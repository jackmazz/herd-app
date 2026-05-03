import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import "styles/settings-page/fields/PasswordField.css";
import passwordHideIcon from "assets/password-hide-icon.png";
import passwordViewIcon from "assets/password-view-icon.png";

export const PasswordField = ({
    label,
    name,
    message,
    placeholder,
    autoComplete,
    maxLength,
    value,
    onChange,
}) => {
    const { t } = useTranslation();
    const [hidden, setHidden] = useState(true);

    const onKeyDown = (event) => {
        if (event.key === "Enter" || event.key === "Escape") {
            event.preventDefault();
            event.target.blur();
        }
    };

    return (
        <div className="password-field">
            <div className="password-field__label">{label}</div>
            <div className="password-field__input-container">
                <input 
                    className="password-field__input"
                    name={name}
                    type={hidden ? "password" : "text"}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    autoComplete={autoComplete}
                    value={value}
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                />
                <img 
                    className="password-field__visibility-button"
                    src={hidden ? passwordHideIcon : passwordViewIcon}
                    alt={t("settings.passwordField.visibilityAlt")}
                    onClick={() => setHidden(!hidden)}
                />
            </div>
            <div className="password-field__message">
                {message}
            </div>
        </div>
    );
};