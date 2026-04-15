import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';

import logo from "assets/logo.png";

import "styles/LoginPage.css";
import "styles/FormField.css";
import "styles/ForgotPassword.css";

import * as Config from "config.js"

const ForgotPassword = () => {
    const navigate = useNavigate();

    // state variables
    const [email, setEmail] = useState(""); // store the email input
    const [password, setPassword] = useState(""); // store the password input

    const submitForgotPassword = (event) => {
        event.preventDefault();
    
        // get the error message elements
        const submitMessage = document.getElementById("submit-message");
        const emailMessage = document.getElementById("email-message");
        
        // whether or not the user input is valid
        let inputValidated = true;
        
        // reset message visibility
        submitMessage.classList.add("hidden");
        emailMessage.classList.add("hidden");
        
        // email error messages
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
        }
        
        // if the input is invalued, return early
        if (!inputValidated) {
            return;
        }
        
        // send login request
        fetch(process.env.REACT_APP_API_PATH + "/auth/request-reset", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email
            })
        })
        
        // convert response to json
        // .then((response) => response.json())

        // handle response data
        .then((response) => {
            console.log(response.status)
            
            if (response.status == 200) {
                // navigate to the next page on on success
                navigate("/reset-password")
            } 
            
            else {
                submitMessage.innerHTML = "Confirmation failed, please try again";
                submitMessage.classList.remove("hidden");
            }
        })
        
        // handle errors
        .catch((error) => {
            console.log(error)
            submitMessage.innerHTML = "Confirmation failed, check your email and try again";
            submitMessage.classList.remove("hidden");
        });
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

            <form id="login-form" onSubmit={submitForgotPassword}>
                <div id="login-form-title">Forgot Password</div>
                
                <div id="email-field" className="form-field">
                    <div className="form-field-title">Enter the email you used for Herd</div>
                    <div className="form-field-textbox">
                        <input 
                            id="email-input" 
                            className="default-input form-field-input"
                            type="text"
                            name="email"
                            placeholder="Your Email"
                            minLength={Config.MIN_EMAIL_LENGTH}
                            maxLength={Config.MAX_EMAIL_LENGTH}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>
                    <div 
                        id="email-message" 
                        className="hidden form-field-message"
                    ></div>
                </div>

                <div id="forgot-submit">
                    <button 
                        id="forgot-button"
                        type="submit"
                        >Confirm
                    </button>
                    <div id="submit-message" className="hidden"></div>
                </div>


                <a id="login-prompt"
                className="default-link"
                href="./">
                    &lt; Return to&nbsp;
                    <span id="login-link">Login</span>
                </a>
            </form>
        </div>
    );
}; export default ForgotPassword;

