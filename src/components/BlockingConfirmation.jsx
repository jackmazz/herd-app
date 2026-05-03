import React from 'react';

export const BlockingConfirmation = ({onClose, username}) => {
    const handlePopupContentClick = (e) => {
        e.stopPropagation();
    };

    return(
        <div className="popup-overlay" onClick={onClose}>
            <div className="block-confirmation-popup" onClick={handlePopupContentClick}>
                <h2 className="block-confirmation-title">Block confirmation</h2>
                <p className="block-confirmation-message">You blocked @{username}.</p>
                <button className="popup-close-btn" onClick={onClose}>&times;</button>
                <div className="block-confirmation-actions">
                    <button className="block-confirmation-confirm-btn" onClick={onClose}>OK</button>
                </div>
            </div>
        </div>
    )
}
export default BlockingConfirmation;