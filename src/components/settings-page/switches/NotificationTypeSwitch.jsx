import React from "react";
import { BaseSwitch } from "components/settings-page/base/BaseSwitch.jsx";

export const NotificationTypeSwitch = ({
                                           label,
                                           attributeName,
                                           currentUser,
                                           setCurrentUser,
                                           showAlert,
                                           defaultValue = true
                                       }) => {
    // Derive value directly from currentUser props to ensure synchronicity
    const value = currentUser.attributes[attributeName] ?? defaultValue;

    const onToggle = async (isActive) => {
        const negatedValue = !value;

        try {
            const getUrl = `${process.env.REACT_APP_API_PATH}/users/${currentUser.id}`;
            const getResponse = await fetch(getUrl, {
                method: "GET",
                headers: { "Authorization": `Bearer ${currentUser.token}` }
            });

            if (!getResponse.ok) throw new Error("failed to fetch current profile");

            const currentData = await getResponse.json();
            const latestAttributes = currentData.attributes ?? {};

            // Update current attribute
            const updatedAttributes = {
                ...latestAttributes,
                [attributeName]: negatedValue,
            };

            // Logic: All Notifications is true ONLY if all sub-switches are true
            const subSwitches = [
                "publicFollowNotifications",
                "commentNotifications",
                "replyNotifications",
                "publicCommunityNotifications"
            ];

            const allOn = subSwitches.every(key => {
                if (key === attributeName) return negatedValue;
                return updatedAttributes[key] ?? true;
            });

            updatedAttributes.allNotifications = allOn;

            const response = await fetch(getUrl, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({
                    attributes: updatedAttributes
                }),
            });

            if (!response.ok) throw new Error("request failed");

            const data = await response.json();
            window.dispatchEvent(new CustomEvent("goat-notifications-updated"));

            if (isActive()) {
                // Updating currentUser here now triggers a re-render of ALL switches
                setCurrentUser({ ...currentUser, attributes: data.attributes ?? {} });
            }
        } catch (error) {
            if (isActive()) {
                showAlert(`Failed to toggle ${label.toLowerCase()}, please try again.`);
            }
        }
    };

    return (
        <div className="notification-type-switch">
            <BaseSwitch label={label} value={value} onToggle={onToggle} />
        </div>
    );
};