import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import verifyUser from "utilities/verifyUser.js";

import logo from "assets/logo.png";
import passwordHideIcon from "assets/password-hide-icon.png";
import passwordViewIcon from "assets/password-view-icon.png";

import "styles/LoginPage.css";
import "styles/FormField.css";

import * as Config from "config.js"

const LoginPage = ({ setLoggedIn }) => {        
    // state variables
    const [email, setEmail] = useState(""); // store the email input
    const [password, setPassword] = useState(""); // store the password input
    
    const navigate = useNavigate();
    
    const submitLogin = (event) => {
        event.preventDefault();
    
        // get the error message elements
        const submitMessage = document.getElementById("submit-message");
        const emailMessage = document.getElementById("email-message");
        const passwordMessage = document.getElementById("password-message");
        
        // whether or not the user input is valid
        let inputValidated = true;
        
        // reset message visibility
        submitMessage.classList.add("hidden");
        emailMessage.classList.add("hidden");
        passwordMessage.classList.add("hidden");
        
        // show empty email error if no email provided
        if (email.length === 0) {
            emailMessage.innerHTML = "Please provide your email";
            emailMessage.classList.remove("hidden");
            inputValidated = false;
        }
        
        // show empty password error if no password provided
        if (password.length === 0) {
            passwordMessage.innerHTML = "Please provide your password";
            passwordMessage.classList.remove("hidden");
            inputValidated = false;
        }
        
        // if the input is invalued, return early
        if (!inputValidated) {
            return;
        }
        
        // send login request
        fetch(process.env.REACT_APP_API_PATH + "/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        })
        
        // convert response to json
        .then((response) => response.json())
        
        // handle response data
        .then((data) => {
            if (data.userID) {
                // set storage variables
                localStorage.setItem("user", data.userID);
                localStorage.setItem("user-token", data.token);
                
                // set session variables
                sessionStorage.setItem("user", data.userID);
                sessionStorage.setItem("user-token", data.token);
                
                // set logged in state
                setLoggedIn(true);
                
                // navigate to the home page
                navigate("/home");
            } 
            
            else {
                submitMessage.innerHTML = "Login failed, check your email and password and try again";
                submitMessage.classList.remove("hidden");
            }
        })
        
        // handle errors
        .catch((error) => {
            submitMessage.innerHTML = "Login failed, check your email and password and try again";
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

    useEffect(() => {
        // navigate to home if the user is already logged in
        const handleRedirect = async () => {
            const verified = await verifyUser();
            if (verified) {
                navigate("/home");
            }
        };
        handleRedirect();
    }, [navigate]);
    
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
            <form id="login-form" onSubmit={submitLogin}>
                <div id="login-form-title">Log In</div>
                
                {/* field to input a email */}
                <div id="email-field" className="form-field">
                    <div className="form-field-title">Email</div>
                    <div className="form-field-textbox">
                        <input 
                            id="email-input" 
                            className="form-field-input"
                            type="text"
                            name="email"
                            placeholder="Your Email"
                            maxLength={Config.MAX_EMAIL_LENGTH}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>
                    <div 
                        id="email-message" 
                        className="hidden form-field-message"
                    ></div>
                </div>
                
                {/* field to input a password */}
                <div id="password-field" className="form-field">
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
                    <Link 
                        id="reset-password-link"
                        className="link"
                        to="/forgot-password"
                        >Forgot Password?
                    </Link>
                </div>
                
                {/* button to submit login info */}
                <div id="login-submit">
                    <button 
                        id="login-button"
                        type="submit"
                        >Log In
                    </button>
                    <div id="submit-message" className="hidden"></div>
                </div>
                
                {/* prompt user to sign in */}
                <p id="signup-prompt">
                    New to Herd?&nbsp;
                    <Link
                        id="signup-link"
                        className="link"
                        to="/register"
                        >Sign up
                    </Link>
                </p>
            </form>
        </div>
    );
}; export default LoginPage;

