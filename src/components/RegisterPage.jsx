import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import logo from "assets/logo.png";
import passwordHideIcon from "assets/password-hide-icon.png";
import passwordViewIcon from "assets/password-view-icon.png";

import "styles/RegisterPage.css";
import "styles/FormField.css";

import * as Config from "config.js"

const RegisterPage = ({ loggedIn, setLoggedIn }) => {
    
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

const toggleLanguage = () => {
    const nextLang = i18n.language === "es" ? "en" : "es";
    i18n.changeLanguage(nextLang);
    localStorage.setItem("i18nextLng", nextLang);

    [
        "submit-message",
        "email-message",
        "username-message",
        "screenname-message",
        "password-message"
    ].forEach((id) => {
        const el = document.getElementById(id);
        if (el) {
            el.innerHTML = "";
            el.classList.add("hidden");
        }
    });
};

    // state variables
    const [email, setEmail] = useState(""); // store the email input
    const [screenname, setScreenname] = useState(""); // store the screenname input
    const [username, setUsername] = useState(""); // store the username input
    const [password, setPassword] = useState(""); // store the password input
    const [sessionToken, setSessionToken] = useState(""); // store the user token
    

    const submitSignup = () => {
        // get the error message elements
        const submitMessage = document.getElementById("submit-message");
        const emailMessage = document.getElementById("email-message");
        const usernameMessage = document.getElementById("username-message");
        const screennameMessage = document.getElementById("screenname-message");
        const passwordMessage = document.getElementById("password-message");
        
        // whether or not the user input is valid
        let inputValidated = true;
        
        // reset message visibility
        submitMessage.classList.add("hidden");
        emailMessage.classList.add("hidden");
        usernameMessage.classList.add("hidden");
        screennameMessage.classList.add("hidden");
        passwordMessage.classList.add("hidden");
        
        // show empty email error if no email provided
        if (email.length === 0) {
            emailMessage.innerHTML = t("auth.errors.provideEmail");
            emailMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (!(email.includes("@"))) { //email has @
            emailMessage.innerHTML = t("auth.errors.emailMissingAt");
            emailMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (!(email.substring(email.lastIndexOf('@') + 1).includes("."))) { //email has . in the domain name
            emailMessage.innerHTML = t("auth.errors.emailMissingDot");
            emailMessage.classList.remove("hidden");
            inputValidated = false;
        } else {
            // fetch all users and compare email
            fetch(`${process.env.REACT_APP_API_PATH}/users`)
            .then(res => res.json())
            .then(data => {
                const usersArray = data[0] || [];
                const emailsArray = usersArray
                    .filter((m) => String(m.email))
                    .map((m) => String(m.email));
                if (emailsArray.includes(email)) {
                    emailMessage.innerHTML = t("auth.errors.emailTaken");
                    emailMessage.classList.remove("hidden");
                    inputValidated = false;
                }
            });
        }

        // show empty username error if no username provided
        if (username.length === 0) {
            usernameMessage.innerHTML = t("auth.errors.provideUsername");
            usernameMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (username.length < 3) {
            usernameMessage.innerHTML = t("auth.errors.usernameMin");
            usernameMessage.classList.remove("hidden");
            inputValidated = false;
        }
        
        // show empty screenname error if no username provided
        if (screenname.length === 0) {
            screennameMessage.innerHTML = t("auth.errors.provideDisplayName");
            screennameMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (screenname.length < 3) {
            screennameMessage.innerHTML = t("auth.errors.displayNameMin");
            screennameMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (screenname.length > 10) {
            screennameMessage.innerHTML = t("auth.errors.displayNameMax");
            screennameMessage.classList.remove("hidden");
            inputValidated = false;
        }
        
        // show empty password error if no password provided
        if (password.length === 0) {
            passwordMessage.innerHTML = t("auth.errors.providePassword");
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (password.length < 10) {
            passwordMessage.innerHTML = t("auth.errors.passwordRequirements");
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        } else if ((!(/\d/).test(password)) || (!(/[!@#$%^&*(),.?;:{}_+=-]/).test(password)) || (!(/[A-Z]/).test(password))) { //", ', /, \, [, ], <, >, `, ~
            passwordMessage.innerHTML = t("auth.errors.passwordRequirements");
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        }
        
        // if the input is invalued, return early
        if (!inputValidated) {
            return;
        }
        
        fetch(process.env.REACT_APP_API_PATH + "/auth/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "email": email,
                "password": password,
                "attributes": {
                    "username": username,
                    "screenname": screenname,
                    "showTutorial": true,
                }
            }),
        })

        // convert response to json
        .then((response) => response.json())
        
        // handle response data
        .then((data) => {
            console.log("data: " + data);
            if (data.userID) {
                // Auto-join community 283 for the site tutorial
                fetch(process.env.REACT_APP_API_PATH + "/group-members", {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + data.token,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        userID: Number(data.userID),
                        groupID: 283,
                        attributes: {}
                    }),
                }).catch(err => console.error("Auto-join tutorial community failed:", err));
                
                // remove user info from local storage
                localStorage.removeItem("user");
                localStorage.removeItem("user-token");
                
                // remove user info from session storage
                sessionStorage.removeItem("user");
                sessionStorage.removeItem("user-token");

                // set session variables
                sessionStorage.setItem("user-token", data.token);
                sessionStorage.setItem("user", data.userID);
                sessionStorage.setItem("justRegistered", "true");
                // set state variables
                setSessionToken(data.token);
                
                // log the user's session token
                console.log(sessionToken, " SESSION TOKEN");
                
                // redirect to home page
                navigate("/");
                window.location.reload();
            } 
            
            else {
                submitMessage.innerHTML = t("auth.errors.signupFailed");
                submitMessage.classList.remove("hidden");
            }
        })
        
        // handle errors
        .catch((error) => {
            console.log("my error is:" + error)
            submitMessage.innerHTML = t("auth.errors.signupFailedInputs");
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
    
    const handleKeyPress = (event) => {
        if (event.key == "Enter") {
            submitSignup();
        }
    };
    
    return (
        <div id="signup-page">
            <button type="button" className="auth-language-toggle" onClick={toggleLanguage}>
  {t("auth.languageToggle")}
</button>
            <header className="auth-mobile-top-bar" aria-label="Herd">
                <div className="auth-mobile-top-bar__brand">
                    <img src={logo} alt="" className="auth-mobile-top-bar__logo" />
                    <span className="auth-mobile-top-bar__title">Herd</span>
                </div>
            </header>

            <div id="banner">
    <div id="banner-title">Herd</div>

    <img
        id="banner-logo"
        src={logo}
        alt="logo"
    />

    <div id="banner-tagline">
        {t("auth.bannerTagline")}
    </div>
</div>

            <div id="signup-form">
                <div id="signup-form-title">{t("auth.signup")}</div>
                
                <div id="email-field" className="register-form-field">
                    <div className="form-field-title">
    <span className="required-star">*</span>{t("auth.email")}
</div>
                    <div className="form-field-textbox">
                        <input 
                            id="email-input" 
                            className="default-input form-field-input"
                            type="text"
                            name="email"
                            required
                            placeholder={t("auth.yourEmail")}
                            minLength={Config.MIN_EMAIL_LENGTH}
                            maxLength={Config.MAX_EMAIL_LENGTH}
                            onChange={(event) => setEmail(event.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                    </div>
                    <div
                        id="email-message" 
                        className="hidden register-form-field-message"
                    ></div>
                </div>

                <div id="username-field" className="register-form-field">
                    <div className="form-field-title">
    <span className="required-star">*</span>{t("auth.username")}
</div>
                    <div className="form-field-textbox">
                        <input 
                            id="username-input" 
                            className="default-input form-field-input"
                            type="text"
                            name="username"
                            required
                            placeholder={t("auth.yourUsername")}
                            minLength={Config.MIN_USERNAME_LENGTH}
                            maxLength={Config.MAX_USERNAME_LENGTH}
                            onChange={(event) => setUsername(event.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                    </div>
                    <div
                        id="username-message" 
                        className="hidden register-form-field-message"
                    ></div>
                </div>
                
                <div id="screenname-field" className="register-form-field">
                    <div className="form-field-title">
    <span className="required-star">*</span>{t("auth.displayName")}
</div>
                    <div className="form-field-textbox">
                        <input 
                            id="screenname-input" 
                            className="default-input form-field-input"
                            type="text"
                            name="screenname"
                            required
                            placeholder={t("auth.yourDisplayName")}
                            minLength={Config.MIN_SCREENNAME_LENGTH}
                            maxLength={Config.MAX_SCREENNAME_LENGTH}
                            onChange={(event) => setScreenname(event.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                    </div>
                    <div
                        id="screenname-message" 
                        className="hidden register-form-field-message"
                    ></div>
                </div>

                <div id="password-field" className="register-form-field">
                    <div className="form-field-title">
    <span className="required-star">*</span>{t("auth.password")}
</div>
                    <div className="form-field-textbox">
                        <input 
                            id="password-input" 
                            className="default-input form-field-input"
                            type="password"
                            name="password"
                            required
                            placeholder={t("auth.yourPassword")}
                            minLength={Config.MIN_PASSWORD_LENGTH}
                            maxLength={Config.MAX_PASSWORD_LENGTH}
                            onChange={(event) => setPassword(event.target.value)}
                            onKeyDown={handleKeyPress}
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
                    <div 
                        id="password-message" 
                        className="hidden register-form-field-message"
                    ></div>
                </div>

                <div id="signup-submit">
                    <button 
                        id="signup-button"
                        className="default-button"
                        onMouseUp={(event) => submitSignup()}
                        >{t("auth.signup")}
                    </button>
                    <div id="submit-message" className="hidden"></div>
                </div>


                <p id="login-prompt">
                    {t("auth.haveAccount")}&nbsp;
                    <a
                        id="login-link"
                        className="default-link"
                        href="./"
                        >{t("auth.loginLink")}
                    </a>
                </p>
            </div>
        </div>
    );
}; export default RegisterPage;
