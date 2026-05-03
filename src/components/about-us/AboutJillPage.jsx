import React from "react";
import jillPhoto from "assets/about/aboutJill.png";
import dogsPhoto from "assets/about/dogs.png";
import { useTranslation } from "react-i18next";

export default function AboutJillPage() {
    const { t } = useTranslation();

    return (
        <div
            style={{
                maxWidth: "800px",
                margin: "0 auto",
                padding: "40px 20px",
                textAlign: "center",
                fontFamily: "Oxanium, sans-serif"
            }}
        >
            <h1 style={{ fontFamily: "Orbitron, sans-serif", color: "#1D3557" }}>
                {t("about.developers.jill.name")}
            </h1>

            <div
                style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "20px",
                    marginBottom: "30px",
                    flexWrap: "wrap",
                }}
            >
                <img
                    src={jillPhoto}
                    alt="Jill"
                    style={{
                        width: "250px",
                        borderRadius: "20px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                    }}
                />
                <img
                    src={dogsPhoto}
                    alt="Dogs"
                    style={{
                        width: "250px",
                        borderRadius: "20px",
                        boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
                    }}
                />
            </div>

            <p
                style={{
                    fontSize: "1.2rem",
                    lineHeight: "1.6",
                    color: "#333",
                    padding: "0 20px",
                    marginBottom: "20px"
                }}
            >
                {t("about.developers.jill.intro")}
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
                <li>{t("about.developers.jill.facts.0")}</li>
                <li>{t("about.developers.jill.facts.1")}</li>
                <li>{t("about.developers.jill.facts.2")}</li>
                <li>{t("about.developers.jill.facts.3")}</li>
            </ul>
        </div>
    );
}

