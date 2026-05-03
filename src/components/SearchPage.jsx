import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from "react-i18next";
import { AlertModal } from "components/settings-page/modals/AlertModal.jsx";

import { notificationsToArray } from "utilities/postLikeNotification";

import "styles/SearchPage.css";
import "styles/HomePage.css";

export const SearchPage = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { query } = useParams();
    const searchValue = query ?? "";
    
    const [communityList, setCommunityList] = useState([]);
    const [joinedCommunityIds, setJoinedCommunityIds] = useState(new Set());
    const [requestedCommunityIds, setRequestedCommunityIds] = useState(new Set());
    
    const [currentUser, setCurrentUser] = useState({});
    const [loading, setLoading] = useState(true);
    
    const [currentModal, setCurrentModal] = useState(null);
    const [alertMessage, setAlertMessage] = useState("");
    const [isAlertFatal, setAlertFatal] = useState(false);
    
    const showAlert = useCallback((message, fatal=false) => {
        setAlertMessage(message);
        setAlertFatal(fatal);
        setCurrentModal("show-alert");
    }, [setAlertMessage, setAlertFatal, setCurrentModal]);
    
    const sendRequestNotification = (community, message) => {  
        const ownerId = community.attributes?.creatorID;
        if (!ownerId) return;
        
        const requestId = uuidv4();
        const date = new Date();

        fetch(`${process.env.REACT_APP_API_PATH}/users/${ownerId}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${currentUser.token}`, 
                "Content-Type": "application/json",
            },
        })
        .then((res) => res.json())
        .then((ownerData) => {
            const previousNotifications = notificationsToArray(ownerData?.attributes?.notifications);
            const newNotification = {
                id: requestId,
                type: "Request to Join Your Private Community",
                content: message,
                read_status: false,
                user_id: currentUser.id,
                group_id: community.id,
                time: date,
            };
            return fetch(`${process.env.REACT_APP_API_PATH}/users/${ownerId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${currentUser.token}`, 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    attributes: {
                        ...ownerData?.attributes, 
                        notifications: [
                            ...previousNotifications,
                            newNotification
                        ], 
                    },
                }),
            });
        })
        .catch((error) => {
            console.error(`Failed to send notification: ${error}`);
        });
    };
    
    const onJoin = (communityId) => {    
        fetch(`${process.env.REACT_APP_API_PATH}/group-members`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${currentUser.token}`, 
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                userID: Number(currentUser.id),
                groupID: Number(communityId),
                attributes: {},
            }),
        })
        .then((response) => response.json())
        .then(() => {
            const updated = new Set(joinedCommunityIds);
            updated.add(String(communityId));
            setJoinedCommunityIds(updated);
        })
        .catch((error) => {
            showAlert(t("searchPage.errors.joinFailed"));
        });
    };

    const onRequest = (communityId) => {
        fetch(`${process.env.REACT_APP_API_PATH}/groups/${communityId}`, {method: "GET"})
        .then((response) => response.json())
        .then((community) => {
            fetch(`${process.env.REACT_APP_API_PATH}/groups/${communityId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${currentUser.token}`, 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    attributes: {
                        ...community.attributes,
                        requested: {
                            ...community.attributes.requested,
                            [Number(currentUser.id)]: true,
                        },
                    },
                }),
            })
            .then((response) => response.json())
            .then(() => {
                const updated = new Set(requestedCommunityIds);
                updated.add(String(communityId));
                setRequestedCommunityIds(updated);
                
                sendRequestNotification(
                    community, 
                    `${currentUser.attributes.username} has requested to join the community ${community.name}.`,
                );
            })
            .catch((error) => {
                showAlert(t("searchPage.errors.requestFailed"));
            });
        });
    };

    const onCancelRequest = (communityId) => {    
        fetch(`${process.env.REACT_APP_API_PATH}/groups/${communityId}`, {method: "GET"})
        .then((response) => response.json())
        .then((community) => {
            fetch(`${process.env.REACT_APP_API_PATH}/groups/${communityId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${currentUser.token}`, 
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    attributes: {
                        ...community.attributes,
                        requested: {
                            ...community.attributes.requested,
                            [Number(currentUser.id)]: false,
                        },
                    }
                }),
            })
            .then(() => {
                const updated = new Set(requestedCommunityIds);
                updated.delete(String(communityId));
                setRequestedCommunityIds(updated);
            })
            .catch((error) => {
                showAlert(t("searchPage.errors.cancelRequestFailed"));
            });
        });
    };
    
    useEffect(() => {    
        setLoading(true);
        
        const searchCommunities = async (currentUser) => {
            try {        
                // get the trimmed search value
                const trimmedSearchValue = searchValue.trim();
                if (trimmedSearchValue.length === 0) {
                    return true;
                }
                
                // search communities by name
                let attributes = {
                    path: "name",
                    stringContains: trimmedSearchValue,
                };
                let query = `attributes=${encodeURIComponent(JSON.stringify(attributes))}`;
                let url = `${process.env.REACT_APP_API_PATH}/groups?${query}`;
                let response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                        "Content-Type": "application/json",
                    },
                });
                
                // if the response fails, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                let data = await response.json();
                const communitiesData = data[0] ?? [];
                
                // process the found communities
                const promises = communitiesData.map(async (communityData) => {
                    const attributesData = communityData.attributes ?? [];
                    const requestedData = attributesData.requested ?? {};

                    const searchedCommunity = {};
                    searchedCommunity.groupID = String(communityData.id ?? "INVALID-ID");
                    searchedCommunity.creatorID = String(attributesData.creatorID ?? "INVALID-ID"); 
                    searchedCommunity.name = communityData.name ?? "Unknown";
                    searchedCommunity.tags = attributesData.tags ?? [];
                    searchedCommunity.color = attributesData.color ?? "#888";
                    searchedCommunity.attributes = attributesData;
                    searchedCommunity.isPrivate = attributesData.visibility === "private";
                    searchedCommunity.isRequested = requestedData[currentUser.id] === true;
                    
                    // skip communities with invalid ids
                    if (searchedCommunity.groupId === "INVALID-ID") {
                        return null;
                    }
                    
                    // skip communities with invalid ids
                    if (searchedCommunity.creatorID === "INVALID-ID") {
                        return null;
                    }
                    
                    // fetch the banner image
                    let query = `uploaderID=${searchedCommunity.creatorID}`;
                    let url = `${process.env.REACT_APP_API_PATH}/file-uploads?${query}`;
                    let response = await fetch(url, { method: "GET" });
                    
                    // if the response fails, throw an error
                    if (!response.ok) {
                        throw new Error("request failed");
                    }
                    
                    // extract the response data
                    let data = await response.json();
                    const filesData = data[0] || [];
                    
                    // find and set the banner
                    let bannerData = null;
                    filesData.forEach(file => {
                        if (
                            file.attributes.type === "communityBanner" &&
                            String(file.attributes.groupID) === String(searchedCommunity.groupID)
                        ) {
                            bannerData = process.env.REACT_APP_API_PATH_SOCKET + file.path;
                        }
                    });
                    searchedCommunity.banner = bannerData;

                    return searchedCommunity;
                });
                
                const results = await Promise.all(promises);
                
                const communityListData = [];
                const requestedCommunityIdsData = new Set();
                const communityIds = {};

                for (const community of results) {
                    if (!community) {
                        continue;
                    }
                    
                    // skip duplicate communities
                    if (communityIds[community.groupID]) {
                        continue;
                    }
                    
                    // update local community list, local requested community ids, and id set
                    communityListData.push(community);
                    communityIds[community.groupID] = true;
                    if (community.isRequested) {
                        requestedCommunityIdsData.add(community.groupID);
                    }
                }
                
                // update community list and requested community ids
                setCommunityList(communityListData);
                setRequestedCommunityIds(requestedCommunityIdsData);
                return true;
            }
            
            catch (error) {            
                showAlert(t("searchPage.errors.searchFailed"), true);
                return false;
            }
        };

        const fetchJoinedCommunityIds = async (currentUser) => {
            try {            
                // request all of the user's communities
                const query = `userID=${currentUser.id}`;
                const url = `${process.env.REACT_APP_API_PATH}/group-members?${query}`;
                const response = await fetch(url, {
                    headers: {
                        Authorization: `Bearer ${currentUser.token}`,
                        "Content-Type": "application/json",
                    },
                })
                
                // if the response fails, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                const data = await response.json();
                const membershipsData = data[0] ?? [];
                
                // process the data
                const joinedCommunityIdsData = new Set();
                for (const membershipData of membershipsData) {
                    const communityIdData = String(membershipData.groupID ?? "INVALID-ID");
                    
                    // skip memberships without a valid group id
                    if (communityIdData === "INVALID-ID") {
                        continue;
                    }
                    
                    // update the local joined community set
                    joinedCommunityIdsData.add(communityIdData);
                }
                
                // update the joined community set
                setJoinedCommunityIds(joinedCommunityIdsData);
                return true;
            }
            
            // show an alert
            catch (error) {
                showAlert(t("searchPage.errors.joinedCommunitiesFailed"), true);
                return false;
            }
        };
    
        const load = async () => {
            try {                
                // get session info from session storage
                const sessionId = sessionStorage.getItem("user");
                const sessionToken = sessionStorage.getItem("user-token");
                
                // the session info must be present
                if (!sessionId || !sessionToken) {
                    throw new Error("session info not found");
                }
                
                // fetch the current user
                let url = `${process.env.REACT_APP_API_PATH}/users/${sessionId}`;
                let response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                let data = await response.json();
                const attributesData = data.attributes ?? {};
                const usernameData = attributesData.username ?? "";
                
                // update the current user
                const updated = {
                    id: sessionId,
                    token: sessionToken,
                    attributes: {username: usernameData},
                };
                setCurrentUser(updated);
                
                // search communities
                let result = await searchCommunities(updated);
                if (!result) {
                    return;
                }
                
                // get the joined community ids
                result = await fetchJoinedCommunityIds(updated);
                if (!result) {
                    return;
                }
                
                // loading complete
                setLoading(false);
            }
            
            // show an alert
            catch (error) {
                showAlert(t("searchPage.errors.profileFailed"), true);
            }
        };
        load();
    }, [searchValue, navigate, showAlert]);
    
    // don't display until loading completes
    if (loading) {
        return (
            <>
                <div className="settings-page settings-page__loading">
                    <p className="settings-page__loading-text">{t("searchPage.loading")}</p>
                </div>
                <AlertModal
                    message={alertMessage}
                    isFatal={isAlertFatal}
                    isOpen={currentModal === "show-alert"}
                    onClose={() => setCurrentModal(null)}
                    onRetry={() => window.location.reload()}
                />
            </>
        );
    }
    
    return (
        <div className="search-page">
            <div className="search-page__title">
    {!searchValue ? (
        t("searchPage.title.noQuery")
    ) : communityList.length === 0 ? (
        t("searchPage.title.noResults", { query: searchValue })
    ) : (
        t("searchPage.title.showingResults", {
            count: communityList.length,
            query: searchValue,
        })
    )}
</div>
            
            <CommunityList
                communities={communityList}
                joinedCommunityIds={joinedCommunityIds}
                requestedCommunityIds={requestedCommunityIds}
                onJoin={onJoin}
                onRequest={onRequest}
                onCancelRequest={onCancelRequest}
            />
            
            <AlertModal
                message={alertMessage}
                isFatal={isAlertFatal}
                isOpen={currentModal === "show-alert"}
                onClose={() => setCurrentModal(null)}
                onRetry={() => window.location.reload()}
            />
        </div>
    );
};

const CommunityList = ({
    communities,
    joinedCommunityIds, 
    requestedCommunityIds, 
    onJoin, 
    onRequest, 
    onCancelRequest,
}) => {
    if (!communities || communities.length === 0) {
        return null;
    }
    
    return (
        <div className="communityList">
            {communities.map((community, index) => (
                <Link
                    key={index}
                    to={`/community/${community.groupID}`}
                    className="communityCardLink"
                    >
                    <CommunityCard
                        community={community}
                        isJoined={joinedCommunityIds.has(String(community.groupID))}
                        isRequested={requestedCommunityIds.has(String(community.groupID))}
                        onJoin={onJoin}
                        onRequest={onRequest}
                        onCancelRequest={onCancelRequest}
                    />
                </Link>
            ))}
        </div>
    );
};

const CommunityCard = ({
    community,
    isJoined,
    isRequested,
    onJoin, 
    onRequest, 
    onCancelRequest,
}) => {
    const { t } = useTranslation();
    return (
        <div className="communityCard">
            <div
                className="communityThumbnail"
                style={{
                    backgroundColor: community.banner ? undefined : community.color,
                }}
                >
                {community.banner && (
                    <img
                        src={community.banner}
                        alt={`${community.name} banner`}
                        style={{
                            width: "100%", 
                            height: "100%", 
                            objectFit: "cover",
                        }}
                    />
                )}
            </div>

            <div className="communityCardContent">
                <div className="communityCardMeta">
                    <h2>{community.name}</h2>
                    <div className="communityCardRight">
                        {community.isPrivate ? (
                            !isJoined && (!isRequested ? (
                                <button 
                                    className="joinBtn" 
                                    onClick={(event) => {
                                        event.preventDefault();
                                        onRequest(community.groupID);
                                    }}
                                    >{t("searchPage.buttons.request")}
                                </button>
                            ) : (
                                <button 
                                    className="requestedBtn" 
                                    onClick={(event) => {
                                        event.preventDefault();
                                        onCancelRequest(community.groupID);
                                    }}
                                    >{t("searchPage.buttons.requested")}
                                </button>
                            ))
                            
                        ) : (
                            !isJoined && (
                            <button 
                                className="joinBtn"
                                onClick={(event) => {
                                    event.preventDefault();
                                    onJoin(community.groupID);
                                }}
                                >{t("searchPage.buttons.join")}
                            </button>
                        ))}
                        
                        <p>
    {community.isPrivate
        ? t("searchPage.visibility.private")
        : t("searchPage.visibility.public")}
</p>
                    </div>
                </div>

                <div className="communityCardDivider"></div>

                <div className="communityTags">
                    {community.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="tag"
                            >{tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};

