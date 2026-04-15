import React from "react";
import { formatMemberDisplayName } from "utilities/communityOwnership";

export default function TransferOwnershipModal({
  isOpen,
  candidates,
  selectedUserId,
  onSelect,
  onClose,
  onConfirm,
}) {
  if (!isOpen) return null;

  function getMemberUsername(member) {
    const username = member?.user?.attributes?.username;
    if (username) return `@${username}`;
    return `@user${member?.userID ?? ""}`;
  }

  return (
    <div className="transferOwnershipModalOverlay" onClick={onClose}>
      <div className="transferOwnershipModal" onClick={(e) => e.stopPropagation()}>
        <h3 className="transferOwnershipModalTitle">Transfer Ownership</h3>
        <p className="transferWarning">This action cannot be undone.</p>
        <p className="transferOwnershipModalText">
          Choose a moderator to become the new owner.
        </p>

        <div className="transferOwnershipCandidates">
          {(Array.isArray(candidates) ? candidates : []).map((member) => {
            const userId = String(member.userID);
            const checked = String(selectedUserId) === userId;
            return (
              <label
                key={member.id}
                className={`transferOwnershipCandidate${checked ? " transferOwnershipCandidate--selected" : ""}`}
              >
                <input
                  type="radio"
                  name="transfer-owner"
                  checked={checked}
                  onChange={() => onSelect(userId)}
                />
                <span className="transferOwnershipCandidateText">
                  <span className="transferOwnershipCandidateName">{formatMemberDisplayName(member)}</span>
                  <span className="transferOwnershipCandidateUsername">{getMemberUsername(member)}</span>
                </span>
              </label>
            );
          })}
        </div>

        <div className="transferOwnershipModalActions">
          <button type="button" className="feedGhostBtn" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="feedPrimaryBtn"
            onClick={onConfirm}
            disabled={!selectedUserId}
          >
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
}
