import React, { useMemo, useState } from "react";
import uploadIcon from "../assets/upload-icon.svg";
import {
  COMMUNITY_BANNER_INPUT_ACCEPT,
  validateCommunityBannerFile,
} from "utilities/validateCommunityBannerFile";

const MAX_NAME_LENGTH = 50;
const MAX_TAGS = 3;
const MAX_BANNER_SIZE_BYTES = 5 * 1024 * 1024;

const TAG_OPTIONS = [
  "Music",
  "Pop Culture",
  "Gaming",
  "Travel",
  "Food",
  "Sports",
  "Tech",
  "Movies",
  "Humor",
  "Scary",
  "Science",
  "Work",
  "Love",
  "Art",
  "Nature",
  "Books",
  "School",
  "Fun",
  "Health",
  "Misc.",
];

async function isCommunityNameTaken({ proposedName, groupID, token }) {
  const res = await fetch(`${process.env.REACT_APP_API_PATH}/groups`, {
    method: "GET",
    headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
  });
  if (!res.ok) return false; // if check fails, don't block update
  const data = await res.json();
  const groups = data?.[0] || [];
  const nameLower = proposedName.trim().toLowerCase();
  return groups.some((g) => {
    const sameGroup = String(g?.id) === String(groupID);
    if (sameGroup) return false;
    return String(g?.name || "").trim().toLowerCase() === nameLower;
  });
}

export default function EditCommunityForm({
  groupID,
  token,
  initialValues,
  onCancel,
  onUpdated,
  currentBannerUrl,
  currentBannerId,
}) {
  const [name, setName] = useState(initialValues.name);
  const [visibility, setVisibility] = useState(initialValues.visibility || "public");
  const [selectedTags, setSelectedTags] = useState(initialValues.tags || []);
  const [color, setColor] = useState(initialValues.color || "#888");

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [removeCurrentBannerPending, setRemoveCurrentBannerPending] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [tagError, setTagError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const nameAtLimit = name.length >= MAX_NAME_LENGTH;

  const visibleTagOptions = useMemo(() => TAG_OPTIONS, []);

  const handleBannerChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setBannerError("");

    if (!file) {
      setBannerFile(null);
      setBannerPreview("");
      return;
    }

    if (file.size > MAX_BANNER_SIZE_BYTES) {
      setBannerError("Banner image is too large. Maximum size is 5 MB.");
      setBannerFile(null);
      setBannerPreview("");
      event.target.value = "";
      return;
    }

    const typeCheck = validateCommunityBannerFile(file);
    if (!typeCheck.ok) {
      setBannerError(typeCheck.message);
      setBannerFile(null);
      setBannerPreview("");
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
    setRemoveCurrentBannerPending(false);
  };

  const deleteCurrentBanner = async () => {
    if (!currentBannerId) return;
    const res = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads/${currentBannerId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) throw new Error("Failed to remove banner");
  };

  const uploadCommunityBanner = async (file) => {
    const uploaderID = sessionStorage.getItem("user");
    if (!uploaderID) throw new Error("Not logged in");

    const formData = new FormData();
    formData.append("uploaderID", String(uploaderID));
    formData.append("attributes", JSON.stringify({ type: "communityBanner", groupID }));
    formData.append("file", file);

    const res = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || "Failed to upload banner.");
    }
  };

  const handleTagClick = (tag) => {
    setTagError("");
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, tag];
    });
  };

  const submitHandler = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setNameError("");
    setTagError("");
    setBannerError("");

    let valid = true;
    if (!name.trim()) {
      setNameError("Community name is required.");
      valid = false;
    }
    if (selectedTags.length === 0) {
      setTagError("Please select at least one tag.");
      valid = false;
    }
    if (bannerError) valid = false;
    if (!valid) return;

    setIsSaving(true);
    try {
      const trimmedName = name.trim();
      const taken = await isCommunityNameTaken({ proposedName: trimmedName, groupID, token });
      if (taken) {
        setNameError("A community with this name already exists.");
        return;
      }

      const currentRes = await fetch(`${process.env.REACT_APP_API_PATH}/groups/${groupID}`, {
        method: "GET",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      });
      if (!currentRes.ok) throw new Error("Failed to load current community details");
      const current = await currentRes.json();

      const nextAttributes = {
        ...(current.attributes || {}),
        tags: selectedTags,
        name: trimmedName,
        color,
        visibility,
      };

      const patchRes = await fetch(`${process.env.REACT_APP_API_PATH}/groups/${groupID}`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          attributes: nextAttributes,
        }),
      });

      if (!patchRes.ok) {
        const text = await patchRes.text().catch(() => "");
        throw new Error(text || "Failed to update community");
      }

      if (bannerFile) {
        await uploadCommunityBanner(bannerFile);
      }
      if (removeCurrentBannerPending && currentBannerId) {
        await deleteCurrentBanner();
      }

      setMessage("Community updated!");
      onUpdated();
    } catch (e) {
      setError("Failed to update community.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submitHandler} className="communityForm">
      {error && <p className="errorMsg">{error}</p>}
      {message && <p className="successMsg">{message}</p>}

      {currentBannerUrl && !bannerPreview && !removeCurrentBannerPending && (
        <div className="bannerPreviewWrap">
          <p className="bannerPreviewLabel">Current banner:</p>
          <img src={currentBannerUrl} alt="Current banner" className="bannerPreviewImg" />
          <div className="formButtonRow" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="cancelBtn"
              onClick={() => setRemoveCurrentBannerPending(true)}
              disabled={isSaving}
            >
              Remove banner image
            </button>
          </div>
        </div>
      )}

      {currentBannerUrl && !bannerPreview && removeCurrentBannerPending && (
        <div className="bannerPreviewWrap">
          <p className="bannerPreviewLabel">Current banner:</p>
          <img src={currentBannerUrl} alt="Current banner" className="bannerPreviewImg" style={{ opacity: 0.5 }} />
          <div className="bannerPreviewLabel" style={{ marginTop: 6 }}>
            Banner image will be removed when you click Update Community.
          </div>
          <div className="formButtonRow" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="cancelBtn"
              onClick={() => setRemoveCurrentBannerPending(false)}
              disabled={isSaving}
            >
              Undo remove
            </button>
          </div>
        </div>
      )}

      <div className="formRow">
        <label className="formField grow">
          Community Name
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
          />
          <span className={`charCounter ${nameAtLimit ? "charCounter--limit" : ""}`}>
            {name.length}/{MAX_NAME_LENGTH}
          </span>
          {nameError && <p className="errorMsg">{nameError}</p>}
        </label>

        <label className="formField shrink">
          Visibility
          <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
      </div>

      <div className="formField">
        <span className="fieldLabel">
          Tags <span className="tagLimit">({selectedTags.length}/{MAX_TAGS} selected)</span>
        </span>
        <div className="tagSelector">
          {visibleTagOptions.map((tag) => {
            const isSelected = selectedTags.includes(tag);
            const isDisabled = !isSelected && selectedTags.length >= MAX_TAGS;
            return (
              <span
                key={tag}
                className={`tagChip ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                onClick={() => !isDisabled && handleTagClick(tag)}
              >
                {tag}
              </span>
            );
          })}
        </div>
        {tagError && <p className="errorMsg">{tagError}</p>}
      </div>

      <label className="formField">
        Banner Color
        <input
          className="colorInput"
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>

      <label className="formField grow bannerUploadLabel">
        Banner Image (optional)
        <input
          type="file"
          accept={COMMUNITY_BANNER_INPUT_ACCEPT}
          onChange={handleBannerChange}
          className="bannerUploadInput"
          disabled={isSaving}
        />
        <span className="bannerUploadBtn">
          <img src={uploadIcon} alt="" className="bannerUploadIcon" />
          <span>{bannerFile ? "Change photo" : "Upload photo"}</span>
        </span>
        {bannerError && <p className="errorMsg errorMsg--fileUpload">{bannerError}</p>}
      </label>

      {bannerPreview && !bannerError && (
        <div className="bannerPreviewWrap">
          <p className="bannerPreviewLabel">Banner preview:</p>
          <img src={bannerPreview} alt="Banner preview" className="bannerPreviewImg" />
          {currentBannerUrl && (
            <div className="bannerPreviewLabel" style={{ marginTop: 6 }}>
              This will replace your current banner image.
            </div>
          )}
        </div>
      )}

      <div className="formButtonRow">
        <button type="button" className="cancelBtn" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
        <button type="submit" className="createCommunityBtn" disabled={isSaving}>
          Update Community
        </button>
      </div>
    </form>
  );
}

