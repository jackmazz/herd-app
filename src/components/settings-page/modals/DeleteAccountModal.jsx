import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFocusTrap } from "utilities/useFocusTrap";

import "styles/settings-page/modals/DeleteAccountModal.css";
import closeIcon from "assets/close-icon-dark.png";

export const DeleteAccountModal = ({
                                       currentUser, setCurrentUser,
                                       isOpen,
                                       onClose,
                                       showAlert,
                                   }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const modalRef = useFocusTrap(isOpen, onClose);

    const confirmationKey = "I want to delete my account.";
    const [confirmation, setConfirmation] = useState("");
    const [isConfirmed, setConfirmed] = useState(false);
    
    useEffect(() => {
        setConfirmed(confirmation === confirmationKey);
    }, [confirmation]);
    
    const deleteAccount = async () => {
        if (!isConfirmed) {
            return;
        }
    
        try {
            const query = "relatedObjectsAction=delete";
            const url = `${process.env.REACT_APP_API_PATH}/users/${currentUser.id}?${query}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser.token}`,
                },
            });
            
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            setCurrentUser(null);
            
            localStorage.removeItem("user");
            localStorage.removeItem("user-token");
            
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("user-token");
            
            navigate("/");
        } catch (error) {
            showAlert(t("settings.deleteAccountModal.error"));
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="delete-account-modal" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
            <div className="delete-account-modal__menu" ref={modalRef}>
                <button
                    className="delete-account-modal__close-button-wrapper"
                    onClick={onClose}
                    aria-label={t("settings.actions.close")}
                >
                    <img
                        className="delete-account-modal__close-button"
                        src={closeIcon}
                        alt=""
                    />
                </button>

                <div className="delete-account-modal__message" id="delete-modal-title">
                    {t("settings.deleteAccountModal.message")}
                </div>
                <div className="delete-account-modal__description">
                    {t("settings.deleteAccountModal.warning")}
                </div>
                
                <ConfirmKeyField
                    confirmationKey={confirmationKey}
                    value={confirmation}
                    setValue={setConfirmation}
                    isConfirmed={isConfirmed}
                    t={t}
                />
                
                <div className="delete-account-modal__footer">
                    <button 
                        className="delete-account-modal__cancel-button"
                        onClick={onClose}
                    >
                        {t("settings.cancel")}
                    </button>
                    <button 
                        className={isConfirmed ? (
                            "delete-account-modal__delete-button"
                        ) : (
                            "delete-account-modal__delete-button__disabled"
                        )}
                        onClick={() => deleteAccount()}
                    >
                        {t("settings.deleteAccountModal.delete")}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ConfirmKeyField = ({
    confirmationKey,
    value, setValue,
    isConfirmed,
    t,
}) => {
    const onChange = (event) => {
        setValue(event.target.value);
    };

    const onKeyDown = (event) => {   
        if (event.key === "Enter" || event.key === "Escape") {
            event.preventDefault();
            event.target.blur();
        }
    };

    return (
        <div className="confirm-key-field">
            <div className="confirm-key-field__label">
                {t("settings.deleteAccountModal.confirmInstruction")}<br/>
                <span className="confirm-key-field__key">{confirmationKey}</span>
            </div>
            <div className="confirm-key-field__input-container">
                <input 
                    className={isConfirmed ? (
                        "confirm-field__input__confirmed"
                    ) : (
                        "confirm-field__input"
                    )}
                    name="confirm"
                    type="text"
                    placeholder={t("settings.deleteAccountModal.confirmPlaceholder")}
                    maxLength={confirmationKey.length * 2}
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                />
            </div>
        </div>
    );
};