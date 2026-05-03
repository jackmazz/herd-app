import React from 'react';
import { useTranslation } from "react-i18next";
import helenphoto from 'assets/about/about-me-pic-helen.png';

export const AboutHelenPage = () => {
    const { t } = useTranslation();

    return (
        <div style={{
            maxWidth: "800px",
            margin: "0 auto",
            padding: "40px 20px",
            textAlign: "center",
            fontFamily: "Oxanium, sans-serif",
            display: "flex",
            alignItems: "center",
            flexDirection: "column"
        }}>
            <h1 style={{ fontFamily: "Orbitron, sans-serif", color: "#1D3557" }}>
                {t("about.developers.helen.name")}
            </h1>
            <img
                src={helenphoto}
                alt="Helen"
                style={{
                    width: "250px",
                    borderRadius: "20px",
                    marginBottom: "30px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                }}
            />

            <p style={{
                fontSize: "1.2rem",
                lineHeight: "1.6",
                color: "#333",
                padding: "0 20px"
            }}>
                {t("about.developers.helen.intro")}
            </p>

            <ul style={{
                textAlign: "left",
                display: "inline-block",
                fontSize: "1.1rem",
                lineHeight: "1.8",
                background: "#D9D9D9",
                padding: "20px 40px",
                borderRadius: "15px",
                color: "#101010",
                marginBottom: "30px"
            }}>
                <li>{t("about.developers.helen.facts.0")}</li>
                <li>{t("about.developers.helen.facts.1")}</li>
                <li>{t("about.developers.helen.facts.2")}</li>
            </ul>

            <div style={{
                display: "inline-block",
                background: "rgba(255, 255, 255, 0.9)",
                padding: "10px 25px",
                borderRadius: "50px",
                fontSize: "1.5rem",
                boxShadow: "0 2px 10px rgba(0,0,0,0.05)"
            }}>
                ദ്ദി(｡•̀ ,&lt;)~✩‧₊
            </div>
        </div>
    );
}; export default AboutHelenPage;

