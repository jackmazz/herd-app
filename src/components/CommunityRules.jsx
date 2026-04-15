import React, { useEffect, useRef, useState } from "react";
import "styles/CommunityRules.css";

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
        className="joinBtn"
        onClick={() => setShowMenu((prev) => !prev)}
      >
        See Rules
      </button>
      {showMenu && (
        <>
        <div className="rulesMenuPanel">
            <h1 className="rulesTitle">Community Rules</h1>

            {(group.attributes?.rulesMessage && group.attributes?.rulesBody) || (group.attributes?.rulesMessage == '' && group.attributes?.rulesBody.length == 0) ? (
            <>
              {group.attributes?.rulesMessage && (
                  <div className="rulesMessage">{group.attributes?.rulesMessage}</div>
              )}
              

              <ol className="rulesBody">
                  {(group.attributes?.rulesBody || [])
                  .filter(item => item.length > 0)
                  .map((item) => {
                      return (
                          <li className="rulesBodyItem">{item}</li>
                      );
                  })}
              </ol>
            </>
            ) : (
            <>
              <div className="rulesMessage">This community currently has no official rules.</div>
            </>
            )}
            

        </div>
        </>
      )}
    </div>
  );
}
