import React, { useEffect, useRef, useState } from "react";
import "../styles/CommunityPage.css";
import PostCard from "./Postcard";
import EditCommunityMenu from "./EditCommunityMenu";
import EditCommunityModal from "./EditCommunityModal";
import { EditChannelsModal } from "components/settings-page/modals/EditChannelsModal.jsx";
import ManageModeratorsModal from "./ManageModeratorsModal";
import TransferOwnershipModal from "./TransferOwnershipModal";
import CommunityRules from "./CommunityRules";
import { BaseSideBar, BaseSideBarItem } from "components/settings-page/base/BaseSideBar.jsx";
import { useParams, useNavigate } from "react-router-dom";
import isPrivate from "utilities/isPrivate.js"
import { mergePostsReactionsOnly } from "utilities/mergePostReactions";
import { getMemberRoleLabel, isModeratorMember } from "utilities/communityRoles";
import { getOwnershipTransferCandidates, transferCommunityOwnership } from "utilities/communityOwnership";
import { deleteCommunityAndPosts } from "utilities/deleteCommunity";
import { notifyOwnerAndModeratorsOfPublicJoin } from "utilities/notifyPublicCommunityJoin";
import { notifyOwnerAndModeratorsOfPrivateJoinRequest } from "utilities/notifyPrivateCommunityJoinRequest";
import * as Config from "config.js";
import {
  POST_ATTACHMENT_ACCEPT,
  validatePostAttachmentFile,
} from "utilities/postAttachmentUpload";
import emptyStar from 'assets/star-empty.png';
import halfStar from 'assets/star-half.png';
import fullStar from 'assets/star-full.png';
import searchIcon from "assets/search-icon.png";

import uploadIcon from "assets/upload-icon-alt-light.png";
import discardIcon from "assets/close-icon-dark.png";
import PostAudioPlayer from "./PostAudioPlayer";
import KickedCommunityView from "./KickedCommunityView";
import { useTranslation } from 'react-i18next';

const MAX_TITLE = 100;
const MAX_BODY = 500;
const MAX_POLL_CHOICE = 45;

export default function CommunityPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { groupID } = useParams();
  const [user, setUser] = useState(null);

  const [group, setGroup] = useState(null);
  const [error, setError] = useState("");

  const [bannerImage, setBannerImage] = useState(null);
  const [communitySongUrl, setCommunitySongUrl] = useState("");

  const [members, setMembers] = useState([]);
  const [showMembers, setShowMembers] = useState(false);
  const [showKicked, setShowKicked] = useState(false);
  const [showSideBar, setShowSideBar] = useState(false);
  const [showModeratorsModal, setShowModeratorsModal] = useState(false);
  const [showEditCommunityModal, setShowEditCommunityModal] = useState(false);
  const [showEditChannelsModal, setShowEditChannelsModal] = useState(false);
  const [showTransferOwnershipModal, setShowTransferOwnershipModal] = useState(false);
  const [showTransferOwnershipErrorModal, setShowTransferOwnershipErrorModal] = useState(false);
  const [showTransferOwnershipSuccessModal, setShowTransferOwnershipSuccessModal] = useState(false);
  const [showOwnerLeaveBlockedModal, setShowOwnerLeaveBlockedModal] = useState(false);
  const [showDeleteCommunityModal, setShowDeleteCommunityModal] = useState(false);
  const [isDeletingCommunity, setIsDeletingCommunity] = useState(false);
  const [deleteCommunityError, setDeleteCommunityError] = useState("");
  const deleteModalRef = useRef(null);
  const [transferOwnershipCandidates, setTransferOwnershipCandidates] = useState([]);
  const [selectedTransferOwnerId, setSelectedTransferOwnerId] = useState("");
  const membersRef = useRef(null);
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);

  // Accessibility: Focus management for Delete Community Modal
  useEffect(() => {
    if (showDeleteCommunityModal && deleteModalRef.current) {
      deleteModalRef.current.focus();

      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !isDeletingCommunity) {
          setShowDeleteCommunityModal(false);
        }
        if (e.key === "Tab") {
          const focusableElements = deleteModalRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showDeleteCommunityModal, isDeletingCommunity]);

  const [posts, setPosts] = useState([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isKicked, setIsKicked] = useState(false);
  const [isRequested, setIsRequested] = useState(false);
  const [membershipId, setMembershipId] = useState(null);

  const [isPostClicked, setIsPostClicked] = useState(false);
  const postOptionsRef = useRef(null);

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postId, setPostId] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [postContent, setPostContent] = useState("");
  const [postAttachmentId, setPostAttachmentId] = useState("");
  const [questionContent, setQuestionContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [pollOptionsCount, setPollOptionsCount] = useState(3);
  const [numPollOptions, setNumPollOptions] = useState([]);
  const [pollInputs, setPollInputs] = useState(['','','','','','','','','','']);

  const [isRankingModalOpen, setIsRankingModalOpen] = useState(false);
  const [rankingInputs, setRankingInputs] = useState(['','','','','','','','','','']);
  const [dragIndex, setDragIndex] = useState(null);
  const [isEditingRanking, setIsEditingRanking] = useState(true);
  const [rankingItemsCount, setRankingItemsCount] = useState(2);

  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [ratingInputs, setRatingInputs] = useState(['','','','','','','','','','']);
  const [ratingValues, setRatingValues] = useState([-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]);

  const [showPostMessageError, setShowPostMessageError] = useState(false);
  const [showTypeMessageError, setShowTypeMessageError] = useState(false);

  const [upload, setUpload] = useState(null);
  const [uploadURL, setUploadURL] = useState("");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploadValid, setUploadValid] = useState(false);

  const searchquery = window.location.href.split("?")[1]?.split("=")[1] || '';
  const [searchValue, setSearchValue] = useState(searchquery);

  const [showEditRulesModal, setShowEditRulesModal] = useState(false);
  const [ruleInputs, setRuleInputs] = useState(['','','','','','','','','','','','','','','','','','','','']);
  const rulesModalRef = useRef(null);

  const [channels, setChannels] = useState(["All"]);
  const [currentChannel, setCurrentChannel] = useState(null);
  
  const imageUploadMinSize = Config.MIN_IMAGE_SIZE;
  const imageUploadMaxSize = Config.MAX_IMAGE_SIZE;
  const videoUploadMinSize = Config.MIN_VIDEO_SIZE;
  const videoUploadMaxSize = Config.MAX_VIDEO_SIZE;
  const audioUploadMinSize = Config.MIN_AUDIO_SIZE;
  const audioUploadMaxSize = Config.MAX_AUDIO_SIZE;

  const token = sessionStorage.getItem("user-token");
  const userId = String(sessionStorage.getItem("user"));

  // Accessibility: Focus management for Post Options Popup
  useEffect(() => {
    if (isPostClicked && postOptionsRef.current) {
      // Check if a tutorial modal is currently active in the DOM
      const isTutorialActive = !!document.querySelector('.tutorial-modal');

      if (!isTutorialActive) {
        const focusable = postOptionsRef.current.querySelector('button');
        focusable?.focus();
      }

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          setIsPostClicked(false);
        }
        if (e.key === "Tab") {
          const focusableElements = postOptionsRef.current.querySelectorAll('button');
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isPostClicked]);

  // Accessibility: Focus management for Edit Rules Modal
  useEffect(() => {
    if (showEditRulesModal && rulesModalRef.current) {
      rulesModalRef.current.focus();

      const handleKeyDown = (e) => {
        if (e.key === "Escape" && !isPosting) {
          closeModal();
        }
        if (e.key === "Tab") {
          const focusableElements = rulesModalRef.current.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const first = focusableElements[0];
          const last = focusableElements[focusableElements.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [showEditRulesModal, isPosting]);

  // Close members popup when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      // Ignore clicks if they are on tutorial elements
      if (e.target.closest('.tutorial-modal') || e.target.closest('.tutorial-button')) {
        return;
      }

      if (membersRef.current && !membersRef.current.contains(e.target)) {
        setShowMembers(false);
      }
      if (postOptionsRef.current && !postOptionsRef.current.contains(e.target)) {
        setIsPostClicked(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!groupID) return;
    getUser();
    fetchCommunity();
    fetchBlockedUsers();
    fetchPosts();
    checkMembership();
    getRequested();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupID]);

  // While the tab is visible: poll reactions lightly. When returning to this tab/window, re-sync
  // membership, group, requests, blocks, and posts so changes from other tabs/sessions show up.
  useEffect(() => {
    if (!groupID) return;

    let debounceTimer = null;

    const refreshReactionsOnly = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      fetchPosts({ silent: true, updateOnlyReactions: true, channel: currentChannel });
    };

    const syncFromServer = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      checkMembership();
      fetchCommunity();
      getRequested();
      fetchBlockedUsers();
      fetchPosts({ silent: true, updateOnlyReactions: false, channel: currentChannel });
    };

    const scheduleFullSync = () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      if (debounceTimer != null) window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        debounceTimer = null;
        syncFromServer();
      }, 150);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") scheduleFullSync();
    };
    const onFocus = () => scheduleFullSync();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    const reactionsIntervalId = window.setInterval(refreshReactionsOnly, 1500);
    const fullSyncIntervalId = window.setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      syncFromServer();
    }, 12000);

    return () => {
      if (debounceTimer != null) window.clearTimeout(debounceTimer);
      window.clearInterval(reactionsIntervalId);
      window.clearInterval(fullSyncIntervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupID, currentChannel]);

  function fetchBlockedUsers() {
    const token = sessionStorage.getItem("user-token");
    const activeUserId = sessionStorage.getItem("user");

    // 1. Blocks initiated by the logged-in user
    const paramsA = new URLSearchParams({
      fromUserID: activeUserId,
      attributes: JSON.stringify({ path: "type", equals: "block" })
    });

    // 2. Blocks targeting the logged-in user
    const paramsB = new URLSearchParams({
      toUserID: activeUserId,
      attributes: JSON.stringify({ path: "type", equals: "block" })
    });

    Promise.all([
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
          setBlockedUserIds(allBlockedIds);
        })
        .catch((err) => console.error("Blocked users load failed:", err));
  }

  function fetchCommunity() {
  fetch(process.env.REACT_APP_API_PATH + "/groups/" + groupID, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      "Content-Type": "application/json",
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error("Request failed");
      return res.json();
    })
    .then((data) => {
      setGroup({
        id: data.id,
        name: data.name,
        attributes: data.attributes || {},
        tags: data.attributes?.tags || [],
        color: data.attributes?.color || "#888",
        visibility: data.attributes?.visibility || "public",
        creatorID: data.attributes?.creatorID || data.creatorID,
      });
      
      setChannels(data.attributes?.channels || []);

      const creatorID = data.attributes?.creatorID || data.creatorID;
      if (creatorID) fetchCommunityMedia();
      else {
        setBannerImage(null);
        setCommunitySongUrl("");
      }
    })
    .catch((err) => {
      console.error("Community fetch error:", err);
      setError(t("communityPage.error.failedToLoad"));
    });
}

  function fetchCommunityMedia() {
    fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`)
      .then((res) => res.json())
      .then((data) => {
        const files = data[0] || [];
        if (!Array.isArray(files)) return;

        const bannerCandidates = files.filter(
          (file) =>
            file.attributes &&
            file.attributes.type === "communityBanner" &&
            String(file.attributes.groupID) === String(groupID)
        );

        const bannerFile = bannerCandidates.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];

        if (bannerFile) {
          setBannerImage(process.env.REACT_APP_API_PATH_SOCKET + bannerFile.path);
        } else {
          setBannerImage(null);
        }

        const songCandidates = files.filter(
          (file) =>
            file.attributes &&
            file.attributes.type === "communitySong" &&
            String(file.attributes.groupID) === String(groupID)
        );
        const songFile = songCandidates.sort((a, b) => Number(b.id || 0) - Number(a.id || 0))[0];
        if (songFile) {
          setCommunitySongUrl(process.env.REACT_APP_API_PATH_SOCKET + songFile.path);
        } else {
          setCommunitySongUrl("");
        }
      })
      .catch((err) => {
        console.error("Community media load failed:", err);
        setCommunitySongUrl("");
      });
  }
  
  async function fetchPosts(options = {}) {
    const {
        silent = false,
        updateOnlyReactions = false,
        channel = currentChannel,
    } = options;

    if (!silent) setPostsLoading(true);
    try {
      let query = `recipientGroupID=${groupID}`;      
      if (channel) {
        const attributes = {
          path: "channel",
          equals: channel,
        };
        query += `&attributes=${encodeURIComponent(JSON.stringify(attributes))}`
      }
      const url = `${process.env.REACT_APP_API_PATH}/posts?${query}`;
      const response = await fetch(url, {
          headers: {
            Authorization: "Bearer " + token
          },
        }
      );
      const data = await response.json();
      const postData = data[0] || [];

      // checking if post is private
      const visiblePosts = await Promise.all(
        postData.map(async (post) => {
          return (await isPrivate(userId, post.authorID)) ? null : post;
        })
      );

      const nextPosts = visiblePosts.filter(Boolean);

      const sq = window.location.href.split("?")[1]?.split("=")[1] || '';
      if (sq != '') {
        const postsFilteredByUsers = nextPosts.filter((e) => e.author?.attributes?.username.toLowerCase().includes(sq.toLowerCase()));
        
        if (!updateOnlyReactions) {
          setPosts(postsFilteredByUsers);
        } else {
          setPosts((prev) =>
            mergePostsReactionsOnly(Array.isArray(prev) ? prev : [], postsFilteredByUsers)
          );
        }
      } else {
        if (!updateOnlyReactions) {
          setPosts(nextPosts);
        } else {
          setPosts((prev) =>
            mergePostsReactionsOnly(Array.isArray(prev) ? prev : [], nextPosts)
          );
        }
      }

    } catch (err) {
      console.error("Posts load failed:", err);
    } finally {
      if (!silent) setPostsLoading(false);
    }
  }

  function checkMembership() {
    fetch(process.env.REACT_APP_API_PATH + "/group-members?groupID=" + groupID, {
      headers: { Authorization: "Bearer " + token },
    })
      .then((res) => res.json())
      .then((data) => {
        const memberships = data[0] || [];
        setMembers(memberships);

        const record = memberships.find(
          (m) => String(m.userID) === userId && String(m.groupID) === String(groupID)
        );

        if (record) {
          const kicked = record.attributes?.role === "kicked";
          setIsKicked(kicked);
          setIsJoined(!kicked);
          setMembershipId(record.id);
        } else {
          setIsKicked(false);
          setIsJoined(false);
          setMembershipId(null);
        }
      })
      .catch((err) => console.error("Membership check failed:", err));
  }

  function getDisplayName(member) {
    if (member?.user?.attributes) {
      return member.user.attributes.screenname || member.user.attributes.username || `User ${member.userID}`;
    }
    return `User ${member?.userID}`;
  }

  function getCurrentMembership() {
    return members.find(
      (member) => String(member.userID) === userId && String(member.groupID) === String(groupID)
    ) || null;
  }

  async function handleTransferOwnership() {
    if (!isOwner) return;

    let freshMembers = members;
    let creatorIdForCandidates = group?.creatorID;

    try {
      const [memRes, grpRes] = await Promise.all([
        fetch(process.env.REACT_APP_API_PATH + "/group-members?groupID=" + groupID, {
          headers: { Authorization: "Bearer " + token },
        }),
        fetch(process.env.REACT_APP_API_PATH + "/groups/" + groupID, {
          method: "GET",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!memRes.ok || !grpRes.ok) {
        window.alert("Could not load an up-to-date member list. Please try again.");
        return;
      }

      const memData = await memRes.json();
      freshMembers = memData[0] || [];
      setMembers(freshMembers);

      const grpData = await grpRes.json();
      creatorIdForCandidates = grpData.attributes?.creatorID || grpData.creatorID;
      setGroup((prev) => (prev ? { ...prev, creatorID: creatorIdForCandidates } : prev));
    } catch (err) {
      console.error("Transfer ownership prefetch failed:", err);
      window.alert("Could not load an up-to-date member list. Please try again.");
      return;
    }

    if (String(creatorIdForCandidates) !== String(userId)) {
      window.alert(
        "You are no longer listed as the owner. Please refresh the page for the latest state."
      );
      checkMembership();
      return;
    }

    const candidates = getOwnershipTransferCandidates(freshMembers, creatorIdForCandidates);
    if (candidates.length === 0) {
      setShowTransferOwnershipErrorModal(true);
      return;
    }

    setTransferOwnershipCandidates(candidates);
    setSelectedTransferOwnerId("");
    setShowTransferOwnershipModal(true);
  }

  async function handleConfirmTransferOwnership() {
    if (!isOwner || !selectedTransferOwnerId) return;

    try {
      const result = await transferCommunityOwnership({
        groupID,
        creatorID: group?.creatorID,
        currentUserId: userId,
        members,
        token,
        newOwnerUserId: selectedTransferOwnerId,
      });

      if (!result.ok) {
        if (result.reason === "no-moderators") {
          setShowTransferOwnershipErrorModal(true);
        } else if (result.reason === "invalid-selection") {
          window.alert("Invalid selection.");
        } else if (result.reason === "member-left") {
          window.alert(
            "That person is no longer a member of this community. The member list was updated — please pick someone who is still here."
          );
          setShowTransferOwnershipModal(false);
          setTransferOwnershipCandidates([]);
          setSelectedTransferOwnerId("");
          checkMembership();
          fetchCommunity();
        } else if (result.reason === "not-owner") {
          window.alert(
            "You are no longer listed as the owner. Please refresh the page for the latest state."
          );
          setShowTransferOwnershipModal(false);
          setTransferOwnershipCandidates([]);
          setSelectedTransferOwnerId("");
          checkMembership();
          fetchCommunity();
        }
        return;
      }

      setShowTransferOwnershipModal(false);
      setTransferOwnershipCandidates([]);
      setSelectedTransferOwnerId("");
      setShowTransferOwnershipSuccessModal(true);
      fetchCommunity();
      checkMembership();
    } catch (err) {
      console.error("Ownership transfer failed:", err);
      window.alert("Failed to transfer ownership. Please try again.");
    }
  }

  function handleJoin() {
    fetch(process.env.REACT_APP_API_PATH + "/group-members", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        userID: Number(userId),
        groupID: Number(groupID),
        attributes: {},
      }),


    })
      .then((res) => res.json())
      .then((data) => {
        setIsJoined(true);
        setMembershipId(data.id);
        checkMembership(); // refresh members list immediately
        if (group?.visibility === "public" && group?.creatorID) {
          notifyOwnerAndModeratorsOfPublicJoin({
            token,
            groupId: groupID,
            communityName: group.name,
            creatorId: group.creatorID,
            joiningUserId: userId,
          });
        }
      })
      .catch((err) => console.error("Join failed:", err));
  }

  function handleLeave() {
    if (isOwner) {
      setShowOwnerLeaveBlockedModal(true);
      return;
    }

    if (!membershipId) return;

    fetch(process.env.REACT_APP_API_PATH + "/group-members/" + membershipId, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
    })
      .then(() => {
        setIsJoined(false);
        setMembershipId(null);
        checkMembership(); // refresh members list immediately
      })
      .catch((err) => console.error("Leave failed:", err));
    
    fetch(process.env.REACT_APP_API_PATH + "/users/" + userId, { method: "GET" })
    .then((res) => res.json())
    .then((user) => {
      const newPins = (user.attributes?.pinnedCommunities || []).filter((e) => e != groupID);
      fetch(process.env.REACT_APP_API_PATH + "/users/" + userId, {
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
        .catch((err) => console.error("Request failed:", err));
    });
  }

  async function handleConfirmDeleteCommunity() {
    if (!group || String(group.creatorID) !== userId || !token || !groupID) return;
    setDeleteCommunityError("");
    setIsDeletingCommunity(true);
    try {
      await deleteCommunityAndPosts({ groupID, token });

      try {
        const userRes = await fetch(process.env.REACT_APP_API_PATH + "/users/" + userId, { method: "GET" });
        if (userRes.ok) {
          const user = await userRes.json();
          const newPins = (user.attributes?.pinnedCommunities || []).filter(
            (e) => String(e) !== String(groupID)
          );
          await fetch(process.env.REACT_APP_API_PATH + "/users/" + userId, {
            method: "PATCH",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({
              attributes: {
                ...user.attributes,
                pinnedCommunities: newPins,
              },
            }),
          });
        }
      } catch (e) {
        console.error("Pin update failed:", e);
      }

      setShowDeleteCommunityModal(false);
      navigate("/home");
    } catch (err) {
      console.error("Delete community failed:", err);
      setDeleteCommunityError(t("communityPage.deleteCommunityModal.error"));
    } finally {
      setIsDeletingCommunity(false);
    }
  }

  function handleKick(membership) {
    if (!membership?.id) return;

    fetch(process.env.REACT_APP_API_PATH + "/group-members/" + membership.id, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        attributes: {
          ...membership.attributes,
          role: "kicked"
        }
      })
    })
        .then((res) => {
          if (!res.ok) throw new Error("Kick failed");
          checkMembership(); // refresh members list
        })
        .catch((err) => console.error("Kick error:", err));
  }

  function handleUnkick(membership) {
    if (!membership?.id) return;

    fetch(process.env.REACT_APP_API_PATH + "/group-members/" + membership.id, {
      method: "PATCH",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        attributes: {
          ...membership.attributes,
          role: "member" // or remove the role attribute
        }
      })
    })
        .then((res) => {
          if (!res.ok) throw new Error("Unkick failed");
          checkMembership();
        })
        .catch((err) => console.error("Unkick error:", err));
  }

  function handleCreatePost() {
    if (!postContent.trim()) {
      setShowPostMessageError(true);
    } else {
      setShowPostMessageError(false);
    }
    if (!postContent.trim()) return;
    setIsPosting(true);

    uploadFile()
      .then((fileData) => {
        if (fileData === false) {
          setIsPosting(false);
          return Promise.reject("Failed to upload file");
        }

        return fetch(process.env.REACT_APP_API_PATH + "/posts", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorID: Number(userId),
          recipientGroupID: Number(groupID),
          content: postContent.trim(),
          attributes: {
            type: "standard",
            title: postTitle.trim(),
            attachmentId: fileData[0],
            attachmentName: fileData[1],
            channel: currentChannel,
          },
        }),
      });
    })
    .then((res) => {
      if (!res.ok) throw new Error("Post creation failed");
      return res.json();
    })
    .then(() => {
      closeModal();
      setIsPosting(false);
      fetchPosts();
    })
    .catch((err) => {
      console.error("Post creation error:", err);
      setIsPosting(false);
    });
  }

  function handleEditPost() {
    if (!postContent.trim()) {
      setShowPostMessageError(true);
    } else {
      setShowPostMessageError(false);
    }
    if (!postContent.trim()) return;
    setIsPosting(true);

    const postType = posts.find(p => p.id === postId)?.attributes?.type || "standard";
    const isSpecialPost = ["poll", "ranking", "rating"].includes(postType);

    const performPatch = (fileData = [null, null]) => {
      const attributes = {
        ...posts.find(p => p.id === postId)?.attributes,
        title: postTitle.trim(),
      };

      // Only update attachment if it's a standard post and not a special one
      if (!isSpecialPost) {
        attributes.attachmentId = fileData[0];
        attributes.attachmentName = fileData[1];
      }

      return fetch(process.env.REACT_APP_API_PATH + "/posts/" + postId, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorID: Number(userId),
          recipientGroupID: Number(groupID),
          content: postContent.trim(),
          attributes: attributes,
        }),
      });
    };

    const uploadPromise = isSpecialPost ? Promise.resolve([null, null]) : uploadFile();

    uploadPromise
        .then((fileData) => {
          if (fileData === false) {
            setIsPosting(false);
            return Promise.reject("failed to upload file");
          }
          return performPatch(fileData);
        })
        .then((res) => {
      if (!res.ok) throw new Error("Post creation failed");
      return res.json();
    })
    .then(() => {
      closeModal();
      setIsPostModalOpen(false);
      setIsPosting(false);
      fetchPosts();
    })
    .catch((err) => {
      console.error("Post creation error:", err);
      setIsPosting(false);
    });
  }

  function handleCreatePoll() {
    if (!questionContent.trim()) {
      setShowPostMessageError(true);
    } else {
      setShowPostMessageError(false);
    }
    const result = pollInputs.filter((option) => option !== '');
    if (result.length <= 0) {
      setShowTypeMessageError(true);
    } else {
      setShowTypeMessageError(false);
    }

    if (!questionContent.trim() || result.length <= 0) return;
    setIsPosting(true);

    fetch(process.env.REACT_APP_API_PATH + "/posts", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        authorID: Number(userId),
        recipientGroupID: Number(groupID),
        content: postContent.trim(),
        attributes: {
            type: "poll", 
            title: postTitle.trim(), 
            question: questionContent.trim(), 
            pollContent: pollInputs,
            channel: currentChannel,
        },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Post creation failed");
        return res.json();
      })
      .then(() => {
        closeModal();
        setIsPosting(false);
        fetchPosts();
      })
      .catch((err) => {
        console.error("Post creation error:", err);
        setIsPosting(false);
      });
  }

  function handleCreateRanking() {
    if (!questionContent.trim()) {
      setShowPostMessageError(true);
    } else {
      setShowPostMessageError(false);
    }
    const result = rankingInputs.filter((option) => option !== '');
    if (result.length <= 0) {
      setShowTypeMessageError(true);
    } else {
      setShowTypeMessageError(false);
    }

    if (!questionContent.trim() || result.length <= 0) return;
    setIsPosting(true);

    fetch(process.env.REACT_APP_API_PATH + "/posts", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        authorID: Number(userId),
        recipientGroupID: Number(groupID),
        content: postContent.trim(),
        attributes: {
            type: "ranking",
            title: postTitle.trim(),
            question: questionContent,
            rankingContent: rankingInputs,
            channel: currentChannel,
        },
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Post creation failed");
        return res.json();
      })
      .then(() => {
        closeModal();
        setIsPosting(false);
        fetchPosts();
      })
      .catch((err) => {
        console.error("Post creation error:", err);
        setIsPosting(false);
      });
  }

  function handleEditRanking() {
    if (!questionContent.trim()) {
      setShowPostMessageError(true);
    } else {
      setShowPostMessageError(false);
    }
    const result = rankingInputs.filter((option) => option !== '');
    if (result.length <= 0) {
      setShowTypeMessageError(true);
    } else {
      setShowTypeMessageError(false);
    }

    if (!questionContent.trim() || result.length <= 0) return;
    setIsPosting(true);

    fetch(process.env.REACT_APP_API_PATH + "/posts/" + postId, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        content: postContent.trim(),
        attributes: {
          ...posts.find(p => p.id === postId)?.attributes,
          title: postTitle.trim(),
          question: questionContent.trim(),
          rankingContent: rankingInputs
        },
      }),
    })
        .then((res) => {
          if (!res.ok) throw new Error("Ranking update failed");
          return res.json();
        })
        .then(() => {
          closeModal();
          setIsPosting(false);
          fetchPosts();
        })
        .catch((err) => {
          console.error("Ranking update error:", err);
          setIsPosting(false);
        });
  }

  function handleCreateRating() {
    if (!postContent.trim()) {
      setShowPostMessageError(true);
    } else {
      setShowPostMessageError(false);
    }
    const result = ratingInputs.filter((option) => option !== '');
    if (result.length <= 0) {
      setShowTypeMessageError(true);
    } else {
      setShowTypeMessageError(false);
    }

    if (!postContent.trim() || result.length <= 0) return;
    setIsPosting(true);

    fetch(process.env.REACT_APP_API_PATH + "/posts", {
      method: "POST",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        authorID: Number(userId),
        recipientGroupID: Number(groupID),
        content: postContent.trim(),
        attributes: {
            type: "rating",
            title: postTitle.trim(),
            ratingContent: ratingInputs,
            ratingValues: ratingValues,
            channel: currentChannel,
        },
      }),
    })
        .then((res) => {
          if (!res.ok) throw new Error("Post creation failed");
          return res.json();
        })
        .then(() => {
          closeModal();
          setIsPosting(false);
          fetchPosts();
        })
        .catch((err) => {
          console.error("Post creation error:", err);
          setIsPosting(false);
        });
  }

  function handleEditRating() {
    if (!postContent.trim()) {
      setShowPostMessageError(true);
    } else {
      setShowPostMessageError(false);
    }
    const result = ratingInputs.filter((option) => option !== '');
    if (result.length <= 0) {
      setShowTypeMessageError(true);
    } else {
      setShowTypeMessageError(false);
    }

    if (!postContent.trim() || result.length <= 0) return;
    setIsPosting(true);

    fetch(process.env.REACT_APP_API_PATH + "/posts/" + postId, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        content: postContent.trim(),
        attributes: {
          ...posts.find(p => p.id === postId)?.attributes,
          title: postTitle.trim(),
          ratingContent: ratingInputs,
          ratingValues: ratingValues
        },
      }),
    })
        .then((res) => {
          if (!res.ok) throw new Error("Rating update failed");
          return res.json();
        })
        .then(() => {
          closeModal();
          setIsPosting(false);
          fetchPosts();
        })
        .catch((err) => {
          console.error("Rating update error:", err);
          setIsPosting(false);
        });
  }

  function closeModal() {
    setIsPostModalOpen(false);
    setIsPollModalOpen(false);
    setIsRankingModalOpen(false);
    setIsRatingModalOpen(false);
    setPostId("");
    setPostTitle("");
    setPostContent("");
    setPostAttachmentId("");
    setUpload(null);
    setUploadURL("");
    setUploadMessage("");
    setUploadValid(false);
    setQuestionContent("");
    setNumPollOptions([]);
    setPollOptionsCount(3);
    setPollInputs(['','','','','','','','','','']);
    setRankingInputs(['','','','','','','','','','']);
    setRatingInputs(['','','','','','','','','','']);
    setRatingValues([-1, -1, -1, -1, -1, -1, -1, -1, -1, -1]);
    setDragIndex(null);
    setIsEditingRanking(true);
    setRankingItemsCount(2);
    setShowPostMessageError(false);
    setShowTypeMessageError(false);
    discardFile();
    setShowEditRulesModal(false);
    setRuleInputs(['','','','','','','','','','','','','','','','','','','','']);
  }

  const getUser = () => {
    fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`)
      .then(res => res.json())
      .then(data => {
          setUser(data);
    });
  }

  //sets isRequested
  function getRequested() {
    fetch(process.env.REACT_APP_API_PATH + "/groups/" + groupID, {
      method: "GET"
    })
    .then((res) => res.json())
    .then((group) => {
      if ("requested" in group.attributes) {
        if (
          Number(userId) in group.attributes.requested &&
          group.attributes.requested[Number(userId)] !== false
        ) {
          setIsRequested(true);
        }
      }
    })
  };

  //patches request to groups
  function handleRequestJoinPrivCommunity() {
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
          .then((data) => {
            setIsRequested(true);
            handleSendRequest(user.attributes.username + " has requested to join the community " + group.name + ".");
          })
          .catch((err) => console.error("Request failed:", err));
      });
  }

  function handleCancelRequest() {
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
          .then(() => setIsRequested(false))
          .catch((err) => console.error("Request failed:", err));
      });
  }

  function handleSendRequest(message) {
    const ownerId = group?.creatorID;
    if (!ownerId) return;
    notifyOwnerAndModeratorsOfPrivateJoinRequest({
      token,
      groupId: groupID,
      creatorId: ownerId,
      requestingUserId: userId,
      message,
    });
  }

  async function uploadFile() {
      try {
          const uploadId = upload ? upload.id : null;
          const uploadName = upload ? upload.name : "Attachment";

          // skip upload if file not changed
          if (uploadId && postAttachmentId === uploadId) {
              return [uploadId, uploadName];
          }

          // delete the existing file (if the caller wants to replace it)
          if (isEditing && postAttachmentId) {
            const url = `${process.env.REACT_APP_API_PATH}/file-uploads/${postAttachmentId}`;
            const response = await fetch(url, {
              method: "DELETE",
              headers: {
                  "Authorization": `Bearer ${token}`
              },
            });

            // if the request failed, throw an error
            if (!response.ok) {
              throw new Error("request failed");
            }
          }

          // dont upload if the file isn't provided, or is isn't valid
          if (!upload || !isUploadValid) {
              return [null, null];
          }

          // make multipart form data for upload
          const formData = new FormData();
          formData.append("uploaderID", userId);
          formData.append("attributes", JSON.stringify({type: "post-attachment"}));
          formData.append("file", upload);

          // upload the attached file
          const url = `${process.env.REACT_APP_API_PATH}/file-uploads`;
          const response = await fetch(url, {
              method: "POST",
              headers: {
                  "Authorization": `Bearer ${token}`
              },
              body: formData,
          });

          // if the request failed, throw an error
          if (!response.ok) {
              throw new Error("request failed");
          }

          // extract the response data
          const data = await response.json();
          const fileIdData = data.id ?? "INVALID-ID";

          // the file id must be present
          if (fileIdData === "INVALID-ID") {
              return false;
          }
        
          // return the file id
          return [fileIdData, upload.name];

        } catch(err) {
            // print an error message and close the modal
            console.error("File upload:", err);
            setIsPosting(false);

            return false;
        }
    }

    const chooseFile = () => {
      // create file input modal
      const input = document.createElement("input");
      input.type = "file";
      input.accept = POST_ATTACHMENT_ACCEPT;
      input.style.display = "none";

      // on file selected
      input.onchange = (event) => {
          const file = event.target.files[0] ?? null;

          const { valid, errorMessage } = validatePostAttachmentFile(file, {
              imageMin: imageUploadMinSize,
              imageMax: imageUploadMaxSize,
              videoMin: videoUploadMinSize,
              videoMax: videoUploadMaxSize,
              audioMin: audioUploadMinSize,
              audioMax: audioUploadMaxSize,
          });

          if (valid) {
              // update the state
              setUpload(file);
              setUploadURL(URL.createObjectURL(file));
              setUploadValid(true);
          }

          // if the upload is not valid, reset the state and show an alert message
          else {
              // reset the state
              if (uploadURL) {
                  URL.revokeObjectURL(uploadURL);
              }
              setUpload(null);
              setUploadURL("");
              setUploadMessage("");
              setUploadValid(false);

              // print an error message and close the modal
              setUploadMessage(errorMessage);
              setIsPosting(false);
          }

          // close the input modal
          document.body.removeChild(input);
      };

      // open the file input modal
      document.body.appendChild(input);
      input.click();
    };

  const discardFile = () => {
      if (uploadURL) {
          URL.revokeObjectURL(uploadURL);
      }
      setUpload(null);
      setUploadURL("");
      setUploadMessage("");
      setUploadValid(false);
  }

  const handleDragStart = (index) => {
  setDragIndex(index);
};

const handleDragOver = (e) => {
  e.preventDefault();
};

const handleDrop = (dropIndex) => {
  if (dragIndex === null || dragIndex === dropIndex) return;

  const filledItems = rankingInputs.filter((item) => item.trim() !== "");
  const draggedItem = filledItems[dragIndex];

  filledItems.splice(dragIndex, 1);
  filledItems.splice(dropIndex, 0, draggedItem);

  const nextInputs = ["", "", "", "", "", "", "", "", "", ""];
  filledItems.forEach((item, index) => {
    nextInputs[index] = item;
  });

  setRankingInputs(nextInputs);
  setDragIndex(null);
};
const moveRankingItem = (fromIndex, toIndex) => {
  const filledItems = rankingInputs.filter((item) => item.trim() !== "");

  if (toIndex < 0 || toIndex >= filledItems.length) return;

  const [movedItem] = filledItems.splice(fromIndex, 1);
  filledItems.splice(toIndex, 0, movedItem);

  const nextInputs = ["", "", "", "", "", "", "", "", "" ,""];
  filledItems.forEach((item, index) => {
    nextInputs[index] = item;
  });

  setRankingInputs(nextInputs);
};

  function saveRankingItems() {
    if (!((rankingInputs.filter(item => item.length > 0)).length > 0)) {
      setShowTypeMessageError(true);
    } else {
      setShowTypeMessageError(false);
      setIsEditingRanking(false);
    }
  }

  if (error) {
    return (
      <div className="communityFeedPage">
        <div className="feedShell">
          <div className="feedEmptyCard">{error}</div>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="community-page--loading">
        <div className="community-page__loading-text">
  {t("communityPage.loading")}
</div>
      </div>
    );
  }

  if (isKicked) {
    return <KickedCommunityView />;
  }

  const titleAtLimit = postTitle.length >= MAX_TITLE;
  const bodyAtLimit = postContent.length >= MAX_BODY;
  const questionContentAtLimit = questionContent.length >= MAX_TITLE;

  const currentMembership = getCurrentMembership();
  const isOwner = String(group?.creatorID) === userId;
  const canManageCommunity = isOwner || isModeratorMember(currentMembership);
  const truncateMemberName = (name, maxLength = 18) => {
    if (!name) return "";
    if (name.length <= maxLength) return name;
    return `${name.slice(0, maxLength)}...`;
  };
  function handleMemberClick(memberUserId) {
    if (!memberUserId) return;
      setShowMembers(false);
      navigate(`/profile/${memberUserId}`);
  }

  function showRulesModal() {
    // navigate(`/community/rules/${groupID}`);
    navigate(`/community/rules/${groupID}`);
  }

  function handleEditRules() {
    setPostContent(group.attributes?.rulesMessage || "");

    const rules = (group.attributes?.rulesBody || []).filter((e) => e !== '');

    if (rules.length > 0) {
      setRankingItemsCount(rules.length+1);

      let ruleinp = ['','','','','','','','','','','','','','','','','','','',''];
      rules.map((e, i) => ruleinp[i] = e);
      setRuleInputs(ruleinp);
    }
  }

  function saveRules() {
    const result = ruleInputs.filter((rule) => rule !== '');
    if (!postContent.trim() && result.length <= 0) {
      setShowPostMessageError(true);
    } else {
      setShowPostMessageError(false);
    }
    if (!postContent.trim() && result.length <= 0) return;

    setIsPosting(true);

    fetch(process.env.REACT_APP_API_PATH + "/groups/" + groupID, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          ...group.attributes,
          rulesMessage: postContent,
          rulesBody: ruleInputs,
        }
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Update rules failed");
        return res.json();
      })
      .then(() => {
        closeModal();
        setIsPosting(false);
      })
      .catch((err) => {
        console.error("Update rules error:", err);
        setIsPosting(false);
      })
      .finally(() => window.location.reload());
  }

  function clearRules() {
    setIsPosting(true);

    let clearedRules = ['','','','','','','','','','','','','','','','','','','','']

    fetch(process.env.REACT_APP_API_PATH + "/groups/" + groupID, {
      method: "PATCH",
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: JSON.stringify({
        attributes: {
          ...group.attributes,
          rulesMessage: "",
          rulesBody: [],
        }
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Update rules failed");
        return res.json();
      })
      .then(() => {
        closeModal();
        setIsPosting(false);
      })
      .catch((err) => {
        console.error("Update rules error:", err);
        setIsPosting(false);
      })
      .finally(() => window.location.reload());
  }

  // Keep owner on top, then all moderators, then the rest.
  const sortedMembers = (() => {
    const creatorId = group?.creatorID;
    const weightForRole = (roleLabel) => {
      if (roleLabel === "owner") return 0;
      if (roleLabel === "mod") return 1;
      return 2;
    };

    return [...members].sort((a, b) => {
      const roleA = getMemberRoleLabel(a, creatorId);
      const roleB = getMemberRoleLabel(b, creatorId);
      return weightForRole(roleA) - weightForRole(roleB);
    });
  })();

  // Keep owner on top, then all moderators, then the rest.
  const activeMembers = sortedMembers.filter(m => m.attributes?.role !== "kicked");
  const kickedMembers = sortedMembers.filter(m => m.attributes?.role === "kicked");

  const onKeyDown = (event) => {
    // submit on enter key
    if (event.key === "Enter") {            
        event.preventDefault();
        event.target.blur();
        onSearch(event);
    }
    
    // unfocus on escape key
    else if (event.key === "Escape") {
        event.preventDefault();
        event.target.blur();
    }
  };

  const onSearch = (event) => {
    event.preventDefault();
    
    // trim search value
    const trimmedSearchValue = searchValue.trim();
    navigate(`/community/${groupID}?q=${encodeURIComponent(trimmedSearchValue)}`);
    fetchPosts();
};

  return (
      <div
          className="communityFeedPage"
          style={{paddingLeft: showSideBar ? "260px" : "12px"}}
      >
        <div id="community-channels-sidebar">
          <BaseSideBar
              label={t("communityPage.header.channels")}
              isOpen={showSideBar}
              onOpen={() => setShowSideBar(true)}
              onClose={() => setShowSideBar(false)}
              role="navigation"
              aria-label="Community Channels"
          >
            <BaseSideBarItem
                label={`# ${t("communityPage.channels.all")}`}
                isSelected={!currentChannel}
                onClick={() => {
                  setCurrentChannel(null);
                  fetchPosts({channel: null});
                }}
                aria-current={!currentChannel ? "location" : undefined}
            />
            {channels.map((channelName, index) => (
                <BaseSideBarItem
                    key={index}
                    label={`# ${channelName}`}
                    isSelected={currentChannel === channelName}
                    onClick={() => {
                      setCurrentChannel(channelName);
                      fetchPosts({channel: channelName});
                    }}
                    aria-current={currentChannel === channelName ? "location" : undefined}
                />
            ))}
          </BaseSideBar>
        </div>

        <div className="feedShell">
        <div
          className="communityBanner"
          style={
            bannerImage
              ? { backgroundImage: `url(${bannerImage})` }
              : { "--community-bg": group?.color || "#888" }
          }
        />

        <div className="communityHeaderRow">
          <div className="communityTitleTagsRow">
            <div className="communityTitleBlock">
              <div className="communityTitleOverflow">
                <h1 className="communityTitle">{group.name}</h1>
              </div>
              <div className="membersTriggerWrapper" ref={membersRef}>
                <button
                    type="button"
                    className="channelsBtn"
                    onClick={() => setShowSideBar(!showSideBar)}
                    aria-expanded={showSideBar}
                    aria-controls="community-channels-sidebar"
                >{t("communityPage.header.channels")} {`(${channels.length + 1})`}
                </button>
                <button
                  type="button"
                  className="membersBtn"
                  onClick={() => setShowMembers((prev) => !prev)}
                >
                  {t("communityPage.header.members")} {activeMembers.length > 0 && `(${activeMembers.length})`}
                </button>

                {showMembers && members.length > 0 && (
                  <div className="membersOptionsPopup">
                    <ul className="membersList">
                      {sortedMembers.map((member) => {
                        const role = getMemberRoleLabel(member, group?.creatorID);
                        const fullName = getDisplayName(member);
                        const truncatedName = truncateMemberName(fullName);
                        const isTruncated = truncatedName !== fullName;
                        const isMemberOwner = role === "owner";
                        const isTargetMe = String(member.userID) === userId;
                        const isKicked = member.attributes?.role === "kicked";

                        if (isKicked) return null;

                        return (
                            <li
                                key={member.id}
                                className="memberItem memberItem--clickable"
                                onClick={() => handleMemberClick(member.userID)}
                            >
                              <span className="memberNameWrap">
                                <span className="memberName">{truncatedName}</span>
                                {isTruncated && (
                                    <span className="memberNameTooltip">{fullName}</span>
                                )}
                              </span>

                              {role && (
                                <span
                                  className={
                                    role === "owner"
                                      ? "memberRole memberRole--owner"
                                      : role === "mod"
                                        ? "memberRole memberRole--mod"
                                        : "memberRole"
                                  }
                                >
                                  {role === "owner"
                                    ? t("communityPage.roles.owner")
                                    : role === "mod"
                                      ? t("communityPage.roles.mod")
                                      : role}
                                </span>
                              )}

                              {canManageCommunity && !isMemberOwner && !isTargetMe && (
                                  <button
                                      className="kickBtn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleKick(member);
                                      }}
                                  >
                                    {t("communityPage.membersList.kick")}
                                  </button>
                              )}
                            </li>
                        );
                      })}
                    </ul>

                    {canManageCommunity && (
                        <>
                          <button
                              className="kickedUsersToggleBtn"
                              onClick={() => setShowKicked(!showKicked)}
                          >
                            <span className="kickedUsersToggleBtn__text">
                              {t("communityPage.membersList.kickedUsers")}
                            </span>
                            <span className="material-icons">
                              {showKicked ? "expand_less" : "expand_more"}
                            </span>
                          </button>
                          {showKicked && (
                              <ul className="kickedList">
                                {kickedMembers.length === 0 ? (
                                    <li className="memberItem" style={{ opacity: 0.6, justifyContent: 'center' }}>{t("communityPage.membersList.noKickedUsers")}</li>
                                ) : (
                                    kickedMembers.map((member) => (
                                        <li key={member.id} className="memberItem">
                                          <div className="memberNameWrap">
                                            <div className="memberName">{getDisplayName(member)}</div>
                                            <div style={{ fontSize: '11px', opacity: 0.7 }}>@{member.user?.attributes?.username}</div>
                                          </div>
                                          <button
                                              className="unkickBtn"
                                              onClick={() => handleUnkick(member)}
                                          >
                                            {t("communityPage.membersList.unkick")}
                                          </button>
                                        </li>
                                    ))
                                )}
                              </ul>
                          )}
                        </>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* community tags */}
            {group.tags.length > 0 && (
              <div className="communityTags">
                {group.tags.map((tag) => (
                <span key={tag} className="tag">{t(`tags.${tag}`)}</span>
              ))}
              </div>
            )}
          </div>

          <div className="communityHeaderActions">
            <CommunityRules
              groupID={groupID}
              groupName={group.name}
              group={group}
            />

            {/* edit community menu */}
            {canManageCommunity && (
              <EditCommunityMenu
                onEditCommunity={() => setShowEditCommunityModal(true)}
                onEditRules={() => {setShowEditRulesModal(true); handleEditRules()}}
                onManageModerators={() => setShowModeratorsModal(true)}
                onManageChannels={() => setShowEditChannelsModal(true)}
                onTransferOwnership={handleTransferOwnership}
                onPermanentlyDelete={() => {
                  setDeleteCommunityError("");
                  setShowDeleteCommunityModal(true);
                }}
                isOwner={isOwner}
              />
            )}

            {/* join community / request to join / requested / leave community button */}
            {isJoined ? (
              <button className="leaveBtn" onClick={handleLeave}>
                {t("communityPage.membership.leaveCommunity")}
              </button>
            ) : (
              group.visibility === "private" ? (
                <>
                  {isRequested ? (
                    <button className="leaveBtn" onClick={handleCancelRequest}>
                      {t("communityPage.membership.requested")}
                    </button>
                  ) : (
                    <button className="joinBtn" onClick={handleRequestJoinPrivCommunity}>
                      {t("communityPage.membership.requestToJoin")}
                    </button>
                  )}
                </>
                ) : (
                <button className="editCommunityTriggerBtn" onClick={handleJoin}>
                  {t("communityPage.membership.joinCommunity")}
                </button>
            )
            )}
          </div>
        </div>

        {/* filtering posts by username + community song player */}
        <div className="filter-searchbar-row">
          <div className="filter-searchbar">
            <input
                className="filter-searchbar-input"
                type="text"
                placeholder={t("communityPage.search.placeholder")}
                maxLength={Config.MAX_USERNAME_LENGTH}
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={onKeyDown}
            />
            <img
                className="filter-searchbar-button"
                src={searchIcon}
                alt={t("communityPage.search.buttonAlt")}
                onClick={onSearch}
            />
          </div>
          {communitySongUrl && (
            <div className="communitySongPlayerWrap">
              <div className="communitySongPlayerLabel">
                {t("communityPage.music.label")}
              </div>
              <PostAudioPlayer src={communitySongUrl} compact />
            </div>
          )}
        </div>

        <EditCommunityModal
          isOpen={showEditCommunityModal}
          onClose={() => setShowEditCommunityModal(false)}
          groupID={groupID}
          token={token || ""}
          userId={userId}
          onUpdated={() => {
            fetchCommunity();
            checkMembership();
          }}
          communitySongUrl={communitySongUrl}
        />
        {showEditRulesModal && (
            <div
                className="postModalOverlay"
                onMouseDown={(e) => {
                  e.currentTarget.dataset.startedOnBackdrop = String(e.target === e.currentTarget);
                }}
                onClick={(e) => {
                  const startedOnBackdrop = e.currentTarget.dataset.startedOnBackdrop === "true";
                  const endedOnBackdrop = e.target === e.currentTarget;

                  if (startedOnBackdrop && endedOnBackdrop) {
                    closeModal();
                  }

                  e.currentTarget.dataset.startedOnBackdrop = "false";
                }}
            >
              <div
                  className="postModal"
                  ref={rulesModalRef}
                  tabIndex="-1"
                  role="dialog"
                  aria-modal="true"
                  onClick={(e) => e.stopPropagation()}
              >
                <div className="postTitleOverflow">
                  <h2>{t("communityPage.rulesModal.title", { communityName: group.name })}</h2>
                </div>
                
                <div className="postOverflow">
                  <div className="postModalFieldWrapper">
                    <div>{t("communityPage.rulesModal.messageLabel")}</div>
                      <textarea
                          className="postModalTextarea"
                          placeholder={t("communityPage.rulesModal.messagePlaceholder")}
                          value={postContent}
                          onChange={(e) => setPostContent(e.target.value)}
                          rows={5}
                          maxLength={MAX_BODY}
                      />
                    <div>
                    {showPostMessageError && (
                      <div className="post-field-error-message">Please enter some amount of content or at least one rule</div>
                    )}
                      <span className={`charCounter ${bodyAtLimit ? "charCounter--limit" : ""}`}>
                          {postContent.length}/{MAX_BODY}
                        </span>
                    </div>
                  </div>

                  <div className="postModalFieldWrapper">
                  <div>{t("communityPage.rulesModal.rulesLabel")}</div>
                    {(() => {
                      const existingRules = (group.attributes?.rulesBody ?? []).filter((e) => e !== "");
                      return (
                        <>
                          {existingRules.length > 0 ? (
                            existingRules.map((item, index) => (
                              <div key={index}>
                                <RuleItem
                                  item_num={index + 1}
                                  ruleInputs={ruleInputs}
                                  setRuleInputs={setRuleInputs}
                                  content={item}
                                />
                              </div>
                            ))
                          ) : (
                            <RuleItem
                              item_num={1}
                              ruleInputs={ruleInputs}
                              setRuleInputs={setRuleInputs}
                              content={""}
                            />
                          )}

                          {numPollOptions.map((num) => (
                            <div key={num.number}>
                              <RuleItem
                                item_num={num.number}
                                ruleInputs={ruleInputs}
                                setRuleInputs={setRuleInputs}
                                content={""}
                              />
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>

                  {!(rankingItemsCount > 20) && (
                    <button className="feedGhostBtn"
                      onClick={() => {
                        setNumPollOptions([
                          ...numPollOptions,
                          { number: rankingItemsCount }
                        ]);
                        setRankingItemsCount(rankingItemsCount+1);
                      }}>
                        {t("communityPage.rulesModal.addMoreRules")}
                    </button>
                  )}
                </div>

                <button className="deleteBtn"
                      onClick={() => clearRules()}>
                        Clear all rules
                    </button>

              <div className="postModalActions">
                <button className="feedGhostBtn" onClick={() => {closeModal()}}>
                {t("communityPage.rulesModal.cancel")}
              </button>
                <button
                    className="feedPrimaryBtn"
                    onClick={() => {saveRules();}}
                >{t("communityPage.rulesModal.save")}</button>
              </div>
            </div>
          </div>
        )}
        <EditChannelsModal
          token={token}
          groupId={groupID}
          channels={channels}
          setChannels={setChannels}
          currentChannel={currentChannel}
          setCurrentChannel={setCurrentChannel}
          isOpen={showEditChannelsModal}
          onClose={() => setShowEditChannelsModal(false)}
        />
        <ManageModeratorsModal
          isOpen={showModeratorsModal}
          onClose={() => setShowModeratorsModal(false)}
          members={activeMembers}
          creatorID={group?.creatorID}
          isOwner={isOwner}
          activeUserId={userId}
          token={token}
          onUpdated={checkMembership}
        />
        <TransferOwnershipModal
          isOpen={showTransferOwnershipModal}
          candidates={transferOwnershipCandidates}
          selectedUserId={selectedTransferOwnerId}
          onSelect={setSelectedTransferOwnerId}
          onClose={() => {
            setShowTransferOwnershipModal(false);
            setTransferOwnershipCandidates([]);
            setSelectedTransferOwnerId("");
          }}
          onConfirm={handleConfirmTransferOwnership}
        />
        {showTransferOwnershipErrorModal && (
          <div
            className="transferOwnershipModalOverlay"
            onClick={() => setShowTransferOwnershipErrorModal(false)}
          >
            <div
              className="transferOwnershipModal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="transferOwnershipModalTitle">{t("communityPage.transferOwnershipModal.title")}</h3>
              <p className="transferOwnershipModalText">
                {t("communityPage.transferOwnershipModal.noModerators")}
              </p>
              <div className="transferOwnershipModalActions">
                <button
                  type="button"
                  className="feedPrimaryBtn"
                  onClick={() => setShowTransferOwnershipErrorModal(false)}
                >
                  {t("communityPage.transferOwnershipModal.ok")}
                </button>
              </div>
            </div>
          </div>
        )}
        {showTransferOwnershipSuccessModal && (
          <div
            className="transferOwnershipModalOverlay"
            onClick={() => setShowTransferOwnershipSuccessModal(false)}
          >
            <div
              className="transferOwnershipModal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="transferOwnershipModalTitle">{t("communityPage.transferOwnershipModal.title")}</h3>
              <p className="transferOwnershipModalText">
                {t("communityPage.transferOwnershipModal.success")}
              </p>
              <div className="transferOwnershipModalActions">
                <button
                  type="button"
                  className="feedPrimaryBtn"
                  onClick={() => setShowTransferOwnershipSuccessModal(false)}
                >
                  {t("communityPage.transferOwnershipModal.ok")}
                </button>
              </div>
            </div>
          </div>
        )}
        {showOwnerLeaveBlockedModal && (
          <div
            className="transferOwnershipModalOverlay"
            onClick={() => setShowOwnerLeaveBlockedModal(false)}
          >
            <div
              className="transferOwnershipModal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="transferOwnershipModalTitle">{t("communityPage.leaveBlockedModal.title")}</h3>
              <p className="transferOwnershipModalText">
                {t("communityPage.leaveBlockedModal.message")}
              </p>
              <div className="transferOwnershipModalActions">
                <button
                  type="button"
                  className="feedPrimaryBtn"
                  onClick={() => setShowOwnerLeaveBlockedModal(false)}
                >
                  {t("communityPage.leaveBlockedModal.ok")}
                </button>
              </div>
            </div>
          </div>
        )}
        {showDeleteCommunityModal && (
            <div
                className="transferOwnershipModalOverlay"
                onMouseDown={(e) => {
                  e.currentTarget.dataset.backdropMouseDown = String(e.target === e.currentTarget);
                }}
                onClick={(e) => {
                  if (isDeletingCommunity) return;
                  const startedOnBackdrop = e.currentTarget.dataset.backdropMouseDown === "true";
                  const endedOnBackdrop = e.target === e.currentTarget;
                  if (startedOnBackdrop && endedOnBackdrop) setShowDeleteCommunityModal(false);
                  e.currentTarget.dataset.backdropMouseDown = "false";
                }}
            >
              <div
                  className="DeleteCommunityModal"
                  ref={deleteModalRef}
                  tabIndex="-1"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="delete-community-title"
                  onClick={(e) => e.stopPropagation()}
              >
                <h3 id="delete-community-title" className="DeleteCommunityModalTitle">
                  {t("communityPage.deleteCommunityModal.title")}
                </h3>
              <p className="DeleteCommunityModalTextQ">{t("communityPage.deleteCommunityModal.question")}</p>
              <p className="DeleteCommunityModalTextDescription">
                {t("communityPage.deleteCommunityModal.description")}</p>
              <p className="DeleteCommunityModalTextUndone"><b>{t("communityPage.deleteCommunityModal.warning")}</b></p>
              {deleteCommunityError ? (
                <p className="transferWarning" role="alert">
                  {deleteCommunityError}
                </p>
              ) : null}
              <div className="DeleteCommunityModalActions">
                <button
                  type="button"
                  className="feedGhostBtn"
                  disabled={isDeletingCommunity}
                  onClick={() => !isDeletingCommunity && setShowDeleteCommunityModal(false)}
                >
                  {t("communityPage.deleteCommunityModal.cancel")}
                </button>
                <button
                  type="button"
                  className="deleteBtn"
                  disabled={isDeletingCommunity}
                  onClick={handleConfirmDeleteCommunity}
                >
                  {t("communityPage.deleteCommunityModal.delete")}
                </button>
              </div>
            </div>
          </div>
        )}

            {/* Post button — members only */}
            {(isJoined && !isPostClicked) && (
              <div className="postBtn">
                <button onClick={() => {
                    discardFile();
                    setIsPostClicked(true);
                    setIsEditing(false);
                  }}>{t("communityPage.feed.postButton")}</button>
              </div>
            )}

            {/* Post type options popup */}
        {isPostClicked && (
            <div>
              <div className="postBtn">
                <button onClick={() => setIsPostClicked(false)}>
                  {t("communityPage.feed.postButton")}
                </button>
              </div>

              <div className="postOptionsPopup" ref={postOptionsRef} role="menu" aria-label={t("communityPage.postOptions.header")}>
                <div className="membersPopupHeader">{t("communityPage.postOptions.header")}</div>
                {(() => {
                  const isTutorialActive = !!document.querySelector('.tutorial-modal');
                  const itemTabIndex = isTutorialActive ? -1 : 0;

                  return (
                      <div className="postOptionsList">
                        <button className="postOptionsItem" role="menuitem" tabIndex={itemTabIndex} onClick={() => { setIsPostClicked(false); setIsPostModalOpen(true); }}>
                          <span className="memberName">{t("communityPage.postOptions.text")}</span>
                        </button>
                        <button className="postOptionsItem" role="menuitem" tabIndex={itemTabIndex} onClick={() => { setIsPostClicked(false); setIsPollModalOpen(true); }}>
                          <span className="memberName">{t("communityPage.postOptions.poll")}</span>
                        </button>
                        <button className="postOptionsItem" role="menuitem" tabIndex={itemTabIndex} onClick={() => { setIsPostClicked(false); setIsRankingModalOpen(true); }}>
                          <span className="memberName">{t("communityPage.postOptions.ranking")}</span>
                        </button>
                        <button className="postOptionsItem" role="menuitem" tabIndex={itemTabIndex} onClick={() => { setIsPostClicked(false); setIsRatingModalOpen(true); }}>
                          <span className="memberName">{t("communityPage.postOptions.rating")}</span>
                        </button>
                      </div>
                  );
                })()}
              </div>
            </div>
        )}

            {/* Post creation modal */}
{isPostModalOpen && (
  <div
  className="postModalOverlay"
  onMouseDown={(e) => {
    e.currentTarget.dataset.startedOnBackdrop = String(e.target === e.currentTarget);
  }}
  onClick={(e) => {
    const startedOnBackdrop = e.currentTarget.dataset.startedOnBackdrop === "true";
    const endedOnBackdrop = e.target === e.currentTarget;

    if (startedOnBackdrop && endedOnBackdrop) {
      closeModal();
    }

    e.currentTarget.dataset.startedOnBackdrop = "false";
  }}
>
    <div className="postModal" onClick={(e) => e.stopPropagation()}>
      <div className="postTitleOverflow">
        <h2>
          {isEditing
            ? t("communityPage.postModal.editPost", {
                postType: posts.find((p) => p.id === postId)?.attributes?.type || "standard",
              })
            : t("communityPage.postModal.newPost", {
                communityName: group.name,
              })}
        </h2>
      </div>

      <div className="postOverflow">
        <div className="postModalFieldWrapper">
          <div className="postModalFieldLabel">
            {t("communityPage.postModal.titleLabel")}
          </div>

          <input
            className="postModalInput"
            type="text"
            placeholder={t("communityPage.postModal.titlePlaceholder")}
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            maxLength={MAX_TITLE}
            autoFocus
          />

          <span className={`charCounter ${titleAtLimit ? "charCounter--limit" : ""}`}>
            {postTitle.length}/{MAX_TITLE}
          </span>
        </div>

        <div className="postModalFieldWrapper">
          <div className="postModalFieldLabel">
            <span className="required-star">*</span>
            {t("communityPage.postModal.captionLabel")}
          </div>

          <textarea
            className="postModalTextarea"
            placeholder={t("communityPage.postModal.contentPlaceholder")}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={5}
            maxLength={MAX_BODY}
            autoFocus
          />

          <div>
            {showPostMessageError && (
              <div className="post-field-error-message">
                {t("communityPage.postModal.contentRequired")}
              </div>
            )}

            <span className={`charCounter ${bodyAtLimit ? "charCounter--limit" : ""}`}>
              {postContent.length}/{MAX_BODY}
            </span>
          </div>
        </div>

        {isEditing &&
          ["poll", "ranking", "rating"].includes(
            posts.find((p) => p.id === postId)?.attributes?.type
          ) && (
            <div className="post-field-error-message" style={{ color: "#4a4a4a" }}>
              {t("communityPage.postModal.interactiveEditNote")}
            </div>
          )}

        {(!isEditing ||
          !["poll", "ranking", "rating"].includes(
            posts.find((p) => p.id === postId)?.attributes?.type
          )) && (
          <div className="postModalUpload">
            <button className="postModalUpload__uploadButton" onClick={() => chooseFile()}>
              <img className="postModalUpload__uploadIcon" src={uploadIcon} alt="UPLOAD" />
              {t("communityPage.postModal.upload")}
            </button>

            {upload ? (
              <div className="postModalAttachment">
                <img
                  className="postModalAttachment__discardButton"
                  src={discardIcon}
                  alt="DISCARD"
                  onClick={() => discardFile()}
                />
                <div className="postModalAttachment__fileName">{upload.name}</div>
              </div>
            ) : (
              <div className="postModalAttachment">
                <div
                  className={
                    uploadMessage
                      ? "postModalAttachment__message postModalAttachment__message--error"
                      : "postModalAttachment__message"
                  }
                >
                  {uploadMessage || t("communityPage.postModal.noFileSelected")}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="postModalActions">
        <button className="feedGhostBtn" onClick={closeModal}>
          {t("communityPage.postModal.cancel")}
        </button>

        <button
          className="feedPrimaryBtn"
          onClick={() => {
            if (isPosting) return;
            if (isEditing) handleEditPost();
            else handleCreatePost();
          }}
          disabled={isPosting}
          style={isPosting ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
          {isEditing && isPosting
            ? t("communityPage.postModal.saving")
            : isEditing && !isPosting
            ? t("communityPage.postModal.save")
            : !isEditing && isPosting
            ? t("communityPage.postModal.posting")
            : t("communityPage.postModal.post")}
        </button>
      </div>
    </div>
  </div>
)}

{/* Poll creation modal */}
{isPollModalOpen && (
<div
  className="postModalOverlay"
  onMouseDown={(e) => {
    e.currentTarget.dataset.startedOnBackdrop = String(e.target === e.currentTarget);
  }}
  onClick={(e) => {
    const startedOnBackdrop = e.currentTarget.dataset.startedOnBackdrop === "true";
    const endedOnBackdrop = e.target === e.currentTarget;

    if (startedOnBackdrop && endedOnBackdrop) {
      closeModal();
    }

    e.currentTarget.dataset.startedOnBackdrop = "false";
  }}
>    <div className="postModal" onClick={(e) => e.stopPropagation()}>
      <div className="titleOverflow">
        <h2>
          {isEditing
            ? t("communityPage.pollModal.editPoll")
            : t("communityPage.pollModal.newPoll", { communityName: group.name })}
        </h2>
      </div>

      <div className="postOverflow">
        <div className="postModalFieldWrapper">
          <div className="postModalFieldLabel">
            {t("communityPage.postModal.titleLabel")}
          </div>

          <input
            className="postModalInput"
            type="text"
            placeholder={t("communityPage.postModal.titlePlaceholder")}
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            maxLength={MAX_TITLE}
            autoFocus
          />

          <span className={`charCounter ${titleAtLimit ? "charCounter--limit" : ""}`}>
            {postTitle.length}/{MAX_TITLE}
          </span>
        </div>

        <div className="postModalFieldWrapper">
          <div className="postModalFieldLabel">
            {t("communityPage.postModal.captionLabel")}
          </div>

          <textarea
            className="postModalTextarea"
            placeholder={t("communityPage.postModal.contentPlaceholder")}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={5}
            maxLength={MAX_BODY}
          />

          <span className={`charCounter ${bodyAtLimit ? "charCounter--limit" : ""}`}>
            {postContent.length}/{MAX_BODY}
          </span>
        </div>

        <div className="postModalFieldWrapper">
          <div className="postModalFieldLabel">
            <span className="required-star">*</span>
            {t("communityPage.pollModal.questionLabel")}
          </div>

          <input
            className="postModalInput"
            type="text"
            placeholder={t("communityPage.pollModal.questionPlaceholder")}
            value={questionContent}
            onChange={(e) => setQuestionContent(e.target.value)}
            maxLength={MAX_TITLE}
            autoFocus
          />

          <div>
            {showPostMessageError && (
              <div className="post-field-error-message">
                {t("communityPage.pollModal.questionRequired")}
              </div>
            )}

            <span className={`charCounter ${questionContentAtLimit ? "charCounter--limit" : ""}`}>
              {questionContent.length}/{MAX_TITLE}
            </span>
          </div>
        </div>

        <PollChoice
          poll_number={1}
          pollInputs={pollInputs}
          setPollInputs={setPollInputs}
          showPostMessageError={showTypeMessageError}
        />

        <PollChoice
          poll_number={2}
          pollInputs={pollInputs}
          setPollInputs={setPollInputs}
          showPostMessageError={false}
        />

        {numPollOptions.map((num) => (
          <div key={num.number}>
            <PollChoice
              poll_number={num.number}
              pollInputs={pollInputs}
              setPollInputs={setPollInputs}
              showPostMessageError={false}
            />
          </div>
        ))}

        {!(pollOptionsCount > 10) && (
          <button
            className="feedGhostBtn"
            onClick={() => {
              setNumPollOptions([...numPollOptions, { number: pollOptionsCount }]);
              setPollOptionsCount(pollOptionsCount + 1);
            }}
          >
            {t("communityPage.pollModal.addMoreOptions")}
          </button>
        )}
      </div>

      <div className="postModalActions">
        <button className="feedGhostBtn" onClick={closeModal}>
          {t("communityPage.pollModal.cancel")}
        </button>

        <button className="feedPrimaryBtn" onClick={handleCreatePoll}>
          {isPosting ? t("communityPage.pollModal.posting") : t("communityPage.pollModal.post")}
        </button>
      </div>
    </div>
  </div>
)}

{/* Ranking creation modal */}
{isRankingModalOpen && (
<div
  className="postModalOverlay"
  onMouseDown={(e) => {
    e.currentTarget.dataset.startedOnBackdrop = String(e.target === e.currentTarget);
  }}
  onClick={(e) => {
    const startedOnBackdrop = e.currentTarget.dataset.startedOnBackdrop === "true";
    const endedOnBackdrop = e.target === e.currentTarget;

    if (startedOnBackdrop && endedOnBackdrop) {
      closeModal();
    }

    e.currentTarget.dataset.startedOnBackdrop = "false";
  }}
>    <div className="postModal" onClick={(e) => e.stopPropagation()}>
      <div className="postTitleOverflow">
        <h2>
          {isEditing
            ? t("communityPage.rankingModal.editRanking")
            : t("communityPage.rankingModal.newRanking", { communityName: group.name })}
        </h2>
      </div>

      <div className="postOverflow">
        <div className="postModalFieldWrapper">
          <div className="postModalFieldLabel">
            {t("communityPage.postModal.titleLabel")}
          </div>

          <input
            className="postModalInput"
            type="text"
            placeholder={t("communityPage.postModal.titlePlaceholder")}
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            maxLength={MAX_TITLE}
            autoFocus
          />

          <span className={`charCounter ${titleAtLimit ? "charCounter--limit" : ""}`}>
            {postTitle.length}/{MAX_TITLE}
          </span>
        </div>

        <div className="postModalFieldWrapper">
          <div className="postModalFieldLabel">

            {t("communityPage.postModal.captionLabel")}
          </div>

          <textarea
            className="postModalTextarea"
            placeholder={t("communityPage.postModal.contentPlaceholder")}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={5}
            maxLength={MAX_BODY}
          />

          <div>
            {isEditing && !postContent.trim() && (
              <div className="post-field-error-message">
                {t("communityPage.postModal.captionRequired")}
              </div>
            )}

            <span className={`charCounter ${bodyAtLimit ? "charCounter--limit" : ""}`}>
              {postContent.length}/{MAX_BODY}
            </span>
          </div>
        </div>

        <div className="postModalFieldWrapper">
          {isEditing ? (
            <div className="postModalReadOnlyQuestion">{questionContent}</div>
          ) : (
            <>
              <div className="postModalFieldLabel">
                <span className="required-star">*</span>
                {t("communityPage.rankingModal.questionLabel")}
              </div>

              <input
                className="postModalInput"
                type="text"
                placeholder={t("communityPage.rankingModal.questionPlaceholder")}
                value={questionContent}
                onChange={(e) => setQuestionContent(e.target.value)}
                maxLength={MAX_TITLE}
                autoFocus
              />

              <div>
                {showPostMessageError && (
                  <div className="post-field-error-message">
                    {t("communityPage.rankingModal.questionRequired")}
                  </div>
                )}

                <span
                  className={`charCounter ${
                    questionContentAtLimit ? "charCounter--limit" : ""
                  }`}
                >
                  {questionContent.length}/{MAX_TITLE}
                </span>
              </div>
            </>
          )}

          {!isEditing && (
  <div>
    <div>
      <RankingItem
        item_num={1}
        rankingInputs={rankingInputs}
        setRankingInputs={setRankingInputs}
        showPostMessageError={showTypeMessageError}
      />

      {numPollOptions.map((num) => (
        <div key={num.number}>
          <RankingItem
            item_num={num.number}
            rankingInputs={rankingInputs}
            setRankingInputs={setRankingInputs}
            showPostMessageError={false}
          />
        </div>
      ))}
    </div>

    <div className="addItemsBtnWrapper">
      {!(rankingItemsCount > 10) && (
        <button
          className="feedGhostBtn"
          onClick={() => {
            setNumPollOptions([...numPollOptions, { number: rankingItemsCount }]);
            setRankingItemsCount(rankingItemsCount + 1);
          }}
        >
          {t("communityPage.rankingModal.addMoreItems")}
        </button>
      )}
    </div>
  </div>
)}
        </div>
      </div>

      <div className="postModalActions">
        <button className="feedGhostBtn" onClick={closeModal}>
          {t("communityPage.rankingModal.cancel")}
        </button>

        <button
          className="feedPrimaryBtn"
          onClick={isEditing ? handleEditRanking : handleCreateRanking}
          disabled={isPosting || (isEditing && (!postTitle.trim() || !postContent.trim()))}
          style={
            isPosting || (isEditing && (!postTitle.trim() || !postContent.trim()))
              ? { opacity: 0.5, cursor: "not-allowed" }
              : {}
          }
        >
          {isPosting
            ? isEditing
              ? t("communityPage.rankingModal.saving")
              : t("communityPage.rankingModal.posting")
            : isEditing
            ? t("communityPage.rankingModal.save")
            : t("communityPage.rankingModal.post")}
        </button>
      </div>
    </div>
  </div>
)}

{/* Rating creation modal */}
{isRatingModalOpen && (
<div
  className="postModalOverlay"
  onMouseDown={(e) => {
    e.currentTarget.dataset.startedOnBackdrop = String(e.target === e.currentTarget);
  }}
  onClick={(e) => {
    const startedOnBackdrop = e.currentTarget.dataset.startedOnBackdrop === "true";
    const endedOnBackdrop = e.target === e.currentTarget;

    if (startedOnBackdrop && endedOnBackdrop) {
      closeModal();
    }

    e.currentTarget.dataset.startedOnBackdrop = "false";
  }}
>    <div className="postModal" onClick={(e) => e.stopPropagation()}>
      <div className="titleOverflow">
        <h2>
          {isEditing
            ? t("communityPage.ratingModal.editRating")
            : t("communityPage.ratingModal.newRating", { communityName: group.name })}
        </h2>
      </div>

      <div className="postOverflow">
        <div className="postModalFieldWrapper">
          <div className="postModalFieldLabel">
            {t("communityPage.postModal.titleLabel")}
          </div>

          <input
            className="postModalInput"
            type="text"
            placeholder={t("communityPage.postModal.titlePlaceholder")}
            value={postTitle}
            onChange={(e) => setPostTitle(e.target.value)}
            maxLength={MAX_TITLE}
            autoFocus
          />

          <span className={`charCounter ${titleAtLimit ? "charCounter--limit" : ""}`}>
            {postTitle.length}/{MAX_TITLE}
          </span>
        </div>

        <div className="postModalFieldWrapper">
          <div className="postModalFieldLabel">
            <span className="required-star">*</span>
            {t("communityPage.postModal.captionLabel")}
          </div>

          <textarea
            className="postModalTextarea"
            placeholder={t("communityPage.postModal.contentPlaceholder")}
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            rows={5}
            maxLength={MAX_BODY}
            autoFocus
          />

          <div>
            {showPostMessageError && (
              <div className="post-field-error-message">
                {t("communityPage.ratingModal.contentRequired")}
              </div>
            )}

            <span className={`charCounter ${bodyAtLimit ? "charCounter--limit" : ""}`}>
              {postContent.length}/{MAX_BODY}
            </span>
          </div>
        </div>

        <div className="postModalFieldWrapper">
          <RatingItem
            item_num={1}
            ratingInputs={ratingInputs}
            setRatingInputs={setRatingInputs}
            showPostMessageError={showTypeMessageError}
            ratingValues={ratingValues}
            setRatingValues={setRatingValues}
            isEditing={isEditing}
          />

          {numPollOptions.map((num) => (
            <div key={num.number}>
              <RatingItem
                item_num={num.number}
                ratingInputs={ratingInputs}
                setRatingInputs={setRatingInputs}
                showPostMessageError={false}
                ratingValues={ratingValues}
                setRatingValues={setRatingValues}
                isEditing={isEditing}
              />
            </div>
          ))}

          {!isEditing && !(rankingItemsCount > 10) && (
            <div className="addItemsBtnWrapper">
              <button
                className="feedGhostBtn"
                onClick={() => {
                  setNumPollOptions([...numPollOptions, { number: rankingItemsCount }]);
                  setRankingItemsCount(rankingItemsCount + 1);
                }}
              >
                {t("communityPage.ratingModal.addMoreItems")}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="postModalActions">
        <button className="feedGhostBtn" onClick={closeModal}>
          {t("communityPage.ratingModal.cancel")}
        </button>

        <button
          className="feedPrimaryBtn"
          onClick={isEditing ? handleEditRating : handleCreateRating}
          disabled={isPosting || (isEditing && (!postTitle.trim() || !postContent.trim()))}
          style={
            isPosting || (isEditing && (!postTitle.trim() || !postContent.trim()))
              ? { opacity: 0.5, cursor: "not-allowed" }
              : {}
          }
        >
          {isPosting
            ? isEditing
              ? t("communityPage.ratingModal.saving")
              : t("communityPage.ratingModal.posting")
            : isEditing
            ? t("communityPage.ratingModal.save")
            : t("communityPage.ratingModal.post")}
        </button>
      </div>
    </div>
  </div>
)}

          {/* REMOVE the old communityInfo div entirely */}

        {group.visibility === "private" && !isJoined ? (<>
          <div className="communityContent">
            <div className="feedEmptyCard">{t("communityPage.privateGate")}</div>
          </div>
        </>):(<>
        {/* Posts feed */}
          <div className="communityContent">
            {postsLoading ? (
              <div className="feedEmptyCard">{t("communityPage.feed.loading")}</div>
          ) : (() => {
            const visiblePosts = posts.filter(
              (p) =>
                !blockedUserIds.includes(String(p.authorID)) &&
                !(p?.attributes?.blockedBy || []).some((b) => String(b) === String(userId))
            );
            return visiblePosts.length === 0 ? (
              <>{searchquery != '' ? (
                  <div className="feedEmptyCard">{t("communityPage.search.noMatches")}</div>
                ) : (
                  <div className="feedEmptyCard">
                    {t("communityPage.feed.noPosts", {
  channel: currentChannel ?? t("communityPage.channels.all")
})}
                  </div>
                )
              }</>
              ) : (
                visiblePosts.map((post) => <PostCard
                    key={post.id}
                    post={post}
                    community={{...group, groupID: group.id}}
                    groupID={groupID}
                    members={members}
                    creatorID={group?.creatorID}
                    setIsPostModalOpen={setIsPostModalOpen}
                    setPostId={setPostId}
                    setPostTitle={setPostTitle}
                    setPostContent={setPostContent}
                    setPostAttachmentId={setPostAttachmentId}
                    setIsPollModalOpen={setIsPollModalOpen}
                    setPollInputs={setPollInputs}
                    setPollOptionsCount={setPollOptionsCount}
                    setQuestionContent={setQuestionContent}
                    setRankingInputs={setRankingInputs}
                    setRatingInputs={setRatingInputs}
                    setRatingValues={setRatingValues}
                    setUpload={setUpload}
                    setIsEditing={setIsEditing}
                    setIsRankingModalOpen={setIsRankingModalOpen}
                    setIsRatingModalOpen={setIsRatingModalOpen}
                    setIsEditingRanking={setIsEditingRanking}
                    setNumPollOptions={setNumPollOptions}
                    setRankingItemsCount={setRankingItemsCount}
                    onPostDeleted={() => fetchPosts()}
                  />)
              );
            })()}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PollChoice({ poll_number, pollInputs, setPollInputs, showPostMessageError }) {
  const { t } = useTranslation();
  const [pollOption, setPollOption] = useState("");
  const optionAtLimit = pollOption.length >= MAX_POLL_CHOICE;
  const ph = t("communityPage.pollModal.choicePlaceholder", { number: poll_number });

  return (
    <div className="postModalFieldWrapper">
      <div className="postModalFieldLabel">
        {poll_number === 1 && <span className="required-star">*</span>}
{t("communityPage.pollModal.choiceLabel")} {poll_number}
      </div>

      <input
        className="postModalInput"
        type="text"
        placeholder={ph}
        value={pollOption}
        onChange={(e) => {
          setPollOption(e.target.value);
          updateArray(pollInputs, setPollInputs, poll_number, e.target.value);
        }}
        maxLength={MAX_POLL_CHOICE}
      />

      <div>
        {showPostMessageError && (
          <div className="poll-field-error-message">
            {t("communityPage.pollModal.choiceRequired")}
          </div>
        )}

        <span className={`charCounter ${optionAtLimit ? "charCounter--limit" : ""}`}>
          {pollOption.length}/{MAX_POLL_CHOICE}
        </span>
      </div>
    </div>
  );
}

function updateArray( inputs, setInputs, num, value ) {
  let newArray = [];
  newArray = inputs;
  newArray.splice((num-1), 1, value.trim());
  setInputs(newArray);
  console.log(inputs)
}

function RankingItem({ item_num, rankingInputs, setRankingInputs, showPostMessageError }) {
  const { t } = useTranslation();
  const [rankingItem, setRankingItem] = useState(rankingInputs[item_num - 1] || "");
  const itemAtLimit = rankingItem.length >= MAX_POLL_CHOICE;
  const ph = t("communityPage.rankingModal.itemPlaceholder", { number: item_num });

  return (
    <div className="postModalFieldWrapper">
      <div className="postModalFieldLabel">
        {item_num === 1 && <span className="required-star">*</span>}
        {t("communityPage.rankingModal.itemLabel")} {item_num}
      </div>

      <input
        className="postModalInput"
        type="text"
        placeholder={ph}
        value={rankingItem}
        onChange={(e) => {
          setRankingItem(e.target.value);
          updateArray(rankingInputs, setRankingInputs, item_num, e.target.value);
        }}
        maxLength={MAX_POLL_CHOICE}
      />

      <div>
        {showPostMessageError && (
          <div className="poll-field-error-message">
            {t("communityPage.rankingModal.itemRequired")}
          </div>
        )}

        <span className={`charCounter ${itemAtLimit ? "charCounter--limit" : ""}`}>
          {rankingItem.length}/{MAX_POLL_CHOICE}
        </span>
      </div>
    </div>
  );
}

 function RatingItem({ item_num, ratingInputs, setRatingInputs, showPostMessageError, ratingValues, setRatingValues, isEditing }) {
  const { t } = useTranslation();
  const [ratingItem, setRatingItem] = useState(ratingInputs[item_num - 1] || "");
  const itemAtLimit = ratingItem.length >= MAX_POLL_CHOICE;
  const ph = t("communityPage.ratingModal.itemPlaceholder", { number: item_num });

  return (
    <div>
      <div className="ratingWrapper2">
        {!isEditing && (
          <div className="ratingWrapper">
            <div className="postModalFieldLabel">
              {item_num === 1 && <span className="required-star">*</span>}
              {t("communityPage.ratingModal.itemLabel")} {item_num}
            </div>

            <input
              className="ratingInput"
              type="text"
              placeholder={ph}
              value={ratingItem}
              onChange={(e) => {
                setRatingItem(e.target.value);
                updateArray(ratingInputs, setRatingInputs, item_num, e.target.value);
              }}
              maxLength={MAX_POLL_CHOICE}
            />

            {showPostMessageError && (
              <div className="post-field-error-message">
                {t("communityPage.ratingModal.ratingItemRequired")}
              </div>
            )}

            <span className={`rankingCharCounter ${itemAtLimit ? "rankingCharCounter--limit" : ""}`}>
              {ratingItem.length}/{MAX_POLL_CHOICE}
            </span>
          </div>
        )}

        {!isEditing && (
          <CreateStar
            item_num={item_num}
            ratingValues={ratingValues}
            setRatingValues={setRatingValues}
          />
        )}
      </div>
    </div>
  );
}

function RuleItem({ item_num, ruleInputs, setRuleInputs, content }) {
  const { t } = useTranslation();
  const [ruleItem, setRuleItem] = useState(content || (ruleInputs[item_num - 1] || ""));
  const itemAtLimit = ruleItem.length >= 100;
  const ph = t("communityPage.rulesModal.rulePlaceholder", { number: item_num });
  return (
    <div>
      <input
        className="postModalInput"
        type="text"
        placeholder={ph}
        value={ruleItem}
        onChange={(e) => { setRuleItem(e.target.value); updateArray(ruleInputs, setRuleInputs, item_num, e.target.value); }}
        maxLength={100}
      />

      <div>
        <span className={`charCounter ${itemAtLimit ? "charCounter--limit" : ""}`}>
          {ruleItem.length}/{100}
        </span>
      </div>
    </div>
  );
}

function CreateStar({ item_num, setRatingValues, ratingValues }) {
  const { t } = useTranslation();
  const initialValue = ratingValues[item_num - 1] || 0;
  const getStarSrcs = (val) => [
    val >= 1 ? fullStar : val >= 0.5 ? halfStar : emptyStar,
    val >= 2 ? fullStar : val >= 1.5 ? halfStar : emptyStar,
    val >= 3 ? fullStar : val >= 2.5 ? halfStar : emptyStar,
    val >= 4 ? fullStar : val >= 3.5 ? halfStar : emptyStar,
    val >= 5 ? fullStar : val >= 4.5 ? halfStar : emptyStar,
  ];

  const [srcs, setSrcs] = useState(getStarSrcs(initialValue));
  const [isClick, setIsClick] = useState(initialValue > 0);
  const [clickedSrcs, setClickedSrcs] = useState(getStarSrcs(initialValue));

  const handleHover = (index, isHalf) => {
    setSrcs((prev) =>
      prev.map((_, i) => {
        if (i < index) return fullStar;
        if (i === index) return isHalf ? halfStar : fullStar;
        return emptyStar;
      })
    );
  };

  const handleEndHover = () => {
    if (!isClick) {
      setSrcs([emptyStar, emptyStar, emptyStar, emptyStar, emptyStar]);
    } else {
      setSrcs(clickedSrcs);
    }
  };

  const handleStarMove = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    handleHover(index, isHalf);
  };

  const handleClick = (e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const isHalf = e.clientX - rect.left < rect.width / 2;
    const selectedSrcs = srcs.map((_, i) => {
      if (i < index) return fullStar;
      if (i === index) return isHalf ? halfStar : fullStar;
      return emptyStar;
    });

    setIsClick(true);
    setClickedSrcs(selectedSrcs);
    setSrcs(selectedSrcs);

    const value = index + (isHalf ? 0.5 : 1);
    updateRatings(value);
  };

  function updateRatings(value) {
    setRatingValues((prev) => {
      const next = [...prev];
      next.splice(item_num - 1, 1, value);
      return next;
    });
  }

  return (
    <div>
      <div className="starContainer">
        <img src={srcs[0]} className="star" alt="one star" onMouseMove={(e) => handleStarMove(e, 0)} onMouseLeave={handleEndHover} onClick={(e) => handleClick(e, 0)} />
        <img src={srcs[1]} className="star" alt="two stars" onMouseMove={(e) => handleStarMove(e, 1)} onMouseLeave={handleEndHover} onClick={(e) => handleClick(e, 1)} />
        <img src={srcs[2]} className="star" alt="three stars" onMouseMove={(e) => handleStarMove(e, 2)} onMouseLeave={handleEndHover} onClick={(e) => handleClick(e, 2)} />
        <img src={srcs[3]} className="star" alt="four stars" onMouseMove={(e) => handleStarMove(e, 3)} onMouseLeave={handleEndHover} onClick={(e) => handleClick(e, 3)} />
        <img src={srcs[4]} className="star" alt="five stars" onMouseMove={(e) => handleStarMove(e, 4)} onMouseLeave={handleEndHover} onClick={(e) => handleClick(e, 4)} />
      </div>
      <div>
        <span
          className="clearRatingText"
          onClick={() => {
            setIsClick(false);
            setSrcs([emptyStar, emptyStar, emptyStar, emptyStar, emptyStar]);
            updateRatings(0);
          }}
        >
          {t("communityPage.ratingModal.clearRating")}
        </span>
      </div>
    </div>
  );
}
