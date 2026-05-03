import React, { useState } from "react";
import { useTranslation } from "react-i18next";

import { BaseSwitch } from "components/settings-page/base/BaseSwitch.jsx";

import "styles/settings-page/switches/PrivateAccountSwitch.css";

export const PrivateAccountSwitch = ({
    currentUser, setCurrentUser,
    showAlert,
}) => {
    const initialValue = currentUser.attributes.privateAccount ?? false;
    const [value, setValue] = useState(initialValue);
    const { t } = useTranslation();
    
    const onToggle = async (isActive) => {  
        if (!isActive()) {
            return;
        }
    
        const negatedValue = !value;
        const savedValue = value;
        setValue(negatedValue);
    
        try {
            const url = `${process.env.REACT_APP_API_PATH}/users/${currentUser.id}`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({
                    attributes: {
                        ...currentUser.attributes,
                        privateAccount: negatedValue,
                    },
                }),
            });
            
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            const data = await response.json();
            const attributesData = data.attributes ?? {};
            
            if (isActive()) {
                setCurrentUser({
                    ...currentUser,
                    attributes: attributesData,
                });
                
                setValue(negatedValue);
            }
        } catch (error) {
            if (isActive()) {
                setValue(savedValue);
                showAlert("Failed to toggle private account mode, check your internet connection and try again.");
            }
        }
    };

    return (
        <div className="private-account-switch">
            <BaseSwitch 
                label={t("settings.fields.enablePrivateAccount")}
                value={value}
                onToggle={onToggle} 
            />
        </div>
    );
};