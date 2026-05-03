import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { BaseTextArea } from "components/settings-page/base/BaseTextArea.jsx"
import * as Config from "config.js"

import "styles/settings-page/fields/BiographyField.css";

export const BiographyField = ({
    currentUser, setCurrentUser,
    showAlert,
}) => {
    const initialValue = currentUser.attributes.bio ?? "";
    const valueMaxLength = Config.MAX_BIO_LENGTH;
    const [value, setValue] = useState(initialValue);
    const [actualValue, setActualValue] = useState(initialValue);
    const [isValid, setValid] = useState(false);
    const [isChanged, setChanged] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const { t } = useTranslation();
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
            // request to update the current user's biography
            const url = `${process.env.REACT_APP_API_PATH}/users/${currentUser.id}`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({attributes: {
                    ...currentUser.attributes,
                    bio: trimmedValue,
                }}),
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // extract the response data
            const data = await response.json();
            const attributesData = data.attributes ?? {};
            const biographyData = attributesData.bio ?? "";
            
            // update the current user
            setCurrentUser({
                ...currentUser,
                attributes: attributesData,
            });
            
            // update the current and actual values
            setValue(biographyData);
            setActualValue(biographyData);
        }
        
        catch (error) {
            // revert the actual value to unhide the save button
            setActualValue(savedActualValue);
            
            // show an alert
            showAlert(t("settings.errors.updateBiography"));
        }
    };
    
    const reset = () => {
        setValue(actualValue);
    };
    
    const onValidate = useCallback((controller, isActive) => {
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
    
        // reject too-long inputs
        if (trimmedValue.length > valueMaxLength) {                
            if (isActive()) {
                setValid(false);
                setErrorMessage(t("settings.errors.biographyMax", { count: valueMaxLength }));
            }
            return;
        }
        
        // give feedback for capped-out inputs including trailing whitespace
        if (value.length === valueMaxLength) {
            if (isActive()) {
                setValid(true);
                setErrorMessage(t("settings.errors.maxReached"));
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
    }, [
        value, 
        actualValue,
        valueMaxLength,
    ]);

    return (
        <div className="biography-field">
            <BaseTextArea
                label={t("settings.fields.biography")}
                name="biography"
                message={errorMessage}
                placeholder={t("settings.placeholders.biography")}
                maxLength={valueMaxLength}
                value={value}
                isValid={isValid}
                isChanged={isChanged}
                onChange={(event) => setValue(event.target.value)}
                onSubmit={() => submit()}
                onReset={() => reset()}
                onValidate={onValidate}
            />
        </div>
    );
};

