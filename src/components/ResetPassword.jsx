import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import verifyUser from "utilities/verifyUser.js";

import logo from "assets/logo.png";
import passwordHideIcon from "assets/password-hide-icon.png";
import passwordViewIcon from "assets/password-view-icon.png";

import "styles/LoginPage.css";
import "styles/FormField.css";
import "styles/ResetPassword.css";

import * as Config from "config.js"

const ResetPassword = () => {        
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
        
        //enter no tokekn
        if (token.length === 0) {
            tokenMessage.innerHTML = "Please provide a token";
            tokenMessage.classList.remove("hidden");
            inputValidated = false;
        }

        // password specifications
        if (password.length === 0) {
            passwordMessage.innerHTML = "Please provide a password";
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (password.length < 10) {
            passwordMessage.innerHTML = "Password must be at least 10 characters and contain at least one number," + "<br />" + "special character, and uppercase letter";
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        } else if ((!(/\d/).test(password)) || (!(/[!@#$%^&*(),.?;:{}_+=-]/).test(password)) || (!(/[A-Z]/).test(password))) { //", ', /, \, [, ], <, >, `, ~
            passwordMessage.innerHTML = "Password must be at least 10 characters and contain at least one number," + "<br />" + "special character, and uppercase letter";
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        }

        // password specifications
        if (confirmpassword.length === 0) {
            confirmPasswordMessage.innerHTML = "Please provide your password";
            confirmPasswordMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (password != confirmpassword) {
            confirmPasswordMessage.innerHTML = "Password does not match";
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
        
        // handle response data
        .then((response) => {
            console.log(response.status)
            
            if (response.status == 200) {
                // navigate to the next page on on success
                navigate("/")
            } else if (response.status == 401) {
                submitMessage.innerHTML = "Invalid token, check your token and try again";
                submitMessage.classList.remove("hidden");
            }
            
            else {
                submitMessage.innerHTML = "Reset password failed, check your token and password and try again";
                submitMessage.classList.remove("hidden");
            }
        })
        
        // handle errors
        .catch((error) => {
            submitMessage.innerHTML = "Reset password failed, check your token and password and try again";
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
                <div id="signup-form-title">Reset Password</div>
                
                <div id="token-field" className="register-form-field">
                    <div className="form-field-title">Please enter the token emailed to you:</div>
                    <div className="form-field-textbox">
                        <input 
                            id="token-input" 
                            className="default-input form-field-input"
                            type="text"
                            name="token"
                            placeholder="Enter token"
                            onChange={(event) => setToken(event.target.value)}
                        />
                    </div>
                    <div 
                        id="token-message" 
                        className="hidden form-field-message"
                    ></div>
                    <div className="form-field-message-orange">If you didn't receive an email, please double check the email you entered and try again.</div>
                    {/* <div className="form-field-message-orange">
                        or click&nbsp;
                            <a className="default-link"
                            href="./forgot-password">
                                <u>here</u>
                            </a>
                            &nbsp;to resubmit email.
                    </div> */}
                </div>

                {/* field to input a password */}
                <div id="password-field" className="register-form-field">
                    <div className="form-field-title">Password</div>
                    <div className="form-field-textbox">
                        <input 
                            id="password-input" 
                            className="form-field-input"
                            type="password"
                            name="password"
                            placeholder="Your Password"
                            maxLength={Config.MAX_PASSWORD_LENGTH}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <img 
                            id="password-hide-button" 
                            src={passwordHideIcon} 
                            alt="PASSWORD-HIDE"
                            onMouseUp={(event) => setPasswordVisible(true)}
                        />
                        <img 
                            id="password-view-button" 
                            className="hidden" 
                            src={passwordViewIcon}
                            alt="PASSWORD-VIEW"
                            onMouseUp={(event) => setPasswordVisible(false)}
                        />
                    </div>
                    <div 
                        id="password-message" 
                        className="hidden form-field-message"
                    ></div>
                </div>

                {/* confirm password */}
                <div id="confirm-password-field" className="register-form-field">
                    <div className="form-field-title">Confirm Password</div>
                    <div className="form-field-textbox">
                        <input 
                            id="confirm-password-input" 
                            className="form-field-input"
                            type="password"
                            name="password"
                            placeholder="Your Password"
                            maxLength={Config.MAX_PASSWORD_LENGTH}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                        />
                        <img 
                            id="confirm-password-hide-button" 
                            src={passwordHideIcon} 
                            alt="PASSWORD-HIDE"
                            onMouseUp={(event) => setConfirmPasswordVisible(true)}
                        />
                        <img 
                            id="confirm-password-view-button" 
                            className="hidden" 
                            src={passwordViewIcon}
                            alt="PASSWORD-VIEW"
                            onMouseUp={(event) => setConfirmPasswordVisible(false)}
                        />
                    </div>
                    <div 
                        id="confirm-password-message" 
                        className="hidden form-field-message"
                    ></div>
                </div>
                
                {/* button to submit */}
                <div id="reset-submit">
                    <button 
                        id="reset-button"
                        type="submit"
                        >Reset Password
                    </button>
                    <div id="submit-message" className="hidden"></div>
                </div>
                
                {/* return to login */}
                <a id="login-prompt"
                className="default-link"
                href="./">
                    &lt; Return to&nbsp;
                    <span id="login-link">Login</span>
                </a>
            </form>
        </div>
    );
}; export default ResetPassword;

