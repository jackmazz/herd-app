import React, { useEffect, useState, useRef } from "react";
import defaultProfileIcon from "../assets/default-profile-black.svg";
import "../styles/Comments.css";
import { useTranslation } from "react-i18next";
import * as Config from "config.js";
import editIcon from "../assets/pencil-edit.svg";
import trashIcon from "../assets/trash.svg";

export default function Comment({
  post,
  comment,
  loadComments,
  onDelete,
  currentUserId,
  onReply,
  replies = [],
  replyingTo,
  uploadIcon,
  t,
}) {
  const token = sessionStorage.getItem("user-token");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [commentAttachmentSrc, setCommentAttachmentSrc] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const author = comment.author || {};
  const screenname = author.attributes?.screenname || author.attributes?.username || "Unknown";
  const username = author.attributes?.username || "";
  const commentAuthorId = comment?.authorID ?? author?.id;
  const isOwnComment = String(commentAuthorId) === String(currentUserId);
  const isReply = comment.attributes?.type === "reply";
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentText, setCommentText] = useState(comment.content);
  const commentPhotoInputRef = useRef(null);
  const [commentError, setCommentError] = useState("");
  const [commentPhotoFile, setCommentPhotoFile] = useState(null);
  const [commentPhotoPreviewUrl, setCommentPhotoPreviewUrl] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    const attachmentId = comment.attributes?.attachmentId;
    if (!attachmentId) {
      setCommentAttachmentSrc("");
      return undefined;
    }
    let cancelled = false;
    fetch(`${process.env.REACT_APP_API_PATH}/file-uploads/${attachmentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (cancelled || !data?.path) return;
          setCommentAttachmentSrc(process.env.REACT_APP_API_PATH_SOCKET + data.path);
          setCommentPhotoPreviewUrl(process.env.REACT_APP_API_PATH_SOCKET + data.path)
        })
        .catch(() => {
          if (!cancelled) setCommentAttachmentSrc("");
        });
    return () => {
      cancelled = true;
    };
  }, [comment.attributes?.attachmentId]);

  useEffect(() => {
    if (!author.id) return;
    fetch(`${process.env.REACT_APP_API_PATH}/file-uploads?uploaderID=${author.id}`)
      .then((res) => res.json())
      .then((data) => {
        const files = data[0] || [];
        const pic = files.find((f) => f.attributes?.type === "profile-pic");
        if (pic) setProfilePhoto(process.env.REACT_APP_API_PATH_SOCKET + pic.path);
      })
      .catch(() => {});
  }, [author.id]);

  function clearCommentPhotoSelection() {
    setCommentPhotoPreviewUrl("");
    setCommentPhotoFile(null);
    if (commentPhotoInputRef.current) {
      commentPhotoInputRef.current.value = "";
    }
  }

  function handleCommentPhotoSelected(event) {
    console.log(event);
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const acceptMIME = [
      "image/png",
      "image/jpeg",
      "image/gif",
      "image/svg+xml",
      "image/webp",
    ];
    const acceptExtension = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"];
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    let errorMessage = "";

    if (!acceptMIME.includes(fileType) || !acceptExtension.some((ext) => fileName.endsWith(ext))) {
      errorMessage = "Only .png, .jpg, .gif, .svg, or .webp images are allowed";
    } else if (file.size < Config.MIN_IMAGE_SIZE) {
      errorMessage = "Image size must be over 1KB";
    } else if (file.size > Config.MAX_IMAGE_SIZE) {
      errorMessage = "Image size must be under 5MB";
    }

    if (errorMessage) {
      setCommentError(errorMessage);
      return;
    }
    
    setCommentError("");
    setCommentPhotoFile(file);
    setCommentPhotoPreviewUrl(URL.createObjectURL(file));
  }

  function openCommentPhotoPicker() {
    setCommentError("");
    commentPhotoInputRef.current?.click();
  }

  const handleEditComment = async (commentId, content, commentPhotoFile) => {
    const commentAuthorId = comment?.authorID ?? comment?.author?.id;
    if (!commentAuthorId) return;
    if (String(commentAuthorId) !== String(currentUserId)) return;

    const hasText = !!content.trim();
    const hasPhoto = !!commentPhotoFile || commentPhotoPreviewUrl != "";
    if (!hasText && !hasPhoto) {
      setCommentError("Add text or a photo to your comment");
      return;
    }
    if (isSubmittingComment) return;
    setCommentError("");
    setIsSubmittingComment(true);

    let uploadedAttachmentId = null;
    let uploadedAttachmentName = null;

    try {
      if (commentPhotoFile) {
        const formData = new FormData();
        formData.append("uploaderID", currentUserId);
        formData.append("attributes", JSON.stringify({ type: "comment-attachment" }));
        formData.append("file", commentPhotoFile);

        const uploadRes = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`, {
          method: "POST",
          headers: { Authorization: "Bearer " + token },
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("upload failed");
        }

        const uploadData = await uploadRes.json();
        const fileId = uploadData.id;
        if (fileId == null || fileId === "INVALID-ID") {
          throw new Error("invalid upload id");
        }
        uploadedAttachmentId = fileId;
        uploadedAttachmentName = commentPhotoFile.name;
      } else if (commentPhotoPreviewUrl != "") {
        uploadedAttachmentId = comment.attributes?.attachmentId || null;
        uploadedAttachmentName = comment.attributes?.attachmentName || null;
      }

      const commentType = comment.attributes.type;
      const attributes = { type: commentType };
      if (uploadedAttachmentId != null) {
        attributes.attachmentId = uploadedAttachmentId;
        attributes.attachmentName = uploadedAttachmentName;
      }

      const payload = {
        authorID: Number(currentUserId),
        parentID: comment.parentID,
        content: commentText.trim() || (uploadedAttachmentId != null ? " " : ""),
        attributes,
      };

      const res = await fetch(`${process.env.REACT_APP_API_PATH}/posts/${commentId}`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Edit post failed");
      }

      loadComments();
      setIsEditingComment(false);
    } catch (err) {
      console.error("Failed to post comment", err);
      setCommentError("Could not post your comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  function handleCancelEdit() {
    setIsEditingComment(false);
    setCommentText(comment.content);
    setCommentPhotoFile(null);
    setCommentError("");
  }

  return (
      <div className="commentComponentWrapper">
        <div className="commentComponent">
          <img src={profilePhoto || defaultProfileIcon} alt="avatar" className="commentAvatar" />
          <div className="commentContentWrapper">
            <div className="commentHeader">
              <span className="commentScreenname">{screenname}</span>
              <span className="commentUsername">@{username}</span>
            </div>
            {(isEditingComment) ? (
              <>
                <div className="commentTextareaShell">
                  <input
                      ref={commentPhotoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/gif,image/svg+xml,image/webp"
                      className="commentPhotoFileInput"
                      aria-hidden="true"
                      tabIndex={-1}
                      onChange={handleCommentPhotoSelected}
                  />
                  <textarea
                    className="commentTextarea"
                    placeholder={replyingTo
                      ? t("postCard.writeReply")
                      : t("postCard.writeComment")}
                    value={commentText}
                    onChange={(e) => {
                      if (e.target.value.length <= 150) {
                        setCommentText(e.target.value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleEditComment(comment.id, commentText, commentPhotoFile);
                      }
                    }}
                  />
                  <div className="commentTextareaToolbar">
                    <button
                        type="button"
                        className="commentAddPhotoBtn"
                        onClick={openCommentPhotoPicker}
                        disabled={isSubmittingComment}
                        aria-label="Add photo to comment"
                        title="Add photo (max 5 MB)"
                    >
                      <img src={uploadIcon} alt="" className="commentAddPhotoBtnIcon" />
                    </button>
                    <div>
                      <button
                          type="button"
                          className="commentCancelBtn"
                          onClick={() => handleCancelEdit(comment.id, commentText, commentPhotoFile)}
                          disabled={isSubmittingComment}
                      >
                        {isSubmittingComment
                        ? "…"
                        : t("homePage.buttons.cancel")}
                      </button>
                      <button
                          type="button"
                          className="commentSubmitBtn"
                          onClick={() => handleEditComment(comment.id, commentText, commentPhotoFile)}
                          disabled={isSubmittingComment}
                      >
                        {isSubmittingComment
                        ? "…"
                        : t("homePage.buttons.save")}
                      </button>
                    </div>
                  </div>
                </div>
                {(commentPhotoPreviewUrl) && (
                  <div className="commentPhotoPreviewRow">
                    <img
                        src={commentPhotoPreviewUrl}
                        alt=""
                        className="commentPhotoPreviewThumb"
                    />
                    <button
                        type="button"
                        className="commentPhotoRemoveBtn"
                        onClick={clearCommentPhotoSelection}
                        aria-label="Remove photo"
                    >
                      ×
                    </button>
                  </div>
                )}
                <div className="commentInputFooter">
                  {commentError && <span className="commentErrorText">{commentError}</span>}
                  <span className={`charCount ${commentText.length >= 150 ? "limit" : ""}`}>
                    {commentText.length}/150
                    { commentText.length >= 150 ? " *Max 150 characters" : "" }
                  </span>
                </div>
              </>
            ) : (
              <>
                {(comment.content || "").trim() && (
                  <div className="commentBody">{comment.content}</div>
                )}
                {commentAttachmentSrc && (
                    <img
                        src={commentAttachmentSrc}
                        alt={comment.attributes?.attachmentName || "Comment attachment"}
                        className="commentAttachmentImage"
                    />
                )}

                <div className="commentActions">
                  {!isReply && (
                      <button className="commentActionBtn" onClick={() => onReply(comment)}>Reply</button>
                  )}
                  {isOwnComment && (
                      <div className="commentMenuWrapper">
                        <button
                          type="button"
                          className="postCardEditIconBtn"
                          aria-label={t("postCard.editPost")}
                          onClick={() => {setIsEditingComment(true); setShowOptions(false); }}
                        >
                          <img src={editIcon} alt="" className="postCardEditIcon" />
                        </button>
                        <button
                          type="button"
                          className="postCardEditIconBtn"
                          aria-label={t("postCard.deletePost")}
                          onClick={() => { onDelete(comment.id); setShowOptions(false);}}
                        >
                          <img src={trashIcon} alt="" className="postCardEditIcon" />
                        </button>
                      </div>
                  )}
                </div>
              </>
            )}



          </div>
        </div>
        {replies.length > 0 && (
            <div className="commentRepliesList">
              {replies.map((reply) => (
                  <Comment
                      key={reply.id}
                      post={post}
                      comment={reply}
                      loadComments={loadComments}
                      onDelete={onDelete}
                      currentUserId={currentUserId}
                      onReply={onReply}
                      replies={[]} // Replies are flat in the current data structure logic, but this allows for future nesting if needed
                      replyingTo={replyingTo}
                      uploadIcon={uploadIcon}
                      t={t}
                  />
              ))}
            </div>
        )}
      </div>
  );
}
