import React, { useState } from "react";
import { Link } from "react-router-dom";
import "styles/StyleGuide.css";
import "styles/FormField.css";
import homeIcon from "../assets/home.svg";
import hamburgerIcon from "../assets/hamburgerMenu.svg";
import defaultProfileIcon from "../assets/default-profile.svg";
import logoIcon from "../assets/logo.png";
import passwordHideIcon from "assets/password-hide-icon.png";
import passwordViewIcon from "assets/password-view-icon.png";

const COLOR_SNIPPET = `/* Primary CTA */
.Btn { background: #f06400; color: white; }
.Btn-primary { background: #F08A24; color: #101010; }

/* Cards and surfaces */
.Card-surface { background: #D9D9D9; }
.Card-community { background: #1D3557; }
.feedShell { background: rgba(255, 255, 255, 0.92); }

/* Destructive */
.leaveBtn { background: #9a3333; color: white; }

/* Overlay for modals */
.popup-overlay { background-color: rgba(0, 0, 0, 0.25); }`;

const FONT_SNIPPET = `/* App.css — load fonts */
@font-face {
  font-family: "Orbitron";
  src: url("../assets/fonts/Orbitron/static/Orbitron-Medium.ttf") format("truetype");
}
@font-face {
  font-family: "Oxanium";
  src: url("../assets/fonts/Oxanium/static/Oxanium-Medium.ttf") format("truetype");
}

/* Zen Dots from Google Fonts (e.g. in HomePage.css) */
@import url('https://fonts.googleapis.com/css2?family=Zen+Dots&display=swap');

/* Usage */
.app-name { font-family: 'Orbitron', sans-serif; font-size: 50px; }
.communitySectionHeader h2 { font-family: "Zen Dots", sans-serif; font-size: 32px; }
.communityForm label { font-size: 18px; }
button, input { font-family: 'Oxanium', cursive !important; }`;

const LAYOUT_JSX_SNIPPET = `// Applied to all pages
<div className="app-shell">
  <Navbar />
  <main className="page-content">
    <Outlet />
  </main>
</div>`;

const LAYOUT_CSS_SNIPPET = `/* App.css */
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.feedPage {
  width: 100%;
  margin-top: -50px;
  min-height: calc(100vh - 80px);
}

/* Navbar: fixed, full width, brand blue color */
.topnav {
  position: fixed;
  top: 0;
  left: 0;
  height: 80px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1D3557;
  z-index: 1000;
}`;

const MODAL_CSS_SNIPPET = `/* Overlay: block interaction, dim background */
.popup-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.25);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

/* Modal content: centered, branded look */
.upload-photo-popup {
  position: fixed;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 50%;
  height: 450px;
  border-radius: 25px;
  background: linear-gradient(180deg, #BCBCBC 0.16%, #FFF 99.84%);
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  z-index: 1000;
}`;

const MODAL_JSX_SNIPPET = `<div className="popup-overlay" onClick={onClose}>
  <div className="upload-photo-popup" onClick={e => e.stopPropagation()}>
    <button className="popup-close-btn" onClick={onClose}>&times;</button>
    <h1 className="upload-photo-heading">Title</h1>
    {/* content */}
  </div>
</div>`;

const FEEDBACK_SNIPPET = `/* Error — red text/box when user hasn't provided required info */
.errorMsg {
  color: black;
  text-align: center;
  background: rgba(255, 107, 107, 0.9);
  border-radius: 10px;
  border: 1px solid #c80000;
  padding: 8px 12px;
  margin: 4px 0;
  font-weight: bold;
  font-size: 14px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.2);
}

/* Success */
.successMsg {
  color: #4caf50;
  text-align: center;
}

/* Inline help — helper text below field */
.helperText {
  font-size: 12px;
  color: #555;
  margin-top: 4px;
}

/* Show error OR helper below field */
{titleError && <p className="errorMsg">{titleError}</p>}
{!titleError && <p className="helperText">Enter a name for your community.</p>}`;

const DATA_ENTRY_SNIPPET = `/* Required field: asterisk after label */
<label>
  Email <span className="required">*</span>
  <input required placeholder="Your Email" />
</label>

/* Placeholder: every input needs one */
<input placeholder="e.g. Board Games" />
<input placeholder="Your Password" />

/* Password with visibility toggle (eye icon) — from LoginPage.jsx (174-185) */
<div className="form-field-textbox">
  <input type={passwordVisible ? "text" : "password"} placeholder="Your Password" />
  <img
    id="password-hide-button"
    src={passwordHideIcon}
    alt="PASSWORD-HIDE"
    onMouseUp={() => setPasswordVisible(true)}
  />
  <img
    id="password-view-button"
    className="hidden"
    src={passwordViewIcon}
    alt="PASSWORD-VIEW"
    onMouseUp={() => setPasswordVisible(false)}
  />
</div>

/* Validation: use required, minLength, maxLength on inputs */
<input required minLength={3} maxLength={50} placeholder="Username" />`;

export default function StyleGuide() {
    const [modalOpen, setModalOpen] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [copiedId, setCopiedId] = useState(null);

    const handleCopy = async (text, id) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => {
            setCopiedId(null);
        }, 1500);
    };

    return (
        <div className="styleGuidePage">
            <header className="styleGuideHeader">
                <h1 className="styleGuideTitle">Guía de Estilo de Herd</h1>
                <p className="styleGuideSubtitle">
                    Instrucciones para extender la aplicación manteniendo la identidad visual.
                </p>
            </header>

            {/* 1. Color palette */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">1. Paleta de colores y uso</h2>
                <p className="styleGuideSectionIntro">
                    Usa estos colores para fondos, texto y acentos para mantener la identidad de la app.
                </p>

                <div className="colorGrid">
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#1D3557" }} />
                        <div className="colorName">#1D3557</div>
                        <div className="colorUse">Barra de navegación, tarjetas de comunidad, oscuro primario</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#F08A24" }} />
                        <div className="colorName">#F08A24</div>
                        <div className="colorUse">Principal, botones, pestañas, acentos, unirse/crear</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#F06400" }} />
                        <div className="colorName">#F06400</div>
                        <div className="colorUse">Acento secundario, logo, bordes</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#D9D9D9" }} />
                        <div className="colorName">#D9D9D9</div>
                        <div className="colorUse">Tarjetas, contenedores de formulario, fondos de ventanas emergentes</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#000000", border: "1px solid #eee" }} />
                        <div className="colorName">#000000</div>
                        <div className="colorUse">Texto</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#9a3333" }} />
                        <div className="colorName">#9a3333</div>
                        <div className="colorUse">Salir / acciones destructivas</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "rgba(255,255,255,0.92)" }} />
                        <div className="colorName">rgba(255,255,255,0.92)</div>
                        <div className="colorUse">Fondo del contenedor del feed</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "rgba(0,0,0,0.25)" }} />
                        <div className="colorName">rgba(0,0,0,0.25)</div>
                        <div className="colorUse">Superposición de modales</div>
                    </div>
                </div>

                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">CSS — ejemplos de uso de colores</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(COLOR_SNIPPET, "color")}
                        >
                            {copiedId === "color" ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <pre className="codeBlock">{COLOR_SNIPPET}</pre>
                </div>
            </section>

            {/* 2. Fonts and font sizes */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">2. Tipografías y tamaños</h2>
                <p className="styleGuideSectionIntro">
                    Usa estas tipografías y tamaños de forma consistente. Cada ejemplo se muestra en la fuente y tamaño indicados.
                </p>

                <div className="fontShowcase">
                    <div className="fontExample">
                        <span className="fontLabel">Orbitron, 50px — Nombre de la app (barra de navegación)</span>
                        <div className="fontSample" style={{ fontFamily: "Orbitron, sans-serif", fontSize: "50px" }}>
                            Herd
                        </div>
                    </div>

                    <div className="fontExample">
                        <span className="fontLabel">Zen Dots, 32px — Encabezados de sección (ej. Mis Comunidades, Descubrir)</span>
                        <div className="fontSample" style={{ fontFamily: '"Zen Dots", sans-serif', fontSize: "32px" }}>
                            Mis Comunidades
                        </div>
                    </div>

                    <div className="fontExample">
                        <span className="fontLabel">Oxanium, 18px — Etiquetas de formulario y texto principal</span>
                        <div className="fontSample" style={{ fontFamily: "Oxanium, sans-serif", fontSize: "18px" }}>
                            Community Name
                        </div>
                    </div>
                    <div className="fontExample">
                        <span className="fontLabel">Oxanium, 14px — Campos, botones, etiquetas, texto secundario</span>
                        <div className="fontSample" style={{ fontFamily: "Oxanium, sans-serif", fontSize: "14px" }}>
                            Unirse · Etiquetas · Público
                        </div>
                    </div>
                </div>

                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">CSS — uso de tipografías</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(FONT_SNIPPET, "font")}
                        >
                            {copiedId === "font" ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <pre className="codeBlock">{FONT_SNIPPET}</pre>
                </div>
            </section>

            {/* 3. Layout and navigation */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">3. Plantillas de diseño y navegación</h2>
                <p className="styleGuideSectionIntro">
                    La app usa una barra de navegación superior y un área de contenido principal. Las páginas nuevas deben vivir dentro de esta estructura. Los componentes principales deben estar centrados (contenedores y modales) como se muestra en esta página.
                </p>

                <div className="layoutExample">
                    <div className="layoutNavSample">
                        <div className="layoutNavLogo">
                            <img src={logoIcon} alt="Herd Logo" className="topnav-icon" />
                            <span className="layoutNavAppName">Herd</span>
                        </div>
                        <div className="nav-right">
                            <img src={homeIcon} alt="Home" className="topnav-icon" />
                            <img src={hamburgerIcon} alt="Hamburger" className="topnav-icon" />
                            <img
                                src={defaultProfileIcon} alt="Profile" className="topnav-icon" style={{ borderRadius: "50%" }}
                            />
                        </div>
                    </div>
                    <div className="layoutMainSample">
                        <p>Contenido principal (page-content) — flex: 1, padding-top: 70px</p>
                    </div>
                </div>

                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">JSX — estructura de la app (AppLayout.jsx)</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(LAYOUT_JSX_SNIPPET, "layout-jsx")}
                        >
                            {copiedId === "layout-jsx" ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <pre className="codeBlock">{LAYOUT_JSX_SNIPPET}</pre>
                </div>
                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">CSS — estructura y barra de navegación</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(LAYOUT_CSS_SNIPPET, "layout-css")}
                        >
                            {copiedId === "layout-css" ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <pre className="codeBlock">{LAYOUT_CSS_SNIPPET}</pre>
                </div>
            </section>

            {/* 4. Popups / modals */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">4. Ventanas emergentes y modales</h2>
                <p className="styleGuideSectionIntro">
                    Guías de tamaño, posición e interacción. Haz clic en el botón para ver un modal de ejemplo.
                </p>

                <ul className="guidelineList">
                    <li><strong>Superposición:</strong> Viewport completo, <code>position: fixed</code>, <code>z-index: 999</code>, <code>background: rgba(0,0,0,0.25)</code>. Clic fuera para cerrar.</li>
                    <li><strong>Panel modal:</strong> Centrado (ej. <code>top: 50%; left: 50%; transform: translate(-50%, -50%)</code>). Ancho ~50% o máx. 500px; altura según necesidad. <code>z-index: 1000</code>.</li>
                    <li><strong>Estilo:</strong> <code>border-radius: 25px</code>, fondo degradado o claro (ej. <code>linear-gradient(180deg, #BCBCBC 0%, #FFF 95%)</code>), <code>box-shadow: 0 4px 15px rgba(0,0,0,0.2)</code>.</li>
                    <li><strong>Cerrar:</strong> Incluye un control visible (ej. ×) y soporte para cerrar al hacer clic fuera.</li>
                </ul>

                <button type="button" className="styleGuideDemoBtn" onClick={() => setModalOpen(true)}>
                    Abrir modal de ejemplo
                </button>

                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">CSS — superposición y modal</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(MODAL_CSS_SNIPPET, "modal-css")}
                        >
                            {copiedId === "modal-css" ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <pre className="codeBlock">{MODAL_CSS_SNIPPET}</pre>
                </div>
                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">JSX — patrón de modal</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(MODAL_JSX_SNIPPET, "modal")}
                        >
                            {copiedId === "modal" ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <pre className="codeBlock">{MODAL_JSX_SNIPPET}</pre>
                </div>
            </section>

            {/* 5. Feedback and inline help */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">5. Retroalimentación y ayuda en línea</h2>
                <p className="styleGuideSectionIntro">
                    Usa mensajes de error en rojo cuando el usuario no ha proporcionado información requerida o la validación falla. Usa verde para éxito. El texto de ayuda puede aparecer dentro de los campos para guiar la entrada.
                </p>
                <div className="feedbackDemo">
                    <div className="feedbackDemoBlock">
                        <span className="fontLabel">Error — entrada faltante o inválida</span>
                        <p className="errorMsg">El nombre de la comunidad es requerido.</p>
                    </div>
                    <div className="feedbackDemoBlock">
                        <span className="fontLabel">Éxito</span>
                        <p className="successMsg">¡Comunidad creada!</p>
                    </div>
                    <div className="feedbackDemoBlock">
                        <span className="fontLabel">Ayuda en línea (debajo del campo)</span>
                        <p className="helperText">¿Qué tienes en mente?</p>
                    </div>
                </div>
                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">CSS + JSX — retroalimentación y ayuda en línea</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(FEEDBACK_SNIPPET, "feedback")}
                        >
                            {copiedId === "feedback" ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <pre className="codeBlock">{FEEDBACK_SNIPPET}</pre>
                </div>
            </section>

            {/* 6. Data entry standards */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">6. Estándares de entrada de datos</h2>
                <p className="styleGuideSectionIntro">
                    Los campos requeridos usan un asterisco (*). Cada campo necesita un placeholder. Los campos de contraseña incluyen un ícono para mostrar/ocultar la contraseña.
                </p>
                <div className="dataEntryDemo">
                    <div className="dataEntryRow form-field">
                        <div className="form-field-title">
                            Correo electrónico <span className="required">*</span>
                        </div>
                        <div className="form-field-textbox">
                            <input
                                type="text"
                                className="form-field-input"
                                placeholder="Tu correo electrónico"
                            />
                        </div>
                    </div>
                    <div className="dataEntryRow form-field">
                        <div className="form-field-title">
                            Nombre de la comunidad <span className="required">*</span>
                        </div>
                        <div className="form-field-textbox">
                            <input
                                type="text"
                                className="form-field-input"
                                placeholder="ej. Juegos de Mesa"
                            />
                        </div>
                    </div>
                    <div className="dataEntryRow form-field">
                        <div className="form-field-title">
                            Contraseña <span className="required">*</span>
                        </div>
                        <div className="form-field-textbox">
                            <input
                                id="styleguide-password-input"
                                type={passwordVisible ? "text" : "password"}
                                className="form-field-input"
                                placeholder="Tu contraseña"
                            />
                            <img
                                id="styleguide-password-hide-button"
                                className={passwordVisible ? "hidden" : ""}
                                src={passwordHideIcon}
                                alt="PASSWORD-HIDE"
                                onMouseUp={() => setPasswordVisible(true)}
                            />
                            <img
                                id="styleguide-password-view-button"
                                className={passwordVisible ? "" : "hidden"}
                                src={passwordViewIcon}
                                alt="PASSWORD-VIEW"
                                onMouseUp={() => setPasswordVisible(false)}
                            />
                        </div>
                    </div>
                </div>
                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">JSX — campos requeridos, placeholders, toggle de contraseña</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(DATA_ENTRY_SNIPPET, "data")}
                        >
                            {copiedId === "data" ? "¡Copiado!" : "Copiar"}
                        </button>
                    </div>
                    <pre className="codeBlock">{DATA_ENTRY_SNIPPET}</pre>
                </div>
            </section>

            {/* Example modal */}
            {modalOpen && (
                <div className="popup-overlay styleGuideOverlay" onClick={() => setModalOpen(false)}>
                    <div className="styleGuideModal" onClick={e => e.stopPropagation()}>
                        <button type="button" className="popup-close-btn" onClick={() => setModalOpen(false)} aria-label="Cerrar">&times;</button>
                        <h2 className="styleGuideModalTitle">Modal de ejemplo</h2>
                        <p className="styleGuideModalText">
                            Este modal usa las mismas guías de superposición y panel: centrado, 50% de ancho, esquinas redondeadas, fondo degradado. Haz clic fuera o en × para cerrar.
                        </p>
                    </div>
                </div>
            )}

            <footer className="styleGuideFooter">
                <Link to="/home" className="styleGuideBackLink">← Volver al inicio</Link>
            </footer>
        </div>
    );
}