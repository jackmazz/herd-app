import React, { useCallback, useState }  from "react";

import { ConfirmationModal } from "components/settings-page/modals/ConfirmationModal.jsx";
import { BaseTextBox } from "components/settings-page/base/BaseTextBox.jsx"
import * as Config from "config.js"

import "styles/settings-page/fields/UsernameField.css";

export const UsernameField = ({
    currentUser, setCurrentUser,
    currentModal, setCurrentModal,
    showAlert,
}) => {
    const initialValue = currentUser.attributes.username ?? "";
    const valueMinLength = Config.MIN_USERNAME_LENGTH;
    const valueMaxLength = Config.MAX_USERNAME_LENGTH;
    const [value, setValue] = useState(initialValue);
    const [actualValue, setActualValue] = useState(initialValue);
    const [isValid, setValid] = useState(false);
    const [isChanged, setChanged] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    
    const submit = async () => {
        // if the input isn't valid or wasn't changed, don't submit
        if (!isValid || !isChanged) {
            return;
        }
        
        // trim the input value
        const trimmedValue = value.trim();
        setValue(trimmedValue);
        
        // set the actual value early to hide the save button
        const savedActualValue = actualValue;
        setActualValue(trimmedValue);
        
        try {
            // request to update the current user's username
            const url = `${process.env.REACT_APP_API_PATH}/users/${currentUser.id}`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({attributes: {
                    ...currentUser.attributes,
                    username: trimmedValue,
                }}),
            });
            
            // if the request failed, throw error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // extract the response data
            const data = await response.json();
            const attributesData = data.attributes || {};
            const usernameData = attributesData.username ?? "";
            
            // update the current user
            setCurrentUser({
                ...currentUser,
                attributes: attributesData,
            });
            
            // update the current and actual values
            setValue(usernameData);
            setActualValue(usernameData);
        }
        
        catch (error) {
            // revert the actual value to unhide save button
            setActualValue(savedActualValue);
            
            // show an alert
            showAlert("Failed to update username, check your internet connection and try again.");
        }
    };
    
    const reset = () => {
        setValue(actualValue);
    };
    
    const onValidate = useCallback(async (controller, isActive) => {    
        // trim the current and actual values
        const trimmedValue = value.trim();
        const trimmedActualValue = actualValue.trim();
    
        // update the isChanged flag
        const changed = trimmedValue !== trimmedActualValue;
        if (isActive()) {
            setChanged(changed);
        } else {
            return;
        }
        
        // return early if no changes were made
        if (!changed) {
            if (isActive()) {
                setValid(true);
                setErrorMessage("");
            }
            return;
        }
    
        // the input cannot be empty
        if (trimmedValue.length === 0) {
            if (isActive()) {
                setValid(false);
                setErrorMessage("Username must be provided");
            }
            return;
        }
        
        // reject too-short inputs
        if (trimmedValue.length < valueMinLength) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(`Username must be at least ${valueMinLength} characters`);
            }
            return;
        }
        
        // reject too-long inputs
        if (trimmedValue.length > valueMaxLength) {
            if (isActive()) {
                setValid(false);
                setErrorMessage(`Username must be at under ${valueMaxLength} characters`);
            }
            return;
        }
        
        try {            
            // fetch users from the server registered with the input username
            const attributes = {
                path: "username",
                equals: trimmedValue,
            };
            const query = `attributes=${encodeURIComponent(JSON.stringify(attributes))}`;
            const url = `${process.env.REACT_APP_API_PATH}/users?${query}`;
            const response = await fetch(url, {
                method: "GET",
                signal: controller.signal,
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // extract the response data
            const data = await response.json();
            const usersData = data[0] ?? [];
            const usersDataLength = data[1] ?? -1;
            
            // there cannot be any other users with the input username besides the current user
            if (usersDataLength < 0 || usersDataLength > 1) {
                if (isActive()) {
                    setValid(false);
                    setErrorMessage("Username already taken");
                }
                return;
            }
            
            // if a user is found, it needs to be the current user
            if (usersDataLength === 1) {
                // extract the found user's id
                const userIdData = usersData[0].id.toString() ?? "INVALID-ID";
                
                // assume a user without id is not the current user
                if (userIdData === "INVALID-ID") {
                    if (isActive()) {
                        setValid(false);
                        setErrorMessage("Username already taken");
                    }
                    return;
                }
                
                // the found user's id must match the current user's id
                if (userIdData !== currentUser.id) {
                    if (isActive()) {
                        setValid(false);
                        setErrorMessage("Username already taken");
                    }
                    return;
                }
            }
            
            // give feedback for capped-out usernames including trailing whitespace
            if (value.length === Config.MAX_USERNAME_LENGTH) {
                if (isActive()) {
                    setValid(true);
                    setErrorMessage("Reached maximum character limit");
                }
                return;
            }
            
            // validation finished successfully
            if (isActive()) {
                setValid(true);
                setErrorMessage("");
            } else {
                return;
            }
        }
        
        catch (error) {
            if (isActive()) {
                // show an error message
                setValid(false);
                setErrorMessage("Failed to validate username");
                
                // show an alert
                showAlert("Failed to validate username, check your internet connection.");
            } else {
                return;
            }
        }
    }, [
        value,
        actualValue,
        valueMinLength,
        valueMaxLength,
        currentUser.id,
        showAlert,
    ]);

    return (
        <div className="username-field">
            <BaseTextBox
                label="Username" 
                name="username"
                message={errorMessage}
                placeholder="Your Username..."
                maxLength={valueMaxLength}
                value={value}
                isValid={isValid}
                isChanged={isChanged}
                onChange={(event) => setValue(event.target.value)}
                onSubmit={() => setCurrentModal("confirm-username")}
                onReset={() => reset()}
                onValidate={onValidate}
            />
            
            <ConfirmationModal
                message="Are you sure you want to change your username?"
                description="You won't be able to recover your username if it gets taken by another user."
                isOpen={currentModal === "confirm-username"}
                onClose={() => setCurrentModal("")}
                onConfirm={() => submit()}
            />
        </div>
    );
};

