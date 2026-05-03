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
import refreshIcon from "assets/refresh-icon.png";
import isPrivate from "utilities/isPrivate.js"
import { useTranslation } from "react-i18next";
import { useFocusTrap } from "utilities/useFocusTrap";
import CreateCommunity from "./CreateCommunity";

export default function HomePage() {
    const { t } = useTranslation();

    const TAG_OPTIONS = [
        "Music", "Pop Culture", "Gaming", "Travel", "Food", "Sports", "Tech", "Movies", "Humor", "Scary", 
        "Science", "Work", "Love", "Art", "Nature", "Books", "School", "Fun", "Health", "Misc.",
    ];
    
    const [pageReady, setPageReady] = useState(false);
    const [pinnedLoaded, setPinnedLoaded] = useState(false);
    const [forYouLoading, setForYouLoading] = useState(false);
    const [followingLoading, setFollowingLoading] = useState(false);
    
    const myCommunitiesScrollRef = useRef(null);
    const recommendedCommunitiesScrollRef = useRef(null);
    const discoverCommunitiesScrollRef = useRef(null);
    const [activeTab, setActiveTab] = useState("communities");
    const [showAllMyCommunities, setShowAllMyCommunities] = useState(false);
    const [showAllRecommendedCommunities, setShowAllRecommendedCommunities] = useState(false);
    const [showAllDiscoverCommunities, setShowAllDiscoverCommunities] = useState(false);
    const [showInterestModal, setShowInterestModal] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    const userId = String(sessionStorage.getItem("user"));
    const token = sessionStorage.getItem("user-token");
    const [user, setUser] = useState(null);
    const [selectedInterestTags, setSelectedInterestTags] = useState(new Set());
    const [hasReachedTagLimit, setHasReachedTagLimit] = useState(false);
    
    const [groups, setGroups] = useState([]);
    const [myGroups, setMyGroups] = useState([]);
    const [recommendedGroups, setRecommendedGroups] = useState([]);
    const [discoverGroups, setDiscoverGroups] = useState([]);
    const [joinedGroupIDs, setJoinedGroupIDs] = useState(new Set());
    const [kickedGroupIDs, setKickedGroupIDs] = useState(new Set());
    const [requestedGroupIDs, setRequestedGroupIDs] = useState(new Set());
    const [bannerMap, setBannerMap] = useState({});
    const [pins, setPins] = useState(new Set());
    
    const [forYouPosts, setForYouPosts] = useState([]);
    const [followingPosts, setFollowingPosts] = useState([]);
  
    const [isCreateCommunityModal, setIsCreateCommunityModal] = useState("");
    
    const [postId, setPostId] = useState(null);
    const [postTitle, setPostTitle] = useState("");
    const [postContent, setPostContent] = useState("");
    const [postAttachmentId, setPostAttachmentId] = useState(null);
    const [upload, setUpload] = useState(null);
    const [editTitleError, setEditTitleError] = useState("");
    const [editContentError, setEditContentError] = useState("");

    useEffect(() => {
        const justRegistered = sessionStorage.getItem("justRegistered");
        if (justRegistered === "true") {
            setShowInterestModal(true);
        }
    }, []);
    
    useEffect(() => {
        const fetchUser = async () => {
            try {
                // fetch the current user's groups
                let url = `${process.env.REACT_APP_API_PATH}/users/${userId}`;
                let response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                let data = await response.json();
                let dataAttributes = data.attributes ?? {};
                let dataUsername = dataAttributes.username ?? "Unknown";
                let dataInterestedTags = new Set(dataAttributes.interestedTags ?? []);
                let dataPinnedIDs = new Set(dataAttributes.pinnedCommunities ?? []);
                let dataShowTutorial = dataAttributes.showTutorial ?? false;
                
                // stringify the pinned ids
                let normalPinnedIDs = new Set();
                for (let elemPinnedID of dataPinnedIDs) {
                    normalPinnedIDs.add(String(elemPinnedID));
                }
                
                // normalize the user
                let normalUser = {
                    ...data,
                    attributes: {
                        ...dataAttributes,
                        username: dataUsername,
                        interestedTags: dataInterestedTags,
                        pinnedCommunities: normalPinnedIDs,
                        showTutorial: dataShowTutorial,
                    },
                };
                
                return normalUser;
            }
            
            // print an error
            catch (error) {
                console.error(`[ERROR] fetchUser failed: ${error}`);
                return {
                    attributes: {
                        username: "Unknown",
                        interestedTags: new Set(),
                        pinnedCommunities: new Set(),
                        showTutorial: false,
                    },
                };
            }
        };

        const fetchUserMemberships = async () => {
            try {
                // fetch the current user's groups
                let query = `userID=${userId}`;
                let url = `${process.env.REACT_APP_API_PATH}/group-members?${query}`;
                let response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                let data = await response.json();
                let dataMemberships = data[0] ?? [];
                
                // process memberships
                let accJoinedIDs = new Set();
                let accKickedIDs = new Set();
                for (let elemMembership of dataMemberships) {
                    // extract the element data
                    let elemGroupID = String(elemMembership.groupID) ?? null;
                
                    // skip memberships with invalid group ids
                    if (elemGroupID === null) {
                        continue;
                    }
                    
                    // accumulate group ids based on roles
                    if (elemMembership.role === "kicked") {
                        accKickedIDs.add(elemGroupID);
                    } else {
                        accJoinedIDs.add(elemGroupID);
                    }
                }
                
                return [accJoinedIDs, accKickedIDs];
            }
            
            // print an error
            catch (error) {
                console.error(`[ERROR] fetchUserMemberships failed: ${error}`);
                return [new Set(), new Set()];
            }
        };

        const fetchCommunities = async (kickedGroupIDs) => {
            try {
                // fetch all the groups
                let url = `${process.env.REACT_APP_API_PATH}/groups`;
                let response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                let data = await response.json();
                let dataCommunities = data[0] ?? [];
                
                // process the communities
                let accCommunities = [];
                for (let elemCommunity of dataCommunities) {
                    // extract the element data
                    let elemGroupID = String(elemCommunity.id) ?? null;
                    let elemName = elemCommunity.name ?? "Unknown"
                    let elemAttributes = elemCommunity.attributes ?? {};
                    let elemCreatorID = String(elemAttributes.creatorID) ?? null;
                    let elemTags = elemAttributes.tags ?? [];
                    let elemColor = elemAttributes.color ?? "#888";
                    let elemIsPrivate = elemAttributes.visibility === "private";
                    let elemRequests = elemAttributes.requested ?? [];
                    let elemIsRequested = elemRequests[userId] === true;
                    
                    // normalize the community
                    let normalCommunity = {
                        groupID: elemGroupID,
                        name: elemName,
                        creatorID: elemCreatorID,
                        tags: elemTags,
                        color: elemColor,
                        isPrivate: elemIsPrivate,
                        isRequested: elemIsRequested,
                        attributes: elemAttributes,
                    };
                    
                    // skip communities with invalid IDs
                    if (
                        elemCommunity.groupID === null || 
                        elemCommunity.creatorID === null
                    ) {
                        continue;
                    }
                    
                    // skip kicked communities
                    if (kickedGroupIDs.has(elemCommunity.groupID)) {
                        continue;
                    }
                    
                    // accumulate the element
                    accCommunities.push(normalCommunity);
                }
                
                return accCommunities;
            }
            
            // print an error
            catch (error) {
                console.error(`[ERROR] fetchCommunities failed: ${error}`);
                return [];
            }
        };
    
        const load = async () => {
            // begin loading
            setPageReady(false);
            setPinnedLoaded(false);
            
            // fetch user
            const currentUser = await fetchUser();
            const interestedTags = currentUser.attributes.interestedTags;
            const pinnedIDs = currentUser.attributes.pinnedCommunities;
            setUser(currentUser);
            setSelectedInterestTags(interestedTags);
            setHasReachedTagLimit(interestedTags.size >= 3);
            setPins(pinnedIDs);
            
            // fetch memberships
            const [joinedIDs, kickedIDs] = await fetchUserMemberships();
            setJoinedGroupIDs(joinedIDs);
            setKickedGroupIDs(kickedIDs);
            
            // fetch communities
            const communities = await fetchCommunities(kickedIDs);
            setGroups(communities);
            
            // load banner images, don't wait
            loadBannerImages(communities);
            
            // determine joined communities
            let joinedCommunities = communities.filter((community) => {
                return joinedIDs.has(community.groupID);
            }).sort((communityA, communityB) => {
                const aPinned = pinnedIDs.has(communityA.groupID) ? 1 : 0;
                const bPinned = pinnedIDs.has(communityB.groupID) ? 1 : 0;
                
                if (bPinned !== aPinned) {
                    return bPinned - aPinned;
                }
                return communityA.name.localeCompare(communityB.name);
            });
            setMyGroups(joinedCommunities);
            
            // determine recommended communities
            let recommendedTags = new Set(joinedCommunities.map((community) => {
                return community.tags;
            }).flat());
            let recommendedCommunities = communities.filter((community) => {
                if (joinedIDs.has(community.groupID)) {
                    return false;
                }
                
                for (const tag of community.tags) {
                    if (recommendedTags.has(tag)) {
                        return true;
                    }
                }
                
                return false;
            });
            for (let i = recommendedCommunities.length-1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i+1));
                [
                    recommendedCommunities[i], 
                    recommendedCommunities[j],
                ] = [
                    recommendedCommunities[j], 
                    recommendedCommunities[i],
                ];
            }
            recommendedCommunities = recommendedCommunities.slice(0, 
                Math.min(20, recommendedCommunities.length),
            );
            setRecommendedGroups(recommendedCommunities);
            
            // determine interested communities
            let interestedCommunities = communities.filter((community) => {
                if (joinedIDs.has(community.groupID)) {
                    return false;
                }
                
                for (const tag of community.tags) {
                    if (interestedTags.has(tag)) {
                        return true;
                    }
                }
                
                return false;
            });
            for (let i = interestedCommunities.length-1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i+1));
                [
                    interestedCommunities[i], 
                    interestedCommunities[j],
                ] = [
                    interestedCommunities[j], 
                    interestedCommunities[i],
                ];
            }
            interestedCommunities = interestedCommunities.slice(0, 
                Math.min(20, interestedCommunities.length),
            );
            setDiscoverGroups(interestedCommunities);
            
            // determine requested communities
            const requestedIDs = new Set();
            communities.forEach((community) => {
                if (community.isRequested) {
                    requestedIDs.add(community.groupID);
                }
            });
            setRequestedGroupIDs(requestedIDs);
            
            // finish loading
            setPageReady(true);
            setPinnedLoaded(true);
        };
        load();
    }, [userId]);
    
    const refreshRecommendedCommunities = () => {
        if (isRefreshing) {
            return;
        }
        
        // begin refreshing
        setIsRefreshing(true);
    
        // update recommended communities
        let recommendedTags = new Set(myGroups.map((community) => {
            return community.tags;
        }).flat());
        let recommendedCommunities = groups.filter((community) => {
            if (joinedGroupIDs.has(community.groupID)) {
                return false;
            }
            
            for (const tag of community.tags) {
                if (recommendedTags.has(tag)) {
                    return true;
                }
            }
            
            return false;
        });
        for (let i = recommendedCommunities.length-1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i+1));
            [
                recommendedCommunities[i], 
                recommendedCommunities[j],
            ] = [
                recommendedCommunities[j], 
                recommendedCommunities[i],
            ];
        }
        recommendedCommunities = recommendedCommunities.slice(0, 
            Math.min(20, recommendedCommunities.length),
        );
        setRecommendedGroups(recommendedCommunities);
        
        // scroll to start
        scrollCommunities(recommendedCommunitiesScrollRef, "start");
        
        // finish refreshing after 0.5 seconds
        setTimeout(() => setIsRefreshing(false), 500);
    };
    
    const refreshDiscoverCommunities = () => {
        if (isRefreshing) {
            return;
        }
        
        // begin refreshing
        setIsRefreshing(true);
    
        // update interested communities
        let interestedCommunities = groups.filter((community) => {
            if (joinedGroupIDs.has(community.groupID)) {
                return false;
            }
            
            for (const tag of community.tags) {
                if (selectedInterestTags.has(tag)) {
                    return true;
                }
            }
            
            return false;
        });
        for (let i = interestedCommunities.length-1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i+1));
            [
                interestedCommunities[i], 
                interestedCommunities[j],
            ] = [
                interestedCommunities[j], 
                interestedCommunities[i],
            ];
        }
        interestedCommunities = interestedCommunities.slice(0, 
            Math.min(20, interestedCommunities.length),
        );
        setDiscoverGroups(interestedCommunities);
        
        document.activeElement?.blur();
        
        // scroll to start
        scrollCommunities(discoverCommunitiesScrollRef, "start");
        
        // finish refreshing after 1 second
        setTimeout(() => setIsRefreshing(false), 1000);
    };
    
    const handleJoin = async (group) => {
        try {
            // send join request
            let url = `${process.env.REACT_APP_API_PATH}/group-members`;
            let response = await fetch(url, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userID: Number(userId), 
                    groupID: Number(group.groupID), 
                    attributes: {}
                }),
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // update joined groupIDs
            let joinedIDs = new Set(joinedGroupIDs.add(group.groupID));
            setJoinedGroupIDs(joinedIDs);
            
            // update my communities
            setMyGroups(prev => [...prev, group]);
            
            // send notification
            if (!group.isPrivate) {
                notifyOwnerAndModeratorsOfPublicJoin({
                    token,
                    groupId: group.groupID,
                    communityName: group.name,
                    creatorId: group.creatorID,
                    joiningUserId: userId,
                });
            }
        }
        
        // print an error
        catch (error) {
            console.error(`[ERROR] handleJoin failed: ${error}`);
        }
    };
    
    const addPin = async (group) => {        
        try {
            const pinnedIDs = new Set(pins);
            pinnedIDs.add(group.groupID);
        
            // update the current user's tags
            let url = `${process.env.REACT_APP_API_PATH}/users/${userId}`;
            let response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...user,
                    attributes: {
                        ...user.attributes,
                        interestedTags: Array.from(user.attributes.interestedTags),
                        pinnedCommunities: Array.from(pinnedIDs),
                    }
                }),
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // extract the response data
            let data = await response.json();
            let dataAttributes = data.attributes ?? {};
            let dataPinnedIDs = new Set(dataAttributes.pinnedCommunities ?? []);
            
            // stringify the pinned ids
            let normalPinnedIDs = new Set();
            for (let elemPinnedID of dataPinnedIDs) {
                normalPinnedIDs.add(String(elemPinnedID));
            }
            
            // update the state
            setPins(normalPinnedIDs);
            
            // sort my groups
            setMyGroups(prev => prev.sort((communityA, communityB) => {
                const aPinned = normalPinnedIDs.has(communityA.groupID) ? 1 : 0;
                const bPinned = normalPinnedIDs.has(communityB.groupID) ? 1 : 0;
                
                if (bPinned !== aPinned) {
                    return bPinned - aPinned;
                }
                return communityA.name.localeCompare(communityB.name);
            }));
        }
        
        // print an error
        catch (error) {
            console.error(`[ERROR] addPin failed: ${error}`);
        }
    };

    const removePin = async (group) => {
        try {
            const pinnedIDs = new Set(pins);
            pinnedIDs.delete(group.groupID);
        
            // update the current user's tags
            let url = `${process.env.REACT_APP_API_PATH}/users/${userId}`;
            let response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...user,
                    attributes: {
                        ...user.attributes,
                        interestedTags: Array.from(user.attributes.interestedTags),
                        pinnedCommunities: Array.from(pinnedIDs),
                    }
                }),
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // extract the response data
            let data = await response.json();
            let dataAttributes = data.attributes ?? {};
            let dataPinnedIDs = new Set(dataAttributes.pinnedCommunities ?? []);
            
            // stringify the pinned ids
            let normalPinnedIDs = new Set();
            for (let elemPinnedID of dataPinnedIDs) {
                normalPinnedIDs.add(String(elemPinnedID));
            }
            
            // update the state
            setPins(normalPinnedIDs);
            
            // sort my groups
            setMyGroups(prev => prev.sort((communityA, communityB) => {
                const aPinned = normalPinnedIDs.has(communityA.groupID) ? 1 : 0;
                const bPinned = normalPinnedIDs.has(communityB.groupID) ? 1 : 0;
                
                if (bPinned !== aPinned) {
                    return bPinned - aPinned;
                }
                return communityA.name.localeCompare(communityB.name);
            }));
        }
        
        // print an error
        catch (error) {
            console.error(`[ERROR] removePin failed: ${error}`);
        }
    };
    
    const handleInterestTagClick = (tag) => {
        // update selected tags
        const interestedTags = new Set(selectedInterestTags);
        if (interestedTags.has(tag)) {
            interestedTags.delete(tag);
        } else if (selectedInterestTags.length >= 3) {
            return;
        } else {
            interestedTags.add(tag);
        }
        setSelectedInterestTags(interestedTags);
        setHasReachedTagLimit(interestedTags.size >= 3);
        
        // determine interested communities
        let interestedCommunities = groups.filter((community) => {
            if (joinedGroupIDs.has(community.groupID)) {
                return false;
            }
            
            for (const tag of community.tags) {
                if (interestedTags.has(tag)) {
                    return true;
                }
            }
            
            return false;
        });
        for (let i = interestedCommunities.length-1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i+1));
            [
                interestedCommunities[i], 
                interestedCommunities[j],
            ] = [
                interestedCommunities[j], 
                interestedCommunities[i],
            ];
        }
        interestedCommunities = interestedCommunities.slice(0, 
            Math.min(20, interestedCommunities.length),
        );
        setDiscoverGroups(interestedCommunities);
    };

    const handleCloseInterestModal = () => {
        const updateInterestedTags = async (interestedTags) => {
            try {            
                // update the current user's tags
                let url = `${process.env.REACT_APP_API_PATH}/users/${userId}`;
                let response = await fetch(url, {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        ...user,
                        attributes: {
                            ...user.attributes,
                            interestedTags: Array.from(interestedTags),
                            pinnedCommunities: Array.from(user.attributes.pinnedCommunities),
                        }
                    }),
                });
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                let data = await response.json();
                let dataAttributes = data.attributes ?? {};
                let dataInterestedTags = new Set(dataAttributes.interestedTags ?? []);
                
                // update the state
                setSelectedInterestTags(dataInterestedTags);
            }
            
            // print an error
            catch (error) {
                console.error(`[ERROR] updateInterestedTags failed: ${error}`);
            }
        };
    
        // update selected tags
        updateInterestedTags(selectedInterestTags);

        // close the modal first
        setShowInterestModal(false);
        sessionStorage.setItem("justRegistered", "false"); // Set to false string rather than remove

        // Delay the event slightly to let the Interest Modal unmount
        setTimeout(() => {
            if (user?.attributes?.showTutorial !== false) {
                window.dispatchEvent(new CustomEvent('trigger-tutorial'));
            }
        }, 100);
    };

    const interestModalRef = useFocusTrap(showInterestModal, handleCloseInterestModal);

    const scrollCommunities = (scrollRef, direction) => {
        const element = scrollRef.current;
        if (!element) return;

        // Disable pointer events during scroll
        element.style.pointerEvents = 'none';
        if (direction === "start") {
            element.scrollBy({
                left: 0,
                behavior: "auto"
            });
        } else if (direction === "end") {
            element.scrollBy({
                left: element.scrollWidth, 
                behavior: "auto"
            });
        } else {
            const card = element.querySelector('.communityCardLink--carousel');
            const cardWidth = card ? card.offsetWidth + 10 : 160;
            element.scrollBy({
                left: direction === "left" ? -cardWidth : cardWidth, 
                behavior: "smooth"
            });
        }
        setTimeout(() => { element.style.pointerEvents = ''; }, 400);
    };

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

  if (!pageReady || !pinnedLoaded) {
    return (
      <div className="feedPage">
        <div className="feedShell" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <p style={{ opacity: 0.5, fontSize: "18px" }}>{t("homePage.loading.page")}</p>
        </div>
      </div>
    );
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

  const titleError = !trimmedTitle ? t("communityPage.postModal.titleRequired") : "";
const contentError = !trimmedContent ? t("communityPage.postModal.captionRequired") : "";

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

      fetchForYouPosts(joinedGroupIDs);
  } catch (err) {
      console.error("Edit post failed:", err);
  }
  }

    return (
        <>
            {showInterestModal && (
                <div className="interestModalOverlay" role="dialog" aria-modal="true" aria-labelledby="interest-modal-title">
                    <div className="interestModal" ref={interestModalRef}>
                        <button
                            className="interestModalSkipBtn"
                            onClick={handleCloseInterestModal}
                        >
                            {t("homePage.interestModal.continue")}
                        </button>

                        <div className="interestModalInner">
                            <h1 className="interestModalTitle" id="interest-modal-title">{t("homePage.interestModal.welcomeTitle")}</h1>
                            <p className="interestModalIntro">
                                {t("homePage.interestModal.welcomeText")}
                            </p>
        <p className="interestModalHint">
  {t("homePage.interestModal.hint")}
</p>

                            <div className="interestModalTagBlock">
                                <h2 className="interestModalHeading" id="tags-heading">{t("homePage.interestModal.chooseUpTo3")}</h2>

                                {hasReachedTagLimit && (
                                    <p className="interestModalLimitMessage" role="alert">
                                        {t("homePage.interestModal.limitMessage")}
                                    </p>
                                )}

                                <div className="tagSelector" role="group" aria-labelledby="tags-heading">
                                    {TAG_OPTIONS.map((tag) => {
                                        const isSelected = selectedInterestTags.has(tag);
                                        const isDisabled = hasReachedTagLimit && !isSelected;

                                        return (
                                            <button
                                                key={tag}
                                                type="button"
                                                className={`tagChip ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                                                onClick={() => handleInterestTagClick(tag)}
                                                disabled={isDisabled}
                                                aria-pressed={isSelected}
                                            >
                                                {t(`tags.${tag}`)}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="interestModalResults">
          <h2 className="interestModalHeading">
            {selectedInterestTags.length === 0
              ? t("homePage.interestModal.suggested")
              : t("homePage.interestModal.matching")}
          </h2>

          {discoverGroups.length === 0 ? (
            <p className="interestModalEmpty">
              {t("homePage.interestModal.noMatches")}
            </p>
          ) : (
            <div className="communityList" style={{ marginTop: "12px" }}>
              {discoverGroups.map((group, index) => (
                <Link
                  key={index}
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
                    addPin={addPin}
                    removePin={removePin}
                    t={t}
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
          {t("homePage.tabs.communities")}
        </button>
        <button
          className={`feedTabBtn ${activeTab === "forYou" ? "active" : ""}`}
          onClick={() => {setActiveTab("forYou"); fetchForYouPosts(joinedGroupIDs)}}
        >
          {t("homePage.tabs.forYou")}
        </button>
        <button
          className={`feedTabBtn ${activeTab === "following" ? "active" : ""}`}
          onClick={() => {setActiveTab("following"); fetchFollowingPosts()}}
        >
          {t("homePage.tabs.following")}
        </button>
      </div>
      <div className="feedTabsDivider" />
    </div>
    
    {isCreateCommunityModal && (
      <CreateCommunity
        onCancel={(c) => setIsCreateCommunityModal(c)}
      />
    )}

    <div className="feedPage">
      <div className="feedShell">
        <div className="feedPanel">

            {activeTab === "communities" && (
                <div className="communityTabs">

                    {/* MY COMMUNITIES — horizontal scroll */}
                    <div className="communitySection community-section-my">
                        <div className="communitySectionHeader">
                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <h2>{t("homePage.sections.myCommunities")}</h2>
                                <button
                                    className="tutorial-help-icon"
                                    onClick={() => window.dispatchEvent(new CustomEvent('trigger-tutorial'))}
                                    title="Restart Tutorial"
                                    aria-label="Restart Tutorial"
                                >
                                    ?
                                </button>
                            </div>
                        <button className="feedPrimaryBtn" onClick={() => setIsCreateCommunityModal(true)}>{t("homePage.buttons.createCommunity")}</button>
                    </div>

                {myGroups.length === 0 ? (
                    <EmptyState
                        title={t("homePage.emptyStates.noMyCommunitiesTitle")}
                        subtitle={t("homePage.emptyStates.noMyCommunitiesSubtitle")}
                        buttonLabel={t("homePage.emptyStates.createFirstCommunity")}
                        onClick={() => setIsCreateCommunityModal(true)}
                        t={t}
                    />
                ) : (
                    <>
                        {pinnedLoaded && (
                            <>
                                {/* Horizontal carousel */}
                                <div className="communityCarouselWrapper">
                                    <button
                                        className="carouselArrow carouselArrow--left"
                                        onClick={() => scrollCommunities(myCommunitiesScrollRef, "left")}
                                        aria-label={t("homePage.communityCard.scrollLeft")}
                                        >‹
                                    </button>

                                    <div
                                        className="communityCarousel"
                                        ref={myCommunitiesScrollRef}
                                        >
                                        {myGroups.map((group, index) => (
                                            <Link
                                                key={index}
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
                                                    addPin={addPin}
                                                    removePin={removePin}
                                                    t={t}
                                                />
                                            </Link>
                                        ))}
                                    </div>

                                    <button
                                        className="carouselArrow carouselArrow--right"
                                        onClick={() => scrollCommunities(myCommunitiesScrollRef, "right")}
                                        aria-label={t("homePage.communityCard.scrollRight")}
                                        >›
                                    </button>
                                </div>

                                {/* View all toggle */}
                                {myGroups.length > 5 && (
                                    <div className="communityViewAllRow">
                                        <button
                                            className="communityViewAllBtn"
                                            onClick={() => setShowAllMyCommunities(prev => !prev)}
                                            >
                                            {showAllMyCommunities ? (
                                                t("homePage.communityCard.showLess")
                                            ) : (
                                                t("homePage.communityCard.viewAll", {count: myGroups.length})
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* Expanded grid when "view all" is open */}
                                {showAllMyCommunities && (
                                    <div className="communityList" style={{marginTop: "16px"}}>
                                        {myGroups.map((group, index) => (
                                            <Link
                                                key={index}
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
                                                    addPin={addPin}
                                                    removePin={removePin}
                                                    t={t}
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

                    {/* DISCOVER — horizontal scroll */}
                    <div className="communitySection community-section-discover">
                        <div className="communitySectionHeader">
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <h2>{t("homePage.sections.discover")}</h2>
                                <button
                                    className="home-action-button"
                                    onClick={() => {refreshDiscoverCommunities()}}
                                    disabled={isRefreshing}
                                    aria-label={t("homePage.actions.refreshDiscover")}
                                >
                                    <img
                                        className="discoverFilterIcon"
                                        src={refreshIcon}
                                        alt=""
                                    />
                                </button>
                            </div>
                            <button
                                className="home-action-button"
                                onClick={() => setShowInterestModal(true)}
                                aria-label={t("homePage.actions.filterDiscover")}
                            >
                                <img
                                    src={filterIcon}
                                    alt=""
                                    className="discoverFilterIcon"
                                />
                            </button>
                        </div>

                        {discoverGroups.length === 0 ? (
                    <EmptyState
                        title={t("homePage.emptyStates.noDiscoverTitle")}
                        subtitle={t("homePage.emptyStates.noDiscoverSubtitle")}
                        buttonLabel={t("homePage.emptyStates.noDiscoverButtonLabel")}
                        onClick={() => setShowInterestModal(true)}
                        t={t}
                    />
                ) : (
                    <>
                        <>
                            {/* Horizontal carousel */}
                            <div className="communityCarouselWrapper">
                                <button
                                    className="carouselArrow carouselArrow--left"
                                    onClick={() => scrollCommunities(discoverCommunitiesScrollRef, "left")}
                                    aria-label={t("homePage.communityCard.scrollLeft")}
                                    >‹
                                </button>

                                <div
                                    className="communityCarousel"
                                    ref={discoverCommunitiesScrollRef}
                                    >
                                    {discoverGroups.map((group, index) => (
                                        <Link
                                            key={index}
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
                                                addPin={addPin}
                                                removePin={removePin}
                                                t={t}
                                            />
                                        </Link>
                                    ))}
                                </div>

                                <button
                                    className="carouselArrow carouselArrow--right"
                                    onClick={() => scrollCommunities(discoverCommunitiesScrollRef, "right")}
                                    aria-label={t("homePage.communityCard.scrollRight")}
                                    >›
                                </button>
                            </div>

                            {/* View all toggle */}
                            {discoverGroups.length > 5 && (
                                <div className="communityViewAllRow">
                                    <button
                                        className="communityViewAllBtn"
                                        onClick={() => setShowAllDiscoverCommunities(prev => !prev)}
                                        >
                                        {showAllDiscoverCommunities ? (
                                            t("homePage.communityCard.showLess")
                                        ) : (
                                            t("homePage.communityCard.viewAll", {count: discoverGroups.length})
                                        )}
                                    </button>
                              </div>
                            )}

                            {/* Expanded grid when "view all" is open */}
                            {showAllDiscoverCommunities && (
                                <div className="communityList" style={{marginTop: "16px"}}>
                                    {discoverGroups.map((group, index) => (
                                        <Link
                                            key={index}
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
                                                addPin={addPin}
                                                removePin={removePin}
                                                t={t}
                                            />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    </>
                )}
            </div>

                    {/* RECOMMENDED — horizontal scroll */}
                    <div className="communitySection community-section-recommended">
                        <div className="communitySectionHeader">
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <h2>{t("homePage.sections.recommended")}</h2>
                                <button
                                    className="home-action-button"
                                    onClick={() => {refreshRecommendedCommunities()}}
                                    disabled={isRefreshing}
                                    aria-label={t("homePage.actions.refreshRecommended")}
                                >
                                    <img
                                        className="discoverFilterIcon"
                                        src={refreshIcon}
                                        alt=""
                                    />
                                </button>
                            </div>
                        </div>

                        {recommendedGroups.length === 0 ? (
                    <EmptyState
                        title={t("homePage.emptyStates.noRecommendedTitle")}
                        subtitle={t("homePage.emptyStates.noRecommendedSubtitle")}
                        buttonLabel={t("homePage.emptyStates.createFirstCommunity")}
                        onClick={() => setIsCreateCommunityModal(true)}
                        t={t}
                    />
                ) : (
                    <>
                        <>
                            {/* Horizontal carousel */}
                            <div className="communityCarouselWrapper">
                                <button
                                    className="carouselArrow carouselArrow--left"
                                    onClick={() => scrollCommunities(recommendedCommunitiesScrollRef, "left")}
                                    aria-label={t("homePage.communityCard.scrollLeft")}
                                    >‹
                                </button>

                                <div
                                    className="communityCarousel"
                                    ref={recommendedCommunitiesScrollRef}
                                    >
                                    {recommendedGroups.map((group, index) => (
                                        <Link
                                            key={index}
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
                                                addPin={addPin}
                                                removePin={removePin}
                                                t={t}
                                            />
                                        </Link>
                                    ))}
                                </div>

                                <button
                                    className="carouselArrow carouselArrow--right"
                                    onClick={() => scrollCommunities(recommendedCommunitiesScrollRef, "right")}
                                    aria-label={t("homePage.communityCard.scrollRight")}
                                    >›
                                </button>
                            </div>

                            {/* View all toggle */}
                            {recommendedGroups.length > 5 && (
                                <div className="communityViewAllRow">
                                    <button
                                        className="communityViewAllBtn"
                                        onClick={() => setShowAllRecommendedCommunities(prev => !prev)}
                                        >
                                        {showAllRecommendedCommunities ? (
                                            t("homePage.communityCard.showLess")
                                        ) : (
                                            t("homePage.communityCard.viewAll", {count: recommendedGroups.length})
                                        )}
                                    </button>
                              </div>
                            )}

                            {/* Expanded grid when "view all" is open */}
                            {showAllRecommendedCommunities && (
                                <div className="communityList" style={{marginTop: "16px"}}>
                                    {recommendedGroups.map((group, index) => (
                                        <Link
                                            key={index}
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
                                                addPin={addPin}
                                                removePin={removePin}
                                                t={t}
                                            />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </>
                    </>
                )}
            </div>
        </div>
      )}

          {activeTab === "forYou" && (
            <div className="forYouFeed">
              {forYouLoading ? (
                <div className="feedEmptyCard">{t("homePage.loading.posts")}</div>
              ) : forYouPosts.length === 0 ? (
                <EmptyState
                  title={t("homePage.emptyStates.forYouEmptyTitle")}
                  subtitle={t("homePage.emptyStates.forYouEmptySubtitle")}
                  buttonLabel={t("homePage.emptyStates.createFirstCommunity")}
                  onClick={() => setIsCreateCommunityModal(true)}
                  t={t}
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
                        onPostDeleted={() => fetchForYouPosts(joinedGroupIDs)}
                        onPostUpdated={() => fetchForYouPosts(joinedGroupIDs)}
                      />
                  );
                })
              )}
            </div>
          )}

            {activeTab === "following" && (
                <div className="forYouFeed">
                    {followingLoading ? (
                        <div className="feedEmptyCard">{t("homePage.loading.posts")}</div>
                    ) : followingPosts.length === 0 ? (
                        <EmptyState
                          title={t("homePage.emptyStates.followingEmptyTitle")}
                          subtitle={t("homePage.emptyStates.followingEmptySubtitle")}
                          buttonLabel={t("homePage.emptyStates.createFirstCommunity")}
                          onClick={() => setIsCreateCommunityModal(true)}
                          t={t}
                        />
                    ) : (
                        followingPosts.map((post) => {
                            const community = groups.find(
                                (g) => String(g.groupID) === String(post.recipientGroupID)
                            );
                            return (
                              <PostCard
                                key={post.id}
                                post={post}
                                community={community}
                                groupID={community?.groupID}
                                showFollow={false}
                                onPostUpdated={fetchFollowingPosts}
                              />
                            );
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
      <h3 className="postModalTitle">{t("homePage.editPostModal.title")}</h3>

      <input
        type="text"
        className={`postModalInput ${editTitleError ? "postModalInputError" : ""}`}
        value={postTitle}
        maxLength={100}
        onChange={(e) => {
          setPostTitle(e.target.value);
          if (e.target.value.trim()) setEditTitleError("");
        }}
        placeholder={t("homePage.editPostModal.titlePlaceholder")}
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
        placeholder={t("homePage.editPostModal.contentPlaceholder")}
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
          {t("homePage.buttons.upload")}
        </label>
        <span className="postModalFileName">
          {upload?.name || t("homePage.editPostModal.noFileSelected")}
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
          {t("homePage.buttons.cancel")}
        </button>

        <button
          className="postModalSaveBtn"
          onClick={handleSaveEditedPost}
        >
          {t("homePage.buttons.save")}
        </button>
      </div>
    </div>
  </div>
)}
  </>
);
}

function CommunityCard({group, isJoined, onJoin, bannerUrl, isRequested, onRequest, onCancelRequest, token, userid, pins, addPin, removePin, t }) {
  const groupid = group.groupID;
  // const [showMenu, setShowMenu] = useState(false);

  return (
  <div className={`communityCard ${Number(groupid) === 283 ? 'tutorial-community-283' : ''}`}>
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
                  <button className="joinBtn" onClick={(e) => { e.preventDefault(); onRequest(group.groupID); }}>{t("homePage.buttons.request")}</button>
                ) : (
                  <button className="requestedBtn" onClick={(e) => { e.preventDefault(); onCancelRequest(group.groupID); }}>{t("homePage.buttons.requested")}</button>
                )
              )
            ) : (
              !isJoined && (
                <button className="joinBtn" onClick={(e) => { e.preventDefault(); onJoin(group); }}>
                  {t("homePage.buttons.join")}
                </button>
              )
            )}
            <p>{group.isPrivate ? t("homePage.communityCard.private") : t("homePage.communityCard.public")}</p>
          </div>
        </div>

        <div className="communityCardDivider" />

          <div>
              <div className="communityTags">
                  {group.tags.map((tag, index) => (
                      <span key={index} className="tag">{t(`tags.${tag}`)}</span>
                  ))}
              </div>

              {isJoined && (
                  <>
                      {pins.has(groupid) ? (
                          <button
                              className="pinBtn"
                              type="button"
                              onClick={(e) => {e.preventDefault(); removePin(group);}}
                          >
                              <img className="pinFilled" src={pinIcon} alt="Filled pin" />
                          </button>
                      ) : (
                          <button
                              className="pinBtn"
                              type="button"
                              onClick={(e) => {e.preventDefault(); addPin(group);}}
                          >
                              <img className="pinUnfilled" src={pinIcon} alt="Unfilled pin" />
                          </button>
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

function EmptyState({ title, subtitle, buttonLabel, onClick, t}) {
  return (
    <div className="feedEmptyCard">
      <div className="feedEmptyIcon">∅</div>
      <h2 className="feedEmptyTitle">{title}</h2>
      <p className="feedEmptySubtitle">{subtitle}</p>
      <div className="feedEmptyActions">
          <button 
            className="feedGhostBtn"
            onClick={onClick}
            >{buttonLabel}
          </button>
      </div>
    </div>
  );
}

    // const groupsRef = useRef(groups);
    // useEffect(() => {
    //     groupsRef.current = groups;
    // }, [groups]);
  
    // const joinedGroupIDsRef = useRef(joinedGroupIDs);
    // useEffect(() => {
    //     joinedGroupIDsRef.current = joinedGroupIDs;
    //     if (pageReady) getPins();
    // }, [joinedGroupIDs]);
    
    // useEffect(() => {
    //   const justRegistered = sessionStorage.getItem("justRegistered");
    //    if (justRegistered === "true") {
    //      setShowInterestModal(true);
    //    }
    // }, []);
    
    // useEffect(() => {
    //     Promise.all([
    //         fetch(process.env.REACT_APP_API_PATH + "/group-members/", {
    //             headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    //         })
    //             .then((res) => res.json())
    //             .then((data) => {
    //                 const memberships = data[0] || [];
    // 
    //                 // Identify joined groups (not kicked)
    //                 const joined = memberships
    //                     .filter((m) => String(m.userID) === userId && m.attributes?.role !== "kicked")
    //                     .map((m) => String(m.groupID));
    // 
    //                 // Identify kicked groups
    //                 const kicked = memberships
    //                     .filter((m) => String(m.userID) === userId && m.attributes?.role === "kicked")
    //                     .map((m) => String(m.groupID));
    // 
    //                 const joinedSet = new Set(joined);
    //                 const kickedSet = new Set(kicked);
    // 
    //                 setJoinedGroupIDs(joinedSet);
    //                 setKickedGroupIDs(kickedSet);
    //                 fetchForYouPosts(joinedSet);
    // 
    //                 return kickedSet; // Pass to next then block
    //             }),
    //         fetch(process.env.REACT_APP_API_PATH + "/groups", {
    //             headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    //         })
    //             .then((res) => res.json())
    //     ])
    //         .then(([kickedSet, groupsData]) => {
    //             const groupsArray = groupsData[0] || [];
    //             // Filter out any groups where the user is kicked
    //             const normalized = groupsArray
    //                 .filter((g) => !kickedSet.has(String(g.id)))
    //                 .map((g) => ({
    //                     groupID: g.id,
    //                     name: g.name,
    //                     tags: g.attributes?.tags || [],
    //                     color: g.attributes?.color || "#888",
    //                     isPrivate: g.attributes?.visibility === "private",
    //                     creatorID: g.attributes?.creatorID ? String(g.attributes.creatorID) : null,
    //                     attributes: g.attributes || {},
    //                 }));
    //             setGroups(normalized);
    //             loadBannerImages(normalized);
    // 
    //             const potentiallyRequestedGroups = normalized
    //                 .filter((m) => (m.isPrivate === true) && (("requested" in m.attributes) === true))
    //                 .map((m) => ({
    //                     groupID: m.groupID,
    //                     requested: m.attributes?.requested,
    //                 }));
    // 
    //             const requested = potentiallyRequestedGroups
    //                 .filter((m) => m.requested?.[userId] === true) // Added optional chaining to prevent crash
    //                 .map((m) => String(m.groupID));
    //             setRequestedGroupIDs(new Set(requested));
    //         })
    //         .catch(() => {})
    //         .finally(() => setPageReady(true));
    // 
    //     getUser();
    //     fetchFollowingPosts();
    // }, []); // eslint-disable-line react-hooks/exhaustive-deps
    
    // Silent background refresh for like counts on For you + Following (same idea as CommunityPage).
    // useEffect(() => {
    //   const refreshReactions = () => {
    //     if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
    //     const joined = joinedGroupIDsRef.current;
    //     if (joined.size > 0) {
    //       fetchForYouPosts(joined, { silent: true, updateOnlyReactions: true });
    //     }
    //     fetchFollowingPosts({ silent: true, updateOnlyReactions: true });
    // 
    //     // Also refresh community banner thumbnails so changes (e.g. ownership transfer / moderator uploads)
    //     // show up when returning to the homepage without a full reload.
    //     const currentGroups = groupsRef.current;
    //     if (Array.isArray(currentGroups) && currentGroups.length > 0) {
    //       loadBannerImages(currentGroups);
    //     }
    //   };
    // 
    //   document.addEventListener("visibilitychange", refreshReactions);
    //   window.addEventListener("focus", refreshReactions);
    //   const intervalId = window.setInterval(refreshReactions, 1500);
    // 
    //   return () => {
    //   window.clearInterval(intervalId);
    //     document.removeEventListener("visibilitychange", refreshReactions);
    //     window.removeEventListener("focus", refreshReactions);
    //   };
    //   // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);

    // const getUser = () => {
    //     fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`)
    //     .then(res => res.json())
    //     .then(data => {
    //         setUser(data);
    //     });
    // };
    
    // const myGroups = groups.filter(
    //     (g) => joinedGroupIDs.has(String(g.groupID)) || (g.creatorID && g.creatorID === userId)
    // );

    // const discoverGroups = groups.filter(
    //     (g) => !joinedGroupIDs.has(String(g.groupID)) && g.creatorID !== userId
    // );
    
    // function handleInterestTagClick(tag) {
    //   setSelectedInterestTags((prev) => {
    //     if (prev.includes(tag)) {
    //       return prev.filter((t) => t !== tag);
    //     }
    // 
    //     if (prev.length >= 3) {
    //       return prev;
    //     }
    // 
    //     return [...prev, tag];
    //   });
    // }
    
    // const hasReachedTagLimit = selectedInterestTags.length >= 3;
    
    // const interestMatchedGroups = [...groups]
    // .filter((group) => !joinedGroupIDs.has(String(group.groupID)))
    // .map((group) => {
    //   const matchCount = group.tags.filter((tag) =>
    //   selectedInterestTags.includes(tag)
    //   ).length;
    // 
    //   return {
    //     ...group,
    //     matchCount,
    //   };
    // })
    // .filter((group) => selectedInterestTags.length === 0 || group.matchCount > 0)
    // .sort((a, b) => {
    //   if (b.matchCount !== a.matchCount) return b.matchCount - a.matchCount;
    //   return a.name.localeCompare(b.name);
    // });
    
    // const getPinned = (joinedCommunities) => {
    //     fetch(process.env.REACT_APP_API_PATH + "/users/" + userId, { method: "GET" })
    //     .then((res) => res.json())
    //     .then((user) => {
    //         const pinnedCommunities = user.attributes?.pinnedCommunities || [];
    //         setPins(pinnedCommunities);
    //         const pinOrder = new Map(pinnedCommunities.map((id, index) => [String(id), index]));
    //        const pinnedGroupsOrdered = [...joinedCommunities]
    //             .filter((group) => pinOrder.has(String(group.groupID)))
    //             .sort((a, b) =>
    //                 pinOrder.get(String(a.groupID)) - pinOrder.get(String(b.groupID))
    //             );
    //         setMyPinnedGroups(pinnedGroupsOrdered);
    //         setPinnedLoaded(true);
    //     });
    // };
    
    // function handleCloseInterestModal() {
    //   setShowInterestModal(false);
    //   sessionStorage.removeItem("justRegistered");
    //   
    //   Only trigger tutorial if the user's attributes allow it
    //   if (user?.attributes?.showTutorial !== false) {
    //     window.dispatchEvent(new CustomEvent('trigger-tutorial'));
    //   }
    // }
    
    // function handleJoin(groupID) {
    //   fetch(process.env.REACT_APP_API_PATH + "/group-members", {
    //     method: "POST",
    //     headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    //     body: JSON.stringify({ userID: Number(userId), groupID: Number(groupID), attributes: {} }),
    //   })
    //   .then((res) => res.json())
    //   .then(() => {
    //      const updated = new Set(joinedGroupIDs);
    //      updated.add(String(groupID));
    //      setJoinedGroupIDs(updated);
    //      fetchForYouPosts(updated);
    //      const g = groups.find((x) => String(x.groupID) === String(groupID));
    //      if (g && !g.isPrivate && g.creatorID) {
    //        notifyOwnerAndModeratorsOfPublicJoin({
    //          token,
    //          groupId: groupID,
    //          communityName: g.name,
    //          creatorId: g.creatorID,
    //          joiningUserId: userId,
    //        });
    //      }
    //    })
    //   .catch((err) => console.error("Join failed:", err));
    // }
    
    // function CommunityList({ groups, joinedGroupIDs, onJoin, bannerMap, requestedGroupIDs, onRequest, onCancelRequest, token, userid, pins, setPins, t }) {
    //     if (!groups || groups.length === 0) return null;
    //     return (
    //         <div className="communityList">
    //             {groups.map((group) => (
    //                 <Link
    //                     key={group.groupID}
    //                     to={`/community/${group.groupID}`}
    //                     className={`communityCardLink ${group.groupID === 283 ? 'tutorial-community-283' : ''}`}
    //                 >
    //                     <CommunityCard
    //                         group={group}
    //                       isJoined={joinedGroupIDs.has(String(group.groupID))}
    //                       onJoin={onJoin}
    //                       bannerUrl={bannerMap ? bannerMap[String(group.groupID)] : null}
    //                       isRequested={requestedGroupIDs.has(String(group.groupID))}
    //                       onRequest={onRequest}
    //                       onCancelRequest={onCancelRequest}
    //                       token={token}
    //                       userid={userid}
    //                       pins={pins}
    //                       setPins={setPins}
    //                       t={t}
    //                     />
    //         </Link>
    //       ))}
    //     </div>
    //   );
    // }
    
    // function addPin() {
    //   fetch(process.env.REACT_APP_API_PATH + "/users/" + userid, { method: "GET" })
    //   .then((res) => res.json())
    //   .then((user) => {
    //      const prevPins = user.attributes?.pinnedCommunities || [];
    //      if (!(prevPins.includes(groupid))) {
    //        fetch(process.env.REACT_APP_API_PATH + "/users/" + userid, {
    //          method: "PATCH",
    //          headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    //          body: JSON.stringify({
    //            attributes: {
    //              ...user.attributes,
    //              pinnedCommunities: [groupid, ...prevPins],
    //            }
    //          }),
    //        })
    //        .then((res) => res.json())
    //        .then((data) => {
    //           setIsPinned(true);
    //           setPins(data.attributes.pinnedCommunities);
    //         })
    //        .catch((err) => console.error("Request failed:", err));
    //      }
    //    });
    // }

    // function removePin() {
    //   fetch(process.env.REACT_APP_API_PATH + "/users/" + userid, { method: "GET" })
    //   .then((res) => res.json())
    //   .then((user) => {
    //      const newPins = (user.attributes?.pinnedCommunities || []).filter((e) => e != groupid);
    //      fetch(process.env.REACT_APP_API_PATH + "/users/" + userid, {
    //        method: "PATCH",
    //        headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
    //        body: JSON.stringify({
    //          attributes: {
    //            ...user.attributes,
    //            pinnedCommunities: newPins,
    //          }
    //        }),
    //      })
    //      .then((res) => res.json())
    //      .then((group) => {
    //          setIsPinned(false);
    //          setPins(group.attributes?.pinnedCommunities || []);
    //       })
    //       .catch((err) => console.error("Request failed:", err));
    //    });
    //  }
    
    // {/* DISCOVER — unchanged grid */}
    // <div className="communitySection community-section-discover">
    //     <div className="communitySectionHeader">
    //         <h2>{t("homePage.sections.discover")}</h2>
    // 
    //         <img
    //             src={filterIcon}
    //             alt="filter"
    //             className="discoverFilterIcon"
    //             onClick={() => setShowInterestModal(true)}
    //         />
    //     </div>
    //     {discoverGroups.length === 0 ? (
    //         <EmptyState
    //             title={t("homePage.emptyStates.noDiscoverTitle")}
    //             subtitle={t("homePage.emptyStates.noDiscoverSubtitle")}
    //             t={t}
    //         />
    //     ) : (
    //         <CommunityList
    //             groups={discoverGroups}
    //             joinedGroupIDs={joinedGroupIDs}
    //             onJoin={handleJoin}
    //             bannerMap={bannerMap}
    //             requestedGroupIDs={requestedGroupIDs}
    //             onRequest={handleRequestJoinPrivCommunity}
    //             onCancelRequest={handleCancelRequest}
    //             token={token}
    //             userid={userId}
    //             pins={pins}
    //             setPins={setPins}
    //             t={t}
    //         />
    //     )}
    // </div>

