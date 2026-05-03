import React, { useState, useEffect, useRef } from "react";
import {
    COMMUNITY_BANNER_INPUT_ACCEPT,
    COMMUNITY_SONG_INPUT_ACCEPT,
    validateCommunityBannerFile,
} from "utilities/validateCommunityBannerFile";
import { validatePostAttachmentFile } from "utilities/postAttachmentUpload";
import { parseFileUploadErrorBody } from "utilities/fileUploadApiError";
import * as Config from "config.js";
import { useNavigate } from "react-router-dom";
// import uploadIcon from "../assets/upload-icon.svg";
import uploadIcon from "assets/upload-icon-alt-light.png";
import "../styles/CreateCommunity.css"
import "../styles/Postcard.css"
import { useTranslation } from "react-i18next";

const MAX_NAME_LENGTH = 50;

export default function CreateCommunity({
                                            onCancel,
                                        }) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const modalRef = useRef(null);

    const [name, setName] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [visibility, setVisibility] = useState("public");
    const [color, setColor] = useState("#4caf50");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [titleError, setTitleError] = useState("");
    const [tagError, setTagError] = useState("");
    const [bannerFile, setBannerFile] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [bannerError, setBannerError] = useState("");
    const [songFile, setSongFile] = useState(null);
    const [songError, setSongError] = useState("");

    const bannerInputRef = useRef(null);
    const songInputRef = useRef(null);

    /** Set when POST succeeded but an optional upload failed; next successful submit navigates here (same flow as edit: dismiss errors, then continue). */
    const [postCreateNavigateGroupId, setPostCreateNavigateGroupId] = useState(null);

    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.focus();
        }

        const handleKeyDown = (e) => {
            if (e.key === "Tab" && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
            if (e.key === "Escape") {
                onCancel(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onCancel]);

    const TAG_OPTIONS = [
        "Music", "Pop Culture", "Gaming", "Travel", "Food", "Sports", "Tech", "Movies", "Humor", "Scary", "Science",
        "Work", "Love", "Art", "Nature", "Books", "School", "Fun", "Health", "Misc."
    ];

    const MAX_TAGS = 3;
    const MAX_BANNER_SIZE_BYTES = 5 * 1024 * 1024;
    const audioUploadMinSize = Config.MIN_AUDIO_SIZE;
    const communitySongMaxSize = Config.MAX_COMMUNITY_SONG_SIZE;
    const communitySongMaxMb = Math.max(1, Math.round(communitySongMaxSize / (1024 * 1024)));

    const handleBannerChange = (event) => {
        const file = event.target.files && event.target.files[0];
        setBannerError("");

        if (!file) {
            setBannerFile(null);
            setBannerPreview(null);
            return;
        }

        if (file.size > MAX_BANNER_SIZE_BYTES) {
            setBannerError(t("createCommunity.errors.bannerTooLarge"));
            setBannerFile(null);
            setBannerPreview(null);
            event.target.value = "";
            return;
        }

        const typeCheck = validateCommunityBannerFile(file);
        if (!typeCheck.ok) {
            setBannerError(typeCheck.message);
            setBannerFile(null);
            setBannerPreview(null);
            event.target.value = "";
            return;
        }

        const fileName = file.name.replace(/\.(?=.*\.)/g, "") || "";
        const lastDot = fileName.lastIndexOf(".");
        const extension = fileName.substring(lastDot);
        let fileToSave =  new File([file], fileName, {
            type: file.type,
            lastModified: file.lastModified,
        });
        if (lastDot > 0 && extension !== extension.toLowerCase()) {
            const nameWithoutExt = fileName.substring(0, lastDot);
            const newFileName = nameWithoutExt + extension.toLowerCase();
            fileToSave = new File([file], newFileName, {
                type: file.type,
                lastModified: file.lastModified,
            });
        }

        setBannerFile(fileToSave);
        setBannerPreview(URL.createObjectURL(fileToSave));
    };

    const uploadCommunityBanner = (groupId, file) => {
        if (!file) return Promise.resolve();
        const token = sessionStorage.getItem("user-token");
        const creatorId = sessionStorage.getItem("user");
        if (!token || !creatorId) return Promise.reject(new Error(t("createCommunity.errors.mustBeLoggedIn")));

        const formData = new FormData();
        formData.append("uploaderID", String(creatorId));
        formData.append("attributes", JSON.stringify({ type: "communityBanner", groupID: groupId }));
        formData.append("file", file);

        return fetch(process.env.REACT_APP_API_PATH + "/file-uploads", {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.text().then((text) => {
                    throw new Error(parseFileUploadErrorBody(text) || t("createCommunity.errors.bannerUploadFailed"));
                });
            }
            return res.json();
        });
    };

    const handleTagClick = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            if (selectedTags.length >= MAX_TAGS) return;
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleSongChange = (event) => {
        const file = event.target.files && event.target.files[0];
        setSongError("");

        if (!file) {
            setSongFile(null);
            return;
        }

        const validationResult = validatePostAttachmentFile(file, {
            imageMin: Config.MIN_IMAGE_SIZE,
            imageMax: Config.MAX_IMAGE_SIZE,
            videoMin: Config.MIN_VIDEO_SIZE,
            videoMax: Config.MAX_VIDEO_SIZE,
            audioMin: audioUploadMinSize,
            audioMax: communitySongMaxSize,
        });

        const isAudioFile = /\.(wav|mp3)$/i.test(file.name || "");
        if (!isAudioFile || !validationResult.valid) {
            setSongError(
                isAudioFile ? validationResult.errorMessage : "Only .wav or .mp3 files are allowed."
            );
            setSongFile(null);
            event.target.value = "";
            return;
        }

        setSongFile(file);
    };

    const uploadCommunitySong = (groupId, file) => {
        if (!file) return Promise.resolve();
        const token = sessionStorage.getItem("user-token");
        const uploaderId = sessionStorage.getItem("user");
        if (!token || !uploaderId) return Promise.reject(new Error("You must be logged in."));

        const formData = new FormData();
        formData.append("uploaderID", String(uploaderId));
        formData.append("attributes", JSON.stringify({ type: "communitySong", groupID: groupId }));
        formData.append("file", file);

        return fetch(process.env.REACT_APP_API_PATH + "/file-uploads", {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: formData
        }).then(res => {
            if (!res.ok) {
                return res.text().then((text) => {
                    throw new Error(parseFileUploadErrorBody(text) || "Failed to upload song.");
                });
            }
            return res.json();
        });
    };

    const submitHandler = (event) => {
        event.preventDefault();
        setError("");
        // Keep the "community was created but upload failed" hint while clearing the file error on the first dismiss click.
        if (!(postCreateNavigateGroupId && (bannerError || songError))) {
            setMessage("");
        }
        setTitleError("");
        setTagError("");

        let valid = true;
        if (!name.trim()) { setTitleError(t("createCommunity.errors.communityNameRequired")); valid = false; }
        if (selectedTags.length === 0) { setTagError(t("createCommunity.errors.selectAtLeastOneTag")); valid = false; }

        // Invalid optional files never set bannerFile/songFile; bannerError/songError only block submit.
        // First submit clears those messages so the user can submit again and create without a file.
        if (bannerError || songError) {
            setBannerError("");
            setSongError("");
            setBannerFile(null);
            setBannerPreview(null);
            setSongFile(null);
            if (valid) return;
        }

        if (!valid) return;

        if (postCreateNavigateGroupId) {
            const id = postCreateNavigateGroupId;
            if (!bannerFile && !songFile) {
                setPostCreateNavigateGroupId(null);
                setMessage("");
                navigate("/community/" + id);
                return;
            }
            let bannerRetryFailed = false;
            let songRetryFailed = false;
            const bp = bannerFile
                ? uploadCommunityBanner(id, bannerFile).catch((err) => {
                    bannerRetryFailed = true;
                    console.error("Banner upload failed:", err);
                    const detail = String(err?.message || "").trim().slice(0, 240);
                    setBannerError(detail || t("createCommunity.errors.bannerUploadFailed"));
                })
                : Promise.resolve();
            const sp = songFile
                ? uploadCommunitySong(id, songFile).catch((err) => {
                    songRetryFailed = true;
                    console.error("Song upload failed:", err);
                    const detail = String(err?.message || "").trim().slice(0, 240);
                    setSongError(detail || t("createCommunity.errors.songUploadFailed"));
                })
                : Promise.resolve();
            Promise.all([bp, sp]).then(() => {
                if (bannerRetryFailed || songRetryFailed) return;
                setPostCreateNavigateGroupId(null);
                setBannerFile(null);
                setBannerPreview(null);
                setSongFile(null);
                setMessage("");
                navigate("/community/" + id);
            });
            return;
        }

        fetch(process.env.REACT_APP_API_PATH + "/groups", {
            method: "GET",
            headers: { Authorization: "Bearer " + sessionStorage.getItem("user-token"), "Content-Type": "application/json" },
        })
            .then(res => res.json())
            .then((data) => {
                const groups = data[0] || [];
                const nameLower = name.trim().toLowerCase();
                const isTaken = groups.some(g => (g.name || "").toLowerCase() === nameLower);
                if (isTaken) {
                    setTitleError(t("createCommunity.errors.communityNameExists"));
                    return;
                }
                return createCommunity();
            })
            .catch(() => setError(t("createCommunity.errors.failedToCheckName")));
    };

    const createCommunity = () => {
        return fetch(process.env.REACT_APP_API_PATH + "/groups", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + sessionStorage.getItem("user-token"),
            },
            body: JSON.stringify({
                name: name.trim(),
                attributes: {
                    name: name.trim(),
                    tags: selectedTags, 
                    color, 
                    visibility, 
                    creatorID: sessionStorage.getItem("user"),
                }
            }),
        })
            .then(res => res.json())
            .then((result) => {
                const newGroupId = result.groupID || result?.data?.id || result.id || result.group?.groupID;
                if (!newGroupId) { setError(t("createCommunity.errors.communityCreatedNoId")); return; }

                const creatorMembershipPromise = fetch(process.env.REACT_APP_API_PATH + "/group-members", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + sessionStorage.getItem("user-token") },
                    body: JSON.stringify({ userID: Number(sessionStorage.getItem("user")), groupID: Number(newGroupId), attributes: { role: "creator" } })
                });

                let bannerUploadFailed = false;
                let songUploadFailed = false;

                const bannerUploadPromise = bannerFile
                    ? uploadCommunityBanner(newGroupId, bannerFile).catch(err => {
                        bannerUploadFailed = true;
                        console.error("Banner upload failed:", err);
                        const detail = String(err?.message || "").trim().slice(0, 240);
                        setBannerError(detail || t("createCommunity.errors.bannerUploadFailed"));
                    })
                    : Promise.resolve();

                const songUploadPromise = songFile
                    ? uploadCommunitySong(newGroupId, songFile).catch(err => {
                        songUploadFailed = true;
                        console.error("Song upload failed:", err);
                        const detail = String(err?.message || "").trim().slice(0, 240);
                        setSongError(detail || t("createCommunity.errors.songUploadFailed"));
                    })
                    : Promise.resolve();

                return Promise.all([creatorMembershipPromise, bannerUploadPromise, songUploadPromise]).then(() => {
                    if (bannerUploadFailed || songUploadFailed) {
                        setPostCreateNavigateGroupId(newGroupId);
                        setMessage(
                            t("createCommunity.messages.communityCreatedUploadFailed")
                        );
                        return;
                    }
                    setMessage(t("createCommunity.messages.communityCreated"));
                    setTimeout(() => navigate("/community/" + newGroupId), 800);
                });
            })
            .catch(() => setError(t("createCommunity.errors.failedToCreateCommunity")));
    };

    const nameAtLimit = name.length >= MAX_NAME_LENGTH;

    return (
        <div className="createCommunityModalOverlay" onClick={() => onCancel(false)}>
            <div
                className="createCommunityModal"
                onClick={(e) => e.stopPropagation()}
                ref={modalRef}
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-community-title"
            >
                <div className="titleOverflow">
                    <h2 id="create-community-title">{t("createCommunity.title")}</h2>
                </div>
                {error && <p className="errorMsg">{error}</p>}
                {message && <p className="successMsg">{message}</p>}

                <form onSubmit={submitHandler}>
                    <div className="postOverflow">
                        <div className="postModalFieldWrapper">
                        {/* ROW 1: Community Name + Visibility */}
                            <div className="formRow">
                                <label className="formField grow">
    <span className="fieldLabel">
        <span className="required-star">*</span>
        {t("createCommunity.fields.communityName")}
    </span>
                                    <input
                                        className="postModalInput"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder={t("createCommunity.fields.communityNamePlaceholder")}
                                        maxLength={MAX_NAME_LENGTH}
                                    />
                                    <div>
                                        {titleError && <div className="post-field-error-message">{titleError}</div>}
                                        <span className={`charCounter ${nameAtLimit ? "charCounter--limit" : ""}`}>
                                            {name.length}/{MAX_NAME_LENGTH}
                                        </span>
                                    </div>
                                </label>
                                <label className="formField shrink">
                                    {t("createCommunity.fields.visibility")}
                                    <select className="postModalInput" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                                        <option value="public">{t("createCommunity.visibilityOptions.public")}</option>
                                        <option value="private">{t("createCommunity.visibilityOptions.private")}</option>
                                    </select>
                                </label>
                            </div>
                        </div>

                        <div className="postModalFieldWrapper">
                            <div className="formField">
                                    <span className="fieldLabel">
                                        <span className="required-star">*</span>
                                        {t("createCommunity.fields.tags")}
                                    </span>
                                <span className="tagLimit">
                                        {t("createCommunity.fields.selectedCount", {
                                            count: selectedTags.length,
                                            max: MAX_TAGS,
                                        })}
                                    </span>
                                <div className="tagSelector">
                                    {TAG_OPTIONS.map(tag => {
                                        const isSelected = selectedTags.includes(tag);
                                        const isDisabled = !isSelected && selectedTags.length >= MAX_TAGS;
                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                className={`tagChip ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                                                onClick={() => handleTagClick(tag)}
                                                disabled={isDisabled}
                                                aria-pressed={isSelected}
                                            >
                                                {t(`tags.${tag}`)}
                                            </button>
                                        );
                                    })}
                                </div>
                                {tagError && <div className="post-field-error-message">{tagError}</div>}
                            </div>
                        </div>

                        <div className="postModalFieldWrapper">
                            <div className="formRow">
                                <label className="formField grow">
                                    {t("createCommunity.fields.bannerColor")}
                                    <input
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="colorInput"
                                    />
                                </label>

                                <label className="formField grow bannerUploadLabel">
                                    {t("createCommunity.fields.bannerImageOptional")}
                                    <input
                                        type="file"
                                        ref={bannerInputRef}
                                        accept={COMMUNITY_BANNER_INPUT_ACCEPT}
                                        onChange={handleBannerChange}
                                        className="bannerUploadInput"
                                        style={{ display: 'none' }}
                                    />
                                    <button
                                        type="button"
                                        className="communityModalUpload__uploadButton"
                                        style={{ boxSizing: 'border-box' }}
                                        onClick={() => bannerInputRef.current?.click()}
                                    >
                                        <img src={uploadIcon} alt="" className="postModalUpload__uploadIcon" />
                                        <span>
                                                {bannerFile
                                                    ? t("createCommunity.buttons.changePhoto")
                                                    : t("createCommunity.buttons.uploadPhoto")}
                                            </span>
                                    </button>
                                </label>
                            </div>

                            {bannerPreview && !bannerError && (
                                <div className="bannerPreviewWrap">
                                    <p className="bannerPreviewLabel">{t("createCommunity.fields.bannerPreview")}</p>
                                    <img src={bannerPreview} alt="Banner preview" className="bannerPreviewImg" />
                                </div>
                            )}

                            {bannerError && <p className="post-field-error-message">{bannerError}</p>}
                        </div>

                        <div className="postModalFieldWrapper">
                            <label className="formField grow bannerUploadLabel">
                                {t("createCommunity.fields.communitySongOptional")}
                                <input
                                    type="file"
                                    ref={songInputRef}
                                    accept={COMMUNITY_SONG_INPUT_ACCEPT}
                                    onChange={handleSongChange}
                                    className="bannerUploadInput"
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    className="communityModalUpload__uploadButton"
                                    style={{ boxSizing: 'border-box' }}
                                    onClick={() => songInputRef.current?.click()}
                                >
                                    <img src={uploadIcon} alt="" className="postModalUpload__uploadIcon"/>
                                    <span>
                                            {songFile
                                                ? t("createCommunity.buttons.changeSong")
                                                : t("createCommunity.buttons.uploadSong")}
                                        </span>
                                </button>

                                {songFile && !songError && (
                                    <p className="bannerPreviewLabel">
                                        {songFile.name} ({Math.round(songFile.size / 1024)} KB)
                                    </p>
                                )}

                            {songError && <p className="post-field-error-message">{songError}</p>}
                                <p className="bannerPreviewLabel" style={{ marginTop: 6 }}>
                                    {t("createCommunity.song.limit", { size: communitySongMaxMb })}
                                </p>
                            </label>
                        </div>
                    </div>

                    <div className="postModalActions">
                        <button
                            type="button"
                            className="feedGhostBtn"
                            onClick={() => {
                                setPostCreateNavigateGroupId(null);
                                onCancel(false);
                            }}
                        >
                            {t("createCommunity.buttons.cancel")}
                        </button>
                        <button className="createPrimaryBtn" type="submit">
                            {t("createCommunity.buttons.create")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
