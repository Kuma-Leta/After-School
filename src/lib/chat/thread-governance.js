export const THREAD_STATES = {
  EMPLOYER_INITIATED: "employer_initiated",
  CANDIDATE_REPLIED: "candidate_replied",
  CLOSED: "closed",
};

const EMPLOYER_ROLES = ["school", "ngo", "family"];
const CANDIDATE_ROLES = ["teacher", "student"];

export function isEmployerRole(role) {
  return EMPLOYER_ROLES.includes((role || "").toLowerCase());
}

export function isCandidateRole(role) {
  return CANDIDATE_ROLES.includes((role || "").toLowerCase());
}

export function getThreadParties(conversation) {
  const participants = conversation?.participants || [];

  const employer = participants.find((participant) =>
    isEmployerRole(participant?.profile?.role),
  );

  const candidate = participants.find((participant) =>
    isCandidateRole(participant?.profile?.role),
  );

  return {
    employer,
    candidate,
    isGoverned: !!employer && !!candidate && participants.length === 2,
  };
}

export function canInitiateThread({ initiatorRole, participantRoles }) {
  const initiatorIsCandidate = isCandidateRole(initiatorRole);
  const hasEmployerParticipant = (participantRoles || []).some((role) =>
    isEmployerRole(role),
  );

  if (initiatorIsCandidate && hasEmployerParticipant) {
    return {
      allowed: false,
      message:
        "Candidates cannot start a new thread with employers. Wait for employer contact and reply in that thread.",
    };
  }

  return { allowed: true, message: null };
}

export function getInitialThreadState(conversation, initiatorId) {
  const { isGoverned } = getThreadParties(conversation);
  if (!isGoverned) return null;

  return {
    state: THREAD_STATES.EMPLOYER_INITIATED,
    initiatedBy: initiatorId,
    initiatedAt: new Date().toISOString(),
  };
}

export function evaluateSendPermission({ conversation, senderId, senderRole }) {
  const { isGoverned } = getThreadParties(conversation);

  if (!isGoverned) {
    return { allowed: true, message: null, nextState: null, auditAction: null };
  }

  const currentState =
    conversation?.thread_state || THREAD_STATES.EMPLOYER_INITIATED;

  if (currentState === THREAD_STATES.CLOSED) {
    return {
      allowed: false,
      message:
        "This thread is closed. Candidates cannot reply to closed threads.",
      nextState: null,
      auditAction: null,
    };
  }

  if (isCandidateRole(senderRole)) {
    if (!conversation?.initiated_by) {
      return {
        allowed: false,
        message:
          "Candidate replies are allowed only on employer-initiated threads.",
        nextState: null,
        auditAction: null,
      };
    }

    if (conversation.initiated_by === senderId) {
      return {
        allowed: false,
        message: "Candidates cannot initiate contact with employers.",
        nextState: null,
        auditAction: null,
      };
    }

    if (currentState === THREAD_STATES.EMPLOYER_INITIATED) {
      return {
        allowed: true,
        message: null,
        nextState: THREAD_STATES.CANDIDATE_REPLIED,
        auditAction: "candidate_replied",
      };
    }
  }

  return {
    allowed: true,
    message: null,
    nextState: null,
    auditAction: null,
  };
}

export function canCloseThread({ conversation, actorRole }) {
  const { isGoverned } = getThreadParties(conversation);
  if (!isGoverned) {
    return {
      allowed: false,
      message: "Only employer-candidate threads support closing.",
    };
  }

  if (!isEmployerRole(actorRole)) {
    return {
      allowed: false,
      message: "Only employers can close governed threads.",
    };
  }

  if (conversation?.thread_state === THREAD_STATES.CLOSED) {
    return {
      allowed: false,
      message: "Thread is already closed.",
    };
  }

  return { allowed: true, message: null };
}
