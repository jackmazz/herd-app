import React from 'react'
import brigidPhoto from 'assets/about/AboutMe-Pic.JPG'
import { useTranslation } from "react-i18next";
const AboutBrigidPage = () => {
    const { t } = useTranslation();

    return (
        <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "40px 20px",
            textAlign: "center",
            fontFamily: "Oxanium, sans-serif"
        }}>
            <h1 style={{ fontFamily: "Orbitron, sans-serif", color: "#1D3557" }}>
                {t("about.developers.brigid.name")}
            </h1>
            <img
                src={brigidPhoto}
                alt="Brigid"
                style={{
                    width: "250px",
                    borderRadius: "20px",
                    marginBottom: "30px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                }}
            />

            <p style={{ fontSize: "1.2rem", marginBottom: "20px" }}>
                {t("about.developers.brigid.intro")}
            </p>

            <ul style={{
                textAlign: "left",
                display: "inline-block",
                fontSize: "1.1rem",
                background: "#D9D9D9",
                padding: "20px 40px",
                borderRadius: "15px"
            }}>
                <li>{t("about.developers.brigid.facts.0")}</li>
                <li>{t("about.developers.brigid.facts.1")}</li>
                <li>{t("about.developers.brigid.facts.2")}</li>
            </ul>
        </div>
    );
}; export default AboutBrigidPage;

