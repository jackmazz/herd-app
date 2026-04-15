import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/HomePage.css";
import "../styles/PinCommunity.css";
import PostCard from "./Postcard";
import { mergePostsReactionsOnly } from "utilities/mergePostReactions";
import { notifyOwnerAndModeratorsOfPublicJoin } from "utilities/notifyPublicCommunityJoin";
import { notifyOwnerAndModeratorsOfPrivateJoinRequest } from "utilities/notifyPrivateCommunityJoinRequest";
import filterIcon from "assets/filter.png";
import pinIcon from "assets/pin.png";
import isPrivate from "utilities/isPrivate.js"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("communities");
  const [groups, setGroups] = useState([]);
  const [joinedGroupIDs, setJoinedGroupIDs] = useState(new Set());
    const [kickedGroupIDs, setKickedGroupIDs] = useState(new Set());
  const [requestedGroupIDs, setRequestedGroupIDs] = useState(new Set());

  const [forYouPosts, setForYouPosts] = useState([]);
  const [forYouLoading, setForYouLoading] = useState(false);

  const [followingPosts, setFollowingPosts] = useState([]);
  const [followingLoading, setFollowingLoading] = useState(false);

  const [bannerMap, setBannerMap] = useState({});
  const [pageReady, setPageReady] = useState(false);
  const [showAllMyCommunities, setShowAllMyCommunities] = useState(false);
  const [showInterestModal, setShowInterestModal] = useState(false);

  const myCommunitiesScrollRef = useRef(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
const [isEditing, setIsEditing] = useState(false);
const [postId, setPostId] = useState(null);
const [postTitle, setPostTitle] = useState("");
const [postContent, setPostContent] = useState("");
const [postAttachmentId, setPostAttachmentId] = useState(null);
const [upload, setUpload] = useState(null);
const [editTitleError, setEditTitleError] = useState("");
const [editContentError, setEditContentError] = useState("");

  const [user, setUser] = useState(null);
  const userId = String(sessionStorage.getItem("user"));
  const token = sessionStorage.getItem("user-token");
  const TAG_OPTIONS = [
    "Music", "Pop Culture", "Gaming", "Travel", "Food", "Sports", "Tech", "Movies", "Humor", "Scary", "Science",
    "Work", "Love", "Art", "Nature", "Books", "School", "Fun", "Health", "Misc."
  ];

  const [selectedInterestTags, setSelectedInterestTags] = useState([]);

  const [pins, setPins] = useState([]);
  const [myPinnedGroups, setMyPinnedGroups] = useState([]);
  const [pinnedLoaded, setPinnedLoaded] = useState(false);

  const joinedGroupIDsRef = useRef(joinedGroupIDs);
  useEffect(() => {
    joinedGroupIDsRef.current = joinedGroupIDs;
    if (pageReady) getPinned();
  }, [joinedGroupIDs]);

  const groupsRef = useRef(groups);
  useEffect(() => {
    groupsRef.current = groups;
  }, [groups]);

    useEffect(() => {
        Promise.all([
            fetch(process.env.REACT_APP_API_PATH + "/group-members/", {
                headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            })
                .then((res) => res.json())
                .then((data) => {
                    const memberships = data[0] || [];

                    // Identify joined groups (not kicked)
                    const joined = memberships
                        .filter((m) => String(m.userID) === userId && m.attributes?.role !== "kicked")
                        .map((m) => String(m.groupID));

                    // Identify kicked groups
                    const kicked = memberships
                        .filter((m) => String(m.userID) === userId && m.attributes?.role === "kicked")
                        .map((m) => String(m.groupID));

                    const joinedSet = new Set(joined);
                    const kickedSet = new Set(kicked);

                    setJoinedGroupIDs(joinedSet);
                    setKickedGroupIDs(kickedSet);
                    fetchForYouPosts(joinedSet);

                    return kickedSet; // Pass to next then block
                }),
            fetch(process.env.REACT_APP_API_PATH + "/groups", {
                headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            })
                .then((res) => res.json())
        ])
            .then(([kickedSet, groupsData]) => {
                const groupsArray = groupsData[0] || [];
                // Filter out any groups where the user is kicked
                const normalized = groupsArray
                    .filter((g) => !kickedSet.has(String(g.id)))
                    .map((g) => ({
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

                const potentiallyRequestedGroups = normalized
                    .filter((m) => (m.isPrivate === true) && (("requested" in m.attributes) === true))
                    .map((m) => ({
                        groupID: m.groupID,
                        requested: m.attributes?.requested,
                    }));

                const requested = potentiallyRequestedGroups
                    .filter((m) => m.requested?.[userId] === true) // Added optional chaining to prevent crash
                    .map((m) => String(m.groupID));
                setRequestedGroupIDs(new Set(requested));
            })
            .catch(() => {})
            .finally(() => setPageReady(true));

        getUser();
        fetchFollowingPosts();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
  const justRegistered = sessionStorage.getItem("justRegistered");
  if (justRegistered === "true") {
    setShowInterestModal(true);
  }
}, []);
  // Silent background refresh for like counts on For you + Following (same idea as CommunityPage).
  useEffect(() => {
    const refreshReactions = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const joined = joinedGroupIDsRef.current;
      if (joined.size > 0) {
        fetchForYouPosts(joined, { silent: true, updateOnlyReactions: true });
      }
      fetchFollowingPosts({ silent: true, updateOnlyReactions: true });

      // Also refresh community banner thumbnails so changes (e.g. ownership transfer / moderator uploads)
      // show up when returning to the homepage without a full reload.
      const currentGroups = groupsRef.current;
      if (Array.isArray(currentGroups) && currentGroups.length > 0) {
        loadBannerImages(currentGroups);
      }
    };

    document.addEventListener("visibilitychange", refreshReactions);
    window.addEventListener("focus", refreshReactions);
    const intervalId = window.setInterval(refreshReactions, 1500);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshReactions);
      window.removeEventListener("focus", refreshReactions);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUser = () => {
    fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`)
      .then(res => res.json())
      .then(data => { setUser(data); });
  }

  async function fetchForYouPosts(joinedSet, options = {}) {
    const { silent = false, updateOnlyReactions = false } = options;
    const ids = Array.from(joinedSet);
    if (ids.length === 0) {
      if (!updateOnlyReactions) setForYouPosts([]);
      return;
    }
    if (!silent) setForYouLoading(true);

    const blockedUsers = await fetchBlockedUsers();

    Promise.all(
      ids.map((gid) =>
        fetch(process.env.REACT_APP_API_PATH + "/posts?recipientGroupID=" + gid, {
          headers: { Authorization: "Bearer " + token },
        })
          .then((res) => res.json())
          .then((data) => data[0] || [])
          .catch(() => [])
      )
    )
      .then(async (results) => {
        const allPosts = results.flat().sort((a, b) => new Date(b.created) - new Date(a.created));
        
        const visiblePosts = (
          await Promise.all(
            allPosts.map(async (p) => {
              const isBlocked = (
                (p?.attributes?.blockedBy || []).some((b) => String(b) === String(userId)) ||
                blockedUsers.includes(String(p?.authorID))
              );

              const isPrivatePost = await isPrivate(userId, p.authorID);

              if (isBlocked || isPrivatePost) {
                return null;
              }
              
              return p;
            })
          )
        ).filter(Boolean);

        if (!updateOnlyReactions) {
          setForYouPosts(visiblePosts);
        } else {
          setForYouPosts((prev) =>
            mergePostsReactionsOnly(Array.isArray(prev) ? prev : [], visiblePosts)
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!silent) setForYouLoading(false);
      });
  }

  function fetchFollowingPosts(options = {}) {
    const { silent = false, updateOnlyReactions = false } = options;
    if (!silent) setFollowingLoading(true);
    fetch(process.env.REACT_APP_API_PATH + "/connections?fromUserID=" + userId, {
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        const connections = data[0] || [];
        
        const followedUserIDs = connections
          .filter((c) => (String(c.fromUserID) === userId) && (c.attributes?.type === "follow"))
          .map((c) => String(c.toUserID))
          .filter(Boolean);

        if (followedUserIDs.length === 0) {
          if (!updateOnlyReactions) setFollowingPosts([]);
          return null;
        }

        return Promise.all(
          followedUserIDs.map((uid) =>
            fetch(process.env.REACT_APP_API_PATH + "/posts?authorID=" + uid, {
              headers: { Authorization: "Bearer " + token },
            })
              .then((res) => res.json())
              .then((data) => data[0] || [])
              .catch(() => [])
          )
        );
      })
      .then((results) => {
        if (!results) return;
        const allPosts = results.flat().sort((a, b) => new Date(b.created) - new Date(a.created));
        const visiblePosts = allPosts.filter(
          (p) => !(p?.attributes?.blockedBy || []).some((b) => String(b) === String(userId))
        );
        if (!updateOnlyReactions) {
          setFollowingPosts(visiblePosts);
        } else {
          setFollowingPosts((prev) =>
            mergePostsReactionsOnly(Array.isArray(prev) ? prev : [], visiblePosts)
          );
        }
      })
      .catch(() => {
        if (!updateOnlyReactions) setFollowingPosts([]);
      })
      .finally(() => {
        if (!silent) setFollowingLoading(false);
      });
  }

  function fetchBlockedUsers() {
    // 1. Blocks initiated by the logged-in user
    const paramsA = new URLSearchParams({
      fromUserID: userId,
      attributes: JSON.stringify({ path: "type", equals: "block" })
    });

    // 2. Blocks targeting the logged-in user
    const paramsB = new URLSearchParams({
      toUserID: userId,
      attributes: JSON.stringify({ path: "type", equals: "block" })
    });

    return Promise.all([
      fetch(`${process.env.REACT_APP_API_PATH}/connections?${paramsA.toString()}`, {
        headers: { Authorization: "Bearer " + token },
      }).then(res => res.json()),
      fetch(`${process.env.REACT_APP_API_PATH}/connections?${paramsB.toString()}`, {
        headers: { Authorization: "Bearer " + token },
      }).then(res => res.json())
    ])
        .then(([dataA, dataB]) => {
          const blocking = (dataA[0] || []).map(conn => String(conn.toUserID));
          const blockedBy = (dataB[0] || []).map(conn => String(conn.fromUserID));

          // Combine both into a unique list of IDs to filter out
          const allBlockedIds = Array.from(new Set([...blocking, ...blockedBy]));
          return allBlockedIds;
        })
        .catch((err) => {
          console.error("Blocked users load failed:", err);
          return [];
        });
  }

  function loadBannerImages(groupsArray) {
    if (!groupsArray || groupsArray.length === 0) return;
    const groupIdSet = new Set(groupsArray.map((g) => String(g.groupID)));

    fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`)
      .then((res) => res.json())
      .then((data) => {
        const files = data[0] || [];
        if (!Array.isArray(files)) {
          setBannerMap({});
          return;
        }

        const latestByGroup = {};
        for (const file of files) {
          const attrs = file?.attributes;
          if (!attrs || attrs.type !== "communityBanner") continue;
          const gid = String(attrs.groupID);
          if (!groupIdSet.has(gid)) continue;

          const prev = latestByGroup[gid];
          if (!prev || Number(file.id || 0) > Number(prev.id || 0)) {
            latestByGroup[gid] = file;
          }
        }

        const map = {};
        for (const gid of groupIdSet) {
          const file = latestByGroup[gid];
          if (file?.path) {
            map[gid] = process.env.REACT_APP_API_PATH_SOCKET + file.path;
          }
        }
        setBannerMap(map);
      })
      .catch(() => {});
  }

  function getPinned() {
    fetch(process.env.REACT_APP_API_PATH + "/users/" + userId, { method: "GET" })
      .then((res) => res.json())
      .then((user) => {
        const pinnedCommunities = user.attributes?.pinnedCommunities || [];
        setPins(pinnedCommunities);
        const pinOrder = new Map(pinnedCommunities.map((id, index) => [String(id), index]));
        const pinnedGroupsOrdered = [...myGroups]
          .filter((group) => pinOrder.has(String(group.groupID)))
          .sort(
            (a, b) =>
              pinOrder.get(String(a.groupID)) - pinOrder.get(String(b.groupID))
          );
        setMyPinnedGroups(pinnedGroupsOrdered);
        setPinnedLoaded(true);
      });
  }

  function handleJoin(groupID) {
    fetch(process.env.REACT_APP_API_PATH + "/group-members", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({ userID: Number(userId), groupID: Number(groupID), attributes: {} }),
    })
      .then((res) => res.json())
      .then(() => {
        const updated = new Set(joinedGroupIDs);
        updated.add(String(groupID));
        setJoinedGroupIDs(updated);
        fetchForYouPosts(updated);
        const g = groups.find((x) => String(x.groupID) === String(groupID));
        if (g && !g.isPrivate && g.creatorID) {
          notifyOwnerAndModeratorsOfPublicJoin({
            token,
            groupId: groupID,
            communityName: g.name,
            creatorId: g.creatorID,
            joiningUserId: userId,
          });
        }
      })
      .catch((err) => console.error("Join failed:", err));
  }

  function handleRequestJoinPrivCommunity(groupID) {
    fetch(process.env.REACT_APP_API_PATH + "/groups/" + groupID, { method: "GET" })
      .then((res) => res.json())
      .then((group) => {
        fetch(process.env.REACT_APP_API_PATH + "/groups/" + groupID, {
          method: "PATCH",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({
            attributes: {
              ...group.attributes,
              requested: { ...group.attributes.requested, [Number(userId)]: true },
            }
          }),
        })
          .then((res) => res.json())
          .then(() => {
            const updated = new Set(requestedGroupIDs);
            updated.add(String(groupID));
            setRequestedGroupIDs(updated);
            handleSendRequest(group, user.attributes.username + " has requested to join the community " + group.name + ".");
          })
          .catch((err) => console.error("Request failed:", err));
      });
  }

  function handleCancelRequest(groupID) {
    fetch(process.env.REACT_APP_API_PATH + "/groups/" + groupID, { method: "GET" })
      .then((res) => res.json())
      .then((group) => {
        fetch(process.env.REACT_APP_API_PATH + "/groups/" + groupID, {
          method: "PATCH",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({
            attributes: {
              ...group.attributes,
              requested: { ...group.attributes.requested, [Number(userId)]: false },
            }
          }),
        })
          .then(() => {
            const updated = new Set(requestedGroupIDs);
            updated.delete(String(groupID));
            setRequestedGroupIDs(updated);
          })
          .catch((err) => console.error("Request failed:", err));
      });
  }

  function handleSendRequest(group, message) {
    const ownerId = group.attributes?.creatorID;
    if (!ownerId) return;
    notifyOwnerAndModeratorsOfPrivateJoinRequest({
      token,
      groupId: group.id,
      creatorId: ownerId,
      requestingUserId: userId,
      message,
    });
  }

  function scrollMyCommunities(direction) {
    const el = myCommunitiesScrollRef.current;
    if (!el) return;
    const card = el.querySelector('.communityCardLink--carousel');
    const cardWidth = card ? card.offsetWidth + 10 : 160;

    // Disable pointer events during scroll
    el.style.pointerEvents = 'none';
    el.scrollBy({ left: direction === "left" ? -cardWidth : cardWidth, behavior: "smooth" });
    setTimeout(() => { el.style.pointerEvents = ''; }, 400);
  }

  const myGroups = groups.filter(
    (g) => joinedGroupIDs.has(String(g.groupID)) || (g.creatorID && g.creatorID === userId)
  );

  const discoverGroups = groups.filter(
    (g) => !joinedGroupIDs.has(String(g.groupID)) && g.creatorID !== userId
  );
  function handleInterestTagClick(tag) {
  setSelectedInterestTags((prev) => {
    if (prev.includes(tag)) {
      return prev.filter((t) => t !== tag);
    }

    if (prev.length >= 3) {
      return prev;
    }

    return [...prev, tag];
  });
}
  const hasReachedTagLimit = selectedInterestTags.length >= 3;
  const interestMatchedGroups = [...groups]
  .filter((group) => !joinedGroupIDs.has(String(group.groupID)))
  .map((group) => {
    const matchCount = group.tags.filter((tag) =>
      selectedInterestTags.includes(tag)
    ).length;

    return {
      ...group,
      matchCount,
    };
  })
  .filter((group) => selectedInterestTags.length === 0 || group.matchCount > 0)
  .sort((a, b) => {
    if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    return a.name.localeCompare(b.name);
  });

  if (!pageReady || !pinnedLoaded) {
    return (
      <div className="feedPage">
        <div className="feedShell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <p style={{ opacity: 0.5, fontSize: "18px" }}>Loading...</p>
        </div>
      </div>
    );
  }
  function handleCloseInterestModal() {
    setShowInterestModal(false);
    sessionStorage.removeItem("justRegistered");
  }
  async function handleEditUploadChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const formData = new FormData();
    formData.append("uploaderID", userId);
    formData.append("attributes", JSON.stringify({ type: "post-attachment" }));
    formData.append("file", file);

    const res = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`, {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
      },
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to upload attachment");

    const data = await res.json();

    setPostAttachmentId(data.id);
    setUpload({
      id: data.id,
      name: file.name,
    });
  } catch (err) {
    console.error("Attachment upload failed:", err);
  }
}
  async function handleSaveEditedPost() {
  const trimmedTitle = postTitle.trim();
  const trimmedContent = postContent.trim();

  const titleError = !trimmedTitle ? "*Please provide a title" : "";
  const contentError = !trimmedContent ? "*Please provide a caption" : "";

  setEditTitleError(titleError);
  setEditContentError(contentError);

  if (titleError || contentError || !postId) return;

  try {
    const existingPost = forYouPosts.find((p) => p.id === postId);
    const existingAttributes = existingPost?.attributes || {};

    const res = await fetch(`${process.env.REACT_APP_API_PATH}/posts/${postId}`, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: trimmedContent,
        attributes: {
          ...existingAttributes,
          title: trimmedTitle,
          attachmentId: postAttachmentId,
          attachmentName: upload?.name || existingAttributes?.attachmentName || null,
        },
      }),
    });

    if (!res.ok) throw new Error("Failed to update post");

    setIsPostModalOpen(false);
    setIsEditing(false);
    setPostId(null);
    setPostTitle("");
    setPostContent("");
    setPostAttachmentId(null);
    setUpload(null);
    setEditTitleError("");
    setEditContentError("");

    fetchForYouPosts(joinedGroupIDsRef.current);
  } catch (err) {
    console.error("Edit post failed:", err);
  }
}
  return (
  <>
    {showInterestModal && (
  <div className="interestModalOverlay">
    <div className="interestModal">
      <button
        className="interestModalSkipBtn"
        onClick={handleCloseInterestModal}
      >
        Continue
      </button>

      <div className="interestModalInner">
        <h1 className="interestModalTitle">Welcome to Herd</h1>
        <p className="interestModalIntro">
          Pick your interests to discover communities you may want to join.
        </p>
        <p className="interestModalHint">
  You can revisit this anytime in Homepage, in the filters icon next to Discover.
</p>

        <div className="interestModalTagBlock">
          <h2 className="interestModalHeading">Choose up to 3 interests</h2>

          {hasReachedTagLimit && (
            <p className="interestModalLimitMessage">
              You can select up to 3 tags. To explore another category,
              deselect one of your current tags first.
            </p>
          )}

          <div className="tagSelector">
            {TAG_OPTIONS.map((tag) => {
              const isSelected = selectedInterestTags.includes(tag);
              const isDisabled = hasReachedTagLimit && !isSelected;

              return (
                <button
                  key={tag}
                  type="button"
                  className={`tagChip ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                  onClick={() => handleInterestTagClick(tag)}
                  disabled={isDisabled}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="interestModalResults">
          <h2 className="interestModalHeading">
            {selectedInterestTags.length === 0
              ? "Suggested communities"
              : "Matching communities"}
          </h2>

          {interestMatchedGroups.length === 0 ? (
            <p className="interestModalEmpty">
              No communities match those interests yet.
            </p>
          ) : (
            <div className="communityList" style={{ marginTop: "12px" }}>
              {interestMatchedGroups.map((group) => (
                <Link
                  key={group.groupID}
                  to={`/community/${group.groupID}`}
                  className="communityCardLink"
                >
                  <CommunityCard
                    group={group}
                    isJoined={joinedGroupIDs.has(String(group.groupID))}
                    onJoin={handleJoin}
                    bannerUrl={bannerMap ? bannerMap[String(group.groupID)] : null}
                    isRequested={requestedGroupIDs.has(String(group.groupID))}
                    onRequest={handleRequestJoinPrivCommunity}
                    onCancelRequest={handleCancelRequest}
                    token={token}
                    userid={userId}
                    pins={pins}
                    setPins={setPins}
                    myPinnedGroups={myPinnedGroups}
                    setMyPinnedGroups={setMyPinnedGroups}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}

    <div className="feedTabsWrapper">

      <div className="feedTabs">
        <button
          className={`feedTabBtn ${activeTab === "communities" ? "active" : ""}`}
          onClick={() => setActiveTab("communities")}
        >
          Communities
        </button>
        <button
          className={`feedTabBtn ${activeTab === "forYou" ? "active" : ""}`}
          onClick={() => {setActiveTab("forYou"); fetchForYouPosts(joinedGroupIDs)}}
        >
          For you
        </button>
        <button
          className={`feedTabBtn ${activeTab === "following" ? "active" : ""}`}
          onClick={() => {setActiveTab("following"); fetchFollowingPosts()}}
        >
          Following
        </button>
      </div>
      <div className="feedTabsDivider" />
    </div>

    <div className="feedPage">
      <div className="feedShell">
        <div className="feedPanel">

          {activeTab === "communities" && (
            <div className="communityTabs">

              {/* MY COMMUNITIES — horizontal scroll */}
              <div className="communitySection">
                <div className="communitySectionHeader">
                  <h2>My Communities</h2>
                  <Link to="/create-community">
                    <button className="feedPrimaryBtn">+ Create Community</button>
                  </Link>
                </div>

                {myGroups.length === 0 ? (
                  <EmptyState
                    title="You're not in any communities yet"
                    subtitle="Create one to get started."
                  />
                ) : (
                  <>
                    {pinnedLoaded && (
                      <>
                        {/* Horizontal carousel */}
                        <div className="communityCarouselWrapper">
                          <button
                            className="carouselArrow carouselArrow--left"
                            onClick={() => scrollMyCommunities("left")}
                            aria-label="Scroll left"
                          >
                            ‹
                          </button>

                          <div
                            className="communityCarousel"
                            ref={myCommunitiesScrollRef}
                          >
                            {myPinnedGroups.map((group) => (
                              <Link
                                key={group.groupID}
                                to={`/community/${group.groupID}`}
                                className="communityCardLink communityCardLink--carousel"
                              >
                                <CommunityCard
                                  group={group}
                                  isJoined={joinedGroupIDs.has(String(group.groupID))}
                                  onJoin={handleJoin}
                                  bannerUrl={bannerMap ? bannerMap[String(group.groupID)] : null}
                                  isRequested={requestedGroupIDs.has(String(group.groupID))}
                                  onRequest={handleRequestJoinPrivCommunity}
                                  onCancelRequest={handleCancelRequest}
                                  token={token}
                                  userid={userId}
                                  pins={pins}
                                  setPins={setPins}
                                  myPinnedGroups={myPinnedGroups}
                                  setMyPinnedGroups={setMyPinnedGroups}
                                />
                              </Link>
                            ))}
                            {myGroups
                              .filter((group) => (!(pins.includes(group.groupID))))
                              .map((group) => (
                              <Link
                                key={group.groupID}
                                to={`/community/${group.groupID}`}
                                className="communityCardLink communityCardLink--carousel"
                              >
                                <CommunityCard
                                  group={group}
                                  isJoined={joinedGroupIDs.has(String(group.groupID))}
                                  onJoin={handleJoin}
                                  bannerUrl={bannerMap ? bannerMap[String(group.groupID)] : null}
                                  isRequested={requestedGroupIDs.has(String(group.groupID))}
                                  onRequest={handleRequestJoinPrivCommunity}
                                  onCancelRequest={handleCancelRequest}
                                  token={token}
                                  userid={userId}
                                  pins={pins}
                                  setPins={setPins}
                                  myPinnedGroups={myPinnedGroups}
                                  setMyPinnedGroups={setMyPinnedGroups}
                                />
                              </Link>
                            ))}
                          </div>

                          <button
                            className="carouselArrow carouselArrow--right"
                            onClick={() => scrollMyCommunities("right")}
                            aria-label="Scroll right"
                          >
                            ›
                          </button>
                        </div>

                        {/* View all toggle */}
                        {myGroups.length > 5 && (
                          <div className="communityViewAllRow">
                            <button
                              className="communityViewAllBtn"
                              onClick={() => setShowAllMyCommunities(prev => !prev)}
                            >
                              {showAllMyCommunities ? "Show less ▲" : `View all ${myGroups.length} communities ▼`}
                            </button>
                          </div>
                        )}

                        {/* Expanded grid when "view all" is open */}
                        {showAllMyCommunities && (
                          <div className="communityList" style={{ marginTop: "16px" }}>
                            {myPinnedGroups.map((group) => (
                                <Link
                                  key={group.groupID}
                                  to={`/community/${group.groupID}`}
                                  className="communityCardLink"
                                >
                                  <CommunityCard
                                    group={group}
                                    isJoined={joinedGroupIDs.has(String(group.groupID))}
                                    onJoin={handleJoin}
                                    bannerUrl={bannerMap ? bannerMap[String(group.groupID)] : null}
                                    isRequested={requestedGroupIDs.has(String(group.groupID))}
                                    onRequest={handleRequestJoinPrivCommunity}
                                    onCancelRequest={handleCancelRequest}
                                    token={token}
                                    userid={userId}
                                    pins={pins}
                                    setPins={setPins}
                                    myPinnedGroups={myPinnedGroups}
                                    setMyPinnedGroups={setMyPinnedGroups}
                                  />
                                </Link>
                            ))}
                            {myGroups
                              .filter((group) => (!(pins.includes(group.groupID))))
                              .map((group) => (
                                <Link
                                  key={group.groupID}
                                  to={`/community/${group.groupID}`}
                                  className="communityCardLink"
                                >
                                  <CommunityCard
                                    group={group}
                                    isJoined={joinedGroupIDs.has(String(group.groupID))}
                                    onJoin={handleJoin}
                                    bannerUrl={bannerMap ? bannerMap[String(group.groupID)] : null}
                                    isRequested={requestedGroupIDs.has(String(group.groupID))}
                                    onRequest={handleRequestJoinPrivCommunity}
                                    onCancelRequest={handleCancelRequest}
                                    token={token}
                                    userid={userId}
                                    pins={pins}
                                    setPins={setPins}
                                    myPinnedGroups={myPinnedGroups}
                                    setMyPinnedGroups={setMyPinnedGroups}
                                  />
                                </Link>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* DISCOVER — unchanged grid */}
              <div className="communitySection">
                <div className="communitySectionHeader">
                  <h2>Discover</h2>

                  <img
                    src={filterIcon}
                    alt="filter"
                    className="discoverFilterIcon"
                    onClick={() => setShowInterestModal(true)}
                  />
                </div>
                {discoverGroups.length === 0 ? (
                  <EmptyState
                    title="No communities to discover yet"
                    subtitle="New communities will appear here."
                  />
                ) : (
                  <CommunityList
                    groups={discoverGroups}
                    joinedGroupIDs={joinedGroupIDs}
                    onJoin={handleJoin}
                    bannerMap={bannerMap}
                    requestedGroupIDs={requestedGroupIDs}
                    onRequest={handleRequestJoinPrivCommunity}
                    onCancelRequest={handleCancelRequest}
                    token={token}
                    userid={userId}
                    pins={pins}
                    setPins={setPins}
                    myPinnedGroups={myPinnedGroups}
                    setMyPinnedGroups={setMyPinnedGroups}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === "forYou" && (
            <div className="forYouFeed">
              {forYouLoading ? (
                <div className="feedEmptyCard">Loading posts...</div>
              ) : forYouPosts.length === 0 ? (
                <EmptyState
                  title="Nothing here yet"
                  subtitle="Join communities and their posts will appear here."
                />
              ) : (
                forYouPosts.map((post) => {
                  const community = groups.find(
                    (g) => String(g.groupID) === String(post.recipientGroupID)
                  );
                  return (
                      <PostCard
                        key={post.id}
                        post={post}
                        community={community}
                        groupID={post.recipientGroupID}
                        setIsPostModalOpen={setIsPostModalOpen}
                        setPostId={setPostId}
                        setPostTitle={setPostTitle}
                        setPostContent={setPostContent}
                        setPostAttachmentId={setPostAttachmentId}
                        setUpload={setUpload}
                        setIsEditing={setIsEditing}
                      />
                  );
                })
              )}
            </div>
          )}

            {activeTab === "following" && (
                <div className="forYouFeed">
                    {followingLoading ? (
                        <div className="feedEmptyCard">Loading posts...</div>
                    ) : followingPosts.length === 0 ? (
                        <EmptyState
                            title="No posts from people you follow"
                            subtitle="Follow people to see their posts here."
                        />
                    ) : (
                        followingPosts.map((post) => {
                            const community = groups.find(
                                (g) => String(g.groupID) === String(post.recipientGroupID)
                            );
                            return <PostCard key={post.id} post={post} community={community} groupID={community?.groupID} showFollow={false} />;
                        })
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
    {isPostModalOpen && (
  <div
    className="postModalOverlay"
    onClick={() => {
      setIsPostModalOpen(false);
      setIsEditing(false);
      setEditTitleError("");
      setEditContentError("");
    }}
  >
    <div className="postModalBox" onClick={(e) => e.stopPropagation()}>
      <h3 className="postModalTitle">Edit your post</h3>

      <input
        type="text"
        className={`postModalInput ${editTitleError ? "postModalInputError" : ""}`}
        value={postTitle}
        maxLength={100}
        onChange={(e) => {
          setPostTitle(e.target.value);
          if (e.target.value.trim()) setEditTitleError("");
        }}
        placeholder="Title"
      />
      <div className="postModalMetaRow">
        <div className="postModalErrorText">{editTitleError}</div>
        <div className="postModalCharCount">{postTitle.length}/100</div>
      </div>

      <textarea
        className={`postModalTextarea ${editContentError ? "postModalInputError" : ""}`}
        value={postContent}
        maxLength={500}
        onChange={(e) => {
          setPostContent(e.target.value);
          if (e.target.value.trim()) setEditContentError("");
        }}
        placeholder="What's on your mind?"
      />
      <div className="postModalMetaRow">
        <div className="postModalErrorText">{editContentError}</div>
        <div className="postModalCharCount">{postContent.length}/500</div>
      </div>

      <div className="postModalUploadRow">
        <label className="postModalUploadBtn">
          <input
            type="file"
            className="postModalHiddenFileInput"
            onChange={handleEditUploadChange}
          />
          ⤴ Upload
        </label>
        <span className="postModalFileName">
          {upload?.name || "No File selected"}
        </span>
      </div>

      <div className="postModalActions">
        <button
          className="postModalCancelBtn"
          onClick={() => {
            setIsPostModalOpen(false);
            setIsEditing(false);
            setEditTitleError("");
            setEditContentError("");
          }}
        >
          Cancel
        </button>

        <button
          className="postModalSaveBtn"
          onClick={handleSaveEditedPost}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}
  </>
);
}

function CommunityCard({ group, isJoined, onJoin, bannerUrl, isRequested, onRequest, onCancelRequest, token, userid, pins, setPins, myPinnedGroups, setMyPinnedGroups }) {
  const groupid = group.groupID;
  // const [showMenu, setShowMenu] = useState(false);
  const [isPinned, setIsPinned] = useState(pins.includes(groupid));

  function addPin() {
    fetch(process.env.REACT_APP_API_PATH + "/users/" + userid, { method: "GET" })
      .then((res) => res.json())
      .then((user) => {
        const prevPins = user.attributes?.pinnedCommunities || [];
        if (!(prevPins.includes(groupid))) {
          fetch(process.env.REACT_APP_API_PATH + "/users/" + userid, {
            method: "PATCH",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({
              attributes: {
                ...user.attributes,
                pinnedCommunities: [groupid, ...prevPins],
              }
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              setIsPinned(true);
              setPins(data.attributes.pinnedCommunities);
              setMyPinnedGroups([group, ...myPinnedGroups]);
            })
            .catch((err) => console.error("Request failed:", err));
        }
      });
  }

  function removePin() {
    fetch(process.env.REACT_APP_API_PATH + "/users/" + userid, { method: "GET" })
      .then((res) => res.json())
      .then((user) => {
        const newPins = (user.attributes?.pinnedCommunities || []).filter((e) => e != groupid);
        fetch(process.env.REACT_APP_API_PATH + "/users/" + userid, {
          method: "PATCH",
          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
          body: JSON.stringify({
            attributes: {
              ...user.attributes,
              pinnedCommunities: newPins,
            }
          }),
        })
          .then((res) => res.json())
          .then((group) => {
            setIsPinned(false);
            setPins(group.attributes?.pinnedCommunities || []);
            setMyPinnedGroups(myPinnedGroups.filter((g) => (!(g.groupID == groupid))));
          })
          .catch((err) => console.error("Request failed:", err));
      });
  }

  return (
    <div className="communityCard">
      <div
        className="communityThumbnail"
        style={{
          backgroundColor: bannerUrl ? undefined : group.color,
        }}
      >
        {bannerUrl && (
          <img
            src={bannerUrl}
            alt={`${group.name} banner`}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
      </div>

      <div className="communityCardContent">
        <div className="communityCardMeta">
          <h2>{group.name}</h2>
          <div className="communityCardRight">
            {group.isPrivate ? (
              !isJoined && (
                !isRequested ? (
                  <button className="joinBtn" onClick={(e) => { e.preventDefault(); onRequest(group.groupID); }}>+ Request</button>
                ) : (
                  <button className="requestedBtn" onClick={(e) => { e.preventDefault(); onCancelRequest(group.groupID); }}>Requested</button>
                )
              )
            ) : (
              !isJoined && (
                <button className="joinBtn" onClick={(e) => { e.preventDefault(); onJoin(group.groupID); }}>
                  + Join
                </button>
              )
            )}
            <p>{group.isPrivate ? "Private" : "Public"}</p>
          </div>
        </div>

        <div className="communityCardDivider" />

        <div>
          <div className="communityTags">
            {group.tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>

          {isJoined && (
            <>
            {isPinned ? (
              // <button className="pinned" type="button" onClick={(e) => {e.preventDefault(); removePin();}}>
              //   Pinned
              // </button>
              <button type="button" onClick={(e) => {e.preventDefault(); removePin();}}>
                <img className="pinFilled" src={pinIcon}></img>
              </button>
              // <button className="makeFilledStar" type="button" onClick={(e) => {e.preventDefault(); removePin();}}></button>
            ) : (
              // <button className="unpinned" type="button" onClick={(e) => {e.preventDefault(); addPin();}}>
              //   Unpinned
              // </button>
              // <button
              // <button className="makeUnfilledStar" type="button" onClick={(e) => {e.preventDefault(); addPin();}}></button>
              <button type="button" onClick={(e) => {e.preventDefault(); addPin();}}>
                <img className="pinUnfilled" src={pinIcon}></img>
              </button>
              // <button type="button" onClick={(e) => {e.preventDefault(); addPin();}}>
              //   <img className="pin" src={pinIcon}></img>
              // </button>
            )}
            </>
          )}

          {/* <button
            className="pinMenuBtn"
            type="button"
            onClick={(e) => {e.preventDefault(); setShowMenu(!showMenu);}}
          >
            •••
          </button>

          {showMenu && (
            <>
                <div className="pinMenuPanel">
                  <button
                    type="button"
                    className="pinMenuOption"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowMenu(false);
                    }}
                  >
                    Pin
                  </button>
                </div>
            </>
          )} */}
        </div>
      </div>
    </div>
  );
}

function CommunityList({ groups, joinedGroupIDs, onJoin, bannerMap, requestedGroupIDs, onRequest, onCancelRequest, token, userid, pins, setPins, myPinnedGroups, setMyPinnedGroups }) {
  if (!groups || groups.length === 0) return null;
  return (
    <div className="communityList">
      {groups.map((group) => (
        <Link
          key={group.groupID}
          to={`/community/${group.groupID}`}
          className="communityCardLink"
        >
          <CommunityCard
            group={group}
            isJoined={joinedGroupIDs.has(String(group.groupID))}
            onJoin={onJoin}
            bannerUrl={bannerMap ? bannerMap[String(group.groupID)] : null}
            isRequested={requestedGroupIDs.has(String(group.groupID))}
            onRequest={onRequest}
            onCancelRequest={onCancelRequest}
            token={token}
            userid={userid}
            pins={pins}
            setPins={setPins}
            myPinnedGroups={myPinnedGroups}
            setMyPinnedGroups={setMyPinnedGroups}
          />
        </Link>
      ))}
    </div>
  );
}

function EmptyState({ title, subtitle }) {
  return (
    <div className="feedEmptyCard">
      <div className="feedEmptyIcon">∅</div>
      <h2 className="feedEmptyTitle">{title}</h2>
      <p className="feedEmptySubtitle">{subtitle}</p>
      <div className="feedEmptyActions">
        <Link to="/create-community" className="feedLinkBtn">
          <button className="feedGhostBtn">Create first community</button>
        </Link>
      </div>
    </div>
  );
}
