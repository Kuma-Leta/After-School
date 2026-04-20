import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { X, Search, UserPlus } from "lucide-react";
import { getEmployerContactEntitlement } from "@/lib/services/contact-entitlement";

const NewChatModal = ({
  isOpen,
  onClose,
  onCreateConversation,
  currentUserId,
}) => {
  const [users, setUsers] = useState([]);
  const [contactEligibility, setContactEligibility] = useState({});
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isGroup, setIsGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const loadContactEligibility = useCallback(async (availableUsers) => {
    try {
      setEligibilityLoading(true);

      const candidateUsers = (availableUsers || []).filter((user) =>
        ["teacher", "student"].includes((user.role || "").toLowerCase()),
      );

      if (candidateUsers.length === 0) {
        setContactEligibility({});
        return;
      }

      const checks = await Promise.all(
        candidateUsers.map(async (user) => {
          try {
            const payload = await getEmployerContactEntitlement({
              candidateId: user.id,
              requireApplication: true,
            });

            return [
              user.id,
              {
                allowed: !!payload.allowed,
                message: payload.message || null,
              },
            ];
          } catch {
            return [
              user.id,
              {
                allowed: false,
                message: "Contact eligibility check failed.",
              },
            ];
          }
        }),
      );

      setContactEligibility(Object.fromEntries(checks));
    } finally {
      setEligibilityLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, email")
        .neq("id", currentUserId)
        .order("full_name");

      if (error) throw error;

      const availableUsers = data || [];
      setUsers(availableUsers);
      await loadContactEligibility(availableUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loadContactEligibility]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  const toggleUserSelection = (user) => {
    const eligibility = contactEligibility[user.id];
    if (eligibility && !eligibility.allowed) {
      return;
    }

    if (selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers(selectedUsers.filter((u) => u.id !== user.id));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;

    const participantIds = selectedUsers.map((user) => user.id);

    try {
      await onCreateConversation(
        participantIds,
        isGroup,
        isGroup ? groupName || undefined : undefined,
      );
      handleClose();
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setContactEligibility({});
    setSearchQuery("");
    setIsGroup(false);
    setGroupName("");
    onClose();
  };

  if (!isOpen) return null;

  const filteredUsers = users.filter(
    (user) =>
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                New Conversation
              </h2>
              <p className="text-gray-600 mt-1">
                Select people to start a conversation with
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {selectedUsers.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full"
                >
                  <span className="font-medium">{user.full_name}</span>
                  <button
                    onClick={() => toggleUserSelection(user)}
                    className="hover:text-blue-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 border-b">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or role..."
              className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <div className="mt-4 space-y-3">
            {eligibilityLoading && (
              <p className="text-xs text-gray-500">
                Checking contact eligibility for candidates...
              </p>
            )}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isGroup}
                onChange={(e) => setIsGroup(e.target.checked)}
                className="w-4 h-4 text-[#FF1E00] focus:ring-[#FF1E00] rounded"
              />
              <span className="font-medium text-gray-900">
                Create as group chat
              </span>
            </label>

            {isGroup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF1E00]/50 focus:border-[#FF1E00]"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF1E00] mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUsers.map((user) => {
                const eligibility = contactEligibility[user.id];
                const isBlocked = eligibility && !eligibility.allowed;

                return (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.some((u) => u.id === user.id)
                        ? "bg-blue-50 border border-blue-100"
                        : isBlocked
                          ? "bg-gray-50 border border-gray-200 opacity-70"
                          : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.full_name}
                          className="w-10 h-10 object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {user.full_name?.charAt(0) || "U"}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          {user.full_name}
                        </h3>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      {isBlocked && (
                        <p className="text-xs text-amber-700 mt-1">
                          {eligibility.message ||
                            "Contact not allowed by policy."}
                        </p>
                      )}
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 ${
                        isBlocked
                          ? "border-gray-300 bg-gray-100"
                          : selectedUsers.some((u) => u.id === user.id)
                            ? "bg-[#FF1E00] border-[#FF1E00]"
                            : "border-gray-300"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-6 border-t">
          <div className="flex items-center justify-between">
            <button
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateChat}
              disabled={
                selectedUsers.length === 0 ||
                (isGroup && selectedUsers.length < 2)
              }
              className={`px-6 py-2 rounded-lg font-medium ${
                selectedUsers.length === 0 ||
                (isGroup && selectedUsers.length < 2)
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-[#FF1E00] text-white hover:bg-[#E01B00] transition-colors"
              }`}
            >
              {isGroup ? "Create Group" : "Start Chat"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
