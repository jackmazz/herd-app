import React, { useEffect, useRef } from "react";
import { formatMemberDisplayName } from "utilities/communityOwnership";
import { useTranslation } from "react-i18next";
export default function TransferOwnershipModal({
                                                 isOpen,
                                                 candidates,
                                                 selectedUserId,
                                                 onSelect,
                                                 onClose,
                                                 onConfirm,
                                               }) {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  // Accessibility: Focus management and trap
  useEffect(() => {
    if (!isOpen) return;

    // Auto-focus the modal container when it opens
    const timeoutId = setTimeout(() => {
      if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 10);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = Array.from(
            modalRef.current.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            )
        ).filter((el) => el.offsetParent !== null); // Ensure only visible elements are counted

        if (focusableElements.length === 0) return;

        const first = focusableElements[0];
        const last = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === first || document.activeElement === modalRef.current) {
            e.preventDefault();
            last.focus();
          }
        } else { // Tab
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]); // Depend only on isOpen to prevent focus reset on polling updates

  if (!isOpen) return null;

  function getMemberUsername(member) {
    const username = member?.user?.attributes?.username;
    if (username) return `@${username}`;
    return `@user${member?.userID ?? ""}`;
  }

  return (
      <div className="transferOwnershipModalOverlay" onClick={onClose}>
        <div
            className="transferOwnershipModal"
            ref={modalRef}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="transfer-ownership-title"
            onClick={(e) => e.stopPropagation()}
        >
          <h3 id="transfer-ownership-title" className="transferOwnershipModalTitle">
            {t("communityPage.transferOwnershipModal.title")}
          </h3>
          <p className="transferWarning">{t("communityPage.deleteCommunityModal.warning")}</p>
          <p className="transferOwnershipModalText">
            {t("communityPage.transferOwnershipModal.chooseModerator")}
          </p>

          <div className="transferOwnershipCandidates" role="radiogroup" aria-labelledby="transfer-ownership-title">
            {(Array.isArray(candidates) ? candidates : []).map((member) => {
              const userId = String(member.userID);
              const checked = String(selectedUserId) === userId;
              return (
                  <label
                      key={member.id}
                      className={`transferOwnershipCandidate${checked ? " transferOwnershipCandidate--selected" : ""}`}
                      style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <input
                        type="radio"
                        name="transfer-owner"
                        checked={checked}
                        onChange={() => onSelect(userId)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onSelect(userId);
                          }
                        }}
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
              {t("communityPage.deleteCommunityModal.cancel")}
            </button>
            <button
                type="button"
                className="feedPrimaryBtn"
                onClick={onConfirm}
                disabled={!selectedUserId}
            >
              {t("communityPage.transferOwnershipModal.transfer")}
            </button>
          </div>
        </div>
      </div>
  );
}