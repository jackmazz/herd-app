import React, { useEffect, useRef, useState } from "react";
import "styles/EditCommunityMenu.css";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();

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
        {t("communityPage.manageMenu.manageCommunity")}
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
            {t("communityPage.manageMenu.editCommunity")}
          </button>
          <button
            type="button"
            className="editCommunityMenuOption"
            onClick={() => {
              setShowMenu(false);
              onEditRules();
            }}
          >
            {t("communityPage.manageMenu.editRules")}
          </button>
          <button
            type="button"
            className="editCommunityMenuOption"
            onClick={() => {
              setShowMenu(false);
              onManageChannels();
            }}
          >
            {t("communityPage.manageMenu.manageChannels")}
          </button>
          <button
            type="button"
            className="editCommunityMenuOption"
            onClick={() => {
              setShowMenu(false);
              onManageModerators();
            }}
          >
            {t("communityPage.manageMenu.manageModerators")}
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
              {t("communityPage.manageMenu.transferOwnership")}
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
              {t("communityPage.manageMenu.deleteCommunity")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
