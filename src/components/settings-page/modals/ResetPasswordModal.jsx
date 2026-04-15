import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { AlertModal } from "components/settings-page/modals/AlertModal.jsx";
import { PasswordField } from "components/settings-page/fields/PasswordField.jsx";
import { TokenField } from "components/settings-page/fields/TokenField.jsx";
import * as Config from "config.js";

import "styles/settings-page/modals/ResetPasswordModal.css";
import closeIcon from "assets/close-icon-dark.png";

export const ResetPasswordModal = ({ 
    currentUser,
    isOpen,
    onOpen,
    onClose,
    currentModal, setCurrentModal,
    showAlert,
}) => {
    const { t } = useTranslation();

    const [password_value, password_setValue] = useState("");
    const [password_isValid, password_setValid] = useState(false);
    const [password_isChanged, password_setChanged] = useState(false);
    const [password_errorMessage, password_setErrorMessage] = useState("");
    
    const [confirmation_value, confirmation_setValue] = useState("");
    const [confirmation_isValid, confirmation_setValid] = useState(false);
    const [confirmation_isChanged, confirmation_setChanged] = useState(false);
    const [confirmation_errorMessage, confirmation_setErrorMessage] = useState("");
    
    const [resetToken_value, resetToken_setValue] = useState("");
    const [resetToken_isValid, resetToken_setValid] = useState(false);
    const [resetToken_isChanged, resetToken_setChanged] = useState(false);
    const [resetToken_errorMessage, resetToken_setErrorMessage] = useState("");

    const cleanupState = () => {
        password_setValue("");
        password_setValid(false);
        password_setChanged(false);
        password_setErrorMessage("");
        
        confirmation_setValue("");
        confirmation_setValid(false);
        confirmation_setChanged(false);
        confirmation_setErrorMessage("");
        
        resetToken_setValue("");
        resetToken_setValid(false);
        resetToken_setChanged(false);
        resetToken_setErrorMessage("");
    };
    
    const submitPasswordReset = async () => {
        password_setChanged(true);
        confirmation_setChanged(true);
        resetToken_setChanged(true);
        
        if (!password_isValid || !confirmation_isValid || !resetToken_isValid) {
            return;
        }
        
        try {
            const url = `${process.env.REACT_APP_API_PATH}/auth/reset-password`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    token: resetToken_value,
                    password: password_value,
                }),
            });
            
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            cleanupState();
            showAlert(t("settings.resetPasswordModal.success"));
        } catch (error) {
            setCurrentModal("retry-reset-password");
        }
    };
        
    const sendResetToken = useCallback(async () => {
        try {
            const url = `${process.env.REACT_APP_API_PATH}/auth/request-reset`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({email: currentUser.email}),
            });
            
            if (!response.ok) {
                throw new Error("request failed");
            }
        } catch (error) {
            cleanupState();
            showAlert(t("settings.resetPasswordModal.errorSend"));
        }
    }, [currentUser.email, showAlert, t]);
        
    useEffect(() => {    
        if (isOpen) {
            sendResetToken();
        }
    }, [isOpen, sendResetToken]);
    
    if (!isOpen) {
        return null;
    }

    return (
        <div className="reset-password-modal">
            <div className="reset-password-modal__menu">
                <img 
                    className="reset-password-modal__close-button"
                    src={closeIcon}
                    alt="CLOSE"
                    onClick={(event) => {
                        cleanupState();
                        onClose(event);
                    }}
                />

                <div className="reset-password-modal__message">
                    {t("settings.resetPasswordModal.title")}
                </div>

                <div className="reset-password-modal__description">
                    {t("settings.resetPasswordModal.emailSent")} <u>{currentUser.email}</u>
                </div>

                <div className="reset-password-modal__field-group">
                    <ResetTokenField
                        value={resetToken_value}
                        setValue={resetToken_setValue}
                        setValid={resetToken_setValid}
                        isChanged={resetToken_isChanged}
                        setChanged={resetToken_setChanged}
                        errorMessage={resetToken_errorMessage}
                        setErrorMessage={resetToken_setErrorMessage}
                        t={t}
                    />
                    <NewPasswordField
                        value={password_value}
                        setValue={password_setValue}
                        setValid={password_setValid}
                        isChanged={password_isChanged}
                        setChanged={password_setChanged}
                        errorMessage={password_errorMessage}
                        setErrorMessage={password_setErrorMessage}
                        t={t}
                    />
                    <ConfirmPasswordField
                        confirmationKey={password_value}
                        value={confirmation_value}
                        setValue={confirmation_setValue}
                        setValid={confirmation_setValid}
                        isChanged={confirmation_isChanged}
                        setChanged={confirmation_setChanged}
                        errorMessage={confirmation_errorMessage}
                        setErrorMessage={confirmation_setErrorMessage}
                        t={t}
                    />
                </div>

                <div className="reset-password-modal__footer">
                    <button 
                        className="reset-password-modal__cancel-button"
                        onClick={(event) => {
                            cleanupState();
                            onClose(event);
                        }}
                    >
                        {t("settings.cancel")}
                    </button>

                    <button 
                        className="reset-password-modal__confirm-button"
                        onClick={() => submitPasswordReset()}
                    >
                        {t("settings.resetPasswordModal.confirm")}
                    </button>
                </div>
            </div>
            
            <AlertModal
                message={t("settings.resetPasswordModal.errorSend")}
                isOpen={currentModal === "retry-reset-password"}
                onClose={onOpen}
            />
        </div>
    );
};

const NewPasswordField = ({
    value, setValue,
    setValid,
    isChanged, setChanged,
    errorMessage, setErrorMessage,
    t,
}) => {  
    const valueMinLength = Config.MIN_PASSWORD_LENGTH;
    const valueMaxLength = Config.MAX_PASSWORD_LENGTH;
    
    const onChange = (event) => {
        // update isChanged flag
        if (!isChanged) {
            setChanged(true);
        }
        
        setValue(event.target.value);
    };
    
    useEffect(() => {   
        // return early if no changes were made
        if (!isChanged) {
            setValid(false);
            setErrorMessage("");
            return;
        }
    
        // the input cannot be empty
        if (value.length === 0) {
            setValid(false);
            setErrorMessage("New password must be provided");
            return;
        }
        
        // reject too-short inputs
        if (value.length < valueMinLength) {
            setValid(false);
            setErrorMessage(
                `Password must be at least ${valueMinLength} characters ` +
                "and contain at least one number, special character, " +
                "and uppercase letter"
            );
            return;
        }
        
        // reject too-long inputs
        if (value.length > valueMaxLength) {
            setValid(false);
            setErrorMessage(`Password must be at under ${valueMaxLength} characters`);
            return;
        }
        
        // reject too-weak inputs
        if ((
            !(/\d/).test(value)
        ) || (
            !(/[!@#$%^&*(),.?;:{}_+=-]/).test(value)
        ) || (
            !(/[A-Z]/).test(value)
        )) {
            setValid(false);
            setErrorMessage(
                `Password must be at least ${valueMinLength} characters ` +
                "and contain at least one number, special character, " +
                "and uppercase letter"
            );
            return;
        }
        
        // give feedback for capped-out inputs
        if (value.length === valueMaxLength) {
            setValid(true);
            setErrorMessage("Reached maximum character limit");
            return;
        }
        
        setValid(true);
        setErrorMessage("");
    }, [
        value,
        isChanged,
        setValid,
        valueMinLength,
        valueMaxLength,
        setErrorMessage,
    ]);
    
    return (
        <PasswordField
    label={t("settings.resetPasswordModal.newPassword")}
    name="new-password"
    message={errorMessage}
    placeholder={t("settings.placeholders.newPassword")}
    autoComplete="new-password"
    maxLength={valueMaxLength}
    value={value}
    onChange={onChange}
/>
    );
};

const ConfirmPasswordField = ({
    confirmationKey,
    value, setValue,
    setValid,
    isChanged, setChanged,
    errorMessage, setErrorMessage,
    t,
}) => {
    const valueMaxLength = Config.MAX_PASSWORD_LENGTH;
    
    const onChange = (event) => {
        // update isChanged flag
        if (!isChanged) {
            setChanged(true);
        }
    
        setValue(event.target.value);
    };
    
    useEffect(() => {        
        // return early if no changes were made
        if (!isChanged) {
            setValid(false);
            setErrorMessage("");
            return;
        }
    
        // the input cannot be empty
        if (value.length === 0) {
            setValid(false);
            setErrorMessage("Confirm password must be provided");
            return;
        }
        
        // the input must match the key
        if (value !== confirmationKey) {
            setValid(false);
            setErrorMessage("Password and confirm password do not match");
            return;
        }
        
        setValid(true);
        setErrorMessage("");
    }, [
        confirmationKey,
        value,
        isChanged,
        setValid,
        setErrorMessage,
    ]);
    
    return (
        <PasswordField
    label={t("settings.resetPasswordModal.confirmPassword")}
    name="confirm-new-password"
    message={errorMessage}
    placeholder={t("settings.placeholders.confirmNewPassword")}
    autoComplete="new-password"
    maxLength={valueMaxLength}
    value={value}
    onChange={onChange}
/>
    );
};

const ResetTokenField = ({
    value, setValue,
    setValid,
    isChanged, setChanged,
    errorMessage, setErrorMessage,
    t,
}) => {  
    const valueMaxLength = Config.MAX_TOKEN_LENGTH;
    
    const onChange = (event) => {
        // update isChanged flag
        if (!isChanged) {
            setChanged(true);
        }
        
        setValue(event.target.value);
    };
    
    useEffect(() => {        
        // return early if no changes were made
        if (!isChanged) {
            setValid(false);
            setErrorMessage("");
            return;
        }
    
        // reset token cannot be empty
        if (value.length === 0) {
            setValid(false);
            setErrorMessage("Reset code must be provided");
            return;
        }
        
        // reject too-long inputs
        if (value.length > valueMaxLength) {
            setValid(false);
            setErrorMessage(`Reset code must be at under ${valueMaxLength} characters`);
            return;
        }
        
        // give feedback for capped-out inputs
        if (value.length === valueMaxLength) {
            setValid(true);
            setErrorMessage("Reached maximum character limit");
            return;
        }
        
        setValid(true);
        setErrorMessage("");
    }, [
        value,
        isChanged,
        setValid,
        valueMaxLength,
        setErrorMessage,
    ]);
    
    return (
        <TokenField
    label={t("settings.resetPasswordModal.resetCode")}
    name="reset-code"
    message={errorMessage}
    placeholder={t("settings.placeholders.resetCode")}
    autoComplete="off"
    maxLength={valueMaxLength}
    value={value}
    onChange={onChange}
/>
    );
};

