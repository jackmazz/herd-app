import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";
import NotificationCard from "./NotificationCard";
import { notificationsToArray } from "utilities/postLikeNotification";

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("unreadnotifs");
  const [groups, setGroups] = useState([]);
  
  const [readNotifs, setReadNotifs] = useState([]);
  const [forYouLoading, setForYouLoading] = useState(false);
  
  const [unreadNotifs, setUnreadNotifs] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);

  const [bannerMap, setBannerMap] = useState({});
  const [pageReady, setPageReady] = useState(false);

  const userId = String(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("user-token");

  useEffect(() => {
    Promise.all([
      fetch(process.env.REACT_APP_API_PATH + "/groups", {
        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          const groupsArray = data[0] || [];
          const normalized = groupsArray.map((g) => ({
            groupID: g.id,
            name: g.name,
            tags: g.attributes?.tags || [],
            color: g.attributes?.color || "#888",
            isPrivate: g.attributes?.visibility === "private",
            creatorID: g.attributes?.creatorID ? String(g.attributes.creatorID) : null,
            attributes: g.attributes || {},
          }));
          setGroups(normalized);
          loadBannerImages(normalized);
        })
    ])
      .catch(() => {})
      .finally(() => setPageReady(true));

    fetchNotifications();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function fetchNotifications() {
  fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`)
    .then((res) => res.json())
    .then((user) => {
      const notifications = notificationsToArray(user.attributes?.notifications)
        .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

      if (notifications.length === 0) {
        setUnreadNotifs([]);
        setReadNotifs([]);
        setForYouLoading(false);
        setFollowingLoading(false);
        return;
      }

      const unread = notifications
        .filter((m) => m.read_status === false)
        .map((m) => ({
          id: m?.id,
          type: m?.type,
          content: m?.content,
          user_id: m?.user_id,
          group_id: m?.group_id,
          post_id: m?.post_id,
          fromUserId: m?.fromUserId,
          toUserId: m?.toUserId,
          read_status: m?.read_status,
          time: m?.time,
        }));

      const read = notifications
        .filter((m) => m.read_status === true)
        .map((m) => ({
          id: m?.id,
          type: m?.type,
          content: m?.content,
          user_id: m?.user_id,
          group_id: m?.group_id,
          post_id: m?.post_id,
          fromUserId: m?.fromUserId,
          toUserId: m?.toUserId,
          read_status: m?.read_status,
          time: m?.time,
        }));

      setUnreadNotifs(unread);
      setReadNotifs(read);
      setForYouLoading(false);
      setFollowingLoading(false);
    })
    .catch(() => {
      setUnreadNotifs([]);
      setReadNotifs([]);
      setForYouLoading(false);
      setFollowingLoading(false);
    });
}

  function loadBannerImages(groupsArray) {
    if (!groupsArray || groupsArray.length === 0) return;
    const requests = groupsArray.map((g) => {
      const creatorID = g.creatorID;
      if (!creatorID) return Promise.resolve({ groupID: g.groupID, bannerUrl: null });
      return fetch(`${process.env.REACT_APP_API_PATH}/file-uploads?uploaderID=${creatorID}`)
        .then((res) => res.json())
        .then((data) => {
          const files = data[0] || [];
          if (!Array.isArray(files)) return { groupID: g.groupID, bannerUrl: null };
          const bannerFile = files.find(
            (file) =>
              file.attributes &&
              file.attributes.type === "communityBanner" &&
              String(file.attributes.groupID) === String(g.groupID)
          );
          return {
            groupID: g.groupID,
            bannerUrl: bannerFile ? process.env.REACT_APP_API_PATH_SOCKET + bannerFile.path : null,
          };
        })
        .catch(() => ({ groupID: g.groupID, bannerUrl: null }));
    });
    Promise.all(requests).then((results) => {
      const map = {};
      results.forEach(({ groupID, bannerUrl }) => {
        if (bannerUrl) map[String(groupID)] = bannerUrl;
      });
      setBannerMap(map);
    });
  }

  return (
    <div className="feedPage">

      <div className="feedTabsWrapper">
        <div className="feedTabs">
          <button
            className={`feedTabBtn ${activeTab === "unreadnotifs" ? "active" : ""}`}
            onClick={() => setActiveTab("unreadnotifs")}
          >
            Unread Notifications
          </button>
          <button
            className={`feedTabBtn ${activeTab === "readnotifs" ? "active" : ""}`}
            onClick={() => setActiveTab("readnotifs")}
          >
            Read Notifications
          </button>
        </div>
        <div className="feedTabsDivider" />
      </div>

      <div className="feedShell">
        <div className="feedPanel">

          {activeTab === "unreadnotifs" && (
            <div className="forYouFeed">
              {forYouLoading ? (
                <div className="feedEmptyCard">Loading notifications...</div>
              ) : unreadNotifs.length === 0 ? (
                <EmptyState
                  title="Nothing here yet"
                  subtitle="You have no unread notifications."
                />
              ) : ( //pull notifications
                unreadNotifs.map((post) => {
                  return <NotificationCard key={post.id} post={post} onStatusChange={fetchNotifications} />;
                })
              )}
            </div>
          )}

          {activeTab === "readnotifs" && (
            <div className="forYouFeed">
              {followingLoading ? (
                <div className="feedEmptyCard">Loading notifications...</div>
              ) : readNotifs.length === 0 ? (
                <EmptyState
                  title="Nothing here yet"
                  subtitle="You have no read notifications."
                />
              ) : ( //pull notifications
                readNotifs.map((post) => (
                    <NotificationCard
                      key={post.id}
                      post={post}
                      onStatusChange={fetchNotifications}
                    />
                  ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="feedEmptyCard">
      <div className="feedEmptyIcon">∅</div>
      <h2 className="feedEmptyTitle">{title}</h2>
      <p className="feedEmptySubtitle">{subtitle}</p>
    </div>
  );
}


// { "notifications" : [
//          {"id": string, "content": string, "read_status": boolean},
//          ...]
// }
// read_status: True -> read
// read_status: False -> unread


//IN HOMEPAGE.JSX & COMMUNITYPAGE.JSX

//set Request to Join / Requested based on boolean isRequested
//set isRequested based on:

//fetch  /group-members=group where "userID"==userID && "groupID"==groupID
//check if group["group"]["attributes"]["requested"] exists
//if None: add "requested"=false -> Request to Join
//else: True -> Requested, False -> Request to Join


//click button:

// 1
//fetch  /group-members=group where "userID"==userID && "groupID"==groupID
//check if group["group"]["attributes"]["requested"] exists
//if None: add "requested"=true
//else: set "requested"=true, update isRequested so the button changes

// 2
//from group, find owner of community: group["group"]["attributes"]["creatorID"]
//fetch /users=user database, match creatorID
//check if user["attributes"]["notifications"] exists
//if None: add new {"notifications": [notification]}
//else: append new notification to "notifications".value

//send request to owner -> in notifications
//if owner accepts, add requester to community list
//else: remove request




//IN NOTIFICATIONS.JSX

//fetch notifcations for the user
//split into a read and unread group
//display

