import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

import logo from "assets/logo.png";
import passwordHideIcon from "assets/password-hide-icon.png";
import passwordViewIcon from "assets/password-view-icon.png";

import "styles/RegisterPage.css";
import "styles/FormField.css";

import * as Config from "config.js"

const RegisterPage = ({ loggedIn, setLoggedIn }) => {
    const navigate = useNavigate();

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
            emailMessage.innerHTML = "Please provide your email";
            emailMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (!(email.includes("@"))) { //email has @
            emailMessage.innerHTML = "Invalid email";
            emailMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (!(email.substring(email.lastIndexOf('@') + 1).includes("."))) { //email has . in the domain name
            emailMessage.innerHTML = "Invalid email";
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
                    emailMessage.innerHTML = "Email already has an account associated with it";
                    emailMessage.classList.remove("hidden");
                    inputValidated = false;
                }
            });
        }

        // show empty username error if no username provided
        if (username.length === 0) {
            usernameMessage.innerHTML = "Please provide a username";
            usernameMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (username.length < 3) {
            usernameMessage.innerHTML = "Username must be at least 3 characters";
            usernameMessage.classList.remove("hidden");
            inputValidated = false;
        }
        
        // show empty screenname error if no username provided
        if (screenname.length === 0) {
            screennameMessage.innerHTML = "Please provide a display name";
            screennameMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (screenname.length < 3) {
            screennameMessage.innerHTML = "Display Name must be at least 3 characters";
            screennameMessage.classList.remove("hidden");
            inputValidated = false;
        } else if (screenname.length > 10) {
            screennameMessage.innerHTML = "Display Name can be 10 characters at most";
            screennameMessage.classList.remove("hidden");
            inputValidated = false;
        }
        
        // show empty password error if no password provided
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
                }
            }),
        })

        // convert response to json
        .then((response) => response.json())
        
        // handle response data
        .then((data) => {
            console.log("data: " + data);
            if (data.userID) {
                // set session variables
                sessionStorage.setItem("token", data.token);
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
                submitMessage.innerHTML = "Sign up failed, try again";
                submitMessage.classList.remove("hidden");
            }
        })
        
        // handle errors
        .catch((error) => {
            console.log("my error is:" + error)
            submitMessage.innerHTML = "Sign up failed, check your inputs and try again";
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
            <header className="auth-mobile-top-bar" aria-label="Herd">
                <div className="auth-mobile-top-bar__brand">
                    <img src={logo} alt="" className="auth-mobile-top-bar__logo" />
                    <span className="auth-mobile-top-bar__title">Herd</span>
                </div>
            </header>

            <div id="banner">
                <div id="banner-title">Herd</div>
                <img id="banner-logo" src={logo} alt="LOGO"/>
            </div>

            <div id="signup-form">
                <div id="signup-form-title">Sign Up</div>
                
                <div id="email-field" className="register-form-field">
                    <div className="form-field-title">Email</div>
                    <div className="form-field-textbox">
                        <input 
                            id="email-input" 
                            className="default-input form-field-input"
                            type="text"
                            name="email"
                            required
                            placeholder="Your Email"
                            minLength={Config.MIN_EMAIL_LENGTH}
                            maxLength={Config.MAX_EMAIL_LENGTH}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>
                    <div 
                        id="email-message" 
                        className="hidden register-form-field-message"
                    ></div>
                </div>

                <div id="username-field" className="register-form-field">
                    <div className="form-field-title">Username</div>
                    <div className="form-field-textbox">
                        <input 
                            id="username-input" 
                            className="default-input form-field-input"
                            type="text"
                            name="username"
                            required
                            placeholder="Your Username"
                            minLength={Config.MIN_USERNAME_LENGTH}
                            maxLength={Config.MAX_USERNAME_LENGTH}
                            onChange={(event) => setUsername(event.target.value)}
                        />
                    </div>
                    <div 
                        id="username-message" 
                        className="hidden register-form-field-message"
                    ></div>
                </div>
                
                <div id="screenname-field" className="register-form-field">
                    <div className="form-field-title">Display Name</div>
                    <div className="form-field-textbox">
                        <input 
                            id="screenname-input" 
                            className="default-input form-field-input"
                            type="text"
                            name="screenname"
                            required
                            placeholder="Your Display Name"
                            minLength={Config.MIN_SCREENNAME_LENGTH}
                            maxLength={Config.MAX_SCREENNAME_LENGTH}
                            onChange={(event) => setScreenname(event.target.value)}
                        />
                    </div>
                    <div 
                        id="screenname-message" 
                        className="hidden register-form-field-message"
                    ></div>
                </div>

                <div id="password-field" className="register-form-field">
                    <div className="form-field-title">Password</div>
                    <div className="form-field-textbox">
                        <input 
                            id="password-input" 
                            className="default-input form-field-input"
                            type="password"
                            name="password"
                            required
                            placeholder="Your Password"
                            minLength={Config.MIN_PASSWORD_LENGTH}
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
                        >Sign Up
                    </button>
                    <div id="submit-message" className="hidden"></div>
                </div>


                <p id="login-prompt">
                    Have an account?&nbsp;
                    <a
                        id="login-link"
                        className="default-link"
                        href="./"
                        >Log in
                    </a>
                </p>
            </div>
        </div>
    );
}; export default RegisterPage;
