import React, { useState } from "react";

import { BaseSwitch } from "components/settings-page/base/BaseSwitch.jsx"

import "styles/settings-page/switches/AllNotificationsSwitch.css";

export const AllNotificationsSwitch = ({
                                           currentUser, setCurrentUser,
                                           showAlert,
                                       }) => {
    // Test 1 specifies this should be toggled on by default
    const initialValue = currentUser.attributes.allNotifications ?? true;
    const [value, setValue] = useState(initialValue);

    const onToggle = async (isActive) => {
        const negatedValue = !value;
        const savedValue = value;
        setValue(negatedValue);

        try {
            // Fetch the latest profile data to ensure we have all current attributes (like notifications)
            const getUrl = `${process.env.REACT_APP_API_PATH}/users/${currentUser.id}`;
            const getResponse = await fetch(getUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${currentUser.token}`,
                }
            });

            if (!getResponse.ok) {
                throw new Error("failed to fetch current profile");
            }

            const currentData = await getResponse.json();
            const latestAttributes = currentData.attributes ?? {};

            // Patch with the merged attributes
            const response = await fetch(getUrl, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({
                    attributes: {
                        ...latestAttributes,
                        allNotifications: negatedValue,
                    }
                }),
            });

            if (!response.ok) {
                throw new Error("request failed");
            }

            const data = await response.json();
            const attributesData = data.attributes ?? {};

            // Notify other components that notification settings changed
            window.dispatchEvent(new CustomEvent("goat-notifications-updated"));

            if (isActive()) {
                setCurrentUser({
                    ...currentUser,
                    attributes: attributesData,
                });
                setValue(negatedValue);
            }
        }
        catch (error) {
            if (isActive()) {
                setValue(savedValue);
                showAlert("Failed to toggle notifications, check your internet connection and try again.");
            }
        }
    };

    return (
        <div className="all-notifications-switch">
            <BaseSwitch
                label="All Notifications"
                value={value}
                onToggle={onToggle}
            />
        </div>
    );
};