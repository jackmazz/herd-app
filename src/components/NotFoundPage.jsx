import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

function NotFoundPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="block-page-content">
            <div className="block-page-heading">{t("profilePage.notFound.title")}</div>
            <p className="popup-paragraph">{t("profilePage.notFound.subtitle")}</p>
            <button
                className="profile-not-found-home-button"
                onClick={() => navigate("/home")}
            >
                {t("profilePage.notFound.goHome")}
            </button>
        </div>
    );
}

export default NotFoundPage;
