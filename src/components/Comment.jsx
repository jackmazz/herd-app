import {useEffect, useState} from "react";
import defaultProfileIcon from "../assets/default-profile-black.svg";
import "../styles/Comments.css";

export default function Comment({
  comment,
  onDelete,
  currentUserId,
  onReply,
  replies = [],
  canDeleteComment,
}) {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [commentAttachmentSrc, setCommentAttachmentSrc] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const author = comment.author || {};
  const screenname = author.attributes?.screenname || author.attributes?.username || "Unknown";
  const username = author.attributes?.username || "";
  const commentAuthorId = comment?.authorID ?? author?.id;
  const isOwnComment = String(commentAuthorId) === String(currentUserId);
  const isReply = comment.attributes?.type === "reply";
  const canDelete = typeof canDeleteComment === "function" ? !!canDeleteComment(comment) : isOwnComment;

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

  return (
      <div className="commentComponentWrapper">
        <div className="commentComponent">
          <img src={profilePhoto || defaultProfileIcon} alt="avatar" className="commentAvatar" />
          <div className="commentContentWrapper">
            <div className="commentHeader">
              <span className="commentScreenname">{screenname}</span>
              <span className="commentUsername">@{username}</span>
            </div>
            {(comment.content || "").trim() ? (
                <div className="commentBody">{comment.content}</div>
            ) : null}
            {commentAttachmentSrc ? (
                <img
                    src={commentAttachmentSrc}
                    alt={comment.attributes?.attachmentName || "Comment attachment"}
                    className="commentAttachmentImage"
                />
            ) : null}
            <div className="commentActions">
              {!isReply && (
                  <button className="commentActionBtn" onClick={() => onReply(comment)}>Reply</button>
              )}
              {canDelete && (
                  <div className="commentMenuWrapper">
                    <button className="commentActionBtn" onClick={() => setShowOptions(!showOptions)}>...</button>
                    {showOptions && (
                        <div className="commentOptionsMenu">
                          <button className="commentDeleteBtn" onClick={() => { onDelete(comment.id); setShowOptions(false); }}>
                            Delete
                          </button>
                        </div>
                    )}
                  </div>
              )}
            </div>
          </div>
        </div>
        {replies.length > 0 && (
            <div className="commentRepliesList">
              {replies.map((reply) => (
                  <Comment
                      key={reply.id}
                      comment={reply}
                      onDelete={onDelete}
                      currentUserId={currentUserId}
                      onReply={onReply}
                      canDeleteComment={canDeleteComment}
                      replies={[]} // Replies are flat in the current data structure logic, but this allows for future nesting if needed
                  />
              ))}
            </div>
        )}
      </div>
  );
}