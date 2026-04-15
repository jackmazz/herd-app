//notifications
import React, { useEffect, useState } from "react";
import "../styles/Postcard.css";
import "../styles/Notifications.css";
import { notificationsToArray } from "utilities/postLikeNotification";

export default function NotificationCard({ post, onStatusChange }) {
  const token = sessionStorage.getItem("user-token");
  const currentUserId = String(sessionStorage.getItem("user"));

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
        {post.type && <div className="postCardTitle">{post.type}</div>}
        <div className="postCardContent">
          {post.content}

          {/* Join request */}
          {post.type === "Request to Join Your Private Community" && post.read_status === false ? (
            <span className="notifCardBtns">
              {notifValidity ? (
                <button className="notifCardAcceptBtn" onClick={handleAcceptRequest}>Accept</button>
              ) : (
                <button className="notifCardCancelAcceptBtn" disabled>Accept</button>
              )}
              <button className="notifCardDenyBtn" onClick={handleDenyRequest}>Deny</button>
            </span>

          /* Follow request (private account) */
          ) : post.type === "Request to Follow" && post.read_status === false ? (
            <span className="notifCardBtns">
              <button className="notifCardAcceptBtn" onClick={handleAcceptFollow}>Accept</button>
              <button className="notifCardDenyBtn" onClick={handleDenyFollow}>Deny</button>
            </span>

          /* Someone followed you (public account) */
          ) : post.type === "Someone Followed You" && post.read_status === false ? (
            <span className="notifCardBtns">
              {followerStillExists === null ? (
                <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>Checking...</span>
              ) : followerStillExists ? (
                <>
                  {/* ✅ Only show Follow Back if you don't already follow them */}
                  {!alreadyFollowingBack && (
                    <button className="notifCardAcceptBtn" onClick={handleFollowBack}>Follow Back</button>
                  )}
                  <button className="notifCardDenyBtn" onClick={handleRemoveFollower}>Remove</button>
                </>
              ) : (
                <button className="notifCardDenyBtn" onClick={markAsRead}>Dismiss</button>
              )}
            </span>

          ) : post.type === "Post Liked" && post.read_status === false ? (
            <span className="notifCardBtns">
              <button type="button" className="notifCardDenyBtn" onClick={markAsRead}>
                Mark as read
              </button>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}