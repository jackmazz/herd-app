import React, { useState, useEffect } from "react";
import "../archive/starter-code/App.css";
import pencilEdit from "../assets/pencil-edit.png";
import cameraIcon from "../assets/camera-icon.png";
import paintingIcon from "../assets/painting-icon.png";
import ellipsisIcon from "../assets/ellipsis-icon.svg";
import lockIcon from "../assets/lock-icon.svg";
import EditBioPopup from "./EditBioPopup";
import "styles/Profile.css";
import ProfilePageCounters from "./ProfilePageCounters";
import NoResultsBubble from "./NoResultsBubble";
import { useNavigate, useParams} from "react-router-dom";
import defaultProfileIcon from "../assets/default-profile-black.svg";
import ChangeBackgroundPhotoPopup from "./ChangeBackgroundPhotoPopup";
import ChangeProfilePhotoPopup from "./ChangeProfilePhotoPopup";
import ProfileEllipsisPopup from "./ProfileEllipsisPopup";
import FollowersList from "./FollowersList";
import FollowingList from "./FollowingList";
import BlockingConfirmation from "./BlockingConfirmation";
import PostCard from "./Postcard";

import isPrivate from "utilities/isPrivate.js"
import { mergePostsReactionsOnly } from "utilities/mergePostReactions";
import { notificationsToArray } from "utilities/postLikeNotification";
import { v4 as uuidv4 } from 'uuid';

// The Profile component shows data from the user table.  This is set up fairly generically to allow for you to customize
// user data by adding it to the attributes for each user, which is just a set of name value pairs that you can add things to
// in order to support your group specific functionality.  In this example, we store basic profile information for the user
const Profile = ({loggedIn}) => {
    const { userId } = useParams();
    const [isEditBioPopupOpen, setIsEditBioPopupOpen] = useState(false);
    const [isUploadBackgroundPhotoPopupOpen, setIsUploadBackgroundPhotoPopupOpen] = useState(false);
    const [isUploadProfilePhotoPopupOpen, setIsUploadProfilePhotoPopupOpen] = useState(false);
    const [isEllipsisPopupOpen, setIsEllipsisPopupOpen] = useState(false);
    const [isFollowerListOpen, setIsFollowerListOpen] = useState(false);
    const [isFollowingListOpen, setIsFollowingListOpen] = useState(false);
    const [isBlockingConfirmationOpen, setIsBlockingConfirmationOpen] = useState(false);
    const [blockingUser, setBlockingUser] = useState(false);
    const [blockedByUser, setBlockedByUser] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [user, setUser] = useState(null);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [backgroundPhoto, setBackgroundPhoto] = useState(null);
    const [isEditingScreenName, setIsEditingScreenName] = useState(false);
    const [screenName, setScreenName] = useState("");
    const [isFollowing, setIsFollowing] = useState(false);
    const [connectionId, setConnectionId] = useState(null);
    const [isFollowProcessing, setIsFollowProcessing] = useState(false);
    const [recentCommunities, setRecentCommunities] = useState([]);
    const [showAllCommunities, setShowAllCommunities] = useState(false);
const [showAllInterests, setShowAllInterests] = useState(false);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(true)
    const [isHidden, setIsHidden] = useState(false);
    const [isFollowRequested, setIsFollowRequested] = useState(false);
    const [isFollowRequestProcessing, setIsFollowRequestProcessing] = useState(false);
    const screenNameCharLimit = 10;
    const navigate = useNavigate();

    useEffect(() => {
        getUser();
        getPhotos();
        checkFollowingStatus();
        getFollowers();
        getFollowing();
        getBlockStatus();
        getRecentCommunities();
        getRecentPosts();
    }, [userId]);

    // Silent background refresh for like counts on profile posts (same pattern as home / community).
    useEffect(() => {
        if (!userId) return;

        const refreshReactions = () => {
            if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
            getRecentPosts({ silent: true, updateOnlyReactions: true });
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
    }, [userId]);

    useEffect(() => {
        setIsLoading(true);


        const allData = [
            getUser(),
            getBlockStatus(),
            getPhotos(),
            checkFollowingStatus(),
            getFollowers(),
            getFollowing(),
            getRecentCommunities(),
            getRecentPosts(),
            getIsPrivate(),
        ];

        Promise.all(allData).finally(() => {
            setIsLoading(false);
        });
    }, [userId]);


    function getRecentCommunities() {
        const token = sessionStorage.getItem("user-token");
        if (!token) return Promise.resolve();

        // Fetch memberships for the profile owner
        fetch(`${process.env.REACT_APP_API_PATH}/group-members?userID=${userId}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        })
        .then(res => res.json())
        .then(data => {
            const memberships = data[0] || [];
            // The API returns membership objects which include the group details
            const communities = memberships.map(m => m.group);
            setRecentCommunities(communities);
        })
        .catch(error => console.error("Error fetching recent communities:", error));
    }

    function getRecentPosts(options = {}) {
        const { updateOnlyReactions = false } = options;
        const token = sessionStorage.getItem("user-token");
        if (!token) return Promise.resolve();

        return fetch(`${process.env.REACT_APP_API_PATH}/posts?authorID=${userId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        })
            .then(res => res.json())
            .then(data => {
                const fetchedPosts = (data[0] || []).filter(post => post.parentID === null);

                if (updateOnlyReactions) {
                    setPosts((prev) =>
                        mergePostsReactionsOnly(Array.isArray(prev) ? prev : [], fetchedPosts)
                    );
                    return;
                }

                setPosts(fetchedPosts);

                // Fetch details for any communities mentioned in posts that aren't in recentCommunities
                const communityIdsInPosts = [...new Set(fetchedPosts
                    .filter(p => p.recipientGroupID)
                    .map(p => p.recipientGroupID))];

                communityIdsInPosts.forEach(id => {
                    if (!recentCommunities.find(c => String(c.id) === String(id))) {
                        fetch(`${process.env.REACT_APP_API_PATH}/groups/${id}`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        })
                            .then(res => res.json())
                            .then(groupData => {
                                setRecentCommunities(prev => {
                                    if (prev.find(c => c.id === groupData.id)) return prev;
                                    return [...prev, groupData];
                                });
                            })
                            .catch(err => console.error(`Error fetching group ${id}:`, err));
                    }
                });
            })
            .catch(err => console.error("Posts load failed:", err));
    }

    const editBio = (event) => {
        event.preventDefault();
        setIsEditBioPopupOpen(true);
    }

    const editProfileBackground = (event) => {
        event.preventDefault();
        setIsUploadBackgroundPhotoPopupOpen(true);
    }

    const editProfilePhoto = (event) => {
        event.preventDefault();
        setIsUploadProfilePhotoPopupOpen(true);
    }

    const editScreenName = (event) => {
        event.preventDefault();
        if (user && user.attributes) {
            setScreenName(user.attributes.screenname || "");
        }
        setIsEditingScreenName(true);
    }

    const openFollowerList = (event) => {
        event.preventDefault();
        setIsFollowerListOpen(true);
    }

    const openFollowingList = (event) => {
        event.preventDefault();
        setIsFollowingListOpen(true);
    }

    const openBlockingConfirmation = (event) => {
        event.preventDefault();
        setIsBlockingConfirmationOpen(true);
    }

    const blockUser = async (event) => {
        event.preventDefault();
        const token = sessionStorage.getItem("user-token");
        const activeUserId = sessionStorage.getItem("user");

        if (!activeUserId || !token || activeUserId === userId) return;

        try {
            // 1. Remove any existing "follow" connections
            // Direction A: Logged in user following this profile
            const paramsA = new URLSearchParams({
                fromUserID: activeUserId,
                toUserID: userId,
                attributes: JSON.stringify({ path: "type", equals: "follow" })
            });

            // Direction B: This profile following the logged in user
            const paramsB = new URLSearchParams({
                fromUserID: userId,
                toUserID: activeUserId,
                attributes: JSON.stringify({ path: "type", equals: "follow" })
            });

            const [resA, resB] = await Promise.all([
                fetch(`${process.env.REACT_APP_API_PATH}/connections?${paramsA.toString()}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                }),
                fetch(`${process.env.REACT_APP_API_PATH}/connections?${paramsB.toString()}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                })
            ]);

            const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);
            const existingFollows = [...(dataA[0] || []), ...(dataB[0] || [])];

            for (const follow of existingFollows) {
                await fetch(`${process.env.REACT_APP_API_PATH}/connections/${follow.id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            }

            // 2. Create "block" connection
            const blockRes = await fetch(`${process.env.REACT_APP_API_PATH}/connections`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    fromUserID: parseInt(activeUserId),
                    toUserID: parseInt(userId),
                    attributes: { type: "block" }
                }),
            });

            if (blockRes.ok) {
                setIsEllipsisPopupOpen(false);
                setIsBlockingConfirmationOpen(true);
                // Refresh data
                checkFollowingStatus();
                getFollowers();
                setBlockingUser(true);
            }
        } catch (error) {
            console.error("Error blocking user:", error);
        }
    }

    const handleUnblockUser = async (event) => {
        if (event) event.preventDefault();
        const token = sessionStorage.getItem("user-token");
        const activeUserId = sessionStorage.getItem("user");

        if (!activeUserId || !token || activeUserId === userId) return;

        try {
            // Find the block connection from logged in user to this profile
            const params = new URLSearchParams({
                fromUserID: activeUserId,
                toUserID: userId,
                attributes: JSON.stringify({ path: "type", equals: "block" })
            });

            const res = await fetch(`${process.env.REACT_APP_API_PATH}/connections?${params.toString()}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await res.json();
            const blockConnections = data[0] || [];

            // Delete all block connections found (usually just one)
            for (const conn of blockConnections) {
                await fetch(`${process.env.REACT_APP_API_PATH}/connections/${conn.id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
            }

            setBlockingUser(false);
            // Refresh status to ensure everything is in sync
            getBlockStatus();
        } catch (error) {
            console.error("Error unblocking user:", error);
        }
    };

    const handleCloseBioPopup = () => {
        setIsEditBioPopupOpen(false);
    }

    const handleCloseBackgroundPhotoPopup = () => {
        setIsUploadBackgroundPhotoPopupOpen(false);
    }

    const handleCloseProfilePhotoPopup = () => {
        setIsUploadProfilePhotoPopupOpen(false);
    }

    const handleCloseFollowerList = () => {
        setIsFollowerListOpen(false);
    }

    const handleCloseFollowingList = () => {
        setIsFollowingListOpen(false);
    }

    const handleCloseBlockingConfirmation = () => {
        setIsBlockingConfirmationOpen(false);
    }

    const toggleEllipsisPopup = (event) => {
        event.preventDefault();
        setIsEllipsisPopupOpen(!isEllipsisPopupOpen);
    }

    

    const handleSaveScreenName = () => {
        // Only save if the name has changed (handling null/undefined safely)
        const currentScreenName = user?.attributes?.screenname || "";
        if (!user || screenName === currentScreenName) {
            setIsEditingScreenName(false);
            return;
        }

        const token = sessionStorage.getItem("user-token");

        fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                attributes: {
                    ...user.attributes,
                    screenname: screenName,
                },
            }),
        })
            .then(res => {
                if (!res.ok) {
                    throw new Error('Failed to update screen name.');
                }
                return res.json();
            })
            .then(updatedUser => {
                setUser(updatedUser); // Update the main user object with the response
                setIsEditingScreenName(false); // Exit edit mode
            })
            .catch(error => {
                console.error("Error saving screen name:", error);
                // Revert changes on error and exit edit mode
                if (user) {
                    setScreenName(user.attributes.screenname);
                }
                setIsEditingScreenName(false);
            });
    };

    const handleScreenNameKeyDown = (event) => {
        if (event.key === 'Enter') {
            handleSaveScreenName();
        } else if (event.key === 'Escape') {
            // Reset to original name and exit edit mode
            if (user) {
                setScreenName(user.attributes.screenname);
            }
            setIsEditingScreenName(false);
        }
    };

    const handleSaveBio = (newBio) => {
        if (!user) {
            console.error("Cannot save bio: user data is not loaded yet.");
            return;
        }

        const token = sessionStorage.getItem("user-token");

        fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                attributes: {
                    ...user.attributes, // Preserves existing attributes
                    bio: newBio,       // Updates the bio
                },
            }),
        })
        .then(res => {
            if (!res.ok) {
                // Handle non-successful responses
                throw new Error('Failed to update bio.');
            }
            return res.json();
        })
        .then(updatedUser => {
            // Update the local state with the new user data from the server
            setUser(updatedUser);
            // Close the popup
            setIsEditBioPopupOpen(false);
        })
        .catch(error => {
            console.error("Error saving bio:", error);
            // Optionally, display an error message to the user
        });
    };

    const handleSaveBackgroundPhoto = async (file) => {
        const token = sessionStorage.getItem("user-token");

        if (!file || !userId || !token) {
            console.error("File, user ID, and token are required to save the photo.");
            handleCloseBackgroundPhotoPopup();
            return;
        }

        try {
            // Check if a background photo already exists
            const getFilesResponse = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads?uploaderID=${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!getFilesResponse.ok) {
                throw new Error('Failed to fetch user files.');
            }

            const filesData = await getFilesResponse.json();
            const userFiles = Array.isArray(filesData) && filesData.length > 0 ? filesData[0] : [];


            if (Array.isArray(userFiles)) {
                const existingBackgroundFile = userFiles.find(
                    f => f.attributes && f.attributes.type === "profile-background"
                );

                // If an old background photo exists, delete it
                if (existingBackgroundFile) {
                    const deleteResponse = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads/${existingBackgroundFile.id}`, {
                        method: 'DELETE',
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (!deleteResponse.ok) {
                        throw new Error('Failed to delete the old background photo.');
                    }
                }
            }

            // Upload the new background photo
            const formData = new FormData();
            formData.append("uploaderID", userId);
            formData.append("attributes", JSON.stringify({ type: "profile-background" }));
            formData.append("file", file);

            const uploadResponse = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Failed to upload new photo: ${errorText}`);
            }

            // Refresh photos and close the popup on success
            getPhotos();
            handleCloseBackgroundPhotoPopup();

        } catch (error) {
            console.error("An error occurred while saving the background photo:", error);
            handleCloseBackgroundPhotoPopup(); // Close popup on error as well
        }
    }

    const handleSaveProfilePhoto = async (file) => {
        const token = sessionStorage.getItem("user-token");

        if (!file || !userId || !token) {
            console.error("File, user ID, and token are required to save the photo.");
            handleCloseProfilePhotoPopup();
            return;
        }

        try {
            // Check if a profile photo already exists
            const getFilesResponse = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads?uploaderID=${userId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!getFilesResponse.ok) {
                throw new Error('Failed to fetch user files.');
            }

            const filesData = await getFilesResponse.json();
            const userFiles = Array.isArray(filesData) && filesData.length > 0 ? filesData[0] : [];

            if (Array.isArray(userFiles)) {
                const existingProfilePhotoFile = userFiles.find(
                    f => f.attributes && f.attributes.type === "profile-pic"
                );

                // If an old profile photo exists, delete it
                if (existingProfilePhotoFile) {
                    const deleteResponse = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads/${existingProfilePhotoFile.id}`, {
                        method: 'DELETE',
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    if (!deleteResponse.ok) {
                        throw new Error('Failed to delete the old profile photo.');
                    }
                }
            }

            // Upload the new background photo
            const formData = new FormData();
            formData.append("uploaderID", userId);
            formData.append("attributes", JSON.stringify({ type: "profile-pic" }));
            formData.append("file", file);

            const uploadResponse = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads`, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                throw new Error(`Failed to upload new photo: ${errorText}`);
            }

            getPhotos();
            handleCloseProfilePhotoPopup();
            window.location.reload();

        } catch (error) {
            console.error("An error occurred while saving the profile photo:", error);
            handleCloseProfilePhotoPopup(); // Close popup on error as well
        }
    }

    const getFollowers = () => {
        const token = sessionStorage.getItem("user-token");
        const activeUserId = sessionStorage.getItem("user");

        if (!activeUserId || !token) return Promise.resolve();

        const params = new URLSearchParams({
            toUserID: userId,
            attributes: JSON.stringify({ path: "type", equals: "follow" })
        });

        fetch(`${process.env.REACT_APP_API_PATH}/connections?${params.toString()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(async (data) => {
                const connections = data[0] || [];
                const profilePromises = connections.map(async (connection) => {
                    const profilePhoto = await getProfileInfo(connection.fromUserID);
                    return {
                        userId: connection.fromUserID,
                        screenname: connection.fromUser.attributes.screenname,
                        username: connection.fromUser.attributes.username,
                        profilePhoto: profilePhoto,
                        connectionId: connection.id
                    };
                });

                const followerProfiles = await Promise.all(profilePromises);
                const seen = new Set();
                const deduped = followerProfiles.filter(f => {
                    if (seen.has(f.userId)) return false;
                    seen.add(f.userId);
                    return true;
            });
                setFollowers(deduped);
            })
            .catch(error => console.error("Error fetching followers:", error));
    };

    const getFollowing = () => {
        const token = sessionStorage.getItem("user-token");
        const activeUserId = sessionStorage.getItem("user");

        if (!activeUserId || !token) return Promise.resolve();

        const params = new URLSearchParams({
            fromUserID: userId,
            attributes: JSON.stringify({ path: "type", equals: "follow" })
        });

        fetch(`${process.env.REACT_APP_API_PATH}/connections?${params.toString()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(async (data) => {
                const connections = data[0] || [];
                const profilePromises = connections.map(async (connection) => {
                    const profilePhoto = await getProfileInfo(connection.toUserID);
                    return {
                        userId: connection.toUserID,
                        screenname: connection.toUser.attributes.screenname,
                        username: connection.toUser.attributes.username,
                        profilePhoto: profilePhoto,
                        connectionId: connection.id
                    };
                });

                const followingProfiles = await Promise.all(profilePromises);
                const seen = new Set();
                const deduped = followingProfiles.filter(f => {
                    if (seen.has(f.userId)) return false;
                    seen.add(f.userId);
                    return true;
            });
                setFollowing(deduped);
            })
            .catch(error => console.error("Error fetching following:", error));
    }

    const getProfileInfo = async (userId) => {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_PATH}/file-uploads?uploaderID=${userId}`);
            const data = await res.json();
            const files = data[0] || [];
            const profilePic = files.find(file => file.attributes.type === "profile-pic");
            return profilePic ? process.env.REACT_APP_API_PATH_SOCKET + profilePic.path : null;
        } catch (error) {
            console.error("Error fetching profile photo:", error);
            return null;
        }
    };

    const getUser = () => {
        const activeUserId = sessionStorage.getItem("user");
    
        fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`)
            .then(res => res.json())
            .then(data => { 
                setUser(data);
                
                const followRequests = data.attributes?.followRequests;
                if (followRequests && activeUserId in followRequests) {
                    setIsFollowRequested(followRequests[activeUserId]);
                }
            })
            .catch(err => {
                console.error("Error fetching user:", err);
            });
    }

    const getBlockStatus = () => {
        const token = sessionStorage.getItem("user-token");
        const activeUserId = sessionStorage.getItem("user");

        setBlockingUser(false);
        setBlockedByUser(false);

        if (!activeUserId || !token || activeUserId === userId) return Promise.resolve();

        // Check if logged in user is blocking this profile
        const blockingParams = new URLSearchParams({
            fromUserID: activeUserId,
            toUserID: userId,
            attributes: JSON.stringify({ path: "type", equals: "block" })
        });

        const p1 = fetch(`${process.env.REACT_APP_API_PATH}/connections?${blockingParams.toString()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data && data[0] && data[0].length > 0) {
                    setBlockingUser(true);
                }
            })
            .catch(error => console.error("Error checking blocking status:", error));

        // Check if this profile is blocking the logged in user
        const blockedByParams = new URLSearchParams({
            fromUserID: userId,
            toUserID: activeUserId,
            attributes: JSON.stringify({ path: "type", equals: "block" })
        });

        const p2 = fetch(`${process.env.REACT_APP_API_PATH}/connections?${blockedByParams.toString()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                if (data && data[0] && data[0].length > 0) {
                    setBlockedByUser(true);
                }
            })
            .catch(error => console.error("Error checking blocked by status:", error));

        return Promise.all([p1, p2]);
    };

    const checkFollowingStatus = () => {
        const token = sessionStorage.getItem("user-token");
        const activeUserId = sessionStorage.getItem("user");

        if (!activeUserId || !token || activeUserId === userId) return Promise.resolve();

        const params = new URLSearchParams({
            fromUserID: activeUserId,
            toUserID: userId,
            attributes: JSON.stringify({ path: "type", equals: "follow" })
        });

        fetch(`${process.env.REACT_APP_API_PATH}/connections?${params.toString()}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.json())
            .then(data => {
                // Based on your format: data[0] is the array of connections
                if (data && data[0] && data[0].length > 0) {
                    setIsFollowing(true);
                    setConnectionId(data[0][0].id);
                } else {
                    setIsFollowing(false);
                    setConnectionId(null);
                }
            })
            .catch(error => console.error("Error checking follow status:", error));
    };

    const getPhotos = () => {
        setProfilePhoto(null);
        setBackgroundPhoto(null);

        return fetch(`${process.env.REACT_APP_API_PATH}/file-uploads?uploaderID=${userId}`)
            .then(res => res.json())
            .then(data => {
                const files = data[0]; // The files are in the first element of the response array
                files.forEach(file => {
                    if (file.attributes.type === "profile-pic") {
                        setProfilePhoto(process.env.REACT_APP_API_PATH_SOCKET + file.path);
                    } else if (file.attributes.type === "profile-background") {
                        setBackgroundPhoto(process.env.REACT_APP_API_PATH_SOCKET + file.path);
                    }
                });
            })
            .catch(error => console.error("Error fetching photos:", error));
    };

    const followUser = (event) => {
        event.preventDefault();
        console.log("Triggering follow...");

        if(isFollowProcessing || isFollowing){
            return
        }

        const token = sessionStorage.getItem("user-token");
        const activeUserId = sessionStorage.getItem("user");

        if (!activeUserId || !token) {
            console.error("User must be logged in to follow others.");
            return;
        }

        setIsFollowProcessing(true);

        fetch(`${process.env.REACT_APP_API_PATH}/connections`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                fromUserID: parseInt(activeUserId),
                toUserID: parseInt(userId),
                attributes: {
                    type: "follow"
                }
            }),
        })
        .then(res => {
            if (!res.ok) {
                throw new Error('Failed to follow user.');
            }
            return res.json();
        })
        .then(data => {
            console.log("Successfully followed user:", data);
            setIsFollowing(true);
            setConnectionId(data.id); // Store ID for subsequent unfollow
            setIsFollowProcessing(false); // Re-enable button
            getFollowers();
            if (!user?.attributes?.isPrivate) {
                sendFollowNotification(userId, activeUserId, token);
            }
        })
        .catch(error => {
            console.error("Error following user:", error);
            setIsFollowProcessing(false);
        });
    }
    const sendFollowNotification = async (toUserId, fromUserId, token) => {
      try {
        const userRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${fromUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const fromUserData = await userRes.json();
        const fromUsername = fromUserData.attributes?.username || "Someone";

        const targetRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${toUserId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const targetData = await targetRes.json();
        const existingNotifs = notificationsToArray(targetData.attributes?.notifications);

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
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attributes: {
              ...targetData.attributes,
              notifications: [...existingNotifs, newNotif],
            },
          }),
        });

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("goat-notifications-updated"));
        }
      } catch (err) {
        console.error("Failed to send follow notification:", err);
      }
    };

    const getIsPrivate = async () => {
        const hidden = await isPrivate(sessionStorage.getItem("user"), userId);
        setIsHidden(hidden);
    };

    const unfollowUser = async (targetUserId = null) => {
    const token = sessionStorage.getItem("user-token");
    const activeUserId = sessionStorage.getItem("user");

    if (!activeUserId || !token) return;

    // If called from FollowingList, use that row's userId.
    // Otherwise fall back to the profile page's userId.
    const actualTargetUserId = targetUserId || userId;

    try {
        const params = new URLSearchParams({
            fromUserID: activeUserId,
            toUserID: actualTargetUserId,
            attributes: JSON.stringify({ path: "type", equals: "follow" }),
        });

        const res = await fetch(
            `${process.env.REACT_APP_API_PATH}/connections?${params.toString()}`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        const data = await res.json();
        const liveConnection = (data[0] || []).find(
            (c) =>
                String(c.fromUserID) === String(activeUserId) &&
                String(c.toUserID) === String(actualTargetUserId) &&
                c.attributes?.type === "follow"
        );

        if (!liveConnection) {
            // If this was the main profile user, clear local follow state
            if (String(actualTargetUserId) === String(userId)) {
                setIsFollowing(false);
                setConnectionId(null);
                await getIsPrivate();
            }

            getFollowers();
            getFollowing();
            return;
        }

        const deleteRes = await fetch(
            `${process.env.REACT_APP_API_PATH}/connections/${liveConnection.id}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            }
        );

        if (!deleteRes.ok) {
            throw new Error("Failed to unfollow user.");
        }

        // Only clear page-level follow state if this is the profile currently being viewed
        if (String(actualTargetUserId) === String(userId)) {
            setIsFollowing(false);
            setConnectionId(null);
            checkFollowingStatus();
            await getIsPrivate();
        }

        getFollowers();
        getFollowing();
    } catch (error) {
        console.error("Error unfollowing user:", error);
    }
};
    
    const requestFollow = async () => {
        const activeUserId = sessionStorage.getItem("user");
        const token = sessionStorage.getItem("user-token");
        if (!activeUserId || !token) {
            return;
        }
        
        setIsFollowRequestProcessing(true);
        
        const requestId = uuidv4();
        const date = new Date();
        
        try {
            const activeUserUrl = `${process.env.REACT_APP_API_PATH}/users/${activeUserId}`;
            const activeUserResponse = await fetch(activeUserUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });
            
            if (!activeUserResponse.ok) {
                throw new Error("request failed");
            }
            
            const activeUserData = await activeUserResponse.json();
            const activeUserUsernameData = activeUserData.attributes?.username || "Unknown";
        
            const userUrl = `${process.env.REACT_APP_API_PATH}/users/${userId}`;
            const userResponse = await fetch(userUrl, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });
            
            if (!userResponse.ok) {
                throw new Error("request failed");
            }
            
            const userData = await userResponse.json();
            const userAttributes = userData.attributes || {};
            const userFollowRequests = userAttributes.followRequests || {};
            const userNotifications = notificationsToArray(userAttributes.notifications);
            
            const newNotification = {
                id: requestId,
                type: "Request to Follow",
                content: `@${activeUserUsernameData} wants to follow you`,
                read_status: false,
                fromUserId: activeUserId,
                toUserId: userId,
                time: date,
            };
            
            const requestFollowUrl = `${process.env.REACT_APP_API_PATH}/users/${userId}`;
            const requestFollowResponse = await fetch(requestFollowUrl, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    attributes: {
                        ...userAttributes,
                        notifications: [
                            ...userNotifications, 
                            newNotification,
                        ],
                        followRequests: {
                            ...userFollowRequests,
                            [Number(activeUserId)]: true,
                        }
                    },
                }),
            });
            
            if (!requestFollowResponse.ok) {
                throw new Error("request failed");
            }
            
            setIsFollowRequested(true);
        }
        
        catch (error) {
            console.log("Failed to send follow request: " + error);
        }
        
        finally {
            setIsFollowRequestProcessing(false);
        }
    }

    const isOwner = userId === sessionStorage.getItem("user");
    const COMMUNITY_PREVIEW_COUNT = 4;
const INTEREST_PREVIEW_COUNT = 6;

const sortedRecentCommunities = [...recentCommunities].sort((a, b) =>
  (a?.name || "").localeCompare(b?.name || "")
);

const allInterestTags = [...new Set(
  recentCommunities.flatMap((community) =>
    Array.isArray(community?.attributes?.tags) ? community.attributes.tags : []
  )
)]
  .filter((tag) => tag && String(tag).trim() !== "")
  .sort((a, b) => a.localeCompare(b));

const visibleCommunities = showAllCommunities
  ? sortedRecentCommunities
  : sortedRecentCommunities.slice(0, COMMUNITY_PREVIEW_COUNT);

const visibleInterests = showAllInterests
  ? allInterestTags
  : allInterestTags.slice(0, INTEREST_PREVIEW_COUNT);
  
    if (isLoading) {
        return (
            <div className="profile-loading-container">
                <p>Loading profile...</p>
            </div>
        );
    }
    
    if (isHidden) {
        return (
            <div className="block-page-content">
                <div className="block-page-icon-container">
                    <img src={lockIcon} style={{width: "100px"}}/>
                </div>
                <div className="block-page-heading">This account is private</div>
                <button className={isFollowRequested ? "follow-requested-button" : "request-follow-button"}
                    onClick={(event) => requestFollow()}
                    disabled={isFollowRequestProcessing}
                    >{isFollowRequested ? "Follow Requested" : "Request to Follow"}
                </button>
            </div>
        );
    }

  return (
      <>
    { (isBlockingConfirmationOpen || (!blockingUser && !blockedByUser)) &&
    <div className="profile-page-content">
        <div className="profile-page-header">
          <div className="profile-page-header-left">
              <div className="profile-user-info">
                  <div className="profile-names">
                      <div style={{display: "flex", alignItems: "center", justifyContent: "", flexDirection: "row"}}>
                          {isEditingScreenName ? (
                              <div>
                                  <input
                                      type="text"
                                      value={screenName}
                                      onChange={(e) => setScreenName(e.target.value)}
                                      onBlur={handleSaveScreenName}
                                      onKeyDown={handleScreenNameKeyDown}
                                      className="profile-page-screen-name-edit"
                                      maxLength={screenNameCharLimit}
                                      autoFocus
                                  />
                                  {screenName.length >= screenNameCharLimit && (
                                      <span className="screen-name-warning">
                                          Max {screenNameCharLimit} characters
                                      </span>
                                  )}
                              </div>
                          ) : (
                              <p className="profile-page-screen-name">{user ? user.attributes.screenname : "Loading..."}</p>
                          )}
                          {isOwner && !isEditingScreenName &&
                              <button className="profile-page-invis-icon-btn" onClick={editScreenName}>
                                  <img src={pencilEdit} alt="edit-screen-name" style={{width: "25px"}}/>
                              </button>
                          }

                      </div>
                      <div style={{display: "flex", alignItems: "center", justifyContent: "", flexDirection: "row"}}>
                          <p className="profile-page-username">@{user ? user.attributes.username : "..."}</p>
                          {!isOwner &&
                              <div style={{position: "relative"}}>
                                  <button className="profile-ellipsis-button" onClick={toggleEllipsisPopup}>
                                      <img src={ellipsisIcon}/>
                                  </button>
                                  {isEllipsisPopupOpen && (
                                      <>
                                          <div
                                              style={{
                                                  position: 'fixed',
                                                  top: 0,
                                                  left: 0,
                                                  width: '100vw',
                                                  height: '100vh',
                                                  zIndex: 999
                                              }}
                                              onClick={() => setIsEllipsisPopupOpen(false)}
                                          />
                                          <div style={{ position: 'relative', zIndex: 1000 }}>
                                              <ProfileEllipsisPopup
                                                  onClose={() => setIsEllipsisPopupOpen(false)}
                                                  showBlock={!blockingUser}
                                                  onBlock={blockUser}
                                              />
                                          </div>
                                      </>
                                  )}
                              </div>
                          }
                      </div>
                  </div>
                  {!isOwner &&
                      <button className={isFollowing ? "unfollow-button" : "follow-button"}
                        onClick={(e) => isFollowing ? unfollowUser() : followUser(e)}
                        disabled={isFollowProcessing}>
                        {isFollowing ? "Unfollow" : "Follow"}
                </button>
                  }
              </div>
              <div className="profile-photo-container">
                  <img src={profilePhoto || defaultProfileIcon} className="profile-photo"/>
                  {isOwner &&
                      <button className="profile-photo-button" onClick={editProfilePhoto}>
                          <img src={cameraIcon}/>
                      </button>
                  }
              </div>
              { isUploadProfilePhotoPopupOpen && (
                <ChangeProfilePhotoPopup onClose={handleCloseProfilePhotoPopup}
                                         onSave={handleSaveProfilePhoto}/>
              )}
          </div>
          <img src={backgroundPhoto} className="profile-page-background-image"/>
          {isOwner &&
              <button className="profile-background-button" onClick={editProfileBackground}>
                  <img src={paintingIcon}/>
              </button>
          }
          {isUploadBackgroundPhotoPopupOpen && (
            <ChangeBackgroundPhotoPopup onClose={handleCloseBackgroundPhotoPopup}
                                        onSave={handleSaveBackgroundPhoto}/>
          )}
          {isFollowerListOpen &&
              <FollowersList followers={followers} onClose={handleCloseFollowerList}
                             unfollow={unfollowUser} owning={isOwner}/>
          }
          {isFollowingListOpen &&
              <FollowingList following={following} onClose={handleCloseFollowingList}
                             unfollow={unfollowUser} owning={isOwner}/>
          }
      </div>
        <ProfilePageCounters followers={followers}
                             following={following}
                             posts={posts}
                             onFollowerListOpened={openFollowerList}
                             onFollowingListOpened={openFollowingList}/>
      <div className="profile-page-heading">
        Bio
          { isOwner &&
              <button className="profile-page-invis-icon-btn" onClick={editBio}>
                  <img src={pencilEdit} alt="edit-bio" style={{width: "25px"}}/>
              </button>
          }
      </div>

      <p className="profile-page-paragraph">
          {user ? user.attributes.bio || "" : "Loading..."}
      </p>
        {isEditBioPopupOpen && (
            <EditBioPopup onClose={handleCloseBioPopup}
                          onSave={handleSaveBio}
                          currentBio={user ? user.attributes.bio || "" : ""}/>
        )}
        <div className="profile-page-heading">
    Recent Communities
</div>

{sortedRecentCommunities.length === 0 ? (
    <NoResultsBubble>
        No recent community activity...
    </NoResultsBubble>
) : (
    <>
        <div className="profile-page-community-list">
            {visibleCommunities.map((community) => (
                <button
                    key={community.id}
                    className="community-tag"
                    onClick={() => navigate(`/community/${community.id}`)}
                >
                    {community.name}
                </button>
            ))}
        </div>

        {sortedRecentCommunities.length > COMMUNITY_PREVIEW_COUNT && (
            <button
                className="profile-show-more-btn"
                onClick={() => setShowAllCommunities((prev) => !prev)}
            >
                {showAllCommunities ? "Show Less" : "Show More"}
            </button>
        )}
    </>
)}
<div className="profile-page-heading">
    Interests
</div>

{allInterestTags.length === 0 ? (
    <NoResultsBubble>
        No interests yet...
    </NoResultsBubble>
) : (
    <>
        <div className="profile-page-community-list">
            {visibleInterests.map((tag) => (
                <button
                    key={tag}
                    type="button"
                    className="community-tag"
                >
                    {tag}
                </button>
            ))}
        </div>

        {allInterestTags.length > INTEREST_PREVIEW_COUNT && (
            <button
                className="profile-show-more-btn"
                onClick={() => setShowAllInterests((prev) => !prev)}
            >
                {showAllInterests ? "Show Less" : "Show More"}
            </button>
        )}
    </>
)}
        <div className="profile-page-heading">
            Recent Posts
        </div>
        {(!posts || posts.length === 0) ? (
    <NoResultsBubble>
        No recent posts...
    </NoResultsBubble>
) : (
    <div className="profile-page-posts-list">
        {posts.map((post) => {
            const matchedCommunity = recentCommunities.find(
                (community) => String(community.id) === String(post.recipientGroupID)
            );

            const communityForCard = matchedCommunity
                ? {
                    groupID: matchedCommunity.id,
                    name: matchedCommunity.name || matchedCommunity.attributes?.name || "Community",
                  }
                : null;

            return (
                <PostCard
                    key={post.id}
                    post={post}
                    community={communityForCard}
                    groupID={post.recipientGroupID}
                    showFollow={false}
                />
            );
        })}
    </div>
)}
    </div>
        }
        {isBlockingConfirmationOpen && (
            <BlockingConfirmation 
                onClose={handleCloseBlockingConfirmation} 
                username={user?.attributes?.username || ""} 
            />
        )}
          {blockingUser && !isBlockingConfirmationOpen &&
          <div className="block-page-content">
              <div className="block-page-icon-container">
                  <img src={lockIcon} style={{width: "100px"}}/>
              </div>
              <div className="block-page-heading">
                  You're currently blocking @{user?.attributes?.username || "..."}.
              </div>
              <button className="popup-ok-btn" onClick={handleUnblockUser}>
                  Unblock
              </button>
          </div>
          }
          {blockedByUser &&
              <div className="block-page-content">
                  <div className="block-page-icon-container">
                      <img src={lockIcon} style={{width: "100px"}}/>
                  </div>
                  <div className="block-page-heading">
                      You're currently blocked by @{user?.attributes?.username || "..."}.
                  </div>
              </div>
          }
      </>
  );
};

export default Profile;
