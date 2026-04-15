import React, { useEffect, useMemo, useState } from "react";
import { isModeratorMember } from "utilities/communityRoles";
import "styles/CreateCommunity.css";
import "styles/EditCommunityModal.css";
import EditCommunityForm from "./EditCommunityForm";

/** Loads community data and renders the edit form (used by the modal and the standalone /edit page). */
export function EditCommunityEditor({ groupID, token, userId, onCancel, onUpdated }) {
  const [community, setCommunity] = useState(null);
  const [members, setMembers] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(null);
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
        } catch {
          if (!cancelled) setCurrentBanner(null);
        }
      } catch (e) {
        if (!cancelled) setError("Failed to load community");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [groupID, token]);

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
      <>
        <h1 id="edit-community-title" className="createCommunityTitle">
          Edit Community
        </h1>
        <p className="successMsg">Loading...</p>
      </>
    );
  }

  if (error || !community || !initialValues) {
    return (
      <>
        <h1 id="edit-community-title" className="createCommunityTitle">
          Edit Community
        </h1>
        <p className="errorMsg">{error || "Community not found."}</p>
        <div className="formButtonRow">
          <button type="button" className="cancelBtn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </>
    );
  }

  if (!canManageCommunity) {
    return (
      <>
        <h1 id="edit-community-title" className="createCommunityTitle">
          Edit Community
        </h1>
        <p className="errorMsg">You do not have permission to edit this community.</p>
        <div className="formButtonRow">
          <button type="button" className="cancelBtn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 id="edit-community-title" className="createCommunityTitle">
        Edit Community
      </h1>
      <EditCommunityForm
        groupID={String(groupID)}
        token={token}
        initialValues={initialValues}
        onCancel={onCancel}
        onUpdated={onUpdated}
        currentBannerUrl={currentBanner?.url || ""}
        currentBannerId={currentBanner?.id || ""}
      />
    </>
  );
}

export default function EditCommunityModal({
  isOpen,
  onClose,
  groupID,
  token,
  userId,
  onUpdated,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="editCommunityModalOverlay"
      onMouseDown={(e) => {
        // Mark whether the interaction started on the backdrop itself.
        // This prevents "drag-select inside modal, release outside" from closing.
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
        className="editCommunityModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-community-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="editCommunityModalClose"
          onClick={onClose}
          aria-label="Close edit community"
        >
          ×
        </button>
        <div className="editCommunityModalCard createCommunityCard">
          <EditCommunityEditor
            groupID={groupID}
            token={token}
            userId={userId}
            onCancel={onClose}
            onUpdated={() => {
              onUpdated?.();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}
