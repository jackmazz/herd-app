import React, { useEffect, useRef, useState } from "react";
import "styles/CommunityRules.css";
import "styles/EditCommunityMenu.css";
import { useTranslation } from "react-i18next";
export default function EditCommunityMenu({
//   onEditCommunity,
//   onManageModerators,
//   onTransferOwnership,
//   onPermanentlyDelete,
//   isOwner,
  groupID,
  groupName,
  group,
}) {
  const { t } = useTranslation();
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
    <div className="rulesMenu" ref={menuRef}>
      <button
        type="button"
        className="editCommunityTriggerBtn"
        onClick={() => setShowMenu((prev) => !prev)}
      >
        {t("communityPage.rules.seeRules")}
      </button>
      {showMenu && (
        <>
        <div className="rulesMenuPanel">
            <h1 className="rulesTitle">{t("communityPage.rules.title")}</h1>

            {(() => {
              const rulesMessage = group.attributes?.rulesMessage ?? "";
              const rulesBody = Array.isArray(group.attributes?.rulesBody)
                ? group.attributes.rulesBody
                : [];

              const hasMessage = rulesMessage !== "";
              const filteredRules = rulesBody.filter((item) => item.length > 0);
              const hasRules = filteredRules.length > 0;

              return hasMessage || hasRules;
            })() ? (
            <>
              {group.attributes?.rulesMessage && (
                  <div className="rulesMessage">{group.attributes?.rulesMessage}</div>
              )}
              

              <ol className="rulesBody">
                  {(group.attributes?.rulesBody || [])
                  .filter(item => item.length > 0)
                  .map((item, idx) => {
                      return (
                          <li key={idx} className="rulesBodyItem">{item}</li>
                      );
                  })}
              </ol>
            </>
            ) : (
            <>
              <div className="rulesMessage">{t("communityPage.rules.empty")}</div>
            </>
            )}
            

        </div>
        </>
      )}
    </div>
  );
}
