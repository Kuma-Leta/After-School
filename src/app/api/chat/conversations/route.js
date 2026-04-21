import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/features/admin/server/auth";
import {
  canInitiateThread,
  getInitialThreadState,
} from "@/lib/chat/thread-governance";
import { evaluateContactInitiationPolicy } from "@/lib/policies/access-control";
import {
  denyWithPolicy,
  requireActorContext,
} from "@/lib/policies/policy-middleware";

export async function POST(request) {
  try {
    const supabase = await createClient();
    const actorContext = await requireActorContext(supabase);

    if (!actorContext.ok) {
      return actorContext.response;
    }

    const body = await request.json().catch(() => ({}));
    const participantIds = Array.isArray(body?.participantIds)
      ? body.participantIds.filter(Boolean)
      : [];
    const isGroup = Boolean(body?.isGroup);
    const name = body?.name || null;
    const avatarUrl = body?.avatarUrl || null;

    if (participantIds.length === 0) {
      return NextResponse.json(
        { error: "At least one participant is required." },
        { status: 400 },
      );
    }

    const dedupedParticipants = Array.from(
      new Set([actorContext.actor.id, ...participantIds]),
    );

    const { data: participantProfiles, error: participantProfilesError } =
      await supabase
        .from("profiles")
        .select("id, role")
        .in("id", participantIds);

    if (participantProfilesError) {
      return NextResponse.json(
        {
          error:
            participantProfilesError.message ||
            "Failed to load participant profiles.",
        },
        { status: 500 },
      );
    }

    const initiationPermission = canInitiateThread({
      initiatorRole: actorContext.profile?.role,
      participantRoles: (participantProfiles || []).map(
        (profile) => profile.role,
      ),
    });

    if (!initiationPermission.allowed) {
      return denyWithPolicy({
        allowed: false,
        status: 403,
        reason: "contact_initiation_blocked",
        message: initiationPermission.message,
      });
    }

    if (!isGroup) {
      const adminClient = createServiceRoleClient();

      for (const participantId of participantIds) {
        if (!participantId || participantId === actorContext.actor.id) continue;

        const contactPolicy = await evaluateContactInitiationPolicy({
          supabase,
          adminClient,
          employerId: actorContext.actor.id,
          candidateId: participantId,
          requireApplication: true,
        });

        if (!contactPolicy.allowed) {
          return denyWithPolicy({
            ...contactPolicy,
            status: 403,
          });
        }
      }
    }

    const { data: conversation, error: createError } = await supabase.rpc(
      "create_conversation_with_participants",
      {
        p_is_group: isGroup,
        p_name: name,
        p_avatar_url: avatarUrl,
        p_participant_ids: dedupedParticipants,
        p_creator_id: actorContext.actor.id,
      },
    );

    if (createError) {
      return NextResponse.json(
        { error: createError.message || "Failed to create conversation." },
        { status: 500 },
      );
    }

    const { data: fullConversation, error: fetchError } = await supabase
      .from("conversations")
      .select(
        `
        *,
        participants:conversation_participants(
          *,
          profile:profiles(*)
        )
      `,
      )
      .eq("id", conversation.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        {
          error:
            fetchError.message ||
            "Conversation created, but failed to load details.",
        },
        { status: 500 },
      );
    }

    const initialGovernance = getInitialThreadState(
      fullConversation,
      actorContext.actor.id,
    );

    if (initialGovernance) {
      const { error: governanceUpdateError } = await supabase
        .from("conversations")
        .update({
          is_governed_thread: true,
          thread_state: initialGovernance.state,
          initiated_by: initialGovernance.initiatedBy,
          initiated_at: initialGovernance.initiatedAt,
          closed_by: null,
          closed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", conversation.id);

      if (!governanceUpdateError) {
        await supabase.from("conversation_thread_audit").insert({
          conversation_id: conversation.id,
          actor_id: actorContext.actor.id,
          action: "employer_initiated",
          previous_state: null,
          new_state: initialGovernance.state,
          metadata: {
            timestamp: new Date().toISOString(),
            source: "api_chat_conversations",
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      conversation: fullConversation,
      policy: {
        enforced: true,
        action: "contact_initiation",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || "Failed to create conversation." },
      { status: 500 },
    );
  }
}
