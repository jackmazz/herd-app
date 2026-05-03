import React from "react";
import { useTranslation } from "react-i18next";

import { BaseSwitch } from "components/settings-page/base/BaseSwitch.jsx";

import "styles/settings-page/switches/AllNotificationsSwitch.css";

export const AllNotificationsSwitch = ({
    currentUser, setCurrentUser,
    showAlert,
}) => {
    const { t } = useTranslation();

    const value = currentUser.attributes.allNotifications ?? true;

    const onToggle = async (isActive) => {
        const negatedValue = !value;

        try {
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

            const updatedAttributes = {
                ...latestAttributes,
                allNotifications: negatedValue,
                publicFollowNotifications: negatedValue,
                commentNotifications: negatedValue,
                replyNotifications: negatedValue,
                publicCommunityNotifications: negatedValue,
            };

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

            if (!response.ok) {
                throw new Error("request failed");
            }

            const data = await response.json();
            const attributesData = data.attributes ?? {};

            window.dispatchEvent(new CustomEvent("goat-notifications-updated"));

            if (isActive()) {
                setCurrentUser({
                    ...currentUser,
                    attributes: attributesData,
                });
            }
        }
        catch (error) {
            if (isActive()) {
                showAlert(t("settings.errors.toggleNotifications"));
            }
        }
    };

    return (
        <div className="all-notifications-switch">
            <BaseSwitch
                label={t("settings.notificationTypes.allNotifications")}
                value={value}
                onToggle={onToggle}
            />
        </div>
    );
};