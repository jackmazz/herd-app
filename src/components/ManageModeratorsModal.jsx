import React, { useMemo, useState } from "react";
import "styles/ManageModeratorsModal.css";

import { isModeratorMember, isOwnerMember } from "utilities/communityRoles";

function getDisplayName(member) {
  if (member?.user?.attributes) {
    return member.user.attributes.screenname || member.user.attributes.username || `User ${member.userID}`;
  }
  return `User ${member?.userID}`;
}

function getUsername(member) {
  return member?.user?.attributes?.username || "";
}

export default function ManageModeratorsModal({
  isOpen,
  onClose,
  members,
  creatorID,
  isOwner,
  activeUserId,
  token,
  onUpdated,
}) {
  const [moderatorSearch, setModeratorSearch] = useState("");
  const [updatingModeratorId, setUpdatingModeratorId] = useState(null);

  const filteredModeratorCandidates = useMemo(() => {
    return members
      .filter((member) => !isOwnerMember(member, creatorID))
      .filter((member) => {
        const searchValue = moderatorSearch.trim().toLowerCase();
        if (!searchValue) return true;
        const displayName = getDisplayName(member).toLowerCase();
        const username = getUsername(member).toLowerCase();
        return displayName.includes(searchValue) || username.includes(searchValue);
      });
  }, [members, creatorID, moderatorSearch]);

  async function updateModeratorRole(member, shouldBeModerator) {
    if (!member?.id || updatingModeratorId) return;

    const previousAttributes = member.attributes || {};
    const nextAttributes = shouldBeModerator
      ? { ...previousAttributes, role: "moderator" }
      : Object.fromEntries(Object.entries(previousAttributes).filter(([key]) => key !== "role"));

    setUpdatingModeratorId(member.id);
    try {
      const response = await fetch(process.env.REACT_APP_API_PATH + "/group-members/" + member.id, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: nextAttributes }),
      });
      if (!response.ok) throw new Error("Failed to update moderator status");
      onUpdated();
    } catch (err) {
      console.error("Moderator update failed:", err);
    } finally {
      setUpdatingModeratorId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="manageModeratorsOverlay" onClick={onClose}>
      <div className="manageModeratorsModal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="manageModeratorsClose"
          onClick={() => {setModeratorSearch(""); onClose();}}
          aria-label="Close manage moderators"
        >
          x
        </button>
        <div className="manageModeratorsSearchWrap">
          <input
            type="text"
            value={moderatorSearch}
            className="manageModeratorsSearchInput"
            placeholder="Search users..."
            onChange={(e) => setModeratorSearch(e.target.value)}
          />
          <button
            type="button"
            className="manageModeratorsSearchClear"
            onClick={() => setModeratorSearch("")}
            aria-label="Clear search"
          >
            x
          </button>
        </div>
        <div className="manageModeratorsList">
          {filteredModeratorCandidates.map((member) => {
            const memberModerator = isModeratorMember(member);
            const username = getUsername(member);
            const canEdit = isOwner && String(member.userID) !== String(activeUserId);
            return (
              <div key={member.id} className="manageModeratorsItem">
                <span className="manageModeratorsName">
                  @{username || getDisplayName(member)}
                </span>
                <button
                  type="button"
                  disabled={!canEdit || String(updatingModeratorId) === String(member.id)}
                  className={memberModerator ? "removeModeratorBtn" : "addModeratorBtn"}
                  onClick={() => updateModeratorRole(member, !memberModerator)}
                >
                  {memberModerator ? "Remove Moderator" : "Add Moderator"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
