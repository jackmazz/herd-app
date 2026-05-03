//notifications
import React, { useEffect, useState } from "react";
import "../styles/Postcard.css";
import "../styles/Notifications.css";
import { useTranslation } from "react-i18next";
import { notificationsToArray } from "utilities/postLikeNotification";

export default function NotificationCard({ post, onStatusChange }) {
  const token = sessionStorage.getItem("user-token");
  const currentUserId = String(sessionStorage.getItem("user"));
  const { t, i18n } = useTranslation();
  const [notifValidity, setNotifValidity] = useState(false);
  const [followerStillExists, setFollowerStillExists] = useState(null);
  const [alreadyFollowingBack, setAlreadyFollowingBack] = useState(false); // ✅ NEW

  useEffect(() => {
    if (post.type === "Request to Join Your Private Community") {
      checkNotifValidity();
    }
    if (post.type === "Someone Followed You" && post.read_status === false) {
      checkFollowStillExists();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── existing handlers ────────────────────────────────────────────────────

  function handleAcceptRequest() {
    fetch(process.env.REACT_APP_API_PATH + "/group-members", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ userID: post.user_id, groupID: post.group_id, attributes: {} }),
    })
      .then((res) => res.json())
      .then(() => handleDenyRequest());
  }

  function handleDenyRequest() {
    fetch(`${process.env.REACT_APP_API_PATH}/groups/${post.group_id}`)
      .then((res) => res.json())
      .then((group) => {
        fetch(process.env.REACT_APP_API_PATH + "/groups/" + post.group_id, {
          method: "PATCH",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({
            attributes: {
              ...group.attributes,
              requested: { ...group.attributes?.requested, [Number(post.user_id)]: false },
            },
          }),
        });
      });

    markAsRead();
  }

  async function handleAcceptFollow() {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_PATH}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fromUserID: parseInt(post.fromUserId),
          toUserID: parseInt(post.toUserId),
          attributes: { type: "follow" },
        }),
      });
      if (!res.ok) throw new Error("request failed");
      handleDenyFollow();
    } catch (error) {
      console.log("Failed to accept follow request: " + error);
    }
  }

  async function handleDenyFollow() {
    try {
      const userRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${post.toUserId}`);
      const userData = await userRes.json();
      const userAttributes = userData.attributes || {};

      const updatedNotifications = notificationsToArray(userAttributes.notifications).map((n) =>
        n.id === post.id ? { ...n, read_status: true } : n
      );
      
      const res = await fetch(`${process.env.REACT_APP_API_PATH}/users/${post.toUserId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          attributes: {
            ...userAttributes,
            notifications: updatedNotifications,
            followRequests: { ...(userAttributes.followRequests || {}), [Number(post.fromUserId)]: false },
          },
        }),
      });
      if (!res.ok) throw new Error("request failed");
      onStatusChange();
    } catch (error) {
      console.log("Failed to discard follow request: " + error);
    }
  }

  // ── new handlers ─────────────────────────────────────────────────────────

  async function checkFollowStillExists() {
    try {
      // Check if they still follow you
      const res = await fetch(
        `${process.env.REACT_APP_API_PATH}/connections?fromUserID=${post.fromUserId}&toUserID=${post.toUserId}`
      );
      const data = await res.json();
      const connections = data[0] || [];
      const stillFollowing = connections.some(
        (c) =>
          String(c.fromUserID) === String(post.fromUserId) &&
          String(c.toUserID) === String(post.toUserId) &&
          c.attributes?.type === "follow"
      );
      setFollowerStillExists(stillFollowing);

      // ✅ NEW: check if you already follow them back
      const reverseRes = await fetch(
        `${process.env.REACT_APP_API_PATH}/connections?fromUserID=${post.toUserId}&toUserID=${post.fromUserId}`
      );
      const reverseData = await reverseRes.json();
      const reverseConnections = reverseData[0] || [];
      const alreadyBack = reverseConnections.some(
        (c) =>
          String(c.fromUserID) === String(post.toUserId) &&
          String(c.toUserID) === String(post.fromUserId) &&
          c.attributes?.type === "follow"
      );
      setAlreadyFollowingBack(alreadyBack);

    } catch {
      setFollowerStillExists(false);
      setAlreadyFollowingBack(false);
    }
  }

  async function handleFollowBack() {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_PATH}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fromUserID: parseInt(post.toUserId),
          toUserID: parseInt(post.fromUserId),
          attributes: { type: "follow" },
        }),
      });
      if (!res.ok) throw new Error("follow back failed");
    } catch (err) {
      console.error(err);
    }
    markAsRead();
  }

  async function handleRemoveFollower() {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_API_PATH}/connections?fromUserID=${post.fromUserId}&toUserID=${post.toUserId}`
      );
      const data = await res.json();
      const connections = data[0] || [];
      const connection = connections.find(
        (c) =>
          String(c.fromUserID) === String(post.fromUserId) &&
          String(c.toUserID) === String(post.toUserId) &&
          c.attributes?.type === "follow"
      );
      if (connection) {
        await fetch(`${process.env.REACT_APP_API_PATH}/connections/${connection.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error(err);
    }
    markAsRead();
  }

  // ── shared helper ─────────────────────────────────────────────────────────

  async function markAsRead() {
    try {
      const userRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${currentUserId}`);
      const userData = await userRes.json();
      const updatedNotifs = notificationsToArray(userData.attributes?.notifications).map((n) =>
        n.id === post.id ? { ...n, read_status: true } : n
      );
      await fetch(`${process.env.REACT_APP_API_PATH}/users/${currentUserId}`, {
        method: "PATCH",
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
        body: JSON.stringify({ attributes: { ...userData.attributes, notifications: updatedNotifs } }),
      });
      if (typeof onStatusChange === "function") onStatusChange();
    } catch (err) {
      console.error("markAsRead failed:", err);
    }
  }

  // ── existing validity check ───────────────────────────────────────────────

  function checkNotifValidity() {
    if (post.type !== "Request to Join Your Private Community") {
      setNotifValidity(true);
      return;
    }
    fetch(process.env.REACT_APP_API_PATH + "/groups/" + post.group_id)
      .then((res) => res.json())
      .then((group) => {
        const requested = group.attributes?.requested || [];
        if (post.user_id in requested) {
          setNotifValidity(requested[post.user_id]);
        } else {
          setNotifValidity(false);
        }
      });
  }

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="notifCard">
      <div className="postCardBody">
        {post.type && (
  <div className="postCardTitle">
    {(() => {
      if (post.type === "Request to Join Your Private Community") {
        return t("notifications.types.joinRequest");
      }
      if (post.type === "Request to Follow") {
        return t("notifications.types.followRequest");
      }
      if (post.type === "Someone Followed You") {
        return t("notifications.types.followedYou");
      }
      if (post.type === "Post Liked") {
        return t("notifications.types.postLiked");
      }
      if (post.type.startsWith("Comment from ")) {
        const name = post.type.replace("Comment from ", "");
        return t("notifications.types.commentFrom", { name });
      }
      return post.type;
    })()}
  </div>
)}
        <div className="postCardContent">
  {(() => {
    if (post.type?.startsWith("Comment from ") || post.type?.startsWith("Comment in your community ")) {
      const match = post.content?.match(/^(.*?) commented "(.*?)" in the community (.*?)\.$/);
      if (match) {
        const [, name, postTitle, communityName] = match;
        return t("notifications.content.commentInCommunity", {
          name,
          postTitle,
          communityName,
        });
      }
    }

  if (post.type === "Post Liked" && post.content) {
  const isSpanish = i18n.language.startsWith("es");

  return isSpanish
    ? post.content
        .replace(" liked your post: ", " le gustó tu publicación: ")
        .replace(" liked your post:", " le gustó tu publicación:")
    : post.content;
}

    if (post.type === "Someone Followed You") {
      const match = post.content?.match(/^(.*?) started following you\.$|^(.*?) followed you back\.$/);
      if (match) {
        const name = match[1] || match[2];
        return t("notifications.content.startedFollowing", { name });
      }
    }

    return post.content;
  })()}

          {/* Join request */}
          {post.type === "Request to Join Your Private Community" && post.read_status === false ? (
            <span className="notifCardBtns">
              {notifValidity ? (
                <button className="notifCardAcceptBtn" onClick={handleAcceptRequest}>
  {t("notifications.actions.accept")}
</button>
              ) : (
                <button className="notifCardCancelAcceptBtn" disabled>
  {t("notifications.actions.accept")}
</button>
              )}
              <button className="notifCardDenyBtn" onClick={handleDenyRequest}>
  {t("notifications.actions.deny")}
</button>
            </span>

          /* Follow request (private account) */
          ) : post.type === "Request to Follow" && post.read_status === false ? (
            <span className="notifCardBtns">
              <button className="notifCardAcceptBtn" onClick={handleAcceptFollow}>
  {t("notifications.actions.accept")}
</button>
              <button className="notifCardDenyBtn" onClick={handleDenyFollow}>
  {t("notifications.actions.deny")}
</button>
            </span>

          /* Someone followed you (public account) */
          ) : post.type === "Someone Followed You" && post.read_status === false ? (
            <span className="notifCardBtns">
              {followerStillExists === null ? (
                <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>
  {t("notifications.actions.checking")}
</span>
              ) : followerStillExists ? (
                <>
                  {/* ✅ Only show Follow Back if you don't already follow them */}
                  {!alreadyFollowingBack && (
                    <button className="notifCardAcceptBtn" onClick={handleFollowBack}>
  {t("notifications.actions.followBack")}
</button>
                  )}
                  <button className="notifCardDenyBtn" onClick={handleRemoveFollower}>
  {t("notifications.actions.remove")}
</button>
                </>
              ) : (
                <button className="notifCardDenyBtn" onClick={markAsRead}>
  {t("notifications.actions.dismiss")}
</button>
              )}
            </span>

          ) : post.type === "Post Liked" && post.read_status === false ? (
            <span className="notifCardBtns">
              <button type="button" className="notifCardDenyBtn" onClick={markAsRead}>
                {t("notifications.actions.markAsRead")}
              </button>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}