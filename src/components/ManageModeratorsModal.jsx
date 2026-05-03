import React, { useMemo, useState, useEffect, useRef } from "react";
import "styles/ManageModeratorsModal.css";
import { useTranslation } from "react-i18next";
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

const MODERATOR_SEARCH_MAX_LENGTH = 75;

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
  const { t } = useTranslation();
  const [moderatorSearch, setModeratorSearch] = useState("");
  const [updatingModeratorId, setUpdatingModeratorId] = useState(null);
  const modalRef = useRef(null);

  // Accessibility: Focus management and trap
  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setModeratorSearch("");
          onClose();
        }
        if (e.key === "Tab") {
          const focusableElements = modalRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements.length === 0) return;

          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]); // Removed onClose to prevent focus reset on parent re-renders

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
      <div className="manageModeratorsOverlay" onClick={() => {setModeratorSearch(""); onClose();}}>
        <div
            className="manageModeratorsModal"
            ref={modalRef}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manage-mods-title"
            onClick={(e) => e.stopPropagation()}
        >
          <button
              type="button"
              className="manageModeratorsClose"
              onClick={() => {setModeratorSearch(""); onClose();}}
              aria-label={t("manageModeratorsModal.close")}
          >
            x
          </button>
          <h2 id="manage-mods-title" className="sr-only">
            {t("manageModeratorsModal.title") || "Manage Moderators"}
          </h2>
          <div className="manageModeratorsSearchWrap">
          <input
            type="text"
            value={moderatorSearch}
            className="manageModeratorsSearchInput"
            placeholder={t("manageModeratorsModal.searchPlaceholder")}
            maxLength={MODERATOR_SEARCH_MAX_LENGTH}
            onChange={(e) =>
              setModeratorSearch(e.target.value.slice(0, MODERATOR_SEARCH_MAX_LENGTH))
            }
          />
          <button
            type="button"
            className="manageModeratorsSearchClear"
            onClick={() => setModeratorSearch("")}
            aria-label={t("manageModeratorsModal.clearSearch")}
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
                  {memberModerator
  ? t("manageModeratorsModal.removeModerator")
  : t("manageModeratorsModal.addModerator")}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
