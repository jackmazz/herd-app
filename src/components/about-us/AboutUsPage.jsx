import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

const AboutUsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [hoveredPath, setHoveredPath] = useState(null);

    const developers = [
        { name: t("about.developers.brigid.name"), path: "/about-brigid" },
        { name: t("about.developers.jill.name"), path: "/about-jill" },
        { name: t("about.developers.helen.name"), path: "/about-helen" },
        { name: t("about.developers.jack.name"), path: "/about-jack" },
        { name: t("about.developers.cam.name"), path: "/about-cam" },
    ];

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "60px 20px",
            fontFamily: "Oxanium, sans-serif",
            minHeight: "80vh"
        }}>
            <h1 style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "48px",
                color: "#1D3557",
                marginBottom: "40px",
                textAlign: "center"
            }}>
                {t("about.title")}
            </h1>

            <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                width: "100%",
                maxWidth: "350px"
            }}>
                {developers.map((dev) => (
                    <button
                        key={dev.path}
                        className="Btn-primary"
                        onClick={() => navigate(dev.path)}
                        onMouseEnter={() => setHoveredPath(dev.path)}
                        onMouseLeave={() => setHoveredPath(null)}
                        style={{
                            padding: "16px 24px",
                            fontSize: "20px",
                            border: "none",
                            borderRadius: "12px",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            boxShadow: hoveredPath === dev.path
                                ? "0 8px 20px rgba(240, 138, 36, 0.4)"
                                : "0 4px 10px rgba(0,0,0,0.1)",
                            transform: hoveredPath === dev.path ? "translateY(-3px)" : "translateY(0)",
                            transition: "all 0.2s ease-in-out",
                            fontWeight: "600"
                        }}
                    >
                        <span>{dev.name}</span>
                        <span style={{
                            fontSize: "24px",
                            opacity: hoveredPath === dev.path ? 1 : 0.5,
                            transition: "transform 0.2s",
                            transform: hoveredPath === dev.path ? "translateX(5px)" : "translateX(0)"
                        }}>
                            ›
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AboutUsPage;

