import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ProfilePictureManager } from "components/settings-page/managers/ProfilePictureManager.jsx";
import { BlockedUserManager } from "components/settings-page/managers/BlockedUserManager.jsx";

import { ResetPasswordModal } from "components/settings-page/modals/ResetPasswordModal.jsx";
import { DeleteAccountModal } from "components/settings-page/modals/DeleteAccountModal.jsx";
import { AlertModal } from "components/settings-page/modals/AlertModal.jsx";

import { EmailField } from "components/settings-page/fields/EmailField.jsx";
import { UsernameField } from "components/settings-page/fields/UsernameField.jsx";
import { ScreennameField } from "components/settings-page/fields/ScreennameField.jsx";
import { BiographyField } from "components/settings-page/fields/BiographyField.jsx";

import { PrivateAccountSwitch } from "components/settings-page/switches/PrivateAccountSwitch.jsx";

import "styles/settings-page/SettingsPage.css";
import securityIcon from "assets/security-icon.png";
import warningIcon from "assets/warning-icon.png";
import {NotificationSettings} from "./NotificationSettings";

export const SettingsPage = () => {
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [currentModal, setCurrentModal] = useState(null);
    const [alertMessage, setAlertMessage] = useState("");
    const [isAlertFatal, setAlertFatal] = useState(false);
    const { t, i18n } = useTranslation();
    const [languageLoading, setLanguageLoading] = useState(false);
    const handleLanguageChange = async (lang) => {
    if (lang === selectedLanguage) return;

    setLanguageLoading(true);

    // waiting state so the user sees a transition
    await new Promise((resolve) => setTimeout(resolve, 700));

    await i18n.changeLanguage(lang);
    localStorage.setItem("appLanguage", lang);
    setSelectedLanguage(lang);

    setLanguageLoading(false);
};
    const [selectedLanguage, setSelectedLanguage] = useState(
    localStorage.getItem("appLanguage") || "en"
);
    const [alertUploadFileError, setAlertUploadFileError] = useState(false);
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    
    const showAlert = useCallback((message, fatal=false, uploadFileError=false) => {
        setAlertMessage(message);
        setAlertFatal(fatal);
        setAlertUploadFileError(!!uploadFileError);
        setCurrentModal("show-alert");
    }, [setAlertMessage, setAlertFatal, setCurrentModal]);
    
    useEffect(() => {
        setLoading(true);
    
        const loadCurrentUser = async () => {
            try {            
                // get session info from session storage
                const sessionId = sessionStorage.getItem("user");
                const sessionToken = sessionStorage.getItem("user-token");
                
                // the session info must be present
                if (!sessionId || !sessionToken) {
                    throw new Error("session info not found");
                }
            
                // fetch the current user
                let query = "";
                let url = `${process.env.REACT_APP_API_PATH}/users/${sessionId}`;
                let response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                let data = await response.json();
                const attributesData = data.attributes ?? {};
                const emailData = data.email ?? "";
                const usernameData = attributesData.username ?? "";
                const screennameData = attributesData.screenname ?? "";
                const biographyData = attributesData.bio ?? "";
                const privateAccountData = attributesData.privateAccount ?? false;
                const allNotificationsData = attributesData.allNotifications ?? true;
                const emailNotificationsData = attributesData.emailNotifications ?? false;
                
                // fetch the current user's files
                query = `uploaderID=${sessionId}`;
                url = `${process.env.REACT_APP_API_PATH}/file-uploads?${query}`;
                response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract data
                data = await response.json();
                const filesData = data[0] ?? [];
                
                // find the profile picture
                let profilePictureData = null;
                filesData.forEach(file => {
                    if (file.attributes.type === "profile-pic") {
                        profilePictureData = process.env.REACT_APP_API_PATH_SOCKET + file.path;
                    }
                });
                
                // update the current user
                setCurrentUser({
                    id: sessionId,
                    token: sessionToken,
                    email: emailData,
                    attributes: {
                        username: usernameData,
                        screenname: screennameData,
                        bio: biographyData,
                        profilePicture: profilePictureData,
                        privateAccount: privateAccountData,
                        allNotifications: allNotificationsData,
                        emailNotifications: emailNotificationsData,
                    },
                });
                
                setLoading(false);
            }
            
            // show an alert
            catch (error) {
                showAlert(t("settings.errors.loadProfile"), true);
            }
        };
        loadCurrentUser();
    }, [navigate, showAlert, t]);
    
    useEffect(() => {
        const onResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    // don't display until loading completes
    if (loading) {
        return (
            <>
                <div className="settings-page settings-page__loading">
                    <p className="settings-page__loading-text">
  {t("settings.loading")}
</p>
                </div>
                <AlertModal
                    message={alertMessage}
                    isFatal={isAlertFatal}
                    isOpen={currentModal === "show-alert"}
                    onClose={() => setCurrentModal(null)}
                    onRetry={() => window.location.reload()}
                    uploadFileError={alertUploadFileError}
                />
            </>
        );
    }
    
    return (
        <div className="settings-page">            
            <div className="settings-section">
                <div className="settings-section__title">
  {t("settings.profile")}
</div>
                <div className="settings-section__content">
                    <div className="settings-section__content-row__mobile-reverse">
                        { screenWidth > 950 ? (
                            <div className="settings-section__content-column__stretch">
                                <ScreennameField
                                    currentUser={currentUser}
                                    setCurrentUser={setCurrentUser}
                                    showAlert={showAlert}
                                />
                                <BiographyField
                                    currentUser={currentUser}
                                    setCurrentUser={setCurrentUser}
                                    showAlert={showAlert}
                                />
                            </div>
                        ) : (
                            <></>
                        )}
                        
                        <div className="settings-section__content-column__center">
                            <ProfilePictureManager 
                                currentUser={currentUser}
                                setCurrentUser={setCurrentUser}
                                currentModal={currentModal}
                                setCurrentModal={setCurrentModal}
                                showAlert={showAlert}
                            />
                        </div>
                        
                        { screenWidth <= 950 ? (
                            <div className="settings-section__content-column__stretch">
                                <ScreennameField
                                    currentUser={currentUser}
                                    setCurrentUser={setCurrentUser}
                                    showAlert={showAlert}
                                />
                                <BiographyField
                                    currentUser={currentUser}
                                    setCurrentUser={setCurrentUser}
                                    showAlert={showAlert}
                                />
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
            </div>
            <div className="settings-section">
    <div className="settings-section__title">{t("settings.language")}</div>
    <div className="settings-section__content">
        <div className="settings-section__content-row">
            <div className="settings-section__content-column__span">
                <div className="language-switch-row">
                    <div className="language-switch-label">{t("settings.communityLanguage")}</div>

                    <div className="language-toggle-group">
                        <button
                            className={`language-toggle-btn ${selectedLanguage === "en" ? "active" : ""}`}
                            onClick={() => handleLanguageChange("en")}
                            disabled={languageLoading}
                        >
                            EN
                        </button>

                        <button
                            className={`language-toggle-btn ${selectedLanguage === "es" ? "active" : ""}`}
                            onClick={() => handleLanguageChange("es")}
                            disabled={languageLoading}
                        >
                            ES
                        </button>
                    </div>
                </div>

                {languageLoading && (
                    <div className="language-loading-text">
                        {t("settings.translating")}
                    </div>
                )}
            </div>
        </div>
    </div>
</div>
            <div className="settings-section">
                <div className="settings-section__title">{t("settings.account")}</div>
                <div className="settings-section__content">
                    <div className="settings-section__content-row">
                        <div className="settings-section__content-column__stretch">
                            <UsernameField
                                currentUser={currentUser}
                                setCurrentUser={setCurrentUser}
                                currentModal={currentModal}
                                setCurrentModal={setCurrentModal}
                                showAlert={showAlert}
                            />
                            <EmailField
                                currentUser={currentUser}
                                setCurrentUser={setCurrentUser}
                                currentModal={currentModal}
                                setCurrentModal={setCurrentModal}
                                showAlert={showAlert}
                            />
                        </div>
                        
                        { screenWidth > 950 ? (
                            <div className="settings-section__content-column__center">
                                <button 
                                    className="reset-password-button" 
                                    onClick={() => setCurrentModal("reset-password")}
                                    >
                                    <img 
                                        className="reset-password-button__security-icon" 
                                        src={securityIcon} 
                                        alt="SECURITY"
                                    />
                                    {t("settings.resetPassword")}
                                </button>
                                <button 
                                    className="delete-account-button"
                                    onClick={() => setCurrentModal("delete-account")}
                                    >
                                    <img 
                                        className="delete-account-button__warning-icon" 
                                        src={warningIcon} 
                                        alt="WARNING"
                                    />
                                    {t("settings.deleteAccount")}
                                </button>
                            </div>
                        ) : (
                            <></>
                        )}
                    </div>
                    
                    <div className="settings-section__content-row">
                        <div className="settings-section__content-column__span">
                            <PrivateAccountSwitch
                                currentUser={currentUser}
                                setCurrentUser={setCurrentUser}
                                showAlert={showAlert}
                            />
                        </div>
                    </div>
                    
                    { screenWidth <= 950 ? (
    <div className="settings-section__content-column__center">
        <button 
            className="reset-password-button" 
            onClick={() => setCurrentModal("reset-password")}
            >
            <img 
                className="reset-password-button__security-icon" 
                src={securityIcon} 
                alt="SECURITY"
            />
            {t("settings.resetPassword")}
        </button>
        <button 
            className="delete-account-button"
            onClick={() => setCurrentModal("delete-account")}
            >
            <img 
                className="delete-account-button__warning-icon" 
                src={warningIcon} 
                alt="WARNING"
            />
            {t("settings.deleteAccount")}
        </button>
    </div>
) : (
    <></>
)}
                </div>
            </div>

            <div className="settings-section">
                <div className="settings-section__title">Notifications</div>
                <div className="settings-section__content">
                    <div className="settings-section__content-row">
                        <div className="settings-section__content-column__span">
                            <NotificationSettings
                                currentUser={currentUser}
                                setCurrentUser={setCurrentUser}
                                showAlert={showAlert}
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="settings-section">
                <div className="settings-section__title">{t("settings.blockedUsers")}</div>
                <div className="settings-section__content__thin">
                    <BlockedUserManager
                        currentUser={currentUser}
                        currentModal={currentModal}
                        setCurrentModal={setCurrentModal}
                        showAlert={showAlert}
                    />
                </div>
            </div>
            
            <ResetPasswordModal
                currentUser={currentUser}
                isOpen={currentModal === "reset-password"}
                onOpen={() => setCurrentModal("reset-password")}
                onClose={() => setCurrentModal(null)}
                showAlert={showAlert}
            />
            
            <DeleteAccountModal
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                isOpen={currentModal === "delete-account"}
                onClose={() => setCurrentModal(null)}
                showAlert={showAlert}
            />
            
            <AlertModal
                message={alertMessage}
                isFatal={isAlertFatal}
                isOpen={currentModal === "show-alert"}
                onClose={() => setCurrentModal(null)}
                onRetry={() => window.location.reload()}
                uploadFileError={alertUploadFileError}
            />
        </div>
    );
};

