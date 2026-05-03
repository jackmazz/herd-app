import React, { useEffect, useMemo, useState, useRef } from "react";
import { isModeratorMember } from "utilities/communityRoles";
import "styles/CreateCommunity.css";
import "styles/EditCommunityModal.css";
import EditCommunityForm from "./EditCommunityForm";
import { useTranslation } from "react-i18next";

/** Loads community data and renders the edit form (used by the modal and the standalone /edit page). */
export function EditCommunityEditor({ groupID, token, userId, onCancel, onUpdated, communitySongUrl }) {
  const { t } = useTranslation();
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(null);
  const [hasCommunitySong, setHasCommunitySong] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!groupID) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [groupRes, membersRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_PATH}/groups/${groupID}`, {
            method: "GET",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          }),
          fetch(`${process.env.REACT_APP_API_PATH}/group-members?groupID=${groupID}`, {
            headers: { Authorization: "Bearer " + token },
          }),
        ]);

        if (!groupRes.ok) throw new Error("Failed to load community");
        const groupData = await groupRes.json();
        const membershipsJson = await membersRes.json();

        if (cancelled) return;
        setCommunity({
          id: groupData.id,
          name: groupData.name,
          tags: groupData.attributes?.tags || [],
          color: groupData.attributes?.color || "#888",
          visibility: groupData.attributes?.visibility || "public",
          creatorID: groupData.attributes?.creatorID || groupData.creatorID,
        });
        setMembers(membershipsJson?.[0] || []);

        try {
          const filesRes = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`, {
            headers: { Authorization: "Bearer " + token },
          });
          const filesJson = await filesRes.json();
          const files = filesJson?.[0] || [];
          const bannerCandidates = Array.isArray(files)
            ? files.filter(
                (file) =>
                  file?.attributes?.type === "communityBanner" &&
                  String(file.attributes.groupID) === String(groupID)
              )
            : [];
          const bannerFile = bannerCandidates.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
          if (!cancelled && bannerFile) {
            setCurrentBanner({ id: bannerFile.id, url: process.env.REACT_APP_API_PATH_SOCKET + bannerFile.path });
          } else if (!cancelled) {
            setCurrentBanner(null);
          }

          const songCandidates = Array.isArray(files)
            ? files.filter(
                (file) =>
                  file?.attributes?.type === "communitySong" &&
                  String(file.attributes.groupID) === String(groupID)
              )
            : [];
          const songFile = songCandidates.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
          if (!cancelled) {
            setHasCommunitySong(Boolean(songFile));
          }
        } catch {
          if (!cancelled) {
            setCurrentBanner(null);
            setHasCommunitySong(false);
          }
        }
      } catch (e) {
        if (!cancelled) setError(t("editCommunityModal.loadFailed"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupID, token, t]);

  const currentMembership = useMemo(() => {
    return (
      members.find(
        (m) => String(m?.userID) === userId && String(m?.groupID) === String(groupID)
      ) || null
    );
  }, [members, userId, groupID]);

  const canManageCommunity = useMemo(() => {
    const isOwner = String(community?.creatorID) === userId;
    return Boolean(isOwner || isModeratorMember(currentMembership));
  }, [community?.creatorID, userId, currentMembership]);

  const initialValues = useMemo(() => {
    if (!community) return null;
    return {
      name: community.name || "",
      visibility: community.visibility || "public",
      tags: Array.isArray(community.tags) ? community.tags : [],
      color: community.color || "#888",
    };
  }, [community]);

  if (loading) {
    return (
        <div className="postOverflow">
          <div id="edit-community-title" className="titleOverflow">
            <h2>{t("editCommunityModal.title")}</h2>
          </div>
          <p className="successMsg">{t("editCommunityModal.loading")}</p>
        </div>
    );
  }

  if (error || !community || !initialValues) {
    return (
        <div className="postOverflow">
          <div id="edit-community-title" className="titleOverflow">
            <h2>{t("editCommunityModal.title")}</h2>
          </div>
          <p className="errorMessage">{error || t("editCommunityModal.notFound")}</p>
          <div className="formButtonRow">
            <button type="button" className="feedGhostBtn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
    );
  }

  if (!canManageCommunity) {
    return (
        <div className="postOverflow">
          <div id="edit-community-title" className="titleOverflow">
            <h2>{t("editCommunityModal.title")}</h2>
          </div>
          <p className="errorMessage">{t("editCommunityModal.noPermission")}</p>
          <div className="formButtonRow">
            <button type="button" className="feedGhostBtn" onClick={onCancel}>
              {t("editCommunityModal.cancel")}
            </button>
          </div>
        </div>
    );
  }

  return (
      <EditCommunityForm
          groupID={String(groupID)}
          token={token}
          initialValues={initialValues}
          onCancel={onCancel}
          onUpdated={onUpdated}
          currentBannerUrl={currentBanner?.url || ""}
          currentBannerId={currentBanner?.id || ""}
          hasCommunitySong={hasCommunitySong}
          communitySongUrl={communitySongUrl}
      />
  );
}

export default function EditCommunityModal({
                                             isOpen,
                                             onClose,
                                             groupID,
                                             token,
                                             userId,
                                             onUpdated,
                                             communitySongUrl,
                                           }) {
  const { t } = useTranslation();
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (modalRef.current) {
      modalRef.current.focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Tab" && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else { // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]); // Removed onClose to prevent focus reset on parent re-renders

  if (!isOpen) return null;

  return (
      <div
          className="createCommunityModalOverlay"
          onMouseDown={(e) => {
            e.currentTarget.dataset.backdropMouseDown = String(e.target === e.currentTarget);
          }}
          onClick={(e) => {
            const startedOnBackdrop = e.currentTarget.dataset.backdropMouseDown === "true";
            const endedOnBackdrop = e.target === e.currentTarget;
            if (startedOnBackdrop && endedOnBackdrop) onClose();
            e.currentTarget.dataset.backdropMouseDown = "false";
          }}
      >
        <div
            className="createCommunityModal editCommunityDialog"
            ref={modalRef}
            tabIndex="-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-community-title"
            onClick={(e) => e.stopPropagation()}
        >
          <EditCommunityEditor
              groupID={groupID}
              token={token}
              userId={userId}
              onCancel={onClose}
              onUpdated={() => {
                onUpdated?.();
                onClose();
              }}
              communitySongUrl={communitySongUrl}
          />
        </div>
      </div>
  );
}