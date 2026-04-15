import React, { useState } from "react";
import {
    COMMUNITY_BANNER_INPUT_ACCEPT,
    validateCommunityBannerFile,
} from "utilities/validateCommunityBannerFile";
import { useNavigate } from "react-router-dom";
import uploadIcon from "../assets/upload-icon.svg";
import "../styles/CreateCommunity.css"

const MAX_NAME_LENGTH = 50;

export default function CreateCommunity() {
    const navigate = useNavigate();

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

    const TAG_OPTIONS = [
        "Music", "Pop Culture", "Gaming", "Travel", "Food", "Sports", "Tech", "Movies", "Humor", "Scary", "Science",
        "Work", "Love", "Art", "Nature", "Books", "School", "Fun", "Health", "Misc."
    ];

    const MAX_TAGS = 3;
    const MAX_BANNER_SIZE_BYTES = 5 * 1024 * 1024;

    const handleBannerChange = (event) => {
        const file = event.target.files && event.target.files[0];
        setBannerError("");

        if (!file) {
            setBannerFile(null);
            setBannerPreview(null);
            return;
        }

        if (file.size > MAX_BANNER_SIZE_BYTES) {
            setBannerError("Banner image is too large. Maximum size is 5 MB.");
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

        let fileToSave = file;
        const fileName = file.name || "";
        const lastDot = fileName.lastIndexOf(".");
        const extension = fileName.substring(lastDot);
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
        if (!token || !creatorId) return Promise.reject(new Error("You must be logged in."));

        const formData = new FormData();
        formData.append("uploaderID", String(creatorId));
        formData.append("attributes", JSON.stringify({ type: "communityBanner", groupID: groupId }));
        formData.append("file", file);

        return fetch(process.env.REACT_APP_API_PATH + "/file-uploads", {
            method: "POST",
            headers: { Authorization: "Bearer " + token },
            body: formData
        }).then(res => {
            if (!res.ok) return res.text().then(text => { throw new Error(text || "Failed to upload banner."); });
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

    const submitHandler = (event) => {
        event.preventDefault();
        setError(""); setMessage(""); setTitleError(""); setTagError("");

        let valid = true;
        if (!name.trim()) { setTitleError("Community name is required."); valid = false; }
        if (selectedTags.length === 0) { setTagError("Please select at least one tag."); valid = false; }
        if (bannerError || !valid) return;

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
                    setTitleError("A community with this name already exists.");
                    return;
                }
                return createCommunity();
            })
            .catch(() => setError("Failed to check community name."));
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
                if (!newGroupId) { setError("Community created but ID not returned."); return; }

                const creatorMembershipPromise = fetch(process.env.REACT_APP_API_PATH + "/group-members", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: "Bearer " + sessionStorage.getItem("user-token") },
                    body: JSON.stringify({ userID: Number(sessionStorage.getItem("user")), groupID: Number(newGroupId), attributes: { role: "creator" } })
                });

                const bannerUploadPromise = bannerFile
                    ? uploadCommunityBanner(newGroupId, bannerFile).catch(err => {
                        console.error("Banner upload failed:", err);
                        setBannerError("Community created, but banner upload failed.");
                    })
                    : Promise.resolve();

                return Promise.all([creatorMembershipPromise, bannerUploadPromise]).then(() => {
                    setMessage("Community created!");
                    setTimeout(() => navigate("/community/" + newGroupId), 800);
                });
            })
            .catch(() => setError("Failed to create community."));
    };

    const nameAtLimit = name.length >= MAX_NAME_LENGTH;

    return (
        <div className="createCommunityPage">
            <div className="createCommunityCard">
                <h1 className="createCommunityTitle">Create Community</h1>

                {error && <p className="errorMsg">{error}</p>}
                {message && <p className="successMsg">{message}</p>}

                <form onSubmit={submitHandler} className="communityForm">

                    {/* ROW 1: Community Name + Visibility */}
                    <div className="formRow">
                        <label className="formField grow">
                            Community Name
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Board Games"
                                maxLength={MAX_NAME_LENGTH}
                            />
                            {/* ✅ Character counter */}
                            <span className={`charCounter ${nameAtLimit ? "charCounter--limit" : ""}`}>
                                {name.length}/{MAX_NAME_LENGTH}
                            </span>
                            {titleError && <p className="errorMsg">{titleError}</p>}
                        </label>

                        <label className="formField shrink">
                            Visibility
                            <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                                <option value="public">Public</option>
                                <option value="private">Private</option>
                            </select>
                        </label>
                    </div>

                    {/* ROW 2: Tags */}
                    <div className="formField">
                        <span className="fieldLabel">
                            Tags <span className="tagLimit">({selectedTags.length}/{MAX_TAGS} selected)</span>
                        </span>
                        <div className="tagSelector">
                            {TAG_OPTIONS.map(tag => {
                                const isSelected = selectedTags.includes(tag);
                                const isDisabled = !isSelected && selectedTags.length >= MAX_TAGS;
                                return (
                                    <span
                                        key={tag}
                                        className={`tagChip ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                                        onClick={() => handleTagClick(tag)}
                                    >
                                        {tag}
                                    </span>
                                );
                            })}
                        </div>
                        {tagError && <p className="errorMsg">{tagError}</p>}
                    </div>

                    {/* ROW 3: Banner Color + Upload Photo */}
                    <div className="formRow">
                        <label className="formField grow">
                            Banner Color
                            <input
                                type="color"
                                value={color}
                                onChange={(e) => setColor(e.target.value)}
                                className="colorInput"
                            />
                        </label>

                        <label className="formField grow bannerUploadLabel">
                            Banner Image (optional)
                            <input
                                type="file"
                                accept={COMMUNITY_BANNER_INPUT_ACCEPT}
                                onChange={handleBannerChange}
                                className="bannerUploadInput"
                            />
                            <span className="bannerUploadBtn">
                                <img src={uploadIcon} alt="" className="bannerUploadIcon" />
                                <span>{bannerFile ? "Change photo" : "Upload photo"}</span>
                            </span>
                            {bannerError && <p className="errorMsg errorMsg--fileUpload">{bannerError}</p>}
                        </label>
                    </div>

                    {/* Banner preview */}
                    {bannerPreview && !bannerError && (
                        <div className="bannerPreviewWrap">
                            <p className="bannerPreviewLabel">Banner preview:</p>
                            <img src={bannerPreview} alt="Banner preview" className="bannerPreviewImg" />
                        </div>
                    )}

                    {/* ROW 4: Submit + Cancel */}
                    <div className="formButtonRow">
                        <button type="button" className="cancelBtn" onClick={() => navigate("/home")}>
                            Cancel
                        </button>
                        <button className="createCommunityBtn" type="submit">
                            Create Community
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}
