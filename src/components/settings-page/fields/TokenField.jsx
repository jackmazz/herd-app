import React from "react";
import { useTranslation } from "react-i18next";
import "styles/settings-page/fields/TokenField.css";

export const TokenField = ({
    label,
    name,
    message,
    placeholder,
    autoComplete,
    maxLength,
    value,
    isValid,
    onChange,
    onResend,
}) => {
    const { t } = useTranslation();
    const onKeyDown = (event) => {
        // unfocus on enter or escape key
        if (event.key === "Enter" || event.key === "Escape") {
            event.preventDefault();
            event.target.blur();
        }
    };

    return (
        <div className="token-field">
            <div className="token-field__label">{label}</div>
            <div className="token-field__input-container">
                <input 
                    className="token-field__input"
                    name={name}
                    type="text"
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    maxLength={maxLength}
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                />
                <div className="token-field__resend-button">
    {t("settings.actions.resend")}
</div>
            </div>
            <div className="token-field__message">
                {message}
            </div>
        </div>
    );
};

