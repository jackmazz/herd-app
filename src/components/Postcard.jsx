import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import defaultProfileIcon from "../assets/default-profile-black.svg";
import likeIcon from "../assets/heart.svg";
import filledLikeIcon from "../assets/filled_heart.svg";
import commentIcon from "../assets/comment-icon.svg"
import editIcon from "../assets/edit.png";
import { useTranslation } from "react-i18next";
import Comment from "./Comment"
import PostAudioPlayer from "./PostAudioPlayer";
import { deletePost } from "../utilities/deletePost";
import { getAttachmentMediaFlags } from "../utilities/postAttachmentMedia";
import "../styles/Postcard.css";
import { getMemberRoleLabel, isModeratorMember } from "utilities/communityRoles";
import {
  notifyPostAuthorOfLike,
  notificationsToArray,
  resolvePostAuthorId,
} from "utilities/postLikeNotification";
import * as Config from "config.js";
import emptyStar from 'assets/star-empty.png';
import halfStar from 'assets/star-half.png';
import fullStar from 'assets/star-full.png';
import uploadIcon from "assets/upload-icon.svg";
const globalFollowingMap = {};
const FOLLOWING_UPDATED_EVENT = "following-updated";
//comment for commiting
function broadcastFollowingUpdate(authorId, isFollowing, connectionId = null) {
  globalFollowingMap[String(authorId)] = {
    isFollowing,
    connectionId,
  };
//comment to merge
  window.dispatchEvent(
    new CustomEvent(FOLLOWING_UPDATED_EVENT, {
      detail: {
        authorId: String(authorId),
        isFollowing,
        connectionId,
      },
    })
  );
}

export default function PostCard({
    post,
    community,
    groupID,
    members = [],
    creatorID = null,
    showFollow = true,
    setIsPostModalOpen,
    setPostId,
    setPostTitle,
    setPostContent,
    setPostAttachmentId,
    setQuestionContent,
    setRankingInputs,
    setRatingInputs,
    setRatingValues,
    setUpload,
    setIsEditing,
    onPostDeleted,
    setIsRankingModalOpen,
    setIsRatingModalOpen,
    setIsEditingRanking,
    setNumPollOptions,
    setRankingItemsCount,
}) {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStatusLoaded, setFollowStatusLoaded] = useState(false);
  const [connectionId, setConnectionId] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [likeCount, setLikeCount] = useState(
    Array.isArray(post.reactions) ? post.reactions.length : 0
  );
  const [userReactionId, setUserReactionId] = useState(null);
  const [isLiking, setIsLiking] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [replyingTo, setReplyingTo] = useState(null);
  const [commentError, setCommentError] = useState("");
  const [currentUserPhoto, setCurrentUserPhoto] = useState(null);
  const [commentPhotoFile, setCommentPhotoFile] = useState(null);
  const [commentPhotoPreviewUrl, setCommentPhotoPreviewUrl] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentPhotoInputRef = useRef(null);
  const { t } = useTranslation();
  
  useEffect(() => {
    return () => {
      if (commentPhotoPreviewUrl) {
        URL.revokeObjectURL(commentPhotoPreviewUrl);
      }
    };
  }, [commentPhotoPreviewUrl]);

  const token = sessionStorage.getItem("user-token");
  const currentUserId = String(sessionStorage.getItem("user"));

  // Small cooldown to reduce rapid like/unlike spam.
  // When user unlikes, we block re-liking for .5 second.
  const likeCooldownUntilRef = useRef(0);
  const likeCooldownTimeoutRef = useRef(null);
  const [likeCooldownActive, setLikeCooldownActive] = useState(false);
  const [likeCooldownMessage, setLikeCooldownMessage] = useState("");

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const [deleteError, setDeleteError] = useState("");
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [isInlineEditing, setIsInlineEditing] = useState(false);
  const [inlineContent, setInlineContent] = useState(post.content || "");
  const [inlineTitle, setInlineTitle] = useState(post.attributes?.title || "");
  const isTitleEmpty = !inlineTitle || inlineTitle.trim() === "";
  const isContentEmpty = !inlineContent || inlineContent.trim() === "";
  const isSaveDisabled = isTitleEmpty || isContentEmpty;

  function startLikeCooldown() {
    likeCooldownUntilRef.current = Date.now() + 250;
    setLikeCooldownActive(true);
    // Start the cooldown silently; we only show the message on repeated clicks.
    setLikeCooldownMessage("");

    if (likeCooldownTimeoutRef.current) {
      clearTimeout(likeCooldownTimeoutRef.current);
    }
    likeCooldownTimeoutRef.current = setTimeout(() => {
      likeCooldownUntilRef.current = 0;
      setLikeCooldownActive(false);
      setLikeCooldownMessage("");
    }, 500);
  }

  const author = post.author || {};
  const authorId = resolvePostAuthorId(post);
  useEffect(() => {
  if (!authorId) return;

  const saved = globalFollowingMap[String(authorId)];
  if (saved) {
    setIsFollowing(!!saved.isFollowing);
    setConnectionId(saved.connectionId || null);
  }

  function handleFollowingUpdated(event) {
    const detail = event.detail;
    if (!detail) return;
    if (String(detail.authorId) !== String(authorId)) return;

    setIsFollowing(!!detail.isFollowing);
    setConnectionId(detail.connectionId || null);
  }

  window.addEventListener(FOLLOWING_UPDATED_EVENT, handleFollowingUpdated);
  return () => {
    window.removeEventListener(FOLLOWING_UPDATED_EVENT, handleFollowingUpdated);
  };
}, [authorId]);
  const screenname =
    author.attributes?.screenname || author.attributes?.username || "Unknown";
  const username = author.attributes?.username || "";
  const title = post.attributes?.title || "";
  const postType = post.attributes?.type || "";
  const pollContent = post.attributes?.pollContent || [];
  const rankingContent = post.attributes?.rankingContent || [];
  const questionContent = post.attributes?.question || [];
  const ratingContent = post.attributes?.ratingContent || [];
  const ratingValues = post.attributes?.ratingValues || [];
  const [selectedPollIndex, setSelectedPollIndex] = useState(null);

  const isOwnPost = String(authorId) === currentUserId;
  const currentMembership = (Array.isArray(members) ? members : []).find(
    (m) => String(m?.userID) === String(currentUserId)
  );
  const currentIsOwner = creatorID != null && String(currentUserId) === String(creatorID);
  const currentIsModerator = isModeratorMember(currentMembership);
  const authorMembership = (Array.isArray(members) ? members : []).find(
    (m) => String(m?.userID) === String(authorId)
  );
  const authorRole = creatorID != null ? getMemberRoleLabel(authorMembership, creatorID) : "";
  const canRemovePost =
    isOwnPost ||
    currentIsOwner ||
    (currentIsModerator && authorRole !== "owner" && authorRole !== "mod");

  const canRemoveCommunityContentByAuthorId = (contentAuthorId) => {
    if (!contentAuthorId) return false;
    const authorIdStr = String(contentAuthorId);
    if (authorIdStr === String(currentUserId)) return true;
    if (currentIsOwner) return true;
    if (!currentIsModerator) return false;
    if (creatorID == null) return false;

    const membership = (Array.isArray(members) ? members : []).find(
      (m) => String(m?.userID) === authorIdStr
    );
    const role = getMemberRoleLabel(membership, creatorID);
    return role !== "owner" && role !== "mod";
  };

  const [pollVotes, setPollVotes] = useState([]);
  const [votedPercentages, setVotedPercentages] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [numberOfOptions, setNumberOfOptions] = useState([]);

  const [hasVoted, setHasVoted] = useState(false);
  const [votedChoice, setVotedChoice] = useState(null);

  const [attachment, setAttachment] = useState("");
  const [attachmentIsVideo, setAttachmentIsVideo] = useState(false);
  const [attachmentIsAudio, setAttachmentIsAudio] = useState(false);
  const attachmentId = post.attributes?.attachmentId || null
  const attachmentName = post.attributes?.attachmentName || "Attachment"

  const [isOwnComment, setIsOwnComment] = useState(false);

  const [isPostBlocked, setIsPostBlocked] = useState((post?.attributes?.blockedBy || []).filter((e) => (e == currentUserId)).length > 0);
  const [isUndo, setIsUndo] = useState((false));

  // Local state to track ratings for immediate UI updates without a full reload
  const [localRatings, setLocalRatings] = useState(post.attributes?.communityRatings || []);

  useEffect(() => {
    setLocalRatings(post.attributes?.communityRatings || []);
  }, [post.attributes?.communityRatings]);

  useEffect(() => {
  setInlineContent(post.content || "");
  setInlineTitle(post.attributes?.title || "");
}, [post.id]);
  useEffect(() => {
    if (!authorId) return;

    checkMembership();
    if (postType === "poll") {
      getPollValues();
    }

    let num = 0;
    if (pollContent.length > 0) {
      pollContent.forEach((e) => {
        if (e !== '') {
          num++;
        }
      });
    }
    setNumberOfOptions(num);

    if (post.authorID == currentUserId) {
      setIsOwnComment(true);
    }

    if (attachmentId) {
      fetch(`${process.env.REACT_APP_API_PATH}/file-uploads/${attachmentId}`)
        .then((res) => res.json())
        .then((data) => {
          const pathData = process.env.REACT_APP_API_PATH_SOCKET + data.path || null;
          const { isVideo: isVideoData, isAudio: isAudioData } =
            getAttachmentMediaFlags(pathData);

          // set the attachment path
          setAttachment(pathData);
          setAttachmentIsVideo(isVideoData);
          setAttachmentIsAudio(isAudioData);
        })
        .catch(() => {});
    }

    fetch(`${process.env.REACT_APP_API_PATH}/file-uploads?uploaderID=${authorId}`)
      .then((res) => res.json())
      .then((data) => {
        const files = data[0] || [];
        const pic = files.find((f) => f.attributes?.type === "profile-pic");
        if (pic) setProfilePhoto(process.env.REACT_APP_API_PATH_SOCKET + pic.path);
      })
      .catch(() => {});

    // Fetch current user's photo for the comment box
    fetch(`${process.env.REACT_APP_API_PATH}/file-uploads?uploaderID=${currentUserId}`)
        .then((res) => res.json())
        .then((data) => {
          const files = data[0] || [];
          const pic = files.find((f) => f.attributes?.type === "profile-pic");
          if (pic) setCurrentUserPhoto(process.env.REACT_APP_API_PATH_SOCKET + pic.path);
        })
        .catch(() => {});

    setFollowStatusLoaded(false);
    fetch(`${process.env.REACT_APP_API_PATH}/connections?fromUserID=${currentUserId}`, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        const connections = data[0] || [];
        const existing = connections.find(
          (c) =>
            String(c.fromUserID) === currentUserId &&
            String(c.toUserID) === String(authorId) &&
            c.attributes?.type === "follow"
        );
        if (existing) {
  broadcastFollowingUpdate(authorId, true, existing.id);
} else {
  broadcastFollowingUpdate(authorId, false, null);
}
      })
      .catch(() => {
        setIsFollowing(false);
        setConnectionId(null);
      })
      .finally(() => setFollowStatusLoaded(true));
  }, [authorId, post.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function checkMembership() {
    fetch(process.env.REACT_APP_API_PATH + "/group-members?groupID=" + groupID, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        const memberships = data[0] || [];

        const record = memberships.find(
          (m) => String(m.userID) === String(currentUserId) && String(m.groupID) === String(groupID)
        );

        if (record) {
          setIsJoined(true);
        } else {
          setIsJoined(false);
        }
      })
      .catch((err) => console.error("Membership check failed:", err));
  }

  function getPollValues() {
    fetch(process.env.REACT_APP_API_PATH + "/posts/" + post.id, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        const voteData = data.attributes?.pollVotes || [];
        setPollVotes(voteData);

        const userVote = voteData.find(
          (v) => String(v.id) === String(currentUserId)
        );
        setHasVoted(!!userVote);
        setVotedChoice(userVote ? userVote.voted : null);

        const votedValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const vP = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        voteData.forEach((e) => {
          const id = Number(e?.voted) - 1;
          if (Number.isFinite(id) && id >= 0 && id < votedValues.length) {
            votedValues[id]++;
          }
        });

        const total = voteData.length;
        let i = 0;
        votedValues.forEach((count) => {
          const value = total > 0 ? Math.round((count / total) * 100) : 0;
          vP[i] = value;
          i++;
        });
        setVotedPercentages(vP);
      })
      .catch((err) => console.error("Vote check failed:", err));
  }

  useEffect(() => {
    loadComments();
  }, [post.id, token]);

  const loadComments = () => {
    if (!post.id || !token) return;

    // Fetch top-level comments
    // Note: Check if your API requires a specific parameter to show ALL users' posts,
    // sometimes 'all=true' or similar is needed if the backend scopes by token.
    fetch(`${process.env.REACT_APP_API_PATH}/posts?parentID=${post.id}`, {
      headers: { Authorization: "Bearer " + token },
    })
        .then((res) => res.json())
        .then(async (data) => {
          const topLevel = data[0] || [];

          // For each comment, fetch its replies
          const repliesPromises = topLevel.map(comment =>
              fetch(`${process.env.REACT_APP_API_PATH}/posts?parentID=${comment.id}`, {
                headers: { Authorization: "Bearer " + token },
              }).then(res => res.json())
          );

          const repliesResults = await Promise.all(repliesPromises);

          const allReplies = repliesResults.flatMap(result => result[0] || []);

          // Sort comments by ID or creation time if available to keep order consistent
          const combined = [...topLevel, ...allReplies];
          setComments(combined);
        })
        .catch((err) => console.error("Failed to load comments and replies", err));
  };

  function clearCommentPhotoSelection() {
    setCommentPhotoPreviewUrl("");
    setCommentPhotoFile(null);
    if (commentPhotoInputRef.current) {
      commentPhotoInputRef.current.value = "";
    }
  }

  function openCommentPhotoPicker() {
    setCommentError("");
    commentPhotoInputRef.current?.click();
  }

  function handleCommentPhotoSelected(event) {
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

  const commentNotificationSnippet = (content, attributes) => {
    const text = (content || "").trim();
    if (text) return text;
    if (attributes?.attachmentId) return "a photo";
    return "";
  };

  const handleCreateComment = async (e) => {
    if (e) e.preventDefault();
    const hasText = !!commentText.trim();
    const hasPhoto = !!commentPhotoFile;
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
      }

      const attributes = { type: replyingTo ? "reply" : "comment" };
      if (uploadedAttachmentId != null) {
        attributes.attachmentId = uploadedAttachmentId;
        attributes.attachmentName = uploadedAttachmentName;
      }

      const payload = {
        authorID: Number(currentUserId),
        parentID: replyingTo ? replyingTo.id : post.id,
        content: commentText.trim() || (uploadedAttachmentId != null ? " " : ""),
        attributes,
      };

      const res = await fetch(`${process.env.REACT_APP_API_PATH}/posts`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("comment post failed");
      }

      const newComment = await res.json();

      if (replyingTo) {
        sendReplyNotification(newComment, replyingTo);
      } else {
        sendCommentNotifications(newComment);
      }
      setCommentText("");
      setReplyingTo(null);
      clearCommentPhotoSelection();
      loadComments();
    } catch (err) {
      console.error("Failed to post comment", err);
      setCommentError("Could not post your comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const sendReplyNotification = async (newReply, parentComment) => {
    try {
      const targetId = String(parentComment.authorID);
      if (targetId === currentUserId) return;

      // Check if target user blocked the current user
      const blockParams = new URLSearchParams({
        fromUserID: targetId,
        toUserID: currentUserId,
        attributes: JSON.stringify({ path: "type", equals: "block" })
      });
      const blockRes = await fetch(`${process.env.REACT_APP_API_PATH}/connections?${blockParams.toString()}`, {
        headers: { Authorization: "Bearer " + token }
      });
      const blockData = await blockRes.json();
      if (blockData[0]?.length > 0) return;

      const targetUserRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${targetId}`, {
        headers: { Authorization: "Bearer " + token }
      });
      const targetUser = await targetUserRes.json();

      // Get current user's screen name or username
      const currentUserRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${currentUserId}`, {
        headers: { Authorization: "Bearer " + token }
      });
      const currentUserData = await currentUserRes.json();
      const senderName = currentUserData.attributes?.screenname || currentUserData.attributes?.username || "Someone";

      const replySnippet = commentNotificationSnippet(newReply.content, newReply.attributes);
      const newNotif = {
        id: `reply-${newReply.id}-${targetId}-${Date.now()}`,
        type: "New Reply",
        content: `${senderName} replied "${replySnippet}"`,
        fromUserId: currentUserId,
        toUserId: targetId,
        read_status: false,
        time: new Date().toISOString(),
      };

      const existingNotifs = notificationsToArray(targetUser.attributes?.notifications);
      await fetch(`${process.env.REACT_APP_API_PATH}/users/${targetId}`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: { ...targetUser.attributes, notifications: [...existingNotifs, newNotif] }
        })
      });
    } catch (err) {
      console.error("Reply notification dispatch failed:", err);
    }
  };

  const sendCommentNotifications = async (newComment) => {
    try {
      // Get current user's screen name or username for the notification
      const currentUserRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const currentUserData = await currentUserRes.json();
      const commenterName = currentUserData.attributes?.screenname || currentUserData.attributes?.username || "Someone";

      // 1. Get Community Members
      const membersRes = await fetch(`${process.env.REACT_APP_API_PATH}/group-members?groupID=${groupID}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const membersData = await membersRes.json();
      const members = membersData[0] || [];

      // 2. Get Followers
      const followersRes = await fetch(`${process.env.REACT_APP_API_PATH}/connections?toUserID=${currentUserId}&attributes=${JSON.stringify({path: "type", equals: "follow"})}`, {
        headers: { Authorization: "Bearer " + token }
      });
      const followersData = await followersRes.json();
      const followers = followersData[0] || [];

      // Combine unique potential recipients (excluding self)
      const recipientIds = new Set([
        ...members.map(m => String(m.userID)),
        ...followers.map(f => String(f.fromUserID))
      ]);
      recipientIds.delete(currentUserId);

      // 3. Prepare Notification Content
      const commentSnippet = commentNotificationSnippet(newComment.content, newComment.attributes);
      const preview = `${title ? title + ": " : ""}${commentSnippet}`;
      const communityName = community?.name;

      for (const targetId of recipientIds) {
        // Check blocks (both directions)
        const blockParams = new URLSearchParams({
          fromUserID: targetId,
          toUserID: currentUserId,
          attributes: JSON.stringify({ path: "type", equals: "block" })
        });
        const blockRes = await fetch(`${process.env.REACT_APP_API_PATH}/connections?${blockParams.toString()}`, {
          headers: { Authorization: "Bearer " + token }
        });
        const blockData = await blockRes.json();
        if (blockData[0]?.length > 0) continue; // Skip if recipient blocked commenter

        // Check if commenter blocked the recipient
        const reverseBlockParams = new URLSearchParams({
          fromUserID: currentUserId,
          toUserID: targetId,
          attributes: JSON.stringify({ path: "type", equals: "block" })
        });
        const reverseBlockRes = await fetch(`${process.env.REACT_APP_API_PATH}/connections?${reverseBlockParams.toString()}`, {
          headers: { Authorization: "Bearer " + token }
        });
        const reverseBlockData = await reverseBlockRes.json();
        if (reverseBlockData[0]?.length > 0) continue; // Skip if commenter blocked recipient

        // Check if target user blocked the community
        const targetUserRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const targetUser = await targetUserRes.json();
        const blockedGroups = targetUser.attributes?.blockedGroups || [];
        if (blockedGroups.includes(Number(groupID))) continue;

        // 4. Send Notification
        const isFollower = followers.some(f => String(f.fromUserID) === String(targetId));
        const notifType = isFollower ? `Comment from ${commenterName}` : `Comment in your community ${communityName}`;

        const newNotif = {
          id: `comment-${newComment.id}-${targetId}-${Date.now()}`,
          type: notifType,
          content: `${commenterName} commented "${preview}" in the community ${communityName}.`,
          fromUserId: currentUserId,
          toUserId: targetId,
          read_status: false,
          time: new Date().toISOString(),
        };

        const existingNotifs = notificationsToArray(targetUser.attributes?.notifications);
        await fetch(`${process.env.REACT_APP_API_PATH}/users/${targetId}`, {
          method: "PATCH",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({
            attributes: { ...targetUser.attributes, notifications: [...existingNotifs, newNotif] }
          })
        });
      }
    } catch (err) {
      console.error("Notification dispatch failed:", err);
    }
  };

  const handleDeleteComment = (commentId) => {
    const comment = (comments || []).find((c) => String(c?.id) === String(commentId));
    const commentAuthorId = comment?.authorID ?? comment?.author?.id;
    if (!canRemoveCommunityContentByAuthorId(commentAuthorId)) return;

    // Find if this comment has replies to delete them as well (Test 3)
    const repliesToDelete = comments.filter(c => String(c.parentID) === String(commentId));

    const deleteRequest = (id) => fetch(`${process.env.REACT_APP_API_PATH}/posts/${id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    });

    // Delete the comment and all its immediate replies
    Promise.all([deleteRequest(commentId), ...repliesToDelete.map(r => deleteRequest(r.id))])
        .then(() => loadComments())
        .catch((err) => console.error("Failed to delete comment(s)", err));
  };

  async function sendFollowNotification(toUserId, fromUserId) {
    try {
      const fromRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${fromUserId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const fromData = await fromRes.json();
      const fromUsername = fromData.attributes?.username || "Someone";

      const toRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${toUserId}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const toData = await toRes.json();
      const existingNotifs = notificationsToArray(toData.attributes?.notifications);

      const newNotif = {
        id: `follow-${fromUserId}-${Date.now()}`,
        type: "Someone Followed You",
        content: `@${fromUsername} started following you.`,
        fromUserId: String(fromUserId),
        toUserId: String(toUserId),
        read_status: false,
        time: new Date().toISOString(),
      };

      await fetch(`${process.env.REACT_APP_API_PATH}/users/${toUserId}`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: { ...toData.attributes, notifications: [...existingNotifs, newNotif] },
        }),
      });
    } catch (err) {
      console.error("Failed to send follow notification:", err);
    }
  }

  useEffect(() => {
    if (!Array.isArray(post.reactions)) {
      setLikeCount(0);
      setUserReactionId(null);
      return;
    }
    setLikeCount(post.reactions.length);
    const existing = post.reactions.find(
      (r) => String(r.reactorID) === currentUserId
    );
    setUserReactionId(existing ? existing.id : null);
  }, [post.reactions, currentUserId]);

  function handleToggleLike() {
    if (!token || !currentUserId || isLiking || !post.id) return;
    if (Date.now() < likeCooldownUntilRef.current) {
      // Optional feedback when user clicks during cooldown.
      setLikeCooldownMessage("Please wait between liking and unliking.");
      setLikeCooldownActive(true);
      return;
    }
    setIsLiking(true);

    // If user has already reacted, delete that reaction
    if (userReactionId != null) {
      fetch(`${process.env.REACT_APP_API_PATH}/post-reactions/${userReactionId}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to remove reaction");
          setUserReactionId(null);
          setLikeCount((c) => (c > 0 ? c - 1 : 0));
          startLikeCooldown();
        })
        .catch(() => {})
        .finally(() => setIsLiking(false));
      return;
    }

    // Otherwise create a new like reaction
    fetch(`${process.env.REACT_APP_API_PATH}/post-reactions`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        postID: post.id,
        reactorID: Number(currentUserId),
        name: "like",
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to add reaction");
        return res.json();
      })
      .then((data) => {
        const newId = data.id || data.postReactionID;
        if (newId != null) {
          setUserReactionId(newId);
        }
        setLikeCount((c) => c + 1);
        if (authorId && String(authorId) !== String(currentUserId)) {
          const preview =
            [title, post.content].filter(Boolean).join(" — ") || post.content;
          notifyPostAuthorOfLike({
            postAuthorId: String(authorId),
            likerId: currentUserId,
            postId: post.id,
            postContentPreview: preview,
          });
        }
      })
      .catch(() => {})
      .finally(() => setIsLiking(false));
  }

  function handleFollow() {
  fetch(`${process.env.REACT_APP_API_PATH}/connections`, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fromUserID: Number(currentUserId),
      toUserID: Number(authorId),
      attributes: { type: "follow" },
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error("Follow failed");
      return res.json();
    })
    .then((data) => {
      broadcastFollowingUpdate(authorId, true, data.id);
      sendFollowNotification(String(authorId), currentUserId);
    })
    .catch((err) => {
      console.error("Follow failed:", err);
    });
}

  function handleUnfollow() {
    if (!connectionId) return;
    fetch(`${process.env.REACT_APP_API_PATH}/connections/${connectionId}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
      .then(() => {
  broadcastFollowingUpdate(authorId, false, null);
})
      .catch(() => {});
  }

  function handleVote(choice) {
    if (!choice) return;

    console.log("fetch");
    fetch(`${process.env.REACT_APP_API_PATH}/posts/${post.id}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          ...post.attributes,
          pollVotes: [
            ...((
              post.attributes?.pollVotes || pollVotes || []
            ).filter((v) => String(v?.id) !== String(currentUserId))),
            { id: currentUserId, voted: choice },
          ],
        },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Vote failed");
        return res.json();
      })
      .then(() => {
        getPollValues();
        setHasVoted(true);
        setVotedChoice(choice);
      })
      .catch((err) => {
        console.error("Vote error:", err);
        setHasVoted(false);
      });
    return;
  }

  function handleRemoveVote() {
    getPollValues();
    const newPollVotes = pollVotes.filter((vote) => String(vote["id"]) !== String(currentUserId));

    fetch(`${process.env.REACT_APP_API_PATH}/posts/${post.id}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          ...post.attributes,
          pollVotes: newPollVotes,
        },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Vote remove failed");
        return res.json();
      })
      .then(() => {
        setSelectedPollIndex(null);
        getPollValues();
      })
      .catch((err) => {
        console.error("Vote remove error:", err);
        setHasVoted(true);
      });
    return;
  }

  function handleRate(itemIndex, rating) {
    if (!isJoined) return;

    const otherRatings = localRatings.filter(
        (r) => !(String(r.userId) === String(currentUserId) && r.itemIndex === itemIndex)
    );

    const newRatings = [
      ...otherRatings,
      { userId: currentUserId, itemIndex, rating }
    ];

    // Update local state immediately for snappy UI
    setLocalRatings(newRatings);

    fetch(`${process.env.REACT_APP_API_PATH}/posts/${post.id}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          ...post.attributes,
          communityRatings: newRatings,
        },
      }),
    })
        .then((res) => {
          if (!res.ok) throw new Error("Rating failed");
          return res.json();
        })
        .then((updatedPost) => {
          // Sync the actual post object in the background
          post.attributes.communityRatings = newRatings;
        })
        .catch((err) => {
          console.error("Rating error:", err);
          // Rollback local state on error
          setLocalRatings(post.attributes?.communityRatings || []);
        });
  }

  useEffect(() => {
  function handleOutsideClick(event) {
    if (showDeleteConfirmModal || showDeleteErrorModal) return;

    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowMenu(false);
    }
  }

  document.addEventListener("click", handleOutsideClick);
  return () => document.removeEventListener("mousedown", handleOutsideClick);
}, [showDeleteConfirmModal, showDeleteErrorModal]);

  function handleHidePost() {
    let alreadyBlockedBy = post?.attributes?.blockedBy || [];
    if (alreadyBlockedBy.length > 0 && (alreadyBlockedBy.filter((e) => (e == currentUserId))).length > 0) {
      return;
    }
    fetch(`${process.env.REACT_APP_API_PATH}/posts/${post.id}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          ...post?.attributes,
          blockedBy: [...alreadyBlockedBy, currentUserId] },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Blocking post failed");
        return res.json();
      })
      .then(() => {
        setIsPostBlocked(true);
        setIsUndo(true);
      })
      .catch((err) => {
        console.error("Blocking post error:", err);
      });
  }

  function handleUndo() {
    let alreadyBlockedBy = post?.attributes?.blockedBy || [];
    let undoArray = (alreadyBlockedBy.filter((e) => (e !== currentUserId)));
    fetch(`${process.env.REACT_APP_API_PATH}/posts/${post.id}`, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          ...post?.attributes,
          blockedBy: undoArray },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Blocking post failed");
        return res.json();
      })
      .then(() => {
        setIsPostBlocked(false);
        setIsUndo(false);
      })
      .catch((err) => {
        console.error("Blocking post error:", err);
      });
  }
//DELETE POST
  async function handleDeletePost() {
  try {
    await deletePost(post.id, token);
    setShowDeleteConfirmModal(false);
    setShowMenu(false);
    if (typeof onPostDeleted === "function") {
      onPostDeleted();
    }
  } catch (err) {
    console.error("Failed to delete post:", err);
    setShowDeleteConfirmModal(false);
    setShowMenu(false);
    setDeleteError(err.message || "Failed to delete post.");
    setShowDeleteErrorModal(true);
  }
}

  const topLevelComments = comments.filter(c => String(c.parentID) === String(post.id));
  const getRepliesFor = (parentId) => comments.filter(c => String(c.parentID) === String(parentId));
  return (
    <div>
      {!isPostBlocked ? (
        <div className="postCard">
          <Link
            to={`/profile/${authorId}`}
            className="postCardAvatarLink"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={profilePhoto || defaultProfileIcon}
              alt="avatar"
              className="postCardAvatar"
            />
          </Link>

          <div className="postCardMain">
            <div className="postCardTopRow">
              <div className="postCardIdentity">

                {/* postCardNameRow: on desktop = display:contents (invisible wrapper),
                    on mobile = flex row for name + username */}
                <div className="postCardNameRow">
                  <Link
                    to={`/profile/${authorId}`}
                    className="postCardNameLink"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="postCardName">{screenname}</span>
                    <span className="postCardUsername">@{username}</span>
                  </Link>
                </div>

                {community && (
                  <Link
                    to={`/community/${community.groupID}`}
                    className="postCardCommunityTag"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {community.name}
                  </Link>
                )}
              </div>

              {showFollow && !isOwnPost && followStatusLoaded && (
                <button
                  className={`postCardFollowBtn ${isFollowing ? "following" : ""}`}
                  onClick={isFollowing ? handleUnfollow : handleFollow}
                >
                  {isFollowing
  ? t("postCard.following")
  : t("postCard.follow")}
                </button>
              )}
            </div>

            {(postType === "post" || postType === "") && (
  <div className="postCardBody">
    {isInlineEditing ? (
  <>
    <input
      type="text"
      className={`inlineEditTitle ${isTitleEmpty ? "inlineErrorInput" : ""}`}
      value={inlineTitle}
      onChange={(e) => {
        if (e.target.value.length <= 100) {
          setInlineTitle(e.target.value);
        }
      }}
      placeholder={t("communityPage.postModal.titlePlaceholder")}
    />
    <div className="inlineFooterRow">
  <div className="inlineError">
    {isTitleEmpty ? t("communityPage.postModal.titleRequired") : ""}
  </div>
  <div className="charCount">{inlineTitle.length}/100</div>
</div>
  </>
) : (
  title && <div className="postCardTitle">{title}</div>
)}

{isInlineEditing ? (
  <div className="inlineEditContainer">
    <textarea
      value={inlineContent}
      onChange={(e) => {
        if (e.target.value.length <= 500) {
          setInlineContent(e.target.value);
        }
      }}
      className={`inlineEditTextarea ${isContentEmpty ? "inlineErrorInput" : ""}`}
    />

    <div className="inlineFooterRow">
  <div className="inlineError">
    {isContentEmpty ? t("communityPage.postModal.captionRequired") : ""}
  </div>
  <div className="charCount">{inlineContent.length}/500</div>
</div>

    <div className="inlineEditActions">
      <button
        className="inlineCancelBtn"
        onClick={() => {
          setInlineContent(post.content || "");
          setInlineTitle(post.attributes?.title || "");
          setIsInlineEditing(false);
        }}
      >
        {t("postCard.cancel")}
      </button>

      <button
        className="inlineSaveBtn"
        disabled={isSaveDisabled}
        style={
          isSaveDisabled
            ? { opacity: 0.5, cursor: "not-allowed" }
            : {}
        }
        onClick={async () => {
          if (isSaveDisabled) return;

          try {
            const res = await fetch(
              `${process.env.REACT_APP_API_PATH}/posts/${post.id}`,
              {
                method: "PATCH",
                headers: {
                  Authorization: "Bearer " + token,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  content: inlineContent,
                  attributes: {
                    ...post.attributes,
                    title: inlineTitle,
                  },
                }),
              }
            );

            if (!res.ok) throw new Error("failed");

            post.content = inlineContent;
            post.attributes.title = inlineTitle;

            setInlineContent(inlineContent);
            setInlineTitle(inlineTitle);
            setIsInlineEditing(false);
          } catch (err) {
            console.error("edit failed:", err);
          }
        }}
      >
        {t("postCard.save")}
      </button>
    </div>
  </div>
) : (
  <div className="postCardContent">{post.content}</div>
)}
  </div>
)}

            {/* {(postType == "poll") && pollContent && ( */}
            {postType === "poll" && (
                <>
                  <div className="postCardBody">
                    {title && <div className="postCardTitle">{title}</div>}
                    {post.content && <div className="postCardContent">{post.content}</div>}
                  </div>
                  <div className="pollPanel">
                    <div className="pollQuestion">{questionContent}</div>
                    <div className="pollHeader">Select One Option ({numberOfOptions})</div>

                    {hasVoted ? (
                    <>
                      <ul className="pollList">
                        {pollContent
                          .filter((e) => e !== "")
                          .map((e, i) => (
                            <li
                              key={i+1}
                              className={votedChoice === i+1 ? "pollItemClicked" : ((votedPercentages[i] > 0) ? "pollItemVotedFor" : "pollItemsWhenVoted")}
                            >
                              <div className="votedText">{e}</div>
                              <div className="votedPercentage">
                                {votedPercentages[i]}%
                              </div>

                            </li>
                        ))}
                      </ul>
                      <div className="voteBtnWrapper">
                        <button className="removeVoteBtn" onClick={() => handleRemoveVote()}>Remove Vote</button>
                      </div>
                    </>
                  ) : (
                    <>
                      <ul className="pollList">
                      {pollContent
                        .filter((e) => e !== "")
                        .map((e, i) => (
                          <li
                            key={i+1}
                            className={selectedPollIndex === i+1 ? "pollItemClicked" : "pollItem"}
                            onClick={() => setSelectedPollIndex(i+1)}
                          >
                            <span>{e}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="voteBtnWrapper">
                        <button className="voteBtn" onClick={() => handleVote(selectedPollIndex)} disabled={!selectedPollIndex || !isJoined}>Vote</button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            <div className="postCardBody">
              {attachment && attachmentIsVideo ? (
                <video
                  className="postCardAttachment__video"
                  src={attachment}
                  alt="attachment"
                  controls
                />
              ) : attachment && attachmentIsAudio ? (
                <PostAudioPlayer src={attachment} />
              ) : attachment && !attachmentIsVideo && !attachmentIsAudio ? (
                <img
                  className="postCardAttachment"
                  src={attachment}
                  alt="attachment"
                />
              ) : (
                <></>
              )}
            </div>

            {postType === "ranking" && (
                <>
                  <div className="postCardBody">
                    {title && <div className="postCardTitle">{title}</div>}
                    <div className="postCardContent">{post.content}</div>
                  </div>
                  <div className="pollPanel">
                    <div className="rankQuestion">{post.attributes?.question}</div>

                    <ul className="rankList">
                {rankingContent
                  .filter((e) => e.length > 0)
                  .map((e, i) => (
                    <div className="rankWrapper">
                      <span className="rankNumbers">{i+1}</span>
                      <li
                        key={i+1}
                        className="rankItems"
                        onClick={() => setSelectedPollIndex(i+1)}
                      >
                        {e}
                      </li>
                    </div>
                  ))}
              </ul>
            </div>
          </>
        )}

            {postType === "rating" && (
                <>
                  <div className="postCardBody">
                    {title && <div className="postCardTitle">{title}</div>}
                    <div className="postCardContent">{post.content}</div>
                  </div>
                  <div className="pollPanel">
                    <ul className="rankList">
                      {ratingContent
                          .filter((e) => e.length > 0)
                          .map((e, i) => {
                            const allRatings = localRatings;
                            const itemRatings = allRatings.filter(r => r.itemIndex === i);

                            // Add the host's initial rating if they left one (ratingValues[i])
                            const hostRating = ratingValues[i];
                            const hostHasRated = hostRating !== -1 && hostRating !== 0;

                            // Filter ratings from community members
                            const memberRatings = itemRatings.map(r => r.rating);

                            // Check if the host has a rating in the community ratings (interacted via stars)
                            const hostCommunityRating = itemRatings.find(r => String(r.userId) === String(authorId))?.rating;

                            // If the host interacted with stars, that takes precedence over the creation modal rating
                            const effectiveHostRating = hostCommunityRating !== undefined ? hostCommunityRating : (hostHasRated ? hostRating : null);

                            const scores = [...memberRatings];
                            // If host has a creation rating and didn't interact via stars yet, include it in average
                            if (hostHasRated && hostCommunityRating === undefined) {
                              scores.push(hostRating);
                            }

                            const average = scores.length > 0
                                ? scores.reduce((a, b) => a + b, 0) / scores.length
                                : null;

                            // My rating logic: check if I am the host or a member who rated
                            let myRating = null;
                            if (isOwnPost) {
                              myRating = effectiveHostRating;
                            } else {
                              const myRatingObj = itemRatings.find(r => String(r.userId) === String(currentUserId));
                              myRating = myRatingObj ? myRatingObj.rating : null;
                            }

                            return (
                                <div key={i} className="rateWrap" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <li className="ratingItem">{e}</li>
                                    <li className="ratingValue" style={{ display: 'flex', alignItems: 'center' }}>
                                      <CreateStarInteractive
                                          value={average ?? 0}
                                          onRate={(val) => handleRate(i, val)}
                                          isGrey={average === null}
                                      />
                                      {average !== null && (
                                          <span style={{ marginLeft: '8px', fontWeight: 'bold' }}>
                                                {Number.isInteger(average) ? average : average.toFixed(2)}/5
                                              </span>
                                      )}
                                    </li>
                                  {myRating !== null && (
                                      <div className="yourRatingRow" style={{ display: 'flex', alignItems: 'center', marginTop: '4px', fontSize: '0.85rem', color: '#666', zoom: '70%' }}>
                                        <span style={{ marginRight: '8px' }}>Your rating</span>
                                        <CreateStar value={myRating} />
                                      </div>
                                  )}
                                </div>
                            );
                          })}
                    </ul>
                  </div>
                </>)}

            <div className="postCardFooter">
              <button
                  type="button"
                  className="postCardCommentBtn"
                  onClick={() => setShowComments(!showComments)}
                  aria-label="Comments"
              >
                <img src={commentIcon} alt="Comments" className="postCardFooterIcon" />
              </button>
              <span className="postCardLikeCount">
                {comments.length}
              </span>
              <button
                type="button"
                className={`postCardLikeIconBtn ${userReactionId != null ? "liked" : ""}`}
                onClick={handleToggleLike}
                disabled={isLiking || likeCooldownActive}
                aria-label={userReactionId != null ? "Unlike" : "Like"}
                style={
                  isLiking || likeCooldownActive
                    ? { cursor: "not-allowed", opacity: 0.65 }
                    : undefined
                }
              >
                <img
                  src={userReactionId != null ? filledLikeIcon : likeIcon}
                  alt="Like"
                  className="postCardLikeIcon"
                />
              </button>
              <span className="postCardLikeCount">
                {likeCount}
              </span>
            </div>

            {likeCooldownActive && likeCooldownMessage && (
              <div style={{ color: "#b00020", fontSize: "0.85em", marginTop: "4px" }}>
                {likeCooldownMessage}
              </div>
            )}
          </div>

          {showComments && (
              <div className="postCardCommentsSection">
                <div className="commentsList">
                  {topLevelComments.length === 0 ? (
                      <p className="noCommentsText">{t("postCard.noComments")}</p>
                  ) : (
                      topLevelComments.map((comment) => (
                          <div key={comment.id} className="commentItem">
                            <Comment
                                comment={comment}
                                onDelete={handleDeleteComment}
                                currentUserId={currentUserId}
                                onReply={(c) => setReplyingTo(c)}
                                canDeleteComment={(c) =>
                                  canRemoveCommunityContentByAuthorId(c?.authorID ?? c?.author?.id)
                                }
                                replies={getRepliesFor(comment.id)}
                            />
                          </div>
                      ))
                  )}
                </div>
                <div className="commentInputArea">
                  <div className="commentInputBodyRow">
                    <img src={currentUserPhoto || defaultProfileIcon} alt="me" className="commentInputAvatar" />
                    <div className="commentInputWrapper">
                      {replyingTo && (
                          <div className="replyingToLabel" style={{ color: '#888', fontSize: '0.9em', marginBottom: '4px' }}>
                            Replying to @{replyingTo.author?.attributes?.username || replyingTo.author?.attributes?.screenname}
                            <button
                                className="cancelReplyBtn"
                                onClick={() => setReplyingTo(null)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: '5px' }}
                            >
                              ×
                            </button>
                          </div>
                      )}
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
                                handleCreateComment();
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
                          <button
                              type="button"
                              className="commentSubmitBtn"
                              onClick={handleCreateComment}
                              disabled={isSubmittingComment}
                          >
                            {isSubmittingComment
                            ? "…"
                            : replyingTo
                            ? t("postCard.reply")
                            : t("postCard.comment")}
                          </button>
                        </div>
                      </div>
                      {commentPhotoPreviewUrl ? (
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
                      ) : null}
                      <div className="commentInputFooter">
                        {commentError && <span className="commentErrorText">{commentError}</span>}
                        <span className={`charCount ${commentText.length >= 150 ? "limit" : ""}`}>
                              {commentText.length}/150
                          { commentText.length >= 150 ? " *Max 150 characters" : "" }
                            </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          )}

        <div className="postCardMenu" ref={menuRef}>
{/*  {isOwnPost && (postType === "post" || postType === "") && (*/}
{/*  <button*/}
{/*  onClick={(e) => {*/}
{/*  e.stopPropagation();*/}
{/*  setInlineContent(post.content || "");*/}
{/*  setIsInlineEditing(true);*/}
{/*}}*/}
{/*    style={{*/}
{/*  background: isInlineEditing ? "#eee" : "none",*/}
{/*  border: "none",*/}
{/*  cursor: "pointer",*/}
{/*  borderRadius: "6px",*/}
{/*  padding: "4px"*/}
{/*}}*/}
{/*  >*/}
{/*    <img src={editIcon} alt="edit" style={{ width: "20px" }} />*/}
{/*  </button>*/}
{/*)}*/}

  <button
  className="postCardMenuBtn"
  onClick={() => setShowMenu((prev) => !prev)}
>
    •••
  </button>

  {showMenu && (
    <>
      {isOwnPost ? (
        <div className="postCardMenuPanel">
          <button
              type="button"
              className="postCardMenuOption"
              onClick={() => {
                const type = post.attributes?.type || "post";
                setPostId(post.id);
                setPostTitle(title);
                setPostContent(post.content ?? "");
                setPostAttachmentId(attachmentId);

                if (type === "ranking") {
                  const content = post.attributes?.rankingContent || [];
                  const filteredContent = content.filter(item => item.length > 0);

                  setQuestionContent(post.attributes?.question || "");
                  setRankingInputs([...content]);

                  // Set up the poll options count and mapping for the edit fields
                  setRankingItemsCount(content.length);
                  const options = [];
                  for(let i = 1; i < content.length; i++) {
                    options.push({ number: i + 1 });
                  }
                  setNumPollOptions(options);

                  // Skip the input fields and go straight to rearrange mode
                  setIsEditingRanking(false);
                  setIsRankingModalOpen(true);
                } else if (type === "rating") {
                  const content = post.attributes?.ratingContent || [];
                  const values = post.attributes?.ratingValues || [];

                  // Filter to only include items that have actual text content
                  const filteredIndices = content
                      .map((item, index) => ({ item, index }))
                      .filter(obj => obj.item && obj.item.trim() !== "");

                  const filteredContent = filteredIndices.map(obj => obj.item);
                  const filteredValues = filteredIndices.map(obj => values[obj.index] ?? 0);

                  setPostId(post.id);
                  setPostTitle(title);
                  setPostContent(post.content ?? "");

                  // Update inputs and values with filtered data
                  setRatingInputs([...filteredContent]);
                  setRatingValues([...filteredValues]);

                  // Map the number of items to the numPollOptions state
                  const options = [];
                  for (let i = 1; i < filteredContent.length; i++) {
                    options.push({ number: i + 1 });
                  }
                  setNumPollOptions(options);
                  setIsRatingModalOpen(true);
                } else {
                  setIsPostModalOpen(true);
                }

                setUpload(
                    attachment
                        ? {
                          id: attachmentId,
                          name: attachmentName,
                        }
                        : null
                );
                setIsEditing(true);
                setShowMenu(false);
              }}
          >
            {t("postCard.editPost")}
          </button>

          <button
  type="button"
  className="postDeleteBtn"
  onClick={(e) => {
    e.stopPropagation();
    e.preventDefault();
    setShowMenu(false);
    setShowDeleteConfirmModal(true);
  }}
>
  {t("postCard.delete")}
</button>
        </div>
      ) : (
        <div className="postCardMenuPanel">
          <button
            type="button"
            className="postCardMenuOption"
            onClick={() => {
              setShowMenu(false);
              handleHidePost();
            }}
          >
            {t("postCard.hideContent")}
          </button>

          {canRemovePost && (
            <button
              type="button"
              className="postDeleteBtn"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setShowMenu(false);
                setShowDeleteConfirmModal(true);
              }}
            >
              {t("postCard.deletePost")}
            </button>
          )}
        </div>
      )}
    </>
  )}
</div>
</div>

      ) : (
        isUndo ? (
          <div className="undoBtnWrapper">
            <button className="undoBtn" onClick={() => handleUndo()}>
              {t("postCard.undo")}
            </button>
          </div>
        ) : null
      )}

      {/* ✅ DELETE CONFIRM MODAL */}
      {showDeleteConfirmModal && (
        <div className="postModalOverlay">
          <div className="postModalBox">
            <h3 className="postModalTitle">{t("postCard.deleteModal.title")}</h3>
            <p className="postModalMessage">
              {t("postCard.deleteModal.message")}
            </p>

            <div className="postModalActions">
              <button
                className="postModalCancelBtn"
                onClick={() => setShowDeleteConfirmModal(false)}
              >
                {t("postCard.cancel")}
              </button>

              <button
                className="postModalDeleteBtn"
                onClick={handleDeletePost}
              >
                {t("postCard.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ DELETE ERROR MODAL */}
      {showDeleteErrorModal && (
        <div className="postModalOverlay">
          <div className="postModalBox">
            <h3 className="postModalTitle">{t("postCard.deleteModal.errorTitle")}</h3>
            <p className="postModalMessage">{deleteError}</p>
            <button
              className="postModalCloseBtn"
              onClick={() => setShowDeleteErrorModal(false)}
            >
              {t("postCard.ok")}
            </button>
          </div>
        </div>
      )}

    </div>
  );
  
}

function CreateStar({ item_num, value }) {
  const srcs = [
    value >= 1 ? fullStar : value >= 0.5 ? halfStar : emptyStar,
    value >= 2 ? fullStar : value >= 1.5 ? halfStar : emptyStar,
    value >= 3 ? fullStar : value >= 2.5 ? halfStar : emptyStar,
    value >= 4 ? fullStar : value >= 3.5 ? halfStar : emptyStar,
    value >= 5 ? fullStar : value >= 4.5 ? halfStar : emptyStar,
  ];
  
  
  return (
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

  );
}

function CreateStarInteractive({ value, onRate, isGrey }) {
  const [hoverValue, setHoverValue] = useState(null);

  const displayValue = hoverValue !== null ? hoverValue : value;

  const srcs = [
    displayValue >= 0.75 ? fullStar : displayValue >= 0.25 ? halfStar : emptyStar,
    displayValue >= 1.75 ? fullStar : displayValue >= 1.25 ? halfStar : emptyStar,
    displayValue >= 2.75 ? fullStar : displayValue >= 2.25 ? halfStar : emptyStar,
    displayValue >= 3.75 ? fullStar : displayValue >= 3.25 ? halfStar : emptyStar,
    displayValue >= 4.75 ? fullStar : displayValue >= 4.25 ? halfStar : emptyStar,
  ];

  const getRatingFromEvent = (e, starIndex) => {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return x > rect.width / 2 ? starIndex + 1 : starIndex + 0.5;
  };

  const handleClick = (e, starIndex) => {
    const rating = getRatingFromEvent(e, starIndex);
    onRate(rating);
  };

  const handleMouseMove = (e, starIndex) => {
    const rating = getRatingFromEvent(e, starIndex);
    setHoverValue(rating);
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  return (
      <div
          className="starContainer"
          style={{ opacity: isGrey && hoverValue === null ? 0.4 : 1 }}
          onMouseLeave={handleMouseLeave}
      >
        {[0, 1, 2, 3, 4].map((i) => (
            <img
                key={i}
                src={srcs[i]}
                className="star"
                alt={`${i + 1} star`}
                onClick={(e) => handleClick(e, i)}
                onMouseMove={(e) => handleMouseMove(e, i)}
                style={{ cursor: 'pointer' }}
            />
        ))}
      </div>
  );
}
