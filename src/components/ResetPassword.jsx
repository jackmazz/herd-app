import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import verifyUser from "utilities/verifyUser.js";

import logo from "assets/logo.png";
import passwordHideIcon from "assets/password-hide-icon.png";
import passwordViewIcon from "assets/password-view-icon.png";

import "styles/LoginPage.css";
import "styles/FormField.css";
import "styles/ResetPassword.css";

import * as Config from "config.js"

const ResetPassword = () => {    
    const { t, i18n } = useTranslation();

const toggleLanguage = () => {
    const nextLang = i18n.language === "es" ? "en" : "es";

    i18n.changeLanguage(nextLang);
    localStorage.setItem("i18nextLng", nextLang);

    [
        "submit-message",
        "token-message",
        "password-message",
        "confirm-password-message"
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = "";
            el.classList.add("hidden");
        }
    });
}; 
    // state variables
    const [password, setPassword] = useState(""); // store the password input
    const [confirmpassword, setConfirmPassword] = useState(""); // store the password input
    const [token, setToken] = useState(""); // store the password input

    const navigate = useNavigate();
    
    const submitLogin = (event) => {
        event.preventDefault();
    
        // get the error message elements
        const submitMessage = document.getElementById("submit-message");
        const tokenMessage = document.getElementById("token-message");
        const passwordMessage = document.getElementById("password-message");
        const confirmPasswordMessage = document.getElementById("confirm-password-message");
        
        // whether or not the user input is valid
        let inputValidated = true;
        
        // reset message visibility
        submitMessage.classList.add("hidden");
        tokenMessage.classList.add("hidden");
        passwordMessage.classList.add("hidden");
        confirmPasswordMessage.classList.add("hidden");
        submitMessage.innerHTML = "";
tokenMessage.innerHTML = "";
passwordMessage.innerHTML = "";
confirmPasswordMessage.innerHTML = "";
        
        //enter no tokekn
        if (token.length === 0) {
            tokenMessage.innerHTML = t("auth.errors.provideToken");
            tokenMessage.classList.remove("hidden");
            inputValidated = false;
        }

        // password specifications
        if (password.length === 0) {
            passwordMessage.innerHTML = t("auth.errors.providePassword");
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (password.length < 10) {
            passwordMessage.innerHTML = t("auth.errors.passwordRules");
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        } else if ((!(/\d/).test(password)) || (!(/[!@#$%^&*(),.?;:{}_+=-]/).test(password)) || (!(/[A-Z]/).test(password))) { //", ', /, \, [, ], <, >, `, ~
            passwordMessage.innerHTML = t("auth.errors.passwordRules");
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        }

        // password specifications
        if (confirmpassword.length === 0) {
            confirmPasswordMessage.innerHTML = t("auth.errors.providePassword");
            confirmPasswordMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (password != confirmpassword) {
            confirmPasswordMessage.innerHTML = t("auth.errors.passwordNoMatch");
            confirmPasswordMessage.classList.remove("hidden");
            inputValidated = false;
        }
        // if the input is invalued, return early
        if (!inputValidated) {
            return;
        }
        
        // send login request
        fetch(process.env.REACT_APP_API_PATH + "/auth/reset-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                token,
                password,
            }),
        })
        
        .then((response) => {
    console.log("reset password status:", response.status);

    if (response.status === 200) {
        navigate("/");
        return;
    }

    if ([400, 401, 404, 422].includes(response.status)) {
        tokenMessage.innerHTML = t("auth.errors.invalidToken");
        tokenMessage.classList.remove("hidden");
        return;
    }

    submitMessage.innerHTML = t("auth.errors.resetFailed");
    submitMessage.classList.remove("hidden");
})
        // handle errors
        .catch((error) => {
            submitMessage.innerHTML = t("auth.errors.resetFailed");
            submitMessage.classList.remove("hidden");
        });
    };
    
    const setPasswordVisible = (visible) => {
        // get password field elements
        const passwordInput = document.getElementById("password-input");
        const viewButton = document.getElementById("password-view-button");
        const hideButton = document.getElementById("password-hide-button");
        
        // set password visibility
        if (visible) {
            passwordInput.type = "text";
        } else {
            passwordInput.type = "password";
        }
        
        // toggle the view/hide buttons
        viewButton.classList.toggle("hidden", !visible);
        hideButton.classList.toggle("hidden", visible);
    };

    const setConfirmPasswordVisible = (visible) => {
        // get password field elements
        const confirmPasswordInput = document.getElementById("confirm-password-input");
        const confirmViewButton = document.getElementById("confirm-password-view-button");
        const confirmHideButton = document.getElementById("confirm-password-hide-button");
        
        // set password visibility
        if (visible) {
            confirmPasswordInput.type = "text";
        } else {
            confirmPasswordInput.type = "password";
        }
        
        // toggle the view/hide buttons
        confirmViewButton.classList.toggle("hidden", !visible);
        confirmHideButton.classList.toggle("hidden", visible);
    };
    
    return (
        <div id="login-page">
             <button
      type="button"
      className="auth-language-toggle"
      onClick={toggleLanguage}
    >
      {t("auth.languageToggle")}
    </button>
            <header className="auth-mobile-top-bar" aria-label="Herd">
                <div className="auth-mobile-top-bar__brand">
                    <img src={logo} alt="" className="auth-mobile-top-bar__logo" />
                    <span className="auth-mobile-top-bar__title">Herd</span>
                </div>
            </header>
            {/* left banner */}
            <div id="banner">
                <div id="banner-title">Herd</div>
                <img id="banner-logo" src={logo} alt="LOGO"/>
            </div>
            
            {/* right login form */}
            <form id="signup-form" onSubmit={submitLogin}>
                <div id="signup-form-title">{t("auth.resetPassword")}</div>
                
                <div id="token-field" className="register-form-field">
    <div className="form-field-title">
        <span className="required-star">*</span>{t("auth.enterTokenLabel")}
    </div>
    <div className="form-field-textbox">
        <input 
            id="token-input" 
            className="default-input form-field-input"
            type="text"
            name="token"
            placeholder={t("auth.enterToken")}
            onChange={(event) => setToken(event.target.value)}
        />
    </div>
    <div id="token-message" className="hidden reset-token-error"></div>
<div className="form-field-message-orange">{t("auth.tokenHelp")}</div>
</div>

<div id="password-field" className="register-form-field">
    <div className="form-field-title">
        <span className="required-star">*</span>{t("auth.password")}
    </div>
    <div className="form-field-textbox">
        <input 
            id="password-input" 
            className="form-field-input"
            type="password"
            name="password"
            placeholder={t("auth.yourPassword")}
            maxLength={Config.MAX_PASSWORD_LENGTH}
            onChange={(event) => setPassword(event.target.value)}
        />
        <img 
            id="password-hide-button" 
            src={passwordHideIcon} 
            alt="PASSWORD-HIDE"
            onMouseUp={() => setPasswordVisible(true)}
        />
        <img 
            id="password-view-button" 
            className="hidden" 
            src={passwordViewIcon}
            alt="PASSWORD-VIEW"
            onMouseUp={() => setPasswordVisible(false)}
        />
    </div>
    <div id="password-message" className="hidden form-field-message"></div>
</div>

<div id="confirm-password-field" className="register-form-field">
    <div className="form-field-title">
        <span className="required-star">*</span>{t("auth.confirmPassword")}
    </div>
    <div className="form-field-textbox">
        <input 
            id="confirm-password-input" 
            className="form-field-input"
            type="password"
            name="confirm-password"
            placeholder={t("auth.confirmYourPassword")}
            maxLength={Config.MAX_PASSWORD_LENGTH}
            onChange={(event) => setConfirmPassword(event.target.value)}
        />
        <img 
            id="confirm-password-hide-button" 
            src={passwordHideIcon} 
            alt="PASSWORD-HIDE"
            onMouseUp={() => setConfirmPasswordVisible(true)}
        />
        <img 
            id="confirm-password-view-button" 
            className="hidden" 
            src={passwordViewIcon}
            alt="PASSWORD-VIEW"
            onMouseUp={() => setConfirmPasswordVisible(false)}
        />
    </div>
    <div id="confirm-password-message" className="hidden form-field-message"></div>
</div>

                {/* confirm password */}

                {/* button to submit */}
                <div id="reset-submit">
                    <button 
                        id="reset-button"
                        type="submit"
                        >{t("auth.resetPassword")}
                    </button>
                    <div id="submit-message" className="hidden"></div>
                </div>
                
                {/* return to login */}
                <a id="login-prompt"
                className="default-link"
                href="./">
                    {t("auth.returnTo")}&nbsp;
                    <span id="login-link">{t("auth.login")}</span>
                </a>
            </form>
        </div>
    );
}; export default ResetPassword;

