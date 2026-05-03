import React from "react";
import engineerImage from "assets/about/engineer.jpg";
import { useTranslation } from "react-i18next";

const AboutJackPage = () => {
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
                JACK
            </h1>
            <img
                src={engineerImage}
                style={{
                    width: "300px",
                    height: "300px",
                    borderRadius: "20px",
                    objectFit: "cover",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                    marginBottom: "30px"
                }}
                alt="JACK"
            />
            <p style={{
                fontSize: "1.2rem",
                lineHeight: "1.6",
                color: "#333",
                padding: "0 20px"
            }}>
                {t("about.developers.jack.intro")}
            </p>

            <ul style={{
                textAlign: "left",
                display: "inline-block",
                fontSize: "1.1rem",
                lineHeight: "1.8",
                background: "#D9D9D9",
                padding: "20px 40px",
                borderRadius: "15px",
                color: "#101010"
            }}>
                <li>{t("about.developers.jack.facts.0")}</li>
                <li>{t("about.developers.jack.facts.1")}</li>
                <li>{t("about.developers.jack.facts.2")}</li>
                <li>{t("about.developers.jack.facts.3")}</li>
                <li>{t("about.developers.jack.facts.4")}</li>
            </ul>
        </div>
    );
}; export default AboutJackPage;

