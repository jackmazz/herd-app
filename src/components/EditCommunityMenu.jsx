import React, { useEffect, useRef, useState } from "react";
import "styles/EditCommunityMenu.css";

export default function EditCommunityMenu({
  onEditCommunity,
  onEditRules,
  onManageModerators,
  onManageChannels,
  onTransferOwnership,
  onPermanentlyDelete,
  isOwner,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div className="editCommunityMenu" ref={menuRef}>
      <button
        type="button"
        className="editCommunityTriggerBtn"
        onClick={() => setShowMenu((prev) => !prev)}
      >
        Manage Community
      </button>
      {showMenu && (
        <div className="editCommunityMenuPanel">
          <button
            type="button"
            className="editCommunityMenuOption"
            onClick={() => {
              setShowMenu(false);
              onEditCommunity();
            }}
          >
            Edit Community
          </button>
          <button
            type="button"
            className="editCommunityMenuOption"
            onClick={() => {
              setShowMenu(false);
              onEditRules();
            }}
          >
            Edit Rules
          </button>
          <button
            type="button"
            className="editCommunityMenuOption"
            onClick={() => {
              setShowMenu(false);
              onManageChannels();
            }}
          >
            Edit Channels
          </button>
          <button
            type="button"
            className="editCommunityMenuOption"
            onClick={() => {
              setShowMenu(false);
              onManageModerators();
            }}
          >
            Manage Moderators
          </button>
          {isOwner && (
            <button
              type="button"
              className="editCommunityMenuOption"
              onClick={() => {
                setShowMenu(false);
                onTransferOwnership();
              }}
            >
              Transfer Ownership
            </button>
          )}
          {isOwner && onPermanentlyDelete && (
            <button
              type="button"
              className="editCommunityMenuOption editCommunityMenuOption--danger"
              onClick={() => {
                setShowMenu(false);
                onPermanentlyDelete();
              }}
            >
              Permanently Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
