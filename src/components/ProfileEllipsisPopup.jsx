import React from 'react';
import blockIcon from 'assets/red-cancel.svg'

const ProfileEllipsisPopup = ({ onClose, showBlock, onBlock }) => {
    return (
        <div className="profile-ellipsis-menu">
            { showBlock &&
                <button className="ellipsis-item block-button" onClick={onBlock}>
                    <span className="button-text">Block</span>
                    <img src={blockIcon} alt="block" className="button-icon" />
                </button>
            }
            {/* ... other items ... */}
        </div>
    );
};
export default ProfileEllipsisPopup;