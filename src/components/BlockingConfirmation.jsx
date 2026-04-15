import React from 'react';

export const BlockingConfirmation = ({onClose, username}) => {
    const handlePopupContentClick = (e) => {
        e.stopPropagation();
    };

    return(
        <div className="popup-overlay" onClick={onClose}>
            <div className="block-confirmation-popup" onClick={handlePopupContentClick}>
                <h1 className="popup-title" style={{position: 'absolute', top: "10px"}}>Block Confirmation</h1>
                <p className="popup-paragraph">Blocked @{username}</p>
                <button className="popup-close-btn" onClick={onClose}>&times;</button>
                <button className="popup-ok-btn" style={{position: 'absolute', bottom: '10px'}} onClick={onClose}>Ok</button>
            </div>
        </div>
    )
}
export default BlockingConfirmation;