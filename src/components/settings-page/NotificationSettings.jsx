import React from "react";

import { AllNotificationsSwitch } from "components/settings-page/switches/AllNotificationsSwitch.jsx";
import { EmailNotificationsSwitch } from "components/settings-page/switches/EmailNotificationsSwitch.jsx";

export const NotificationSettings = ({
                                         currentUser, setCurrentUser,
                                         showAlert,
                                     }) => {
    return (
        <div className="notification-settings">
            <AllNotificationsSwitch
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                showAlert={showAlert}
            />
            <EmailNotificationsSwitch
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                showAlert={showAlert}
            />
        </div>
    );
};