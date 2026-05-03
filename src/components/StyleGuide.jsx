import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "styles/StyleGuide.css";
import "styles/FormField.css";
import "styles/Postcard.css";
import "styles/settings-page/managers/BlockedUserManager.css";
import { useTranslation } from "react-i18next";
import homeIcon from "../assets/home.svg";
import hamburgerIcon from "../assets/hamburgerMenu.svg";
import defaultProfileIcon from "../assets/default-profile.svg";
import logoIcon from "../assets/logo.png";
import passwordHideIcon from "assets/password-hide-icon.png";
import passwordViewIcon from "assets/password-view-icon.png";
import { BaseSwitch } from "components/settings-page/base/BaseSwitch";
import { BaseTextBox } from "components/settings-page/base/BaseTextBox";
import { BaseTextArea } from "components/settings-page/base/BaseTextArea";
import bellIcon from "../assets/bell.png";
import pinIcon from "../assets/pin.png";
import likeIcon from "../assets/heart.svg";
import filledLikeIcon from "../assets/filled_heart.svg";
import emptyStar from 'assets/star-empty.png';
import halfStar from 'assets/star-half.png';
import fullStar from 'assets/star-full.png';
import commentIcon from "../assets/comment-icon.svg"
import goatField from "../assets/goat_field.jpg";
import CreateStarInteractive from "components/Postcard";
import CreateStar from "components/Postcard";

const COLOR_SNIPPET = `/* Primary CTA */
.Btn { background: #f06400; color: white; }
.Btn-primary { background: #F08A24; color: #101010; }

/* Cards and surfaces */
.Card-surface { background: #D9D9D9; }
.Card-community { background: #1D3557; }
.feedShell { background: rgba(255, 255, 255, 0.92); }

/* Destructive */
.leaveBtnStyle { background: #9a3333; color: white; }

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

const MODAL_CSS_SNIPPET = `/* Community/Post edit modal pattern */
.postModalOverlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.postModal {
  background: white;
  border-radius: 16px;
  padding: 28px;
  width: 100%;
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}

.postModalInput,
.postModalTextarea {
  width: 100%;
  border: 1.5px solid #e0e0e0;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 15px;
  font-family: inherit;
}`;

const MODAL_JSX_SNIPPET = `<div className="postModalOverlay" onClick={onClose}>
  <div className="postModal" onClick={(e) => e.stopPropagation()}>
    <div className="postTitleOverflow">
      <h2>Edit post</h2>
    </div>

    <div className="postModalFieldWrapper">
      <div className="postModalFieldLabel">Title</div>
      <input className="postModalInput" type="text" placeholder="Title" />
    </div>

    <div className="postModalFieldWrapper">
      <div className="postModalFieldLabel">Caption</div>
      <textarea className="postModalTextarea" rows={5} placeholder="Write a placeholder here..." />
    </div>

    <div className="postModalActions">
      <button className="feedGhostBtn" onClick={onClose}>Cancel</button>
      <button className="feedPrimaryBtn">Save</button>
    </div>
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

const FEEDPRIMARYBTN_SNIPPET = `.feedPrimaryBtn {
  border-radius: 999px;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  background: #f08a24;
  color: #fff;
}
.feedPrimaryBtn:hover {
  background: #db6c12;
}`;

const FEEDGHOSTBTN_SNIPPET = `.feedGhostBtn {
    border-radius: 999px;
    padding: 10px 20px;
    border: none;
    cursor: pointer;
    font-size: 15px;
    font-weight: 600;
    background: rgba(0,0,0,0.08);
    color: #111;
}
.feedGhostBtn:hover {
    background: rgba(0,0,0,0.20);
}`;

const LEAVEBTN_SNIPPET = `.leaveBtn {
  padding: 8px 16px;
  border-radius: 999px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  color: white;
  font-size: 15px;
  white-space: nowrap;
  background: #9a3333;
}
.leaveBtn:hover {
  background: #7a2828;
  transform:translateY(-2px);
}`;
const DELETEBTN_SNIPPET = `.deleteBtn {
  border-radius: 999px;
  padding: 10px 20px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  background: #F64E4E;
  color: #fff;
}
.deleteBtn:hover {
  background: #cc0000
}`;

export default function StyleGuide() {
    const { t } = useTranslation();
    const [modalOpen, setModalOpen] = useState(false);
    const [passwordVisible, setPasswordVisible] = useState(false);
    const [copiedId, setCopiedId] = useState(null);
    const [demoSwitch, setDemoSwitch] = useState(true);
    const [email, setEmail] = useState("");
    const [bio, setBio] = useState("");
    const [isNotFollow, setIsNotFollow] = useState(false);
    const [isNotBlock, setIsNotBlock] = useState(false);
    const [isPinFilled, setIsPinFilled] = useState(false);

    // State for post preview likes
    const [likes1, setLikes1] = useState(false);
    const [likes2, setLikes2] = useState(false);
    const [likes3, setLikes3] = useState(false);
    const [likes4, setLikes4] = useState(false);
    const [likes5, setLikes5] = useState(false);

    const handleCopy = async (text, id) => {
        await navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => {
            setCopiedId(null);
        }, 1500);
    };

    const [hoverValue, setHoverValue] = useState(null);
    const displayValue = 5;
    const srcs = [
        displayValue >= 0.75 ? fullStar : displayValue >= 0.25 ? halfStar : emptyStar,
        displayValue >= 1.75 ? fullStar : displayValue >= 1.25 ? halfStar : emptyStar,
        displayValue >= 2.75 ? fullStar : displayValue >= 2.25 ? halfStar : emptyStar,
        displayValue >= 3.75 ? fullStar : displayValue >= 3.25 ? halfStar : emptyStar,
        displayValue >= 4.75 ? fullStar : displayValue >= 4.25 ? halfStar : emptyStar,
    ];

    const displayValue2 = 4.5;
    const srcs2 = [
        displayValue2 >= 0.75 ? fullStar : displayValue2 >= 0.25 ? halfStar : emptyStar,
        displayValue2 >= 1.75 ? fullStar : displayValue2 >= 1.25 ? halfStar : emptyStar,
        displayValue2 >= 2.75 ? fullStar : displayValue2 >= 2.25 ? halfStar : emptyStar,
        displayValue2 >= 3.75 ? fullStar : displayValue2 >= 3.25 ? halfStar : emptyStar,
        displayValue2 >= 4.75 ? fullStar : displayValue2 >= 4.25 ? halfStar : emptyStar,
    ];
    

    return (
        <div className="styleGuidePage">
            <header className="styleGuideHeader">
                <h1 className="styleGuideTitle">{t("styleGuide.title")}</h1>
                <p className="styleGuideSubtitle">
                    {t("styleGuide.subtitle")}
                </p>
            </header>
            
            {/* 1. Color palette */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">{t("styleGuide.sections.colors.title")}</h2>
                <p className="styleGuideSectionIntro">
                    {t("styleGuide.sections.colors.intro")}
                </p>

                <div className="colorGrid">
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#1D3557" }} />
                        <div className="colorName">#1D3557</div>
                        <div className="colorUse">{t("styleGuide.colorCards.navy")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#224A84" }} />
                        <div className="colorName">#224A84</div>
                        <div className="colorUse">{t("styleGuide.colorCards.blue")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#F08A24" }} />
                        <div className="colorName">#F08A24</div>
                        <div className="colorUse">{t("styleGuide.colorCards.orange")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#F06400" }} />
                        <div className="colorName">#F06400</div>
                        <div className="colorUse">{t("styleGuide.colorCards.deepOrange")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#9a3333" }} />
                        <div className="colorName">#9a3333</div>
                        <div className="colorUse">{t("styleGuide.colorCards.red")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#F64E4E" }} />
                        <div className="colorName">#F64E4E</div>
                        <div className="colorUse">{t("styleGuide.colorCards.brightred")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#000000", border: "1px solid #eee" }} />
                        <div className="colorName">#000000</div>
                        <div className="colorUse">{t("styleGuide.colorCards.black")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#D9D9D9" }} />
                        <div className="colorName">#D9D9D9</div>
                        <div className="colorUse">{t("styleGuide.colorCards.gray")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "rgba(255,255,255,0.92)" }} />
                        <div className="colorName">rgba(255,255,255,0.92)</div>
                        <div className="colorUse">{t("styleGuide.colorCards.white")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "rgba(0,0,0,0.25)" }} />
                        <div className="colorName">rgba(0,0,0,0.25)</div>
                        <div className="colorUse">{t("styleGuide.colorCards.overlay")}</div>
                    </div>
                    <div className="colorCard">
                        <div className="colorSwatch" style={{ background: "#333333" }} />
                        <div className="colorName">rgba(0,0,0,0.25)</div>
                        <div className="colorUse">{t("styleGuide.colorCards.tag")}</div>
                    </div>
                </div>

                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">{t("styleGuide.sections.colors.codeLabel")}</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(COLOR_SNIPPET, "color")}
                        >
                            {copiedId === "color" ? t("styleGuide.copied") : t("styleGuide.copy")}
                        </button>
                    </div>
                    <pre className="codeBlock">{COLOR_SNIPPET}</pre>
                </div>
            </section>

            {/* 2. Fonts and font sizes */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">{t("styleGuide.sections.fonts.title")}</h2>
                <p className="styleGuideSectionIntro">
                    {t("styleGuide.sections.fonts.intro")}
                </p>

                <div className="fontShowcase">
                    <div className="fontExample">
                        <span className="fontLabel">{t("styleGuide.fontSamples.appName")}</span>
                        <div className="fontSample" style={{ fontFamily: "Orbitron, sans-serif", fontSize: "50px" }}>
                            Herd
                        </div>
                    </div>

                    <div className="fontExample">
                        <span className="fontLabel">{t("styleGuide.fontSamples.sectionHeader")}</span>
                        <div className="fontSample" style={{ fontFamily: '"Zen Dots", sans-serif', fontSize: "32px" }}>
                            {t("styleGuide.fontSamples.sectionHeaderExample")}
                        </div>
                    </div>

                    <div className="fontExample">
                        <span className="fontLabel">{t("styleGuide.fontSamples.formLabel")}</span>
                        <div className="fontSample" style={{ fontFamily: "Oxanium, sans-serif", fontSize: "48px" }}>
                            {t("createCommunity.fields.communityName")}
                        </div>
                    </div>

                    <div className="fontExample">
                        <span className="fontLabel">{t("styleGuide.fontSamples.modalTitle")}</span>
                        <div className="fontSample" style={{ fontFamily: "Oxanium, sans-serif", fontSize: "22px" }}>
                            {t("createCommunity.fields.communityName")}
                        </div>
                    </div>

                    <div className="fontExample">
                        <span className="fontLabel">{t("styleGuide.fontSamples.secondary")}</span>
                        <div className="fontSample" style={{ fontFamily: "Oxanium, sans-serif", fontSize: "15px" }}>
                            {t("styleGuide.fontSamples.secondaryExample")}
                        </div>
                    </div>
                </div>

                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">{t("styleGuide.sections.fonts.codeLabel")}</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(FONT_SNIPPET, "font")}
                        >
                            {copiedId === "font" ? t("styleGuide.copied") : t("styleGuide.copy")}
                        </button>
                    </div>
                    <pre className="codeBlock">{FONT_SNIPPET}</pre>
                </div>
        </section>

        {/* 3. Buttons */}
        <section className="styleGuideSection">
            <h2 className="styleGuideSectionTitle">{t("styleGuide.sections.buttons.title")}</h2>
                <p className="styleGuideSectionIntro">
                    {t("styleGuide.sections.buttons.intro")}
                </p>
                <div className="styleGuideRow">
                    <button type="button" className="feedPrimaryBtn">{t("styleGuide.sections.buttons.post")}</button>
                    <button type="button" className="feedGhostBtn">{t("styleGuide.sections.buttons.cancel")}</button>
                    <button type="button" className="leaveBtnStyle">{t("styleGuide.sections.buttons.leave")}</button>
                    <button type="button" className="deleteBtn">{t("styleGuide.sections.buttons.delete")}</button>
                </div>

                <ul className="guidelineList">
                    <li>Use <code className="styleGuideInlineCode">feedPrimaryBtn</code>{t("styleGuide.sections.buttons.postBtnMessage")}</li>
                    <div className="codeBlockWrap">
                        <div className="codeBlockHeaderRow">
                            <div className="codeBlockLabel">{t("styleGuide.sections.buttons.codeLabel")}</div>
                            <button
                                type="button"
                                className="codeCopyBtn"
                                onClick={() => handleCopy(FEEDPRIMARYBTN_SNIPPET, "font")}
                            >
                                {copiedId === "font" ? t("styleGuide.copied") : t("styleGuide.copy")}
                            </button>
                        </div>
                        <pre className="codeBlock">{FEEDPRIMARYBTN_SNIPPET}</pre>
                    </div>
                    
                    <li>Use <code className="styleGuideInlineCode">feedGhostBtn</code>{t("styleGuide.sections.buttons.cancelBtnMessage")}</li>
                    <div className="codeBlockWrap">
                        <div className="codeBlockHeaderRow">
                            <div className="codeBlockLabel">{t("styleGuide.sections.buttons.codeLabel")}</div>
                            <button
                                type="button"
                                className="codeCopyBtn"
                                onClick={() => handleCopy(FEEDGHOSTBTN_SNIPPET, "font")}
                            >
                                {copiedId === "font" ? t("styleGuide.copied") : t("styleGuide.copy")}
                            </button>
                        </div>
                        <pre className="codeBlock">{FEEDGHOSTBTN_SNIPPET}</pre>
                    </div>
                    
                    <li>Use <code className="styleGsuideInlineCode">leaveBtn</code>{t("styleGuide.sections.buttons.leaveBtnMessage")}</li>
                    <div className="codeBlockWrap">
                        <div className="codeBlockHeaderRow">
                            <div className="codeBlockLabel">{t("styleGuide.sections.buttons.codeLabel")}</div>
                            <button
                                type="button"
                                className="codeCopyBtn"
                                onClick={() => handleCopy(LEAVEBTN_SNIPPET, "font")}
                            >
                                {copiedId === "font" ? t("styleGuide.copied") : t("styleGuide.copy")}
                            </button>
                        </div>
                        <pre className="codeBlock">{LEAVEBTN_SNIPPET}</pre>
                    </div>

                    <li>Use <code className="styleGsuideInlineCode">deleteBtn</code>{t("styleGuide.sections.buttons.deleteBtnMessage")}</li>
                    <div className="codeBlockWrap">
                        <div className="codeBlockHeaderRow">
                            <div className="codeBlockLabel">{t("styleGuide.sections.buttons.codeLabel")}</div>
                            <button
                                type="button"
                                className="codeCopyBtn"
                                onClick={() => handleCopy(DELETEBTN_SNIPPET, "font")}
                            >
                                {copiedId === "font" ? t("styleGuide.copied") : t("styleGuide.copy")}
                            </button>
                        </div>
                        <pre className="codeBlock">{DELETEBTN_SNIPPET}</pre>
                    </div>

                    <li>{t("styleGuide.sections.buttons.interactiveMessage")}</li>
                    <div className="styleGuideRow">
                        <div className="styleItem">
                            {isNotFollow
                                ? <button type="button" className="user-list-item__unfollow-button" onClick={() => {setIsNotFollow(false)}}>{t("styleGuide.sections.buttons.following")}</button>
                                : <button type="button" className="user-list-item__follow-button" onClick={() => {setIsNotFollow(true)}}>{t("styleGuide.sections.buttons.follow")}</button>
                            }
                        </div>
                        <div className="styleItem">
                        {isNotBlock
                            ? <button type="button" className="blocked-user-list-item__unblock-button" onClick={() => {setIsNotBlock(false)}}>{t("styleGuide.sections.buttons.unblock")}</button>
                            : <button type="button" className="red-block-button" onClick={() => {setIsNotBlock(true)}}>{t("styleGuide.sections.buttons.block")}</button>
                        }
                        </div>
                        <button type="button" onClick={() => {setIsPinFilled(!isPinFilled)}}>
                            <img className={isPinFilled ? "pinExampleFilled" : "pinExampleUnfilled"} src={pinIcon}></img>
                        </button>
                        
                        <BaseSwitch
                            value={demoSwitch}
                            onToggle={async (isActive) => {
                                await new Promise((r) => setTimeout(r, 120));
                                if (isActive()) setDemoSwitch((v) => !v);
                            }}
                        />&lt;- Click Me!
                    </div>
                </ul>
            </section>

            {/* 3. Layout and navigation */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">{t("styleGuide.sections.layout.title")}</h2>
                <p className="styleGuideSectionIntro">
                    {t("styleGuide.sections.layout.intro")}
                </p>

                <div className="layoutExample">
                    <div className="layoutNavSample">
                        <div className="layoutNavLogo">
                            <img src={logoIcon} alt="Herd Logo" className="topnav-icon" />
                            <span className="layoutNavAppName">Herd</span>
                        </div>
                        <div className="nav-right">
                            <img src={homeIcon} alt="Home" className="topnav-icon" />
                            <img src={bellIcon} alt={t("navbar.notifications")} className="topnav-icon" />
                            <img src={hamburgerIcon} alt="Hamburger" className="topnav-icon" />
                            <img
                                src={defaultProfileIcon} alt="Profile" className="topnav-icon" style={{ borderRadius: "50%" }}
                            />
                        </div>
                    </div>
                    <div className="layoutMainSample">
                       <p>{t("styleGuide.sections.layout.layoutMainSample")}</p>
                    </div>
                </div>

                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">{t("styleGuide.sections.layout.codeLabelJsx")}</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(LAYOUT_JSX_SNIPPET, "layout-jsx")}
                        >
                            {copiedId === "layout-jsx" ? t("styleGuide.copied") : t("styleGuide.copy")}
                        </button>
                    </div>
                    <pre className="codeBlock">{LAYOUT_JSX_SNIPPET}</pre>
                </div>
                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">{t("styleGuide.sections.layout.codeLabelCss")}</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(LAYOUT_CSS_SNIPPET, "layout-css")}
                        >
                            {copiedId === "layout-css" ? t("styleGuide.copied") : t("styleGuide.copy")}
                        </button>
                    </div>
                    <pre className="codeBlock">{LAYOUT_CSS_SNIPPET}</pre>
                </div>
            </section>

            {/* 4. Popups / modals */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">{t("styleGuide.sections.modals.title")}</h2>
                <p className="styleGuideSectionIntro">
                    {t("styleGuide.sections.modals.intro")}
                </p>

                <ul className="guidelineList">
                    <li dangerouslySetInnerHTML={{ __html: t("styleGuide.sections.modals.guidelines.overlay") }} />
                    <li dangerouslySetInnerHTML={{ __html: t("styleGuide.sections.modals.guidelines.panel") }} />
                    <li dangerouslySetInnerHTML={{ __html: t("styleGuide.sections.modals.guidelines.style") }} />
                    <li dangerouslySetInnerHTML={{ __html: t("styleGuide.sections.modals.guidelines.close") }} />
                </ul>

                <button type="button" className="styleGuideDemoBtn" onClick={() => setModalOpen(true)}>
                    {t("styleGuide.openModal")}
                </button>

                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">{t("styleGuide.sections.modals.codeLabelCss")}</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(MODAL_CSS_SNIPPET, "modal-css")}
                        >
                            {copiedId === "modal-css" ? t("styleGuide.copied") : t("styleGuide.copy")}
                        </button>
                    </div>
                    <pre className="codeBlock">{MODAL_CSS_SNIPPET}</pre>
                </div>
                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">{t("styleGuide.sections.modals.codeLabelJsx")}</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(MODAL_JSX_SNIPPET, "modal")}
                        >
                            {copiedId === "modal" ? t("styleGuide.copied") : t("styleGuide.copy")}
                        </button>
                    </div>
                    <pre className="codeBlock">{MODAL_JSX_SNIPPET}</pre>
                </div>
            </section>

            {/* 5. Feedback and inline help */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">{t("styleGuide.sections.feedback.title")}</h2>
                <p className="styleGuideSectionIntro">
                    {t("styleGuide.sections.feedback.intro")}
                </p>
                <div className="feedbackDemo">
                    <div className="feedbackDemoBlock">
                        <span className="fontLabel">{t("styleGuide.sections.feedback.errorLabel")}</span>
                        <div><p className="post-field-error-message">{t("styleGuide.sections.feedback.errorExample")}</p></div>
                    </div>
                    <div className="feedbackDemoBlock">
                        <span className="fontLabel">{t("styleGuide.sections.feedback.successLabel")}</span>
                        <p className="successMsg">{t("styleGuide.sections.feedback.successExample")}</p>
                    </div>
                    <div className="feedbackDemoBlock">
                        <span className="fontLabel">{t("styleGuide.sections.feedback.helpLabel")}</span>
                        <p className="helperText">{t("styleGuide.sections.feedback.helpExample")}</p>
                    </div>
                </div>
                <div className="codeBlockWrap">
                    <div className="codeBlockHeaderRow">
                        <div className="codeBlockLabel">{t("styleGuide.sections.feedback.codeLabel")}</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(FEEDBACK_SNIPPET, "feedback")}
                        >
                            {copiedId === "feedback" ? t("styleGuide.copied") : t("styleGuide.copy")}
                        </button>
                    </div>
                    <pre className="codeBlock">{FEEDBACK_SNIPPET}</pre>
                </div>
            </section>

            {/* 6. Data entry standards */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">{t("styleGuide.sections.dataEntry.title")}</h2>
                <p className="styleGuideSectionIntro">
                    {t("styleGuide.sections.dataEntry.intro")}
                </p>
                <ul className="guidelineList">
                    <li>{t("styleGuide.sections.dataEntry.loginsignup")}</li>
                <div className="dataEntryDemo">
                    <div className="dataEntryRow form-field">
                        <div className="form-field-title">
                            {t("settings.fields.email")} <span className="required">*</span>
                        </div>
                        <div className="form-field-textbox">
                            <input
                                type="text"
                                className="form-field-input"
                                placeholder={t("settings.fields.email")}
                            />
                        </div>
                    </div>
                    <div className="dataEntryRow form-field">
                        <div className="form-field-title">
                            {t("createCommunity.fields.communityName")} <span className="required">*</span>
                        </div>
                        <div className="form-field-textbox">
                            <input
                                type="text"
                                className="form-field-input"
                                placeholder={t("createCommunity.fields.communityNamePlaceholder")}
                            />
                        </div>
                    </div>
                    <div className="dataEntryRow form-field">
                        <div className="form-field-title">
                            {t("settings.resetPasswordModal.newPassword")} <span className="required">*</span>
                        </div>
                        <div className="form-field-textbox">
                            <input
                                id="styleguide-password-input"
                                type={passwordVisible ? "text" : "password"}
                                className="form-field-input"
                                placeholder={t("settings.resetPasswordModal.newPassword")}
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
                        <div className="codeBlockLabel">{t("styleGuide.sections.dataEntry.codeLabel")}</div>
                        <button
                            type="button"
                            className="codeCopyBtn"
                            onClick={() => handleCopy(DATA_ENTRY_SNIPPET, "data")}
                        >
                            {copiedId === "data" ? t("styleGuide.copied") : t("styleGuide.copy")}
                        </button>
                    </div>
                    <pre className="codeBlock">{DATA_ENTRY_SNIPPET}</pre>
                </div>
                
                <div className="settings-section__content">
                    <div className="settings-section__content-row">
                        <BaseTextBox
                            label={t("settings.fields.screenname")}
                            name="screenanmes"
                            placeholder={t("settings.placeholders.screenname")}
                            maxLength={150}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onReset={() => setEmail("")}
                            onValidate={async (_controller, isActive) => {
                                await new Promise((r) => setTimeout(r, 80));
                                if (!isActive()) return;
                            }}
                        />
                        <BaseTextArea
                            label={t("settings.fields.biography")}
                            name="bio"
                            placeholder={t("settings.placeholders.biography")}
                            maxLength={150}
                            value={bio}
                            message={""}
                            onChange={(e) => setBio(e.target.value)}
                            onReset={() => setBio("")}
                            onValidate={async (_controller, isActive) => {
                                await new Promise((r) => setTimeout(r, 80));
                                if (!isActive()) return;
                            }}
                        />
                    </div>
                </div>


                
                </ul>
            </section>

            {/* 8. Post Types */}
            <section className="styleGuideSection">
                <h2 className="styleGuideSectionTitle">{t("styleGuide.sections.postTypes.title")}</h2>
                <p className="styleGuideSectionIntro">
                    {t("styleGuide.sections.postTypes.intro")}
                </p>

                <div className="postTypesPreviewStack">
                    <div className="postCard">
                        <div className="postCardAvatarLink styleGuidePostPreview__noLink">
                            <img src={logoIcon} alt="avatar" className="postCardAvatar" />
                        </div>
                        <div className="postCardMain">
                            <div className="postCardTopRow">
                                <div className="postCardIdentity">
                                    <div className="postCardNameRow">
                                        <div className="postCardNameLink styleGuidePostPreview__noLink">
                                            <span className="postCardName">{t("styleGuide.sections.postTypes.postCardName")}</span>
                                            <span className="postCardUsername">{t("styleGuide.sections.postTypes.postCardUsername")}</span>
                                        </div>
                                        <span className="postCardCommunityTag">{t("styleGuide.sections.postTypes.postCardCommunityTag")}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="postCardBody">
                                <div className="postCardTitle">Join the Herd</div>
                                <div className="postCardContent">Join the GOATs.</div>
                            </div>

                            {likes1 ? (
                                <div className="postCardFooter">
                                    <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                        <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                    <button type="button" className={`postCardLikeIconBtn`} aria-label={"Unlike"} onClick={() => setLikes1(false)}>
                                        <img src={filledLikeIcon} alt="Like" className="postCardLikeIcon"/>
                                    </button>
                                <span className="postCardLikeCount">{1}</span>
                            </div>
                            ) : (
                                <div className="postCardFooter">
                                <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                    <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                </button>
                                <span className="postCardLikeCount">{0}</span>
                                <button type="button" className={`postCardLikeIconBtn`} aria-label={"Like"} onClick={() => setLikes1(true)}>
                                    <img src={likeIcon} alt="Like" className="postCardLikeIcon"/>
                                </button>
                                <span className="postCardLikeCount">{0}</span>
                            </div>
                            )}
                        </div>
                    </div>

                    <div className="postCard">
                        <div className="postCardAvatarLink styleGuidePostPreview__noLink">
                            <img src={logoIcon} alt="avatar" className="postCardAvatar" />
                        </div>
                        <div className="postCardMain">
                            <div className="postCardTopRow">
                                <div className="postCardIdentity">
                                    <div className="postCardNameRow">
                                        <div className="postCardNameLink styleGuidePostPreview__noLink">
                                            <span className="postCardName">{t("styleGuide.sections.postTypes.postCardName")}</span>
                                            <span className="postCardUsername">{t("styleGuide.sections.postTypes.postCardUsername")}</span>
                                        </div>
                                        <span className="postCardCommunityTag">{t("styleGuide.sections.postTypes.postCardCommunityTag")}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="postCardBody">
                                <div className="postCardTitle">Be a goat roaming the lands.</div>
                                <div className="postCardContent">Over good pastures.</div>
                            </div>
                            <div className="postCardBody">
                                <img className="postCardAttachment" src={goatField} alt="goat field" />
                            </div>


                            {likes2 ? (
                                <div className="postCardFooter">
                                    <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                        <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                    <button type="button" className={`postCardLikeIconBtn`} aria-label={"Unlike"} onClick={() => setLikes2(false)}>
                                        <img src={filledLikeIcon} alt="Like" className="postCardLikeIcon"/>
                                    </button>
                                <span className="postCardLikeCount">{1}</span>
                            </div>
                            ) : (
                                <div className="postCardFooter">
                                    <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                        <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                    <button type="button" className={`postCardLikeIconBtn`} aria-label={"Like"} onClick={() => setLikes2(true)}>
                                        <img src={likeIcon} alt="Like" className="postCardLikeIcon"/>
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                </div>
                            )}


                            
                        </div>
                    </div>

                    <div className="postCard">
                        <div className="postCardAvatarLink styleGuidePostPreview__noLink">
                            <img src={logoIcon} alt="avatar" className="postCardAvatar" />
                        </div>
                        <div className="postCardMain">
                            <div className="postCardTopRow">
                                <div className="postCardIdentity">
                                    <div className="postCardNameRow">
                                        <div className="postCardNameLink styleGuidePostPreview__noLink">
                                            <span className="postCardName">{t("styleGuide.sections.postTypes.postCardName")}</span>
                                            <span className="postCardUsername">{t("styleGuide.sections.postTypes.postCardUsername")}</span>
                                        </div>
                                        <span className="postCardCommunityTag">{t("styleGuide.sections.postTypes.postCardCommunityTag")}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="postCardBody">
                                <div className="postCardTitle">Goats live in a lot of different places.</div>
                                <div className="postCardContent">From warm to cold, high to low.</div>
                            </div>
                            <div className="pollPanel">
                                <div className="pollQuestion">Where would you want to be a goat in?</div>
                                <div className="pollHeader">Select One Option (3)</div>
                                <ul className="pollList">
                                    <li className="pollItem"><span>Mountainous region</span></li>
                                    <li className="pollItemClicked"><span>Snowy tundra region</span></li>
                                    <li className="pollItem"><span>In the pastures</span></li>
                                </ul>
                                <div className="voteBtnWrapper">
                                    <button className="voteBtn" type="button">Vote</button>
                                </div>
                            </div>


                            {likes3 ? (
                                <div className="postCardFooter">
                                    <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                        <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                    <button type="button" className={`postCardLikeIconBtn`} aria-label={"Unlike"}  onClick={() => setLikes3(false)}>
                                        <img src={filledLikeIcon} alt="Like" className="postCardLikeIcon"/>
                                    </button>
                                    <span className="postCardLikeCount">{1}</span>
                                </div>
                            ) : (
                                <div className="postCardFooter">
                                    <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                        <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                    <button type="button" className={`postCardLikeIconBtn`} aria-label={"Like"}  onClick={() => setLikes3(true)}>
                                        <img src={likeIcon} alt="Like" className="postCardLikeIcon"/>
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                </div>
                            )}
                            
                        </div>
                    </div>

                    <div className="postCard">
                        <div className="postCardAvatarLink styleGuidePostPreview__noLink">
                            <img src={logoIcon} alt="avatar" className="postCardAvatar" />
                        </div>
                        <div className="postCardMain">
                            <div className="postCardTopRow">
                                <div className="postCardIdentity">
                                    <div className="postCardNameRow">
                                        <div className="postCardNameLink styleGuidePostPreview__noLink">
                                            <span className="postCardName">{t("styleGuide.sections.postTypes.postCardName")}</span>
                                            <span className="postCardUsername">{t("styleGuide.sections.postTypes.postCardUsername")}</span>
                                        </div>
                                        <span className="postCardCommunityTag">{t("styleGuide.sections.postTypes.postCardCommunityTag")}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="postCardBody">
                                <div className="postCardTitle">Goats are cloven-hoofed, ruminant mammals.</div>
                                <div className="postCardContent">Along with many other mammals.</div>
                            </div>
                            <div className="pollPanel">
                                <div className="rankQuestion">Ranking bovidae</div>
                                <ul className="rankList">
                                    <li className="rankWrapper"><span className="rankNumbers">1</span><span className="rankItems">Goats</span></li>
                                    <li className="rankWrapper"><span className="rankNumbers">2</span><span className="rankItems">Sheep</span></li>
                                    <li className="rankWrapper"><span className="rankNumbers">3</span><span className="rankItems">Antelope</span></li>
                                </ul>
                                <div className="voteBtnWrapper">
                                    <button className="voteBtn" type="button">Submit</button>
                                </div>
                            </div>


                            {likes4 ? (
                                <div className="postCardFooter">
                                    <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                        <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                    <button type="button" className={`postCardLikeIconBtn`} aria-label={"Unlike"}  onClick={() => setLikes4(false)}>
                                        <img src={filledLikeIcon} alt="Like" className="postCardLikeIcon"/>
                                    </button>
                                    <span className="postCardLikeCount">{1}</span>
                                </div>
                            ) : (
                                <div className="postCardFooter">
                                    <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                        <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                    <button type="button" className={`postCardLikeIconBtn`} aria-label={"Like"} onClick={() => setLikes4(true)}>
                                        <img src={likeIcon} alt="Like" className="postCardLikeIcon"/>
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="postCard">
                        <div className="postCardAvatarLink styleGuidePostPreview__noLink">
                            <img src={logoIcon} alt="avatar" className="postCardAvatar" />
                        </div>
                        <div className="postCardMain">
                            <div className="postCardTopRow">
                                <div className="postCardIdentity">
                                    <div className="postCardNameRow">
                                        <div className="postCardNameLink styleGuidePostPreview__noLink">
                                            <span className="postCardName">{t("styleGuide.sections.postTypes.postCardName")}</span>
                                            <span className="postCardUsername">{t("styleGuide.sections.postTypes.postCardUsername")}</span>
                                        </div>
                                        <span className="postCardCommunityTag">{t("styleGuide.sections.postTypes.postCardCommunityTag")}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="postCardBody">
                                <div className="postCardTitle">5 stars? You're a GOAT.</div>
                                <div className="postCardContent">In my eyes, all goats get 5 stars.</div>
                            </div>
                            <div className="pollPanel">
                                <ul className="rankList">
                                    <li key={0} className="rateWrap" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <div className="ratingItem">Goats</div>
                                            <div className="ratingValue" style={{ display: 'flex', alignItems: 'center' }}>
                                                <div
                                                    className="starContainer"
                                                    role="img"
                                                    aria-label={"Rating for Goat"}
                                                    style={{ opacity: 1 }}
                                                >
                                                    {[0, 1, 2, 3, 4].map((i) => (
                                                        <img
                                                            key={i}
                                                            src={srcs[i]}
                                                            className="star"
                                                            alt={`${i + 1} star`}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    ))}
                                                </div>
                                                5/5
                                            </div>
                                            <div className="sr-only">
                                                <label>Rate Goat (1 to 5 stars)</label>
                                                <select
                                                    value={5}
                                                >
                                                <option value="" disabled>Rate this item...</option>
                                                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(num => (
                                                    <option key={num} value={num}>{num} Stars</option>
                                                ))}
                                                </select>
                                            </div>
                                            <div className="yourRatingRow" style={{ display: 'flex', alignItems: 'center', marginTop: '4px', fontSize: '0.85rem', color: '#666', zoom: '70%' }}>
                                                <span style={{ marginRight: '8px' }}>Your rating</span>
                                                <div>
                                                    <div className="starContainer">
                                                        <img
                                                        src={srcs[0]}
                                                        className="star"
                                                        alt="one star"
                                                        />
                                                        
                                                        <img
                                                        src={srcs[1]}
                                                        className="star"
                                                        alt="two star"
                                                        />

                                                        <img
                                                        src={srcs[2]}
                                                        className="star"
                                                        alt="three star"
                                                        />
                                                        <img
                                                        src={srcs[3]}
                                                        className="star"
                                                        alt="four star"
                                                        />
                                                        <img
                                                        src={srcs[4]}
                                                        className="star"
                                                        alt="five star"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                    </li>
                                    <li key={0} className="rateWrap" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                        <div className="ratingItem">Sheep</div>
                                            <div className="ratingValue" style={{ display: 'flex', alignItems: 'center' }}>
                                                <div
                                                    className="starContainer"
                                                    role="img"
                                                    aria-label={"Rating for Sheep"}
                                                    style={{ opacity: 1 }}
                                                >
                                                    {[0, 1, 2, 3, 4].map((i) => (
                                                        <img
                                                            key={i}
                                                            src={srcs2[i]}
                                                            className="star"
                                                            alt={`${i + 1} star`}
                                                            style={{ cursor: 'pointer' }}
                                                        />
                                                    ))}
                                                </div>
                                                4.5/5
                                            </div>
                                            <div className="sr-only">
                                                <label>Rate Sheep (1 to 5 stars)</label>
                                                <select
                                                    value={5}
                                                >
                                                <option value="" disabled>Rate this item...</option>
                                                {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(num => (
                                                    <option key={num} value={num}>{num} Stars</option>
                                                ))}
                                                </select>
                                            </div>
                                            <div className="yourRatingRow" style={{ display: 'flex', alignItems: 'center', marginTop: '4px', fontSize: '0.85rem', color: '#666', zoom: '70%' }}>
                                                <span style={{ marginRight: '8px' }}>Your rating</span>
                                                <div>
                                                    <div className="starContainer">
                                                        <img
                                                        src={srcs2[0]}
                                                        className="star"
                                                        alt="one star"
                                                        />
                                                        
                                                        <img
                                                        src={srcs2[1]}
                                                        className="star"
                                                        alt="two star"
                                                        />

                                                        <img
                                                        src={srcs2[2]}
                                                        className="star"
                                                        alt="three star"
                                                        />
                                                        <img
                                                        src={srcs2[3]}
                                                        className="star"
                                                        alt="four star"
                                                        />
                                                        <img
                                                        src={srcs2[4]}
                                                        className="star"
                                                        alt="five star"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                    </li>
                                </ul>
                            </div>

                            {likes5 ? (
                                <div className="postCardFooter">
                                    <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                        <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                    <button type="button" className={`postCardLikeIconBtn`} aria-label={"Unlike"} onClick={() => setLikes5(false)}>
                                        <img src={filledLikeIcon} alt="Like" className="postCardLikeIcon"/>
                                    </button>
                                    <span className="postCardLikeCount">{1}</span>
                                </div>
                            ) : (
                                <div className="postCardFooter">
                                    <button type="button" className="postCardCommentBtn" aria-label="Comments">
                                        <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                    <button type="button" className={`postCardLikeIconBtn`} aria-label={"Like"} onClick={() => setLikes5(true)}>
                                        <img src={likeIcon} alt="Like" className="postCardLikeIcon"/>
                                    </button>
                                    <span className="postCardLikeCount">{0}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Example modal */}
            {modalOpen && (
                <div className="postModalOverlay" onClick={() => setModalOpen(false)}>
                    <div className="postModal" onClick={(e) => e.stopPropagation()}>
                        <div className="postTitleOverflow">
                            <h2>{t("styleGuide.sections.modals.exampleTitle")}</h2>
                        </div>

                        <div className="postModalFieldWrapper">
                            <div className="postModalFieldLabel">Title</div>
                            <input
                                className="postModalInput"
                                type="text"
                                placeholder={t("Title")}
                                readOnly
                            />
                        </div>

                        <div className="postModalFieldWrapper">
                            <div className="postModalFieldLabel">Caption</div>
                            <textarea
                                className="postModalTextarea"
                                rows={5}
                                placeholder={t("Write a placeholder here...")}
                                readOnly
                            />
                        </div>

                        <div className="postModalActions">
                            <button type="button" className="feedGhostBtn" onClick={() => setModalOpen(false)}>
                                {t("communityPage.postModal.cancel")}
                            </button>
                            <button type="button" className="feedPrimaryBtn">
                                {t("communityPage.postModal.save")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="styleGuideFooter">
                <Link to="/home" className="styleGuideBackLink">{t("styleGuide.backToHome")}</Link>
            </footer>
        </div>
    );
}