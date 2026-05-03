import React from "react";

import "styles/settings-page/modals/AlertModal.css";
import closeIcon from "assets/close-icon-dark.png";

export const AlertModal = ({
    message, 
    isFatal = false,
    isOpen, 
    onClose,
    onRetry = () => {},
    uploadFileError = false,
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="alert-modal">
            { isFatal ? (
                <div className="alert-modal__menu">                    
                    <div
                        className={
                            uploadFileError
                                ? "alert-modal__message alert-modal__message--upload-file-error"
                                : "alert-modal__message"
                        }
                    >
                        {message}
                    </div>
                    
                    <div className="alert-modal__footer">
                        <button 
                            className="alert-modal__retry-button"
                            onClick={onRetry}
                            >Retry
                        </button>
                    </div>
                </div>
            ) : (
                <div className="alert-modal__menu">
                    <img 
                        className="alert-modal__close-button"
                        src={closeIcon}
                        alt="CLOSE"
                        onClick={onClose}
                    />
                    
                    <div
                        className={
                            uploadFileError
                                ? "alert-modal__message alert-modal__message--upload-file-error"
                                : "alert-modal__message"
                        }
                    >
                        {message}
                    </div>
                    
                    <div className="alert-modal__footer">
                        <button 
                            className="alert-modal__confirm-button"
                            onClick={onClose}
                            >Confirm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

