import React, { useMemo, useState } from "react";
// import uploadIcon from "../assets/upload-icon.svg";
import uploadIcon from "assets/upload-icon-alt-light.png";
import { useTranslation } from "react-i18next";
import {
  COMMUNITY_BANNER_INPUT_ACCEPT,
  COMMUNITY_SONG_INPUT_ACCEPT,
  validateCommunityBannerFile,
} from "utilities/validateCommunityBannerFile";
import { validatePostAttachmentFile } from "utilities/postAttachmentUpload";
import { parseFileUploadErrorBody } from "utilities/fileUploadApiError";
import PostAudioPlayer from "./PostAudioPlayer";
import * as Config from "config.js";
import "../styles/CreateCommunity.css"
import "../styles/Postcard.css"
import "../styles/EditCommunityModal.css"

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
  if (!res.ok) return false;
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
  hasCommunitySong = false,
  communitySongUrl,
}) {
  const { t } = useTranslation();
  const [name, setName] = useState(initialValues.name);
  const [visibility, setVisibility] = useState(initialValues.visibility || "public");
  const [selectedTags, setSelectedTags] = useState(initialValues.tags || []);
  const [color, setColor] = useState(initialValues.color || "#888");

  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [bannerError, setBannerError] = useState("");
  const [removeCurrentBannerPending, setRemoveCurrentBannerPending] = useState(false);
  const [songFile, setSongFile] = useState(null);
  const [songError, setSongError] = useState("");
  const [removeCurrentSongPending, setRemoveCurrentSongPending] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [nameError, setNameError] = useState("");
  const [tagError, setTagError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const nameAtLimit = name.length >= MAX_NAME_LENGTH;
  const audioUploadMinSize = Config.MIN_AUDIO_SIZE;
  const communitySongMaxSize = Config.MAX_COMMUNITY_SONG_SIZE;
  const communitySongMaxMb = Math.max(1, Math.round(communitySongMaxSize / (1024 * 1024)));

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
    setRemoveCurrentBannerPending(false);
  };

  const deleteCurrentBanner = async () => {
    if (!currentBannerId) return;
    const res = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads/${currentBannerId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(parseFileUploadErrorBody(text) || "Failed to remove banner");
    }
  };

  const uploadCommunityBanner = async (file) => {
    const uploaderID = sessionStorage.getItem("user");
    if (!uploaderID) throw new Error("Not logged in");

    const formData = new FormData();
    formData.append("uploaderID", String(uploaderID));
    formData.append("attributes", JSON.stringify({ type: "communityBanner", groupID }));
    formData.append("file", file);

    console.log("uploaderID", String(uploaderID));
    console.log("attributes", JSON.stringify({ type: "communityBanner", groupID }));
    console.log("file", file)
    const res = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(parseFileUploadErrorBody(text) || "Failed to upload banner.");
    }
  };

  const handleSongChange = (event) => {
    const file = event.target.files && event.target.files[0];
    setSongError("");
    setRemoveCurrentSongPending(false);

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
      setSongError(isAudioFile ? validationResult.errorMessage : "Only .wav or .mp3 files are allowed.");
      setSongFile(null);
      event.target.value = "";
      return;
    }

    setSongFile(file);
  };

  const uploadCommunitySong = async (file) => {
    const uploaderID = sessionStorage.getItem("user");
    if (!uploaderID) throw new Error("Not logged in");

    const formData = new FormData();
    formData.append("uploaderID", String(uploaderID));
    formData.append("attributes", JSON.stringify({ type: "communitySong", groupID }));
    formData.append("file", file);

    const res = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`, {
      method: "POST",
      headers: { Authorization: "Bearer " + token },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(parseFileUploadErrorBody(text) || "Failed to upload song.");
    }
  };

  const deleteExistingCommunitySongsForGroup = async () => {
    const listRes = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`, {
      headers: { Authorization: "Bearer " + token },
    });
    if (!listRes.ok) {
      const text = await listRes.text().catch(() => "");
      throw new Error(parseFileUploadErrorBody(text) || "Could not load existing uploads.");
    }
    const data = await listRes.json();
    const files = data?.[0] || [];
    if (!Array.isArray(files)) return;
    const songs = files.filter(
      (f) =>
        f?.attributes?.type === "communitySong" &&
        String(f.attributes.groupID) === String(groupID)
    );
    for (const song of songs) {
      const delRes = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads/${song.id}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });
      if (!delRes.ok) {
        const text = await delRes.text().catch(() => "");
        throw new Error(parseFileUploadErrorBody(text) || "Failed to remove existing community song.");
      }
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

    let valid = true;
    if (!name.trim()) {
      setNameError(t("editCommunityForm.errors.nameRequired"));
      valid = false;
    }
    if (selectedTags.length === 0) {
      setTagError(t("editCommunityForm.errors.tagRequired"));
      valid = false;
    }

    // Client validation or API errors (e.g. FILE_STORAGE_EXCEEDED) on optional uploads.
    // First submit clears the message and drops the pending file; second submit saves without it.
    if (bannerError || songError) {
      setBannerError("");
      setSongError("");
      setBannerFile(null);
      setBannerPreview("");
      setSongFile(null);
      if (valid) return;
    }

    if (!valid) return;

    setIsSaving(true);
    try {
      const trimmedName = name.trim();
      const taken = await isCommunityNameTaken({ proposedName: trimmedName, groupID, token });
      if (taken) {
        setNameError(t("editCommunityForm.errors.nameTaken"));
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
        try {
          await uploadCommunityBanner(bannerFile);
        } catch (e) {
          const detail = String(e?.message || "").trim().slice(0, 240);
          setBannerError(detail || "Failed to upload banner.");
          throw e;
        }
      }
      if (songFile) {
        try {
          await deleteExistingCommunitySongsForGroup();
          await uploadCommunitySong(songFile);
        } catch (e) {
          const detail = String(e?.message || "").trim().slice(0, 240);
          setSongError(detail || "Failed to upload song.");
          throw e;
        }
      } else if (removeCurrentSongPending) {
        await deleteExistingCommunitySongsForGroup();
      }
      if (removeCurrentBannerPending && currentBannerId) {
        await deleteCurrentBanner();
      }

      setMessage(t("editCommunityForm.success"));
      onUpdated();
    } catch (e) {
      console.error("Edit community failed:", e);
      const detail = String(e?.message || "").trim().slice(0, 240);
      setError(detail || t("editCommunityForm.errors.updateFailed"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <>
      <div id="edit-community-title" className="titleOverflow">
        <h2>{t("editCommunityModal.title")}</h2>
      </div>

      <form onSubmit={submitHandler}>
        <div className="postOverflow">
          <div className="postModalFieldWrapper">
            <div className="formRow">
              <label className="formField grow">
                <div className="postModalFieldLabel">
                  <span className="required-star" aria-hidden="true">
                    *
                  </span>
                  {t("editCommunityForm.fields.communityName")}
                </div>
                <input
                    className="postModalInput"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("createCommunity.fields.communityNamePlaceholder")}
                    maxLength={MAX_NAME_LENGTH}
                    aria-required="true"
                />
                <div>
                  {nameError && <div className="post-field-error-message">{nameError}</div>}
                  <span className={`charCounter ${nameAtLimit ? "charCounter--limit" : ""}`}>
                      {name.length}/{MAX_NAME_LENGTH}
                    </span>
                </div>
              </label>
              <label className="formField shrink">
                {t("editCommunityForm.fields.visibility")}
                <select className="postModalInput" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="public">{t("editCommunityForm.visibility.public")}</option>
                  <option value="private">{t("editCommunityForm.visibility.private")}</option>
                </select>
              </label>
            </div>
          </div>

          {/* tags */}
          <div className="postModalFieldWrapper">
            <div className="formField">
              <div className="postModalFieldLabel">
                <span className="required-star" aria-hidden="true">
                  *
                </span>
                {t("editCommunityForm.fields.tags")}
                <span className="tagLimit">({selectedTags.length}/{MAX_TAGS} selected)</span>
              </div>
              <div className="tagSelector">
                {visibleTagOptions.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const isDisabled = !isSelected && selectedTags.length >= MAX_TAGS;
                  return (
                      <button
                          key={tag}
                          type="button"
                          className={`tagChip ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                          onClick={() => !isDisabled && handleTagClick(tag)}
                          disabled={isDisabled}
                      >
                        {t(`tags.${tag}`)}
                      </button>
                  );
                })}
              </div>
              {tagError && <div className="post-field-error-message">{tagError}</div>}
            </div>
          </div>

          {/* banner color & upload banner */}
          <div className="postModalFieldWrapper">
            <div className="formRow">
              <label className="formField grow">
                {t("editCommunityForm.fields.bannerColor")}
                <input
                    className="colorInput"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                />
              </label>

              <label className="formField grow bannerUploadLabel">
                {t("editCommunityForm.fields.bannerImage")}
                <input
                    type="file"
                    accept={COMMUNITY_BANNER_INPUT_ACCEPT}
                    onChange={handleBannerChange}
                    className="bannerUploadInput"
                    disabled={isSaving}
                    style={{ display: 'none' }}
                />
                <button
                    type="button"
                    className="communityModalUpload__uploadButton"
                    style={{ boxSizing: 'border-box' }}
                    onClick={(e) => e.currentTarget.previousSibling.click()}
                >
                  <img src={uploadIcon} alt="" className="postModalUpload__uploadIcon" />
                  <span>
                      {bannerFile
                          ? t("editCommunityForm.banner.change")
                          : t("editCommunityForm.banner.upload")}
                    </span>
                </button>
              </label>
            </div>

            {bannerError && <p className="post-field-error-message">{bannerError}</p>}
          </div>

            <div className="postModalFieldWrapper">
              {currentBannerUrl && !bannerPreview && !removeCurrentBannerPending && (
                <div className="bannerPreviewWrap">
                  <p className="bannerPreviewLabel">{t("editCommunityForm.banner.current")}</p>
                  <img src={currentBannerUrl} alt="Current banner" className="bannerPreviewImg" />
                  <div className="formButtonRow" style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="removeBtn"
                      onClick={() => setRemoveCurrentBannerPending(true)}
                      disabled={isSaving}
                    >
                      {t("editCommunityForm.banner.remove")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="postModalFieldWrapper">
              {currentBannerUrl && !bannerPreview && removeCurrentBannerPending && (
                <div className="bannerPreviewWrap">
                  <p className="bannerPreviewLabel">{t("editCommunityForm.banner.current")}</p>
                  <img src={currentBannerUrl} alt="Current banner" className="bannerPreviewImg" style={{ opacity: 0.5 }} />
                  <div className="bannerPreviewLabel" style={{ marginTop: 6 }}>
                    {t("editCommunityForm.banner.pending")}
                  </div>
                  <div className="formButtonRow" style={{ marginTop: 10 }}>
                    <button
                      type="button"
                      className="removeBtn"
                      onClick={() => setRemoveCurrentBannerPending(false)}
                      disabled={isSaving}
                    >
                      {t("editCommunityForm.banner.undo")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {bannerPreview && !bannerError && (
              <div className="bannerPreviewWrap">
                <p className="bannerPreviewLabel">{t("editCommunityForm.banner.preview")}</p>
                <img src={bannerPreview} alt="Banner preview" className="bannerPreviewImg" />
                {currentBannerUrl && (
                  <div className="bannerPreviewLabel" style={{ marginTop: 6 }}>
                    {t("editCommunityForm.banner.replace")}
                  </div>
                )}
              </div>
            )}

          <div className="postModalFieldWrapper">
            {hasCommunitySong && !songFile && removeCurrentSongPending && (
                <div className="bannerPreviewWrap">
                  <p className="bannerPreviewLabel">{t("editCommunityForm.song.current")}</p>
                  <div className="disabledAudioPlayer">
                    <PostAudioPlayer src={communitySongUrl} disabled={true} compact />
                  </div>
                  <div className="bannerPreviewLabel" style={{ marginTop: 6 }}>
                    {t("editCommunityForm.song.pending")}
                  </div>

                  <div className="formButtonRow" style={{ marginTop: 10 }}>
                    <button
                        type="button"
                        className="removeBtn"
                        onClick={() => setRemoveCurrentSongPending(false)}
                        disabled={isSaving}
                    >
                      {t("editCommunityForm.banner.undo")}
                    </button>
                  </div>
                </div>
            )}
          </div>

          <div className="postModalFieldWrapper">
            <label className="formField grow bannerUploadLabel">
              {t("editCommunityForm.fields.communitySong")}
              <input
                  type="file"
                  accept={COMMUNITY_SONG_INPUT_ACCEPT}
                  onChange={handleSongChange}
                  className="bannerUploadInput"
                  disabled={isSaving}
                  style={{ display: 'none' }}
              />
              <button
                  type="button"
                  className="communityModalUpload__uploadButton"
                  style={{ boxSizing: 'border-box' }}
                  onClick={(e) => e.currentTarget.previousSibling.click()}
              >
                <img src={uploadIcon} alt="" className="postModalUpload__uploadIcon" />
                <span>{songFile
                    ? t("editCommunityForm.song.change")
                    : t("editCommunityForm.song.upload")}
                  </span>
              </button>
              {songFile && !songError && (
                  <p className="bannerPreviewLabel">
                    {songFile.name} ({Math.round(songFile.size / 1024)} KB)
                  </p>
              )}
              {songError && <p className="post-field-error-message">{songError}</p>}
              <p className="bannerPreviewLabel" style={{ marginTop: 6 }}>
                {t("editCommunityForm.song.limit", {
                  size: communitySongMaxMb
                })}
              </p>
            </label>
          </div>
        </div>

        <div className="postModalActions">
          <button type="button" className="feedGhostBtn" onClick={onCancel} disabled={isSaving}>
            {t("editCommunityForm.buttons.cancel")}
          </button>
          <button type="submit" className="createPrimaryBtn" disabled={isSaving}>
            {t("editCommunityForm.buttons.update")}
          </button>
        </div>
      </form>
      </>
  );
}
