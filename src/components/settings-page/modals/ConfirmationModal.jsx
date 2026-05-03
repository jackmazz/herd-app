import React from "react";

import "styles/settings-page/modals/ConfirmationModal.css";
import closeIcon from "assets/close-icon-dark.png";

export const ConfirmationModal = ({
    message, 
    description,
    isOpen, 
    onClose,
    onConfirm,
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="confirmation-modal">
            <div className="confirmation-modal__menu">
                <img 
                    className="confirmation-modal__close-button"
                    src={closeIcon}
                    alt="CLOSE"
                    onClick={onClose}
                />
                
                <div className="confirmation-modal__message">{message}</div>
                <div className="confirmation-modal__description">{description}</div>
                
                <div className="confirmation-modal__footer">
                    <button 
                        className="confirmation-modal__cancel-button"
                        onClick={onClose}
                        >Cancel
                    </button>
                    <button 
                        className="confirmation-modal__confirm-button"
                        onClick={(event) => {
                            onClose(event);
                            onConfirm(event);
                        }}
                        >Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

