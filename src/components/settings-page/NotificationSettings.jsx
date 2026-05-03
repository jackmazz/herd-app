import React from "react";
import { useTranslation } from "react-i18next";

import { AllNotificationsSwitch } from "components/settings-page/switches/AllNotificationsSwitch.jsx";
import { EmailNotificationsSwitch } from "components/settings-page/switches/EmailNotificationsSwitch.jsx";
import { NotificationTypeSwitch } from "components/settings-page/switches/NotificationTypeSwitch.jsx";

export const NotificationSettings = ({
    currentUser, setCurrentUser,
    showAlert,
}) => {
    const { t } = useTranslation();

    return (
        <div className="notification-settings">
            <AllNotificationsSwitch
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                showAlert={showAlert}
            />
            <NotificationTypeSwitch
                label={t("settings.notificationTypes.publicFollow")}
                attributeName="publicFollowNotifications"
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                showAlert={showAlert}
            />
            <NotificationTypeSwitch
                label={t("settings.notificationTypes.comments")}
                attributeName="commentNotifications"
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                showAlert={showAlert}
            />
            <NotificationTypeSwitch
                label={t("settings.notificationTypes.replies")}
                attributeName="replyNotifications"
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                showAlert={showAlert}
            />
            <NotificationTypeSwitch
                label={t("settings.notificationTypes.publicCommunities")}
                attributeName="publicCommunityNotifications"
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                showAlert={showAlert}
            />
        </div>
    );
};