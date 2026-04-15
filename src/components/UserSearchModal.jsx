import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';

import "styles/UserSearchModal.css";

import defaultProfilePicture from "assets/profile-picture.png";
import closeIcon from "assets/close-icon-dark.png";

import { notificationsToArray } from "utilities/postLikeNotification";
import * as Config from "config.js"

export const UserSearchModal = ({
    userId,
    userToken,
    isOpen,
    onClose,
    showAlert,
}) => {
    const searchValueMaxLength = Config.MAX_USERNAME_LENGTH;
    const [searchValue, setSearchValue] = useState("");
    const [isSearching, setSearching] = useState(false);
        
    const [userList, setUserList] = useState([]);
    
    const searchUsers = useCallback(async (controller, isActive) => {    
        // clear user list
        if (isActive()) {
            setUserList([]);
        } else {
            return;
        }
        
        // get trimmed search value
        const trimmedSearchValue = searchValue.trim();
        
        // don't search on an empty input
        if (trimmedSearchValue.length === 0) {
            return;
        }
    
        try {
            // search users by username
            let attributes = {
                path: "username",
                stringContains: trimmedSearchValue,
            };
            let query = `attributes=${encodeURIComponent(JSON.stringify(attributes))}`
            let url = `${process.env.REACT_APP_API_PATH}/users?${query}`;
            let response = await fetch(url, {
                method: "GET",
                signal: controller.signal,
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // extract the response data
            let data = await response.json();
            let usersData = data[0] ?? [];
            
            // process the found users
            const userListData = [];
            const userIds = {};
            for (const userData of usersData) {
                if (!isActive()) {
                    return;
                }
                
                const attributesData = userData.attributes ?? {};
                
                const searchedUser = {attributes: {}};
                searchedUser.id = String(userData.id ?? "INVALID-ID");
                searchedUser.attributes.username = attributesData.username ?? "Unknown";
                searchedUser.attributes.privateAccount = attributesData.privateAccount ?? false;
                
                // skip the current users
                if (searchedUser.id === userId) {
                    continue;
                }
                
                // skip duplicate users
                if (userIds[searchedUser.id]) {
                    continue;
                }
                
                // skip users with invalid ids
                if (searchedUser.id === "INVALID-ID") {
                    continue;
                }
                
                // retrieve whether the current user is blocking the searched user
                attributes = {
                    path: "type",
                    equals: "block",
                };
                query = (
                    `fromUserID=${userId}&` +
                    `toUserID=${searchedUser.id}&` +
                    `attributes=${encodeURIComponent(JSON.stringify(attributes))}`
                );
                url = `${process.env.REACT_APP_API_PATH}/connections?${query}`;
                response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data data
                data = await response.json();
                let connectionsData = data[0] ?? [];
                let connectionData = null;
                   
                // skip blocked users
                if (connectionsData.length > 0) {
                    continue;
                }
                
                // retrieve whether the searched user is blocking the current user
                attributes = {
                    path: "type",
                    equals: "block",
                };
                query = (
                    `fromUserID=${searchedUser.id}&` +
                    `toUserID=${userId}&` +
                    `attributes=${encodeURIComponent(JSON.stringify(attributes))}`
                );
                url = `${process.env.REACT_APP_API_PATH}/connections?${query}`;
                response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data data
                data = await response.json();
                connectionsData = data[0] ?? [];
                connectionData = null;
                   
                // skip blocked users
                if (connectionsData.length > 0) {
                    continue;
                }
                
                // retrieve whether the searched user is being followed
                attributes = {
                    path: "type",
                    equals: "follow",
                };
                query = (
                    `fromUserID=${userId}&` +
                    `toUserID=${searchedUser.id}&` +
                    `attributes=${encodeURIComponent(JSON.stringify(attributes))}`
                );
                url = `${process.env.REACT_APP_API_PATH}/connections?${query}`;
                response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data data
                data = await response.json();
                connectionsData = data[0] ?? [];
                connectionData = connectionsData[0] ?? {};
                
                // if the response has at least one following connection, the user is being followed
                searchedUser.attributes.following = connectionsData.length > 0;
                searchedUser.attributes.connectionId = connectionData.id ?? null;
                
                // fetch the profile picture from the server
                query = `uploaderID=${searchedUser.id}`;
                url = `${process.env.REACT_APP_API_PATH}/file-uploads?${query}`;
                response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                data = await response.json();
                const filesData = data[0] ?? [];
                
                // find and set the profile picture
                let profilePictureData = null;
                filesData.forEach(file => {
                    if (file.attributes.type === "profile-pic") {
                        profilePictureData = process.env.REACT_APP_API_PATH_SOCKET + file.path;
                    }
                });
                searchedUser.attributes.profilePicture = profilePictureData;
                
                let followRequestedData = false;
                if (searchedUser.attributes.privateAccount === true) {
                    // fetch the current user
                    url = `${process.env.REACT_APP_API_PATH}/users/${searchedUser.id}`;
                    response = await fetch(url, {method: "GET"});
                    
                    // if the request failed, throw error
                    if (!response.ok) {
                        throw new Error("request failed");
                    }
                    
                    // extract the response data
                    data = await response.json();
                    const followRequests = data.attributes?.followRequests;
                    
                    if (followRequests && userId in followRequests) {
                        followRequestedData = followRequests[userId];
                    }
                }
                searchedUser.attributes.followRequested = followRequestedData;
                
                // update the local user list and id set
                userListData.push(searchedUser);
                userIds[searchedUser.id] = true;
            }
            
            // update user list after iterations
            if (isActive()) {
                setUserList(userListData);
            } else {
                return;
            }
        }
        
        // show an alert
        catch (error) {
            if (isActive()) {
                showAlert("Failed to search for users, check your internet connection and try again.");
            } else {
                return;
            }
        }
    }, [userId, searchValue, showAlert]);
    
    if (!isOpen) {
        return null;
    }

    return (
        <div className="user-search-modal">
            <div className="user-search-modal__menu">
                <img 
                    className="user-search-modal__close-button"
                    src={closeIcon}
                    alt="CLOSE"
                    onClick={() => {
                        setSearchValue("");
                        setUserList([]);
                        onClose();
                    }}
                />
                
                <div className="user-search-modal__message">Search Users</div>
            
                <UserSearchBar
                    placeholder="Search Usernames..."
                    maxLength={searchValueMaxLength}
                    value={searchValue}
                    isSearching={isSearching}
                    setSearching={setSearching}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onClear={() => setSearchValue("")}
                    onSearch={searchUsers}
                />
                <div className="user-search-modal__list">
                    {isSearching ? (
                        searchValue.length === 0 ? (
                            <div className="user-search-modal__empty-message">No search query provided</div>
                        ) : (
                            <div className="user-search-modal__empty-message">Loading...</div>
                        )
                    
                    ) : userList.length === 0 ? (
                        searchValue.length === 0 ? (
                            <div className="user-search-modal__empty-message">No search query provided</div>
                        ) : (
                            <div className="user-search-modal__empty-message">No results found</div>
                        )
                    
                    ) : userList.map((listedUser, index) => (
                        <UserListItem 
                            key={index}
                            userId={userId}
                            userToken={userToken}
                            listedUser={listedUser}
                            isSearching={isSearching}
                            onClose={() => {
                                setSearchValue("");
                                setUserList([]);
                                onClose();
                            }}
                            showAlert={showAlert}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

const UserListItem = ({
    userId,
    userToken,
    listedUser,
    isSearching,
    onClose,
    showAlert,
}) => {
    const initialFollowing = listedUser.attributes.following;
    const initialIsFollowRequested = listedUser.attributes.followRequested;
    const [isFollowing, setFollowing] = useState(initialFollowing);
    const [isFollowRequested, setIsFollowRequested] = useState(initialIsFollowRequested);
        
    const submitFollowRequest = async () => {        
        try {
            // request to follow the listed user
            const url = `${process.env.REACT_APP_API_PATH}/connections`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userToken}`,
                },
                body: JSON.stringify({
                    fromUserID: userId,
                    toUserID: listedUser.id,
                    attributes: {type: "follow"},
                }),
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // extract the response data
            const data = await response.json();
            const connectionIdData = data.id ?? null;
            
            // listed users without a connection id are considered not following
            if (connectionIdData === null) {
                return;
            }
            
            // update the listed user's following state
            setFollowing(true);
            listedUser.attributes.following = true;
            
            // update the listed user's connection id
            listedUser.attributes.connectionId = connectionIdData;
        }
        
        // show an alert
        catch (error) {            
            showAlert("Failed to follow user, check your internet connection.");
        }
    };
    
    const submitUnfollowRequest = async () => {
        try {
            // request to unfollow the listed user
            const url = `${process.env.REACT_APP_API_PATH}/connections/${listedUser.attributes.connectionId}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${userToken}`,
                },
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // update the listed user's following state
            setFollowing(false);
            listedUser.attributes.following = false;
            
            // update the listed user's connection id
            listedUser.attributes.connectionId = null;
        }
        
        // show an alert
        catch (error) {            
            showAlert("Failed to unfollow user, check your internet connection.");
        }
    };
    
    const requestFollow = async (targetUser) => {
        const requestId = uuidv4();
        const date = new Date();
        
        try {
            let url = `${process.env.REACT_APP_API_PATH}/users/${userId}`;
            let response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    "Content-Type": "application/json"
                },
            });
            
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            let data = await response.json();
            const usernameData = data.attributes?.username || "Unknown";
        
            url = `${process.env.REACT_APP_API_PATH}/users/${targetUser.id}`;
            response = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${userToken}`,
                    "Content-Type": "application/json"
                },
            });
            
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            data = await response.json();
            const userAttributes = data.attributes || {};
            const userFollowRequests = userAttributes.followRequests || {};
            const userNotifications = notificationsToArray(userAttributes.notifications);
            
            const newNotification = {
                id: requestId,
                type: "Request to Follow",
                content: `@${usernameData} wants to follow you`,
                read_status: false,
                fromUserId: userId,
                toUserId: targetUser.id,
                time: date,
            };
            
            const requestFollowUrl = `${process.env.REACT_APP_API_PATH}/users/${targetUser.id}`;
            const requestFollowResponse = await fetch(requestFollowUrl, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${userToken}`,
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
                            [Number(userId)]: true,
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
            showAlert("Failed to send follow request: " + error);
        }
    }

    return (
        <div className="user-list-item">
            <Link 
                className="user-list-item__profile-package"
                to={`/profile/${listedUser.id}`}
                onClick={onClose}
                >
                <img 
                    className="user-list-item__profile-picture" 
                    src={listedUser.attributes.profilePicture || defaultProfilePicture} 
                    alt="PROFILE"
                />
                <div className="user-list-item__username">
                    @{listedUser.attributes.username}
                </div>
            </Link>
            {listedUser.attributes.privateAccount === true ? (
                <button 
                    className={isFollowing || isFollowRequested ? (
                        "user-list-item__follow-button" 
                    ) : ( 
                        "user-list-item__unfollow-button"
                    )}
                    disabled={isSearching}
                    onClick={() => {
                        if (!isSearching) {
                            if (isFollowing) {
                                submitUnfollowRequest();
                            } else if (!isFollowRequested) {
                                requestFollow(listedUser);
                            }
                        }
                    }}
                    >{isFollowing ? (
                        "Unfollow"
                    ) : isFollowRequested ? (
                        "Requested"
                    ) : (
                        "Request"
                    )}
                </button>
            ) : (
                <button 
                    className={isFollowing ? (
                        "user-list-item__follow-button" 
                    ) : ( 
                        "user-list-item__unfollow-button"
                    )}
                    disabled={isSearching}
                    onClick={() => {
                        if (!isSearching) {
                            if (isFollowing) {
                                submitUnfollowRequest();
                            } else {
                                submitFollowRequest();
                            }
                        }
                    }}
                    >{isFollowing ? "Unfollow" : "Follow"}
                </button>
            )}
        </div>
    );
};

const UserSearchBar = ({
    placeholder,
    maxLength,
    value,
    setSearching,
    onChange,
    onSearch,
}) => {
    const requestIdRef = useRef(0);
    
    useEffect(() => {
        const controller = new AbortController(); // cancels stale requests
        const requestId = ++requestIdRef.current; // tracks the current process
        let active = true;
        
        // searching, block submissions
        setSearching(true);
        
        // determines if a process is stale
        const isActive = () => {
            return (
                active &&
                !controller.signal.aborted &&
                requestId === requestIdRef.current
            );
        };
        
        // validate after INPUT_DELAY to prevent spam
        const timeout = setTimeout(async () => {
            await onSearch(controller, isActive);
            
            // finished searching, unblock submissions
            if (isActive()) {
                setSearching(false);
            } else {
                return;
            }
        }, Config.INPUT_DELAY);
        
        return () => {
            // clean up the current process
            active = false;
            controller.abort();
            clearTimeout(timeout);
            
            // finished searching, unblock submissions
            setSearching(false);
        };
    }, [value, setSearching, onSearch]);
    
    const onKeyDown = (event) => {
        // unfocus on enter or escape key
        if (event.key === "Enter" || event.key === "Escape") {
            event.preventDefault();
            event.target.blur();
        }
    };

    return (
        <div className="user-searchbar">
            <input 
                className="user-searchbar__input"
                value={value}
                placeholder={placeholder}
                maxLength={maxLength}
                onChange={onChange}
                onKeyDown={onKeyDown}
            />
        </div>
    );
};

