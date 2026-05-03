import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "styles/settings-page/managers/BlockedUserManager.css";
import "styles/Profile.css";
import defaultProfilePicture from "assets/profile-picture.png";
import closeIcon from "assets/close-icon-light.png";

import * as Config from "config.js"

export const BlockedUserManager = ({
    currentUser,
    currentModal, setCurrentModal,
    showAlert,
}) => {
    const searchValueMaxLength = Config.MAX_USERNAME_LENGTH;
    const [searchValue, setSearchValue] = useState("");
    const [isSearching, setSearching] = useState(false);
        
    const [userList, setUserList] = useState([]);
    const { t } = useTranslation();
    const loadBlockedUsers = useCallback(async (controller, isActive) => {            
        // clear the user list
        if (isActive()) {
            setUserList([]);
        } else {
            return;
        }
        
        try {
            // retrieve all blocked users
            let attributes = {
                path: "type",
                equals: "block",
            };
            let query = (
                `fromUserID=${currentUser.id}&` +
                `attributes=${encodeURIComponent(JSON.stringify(attributes))}`
            );
            let url = `${process.env.REACT_APP_API_PATH}/connections?${query}`;
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
            let connectionsData = data[0] ?? [];
            
            // process the connections
            const userListData = [];
            const userIds = {};
            for (const connectionData of connectionsData) {
                if (!isActive()) {
                    return;
                }
                
                const userData = connectionData.toUser ?? {};
                const attributesData = userData.attributes ?? {};
            
                const blockedUser = {attributes: {}};
                blockedUser.id = String(userData.id ?? "INVALID-ID");
                blockedUser.attributes.connectionId = connectionData.id ?? null;
                blockedUser.attributes.username = attributesData.username ?? "Unknown";
                blockedUser.attributes.blocked = connectionData.id ? true : false;
                
                // skip the current user
                if (blockedUser.id === currentUser.id) {
                    continue;
                }
                
                // skip duplicate users
                if (userIds[blockedUser.id]) {
                    continue;
                }
                
                // skip users with invalid ids
                if (blockedUser.id === "INVALID-ID") {
                    continue;
                }
                
                // fetch the profile picture
                query = `uploaderID=${blockedUser.id}`;
                url = `${process.env.REACT_APP_API_PATH}/file-uploads?${query}`;
                response = await fetch(url, {method: "GET"});
                
                // if the request failed, throw an error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract the response data
                let data = await response.json();
                const filesData = data[0];
                
                // find and set the profile picture
                let profilePictureData = null;
                filesData.forEach(file => {
                    if (file.attributes.type === "profile-pic") {
                        profilePictureData = process.env.REACT_APP_API_PATH_SOCKET + file.path;
                    }
                });
                blockedUser.attributes.profilePicture = profilePictureData;
                
                // update the local user list and id set
                userListData.push(blockedUser);
                userIds[blockedUser.id] = true;
            }
                            
            // update the user list after iterations
            if (isActive()) {
                setUserList(userListData);
            } else {
                return;
            }
        }
        
        // show an alert
        catch (error) {
            if (isActive()) {
                showAlert("Failed to retrieve blocked users, check your internet connection.");
            } else {
                return;
            }
        }
    }, [currentUser.id, showAlert]);
    
    const searchUsers = useCallback(async (controller, isActive) => {    
        // clear user list
        if (isActive()) {
            setUserList([]);
        } else {
            return;
        }
        
        // get trimmed search value
        const trimmedSearchValue = searchValue.trim();
    
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
                
                // skip the current users
                if (searchedUser.id === currentUser.id) {
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
                
                // retrieve whether the searched user is blocked
                attributes = {
                    path: "type",
                    equals: "block",
                };
                query = (
                    `fromUserID=${currentUser.id}&` +
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
                const connectionsData = data[0] ?? [];
                const connectionData = connectionsData[0] ?? {};
                
                // if the response has at least one blocked connection, the user is blocked
                searchedUser.attributes.blocked = connectionsData.length > 0;
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
    }, [currentUser.id, searchValue, showAlert]);

    return (
        <div className="blocked-user-manager">
            <BlockedUserSearchBar
                placeholder={t("settings.fields.searchUsernames")}
                maxLength={searchValueMaxLength}
                value={searchValue}
                isSearching={isSearching}
                setSearching={setSearching}
                onChange={(event) => setSearchValue(event.target.value)}
                onClear={() => setSearchValue("")}
                onSearch={searchValue.length === 0 ? (
                    loadBlockedUsers
                ) : (
                    searchUsers
                )}
            />
            <div className="blocked-user-manager__list">
                {isSearching ? (
                    <div className="blocked-user-manager__empty-message">{t("settings.loading")}</div>
                
                ) : userList.length === 0 ? (
                    searchValue.length === 0 ? (
                        <div className="blocked-user-manager__empty-message">{t("settings.fields.noBlockedUsers")}</div>
                    ) : (
                        <div className="blocked-user-manager__empty-message">{t("settings.noResults")}</div>
                    )
                
                ) : userList.map((listedUser, index) => (
                    <BlockedUserListItem 
                        key={index}
                        currentUser={currentUser}
                        listedUser={listedUser}
                        isSearching={isSearching}
                        showAlert={showAlert}
                    />
                ))}
            </div>
        </div>
    );
};

const BlockedUserListItem = ({
    currentUser,
    listedUser,
    isSearching,
    showAlert,
}) => {
    const initialBlocked = listedUser.attributes.blocked;
    const [blocked, setBlocked] = useState(initialBlocked);
    const { t } = useTranslation();   
    const submitBlockRequest = async () => {        
        try {
            // request to block the listed user
            const url = `${process.env.REACT_APP_API_PATH}/connections`;
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${currentUser.token}`,
                },
                body: JSON.stringify({
                    fromUserID: currentUser.id,
                    toUserID: listedUser.id,
                    attributes: {type: "block"},
                }),
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // extract the response data
            const data = await response.json();
            const connectionIdData = data.id ?? null;
            
            // listed users without a connection id are considered not blocked
            if (connectionIdData === null) {
                return;
            }
            
            // update the listed user's blocked state
            setBlocked(true);
            listedUser.attributes.blocked = true;
            
            // update the listed user's connection id
            listedUser.attributes.connectionId = connectionIdData;
        }
        
        // show an alert
        catch (error) {            
            showAlert("Failed to block user, check your internet connection.");
        }
    };
    
    const submitUnblockRequest = async () => {
        try {
            // request to unblock the listed user
            const url = `${process.env.REACT_APP_API_PATH}/connections/${listedUser.attributes.connectionId}`;
            const response = await fetch(url, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${currentUser.token}`,
                },
            });
            
            // if the request failed, throw an error
            if (!response.ok) {
                throw new Error("request failed");
            }
            
            // update the listed user's blocked state
            setBlocked(false);
            listedUser.attributes.blocked = false;
            
            // update the listed user's connection id
            listedUser.attributes.connectionId = null;
        }
        
        // show an alert
        catch (error) {            
            showAlert("Failed to unblock user, check your internet connection.");
        }
    };

    return (
        <div className="blocked-user-list-item">
            <Link 
                className="blocked-user-list-item__profile-package"
                to={`/profile/${listedUser.id}`}
                >
                <img 
                    className="blocked-user-list-item__profile-picture" 
                    src={listedUser.attributes.profilePicture || defaultProfilePicture} 
                    alt="PROFILE"
                />
                <div className="blocked-user-list-item__username">
                    @{listedUser.attributes.username}
                </div>
            </Link>
            <button 
                className={blocked ? (
                    "blocked-user-list-item__unblock-button" 
                ) : ( 
                    "red-block-button"
                )}
                disabled={isSearching}
                onClick={() => {
                    if (!isSearching) {
                        if (blocked) {
                            submitUnblockRequest();
                        } else {
                            submitBlockRequest();
                        }
                    }
                }}
                >{blocked ? t("settings.actions.unblock") : t("settings.actions.block")}
            </button>
        </div>
    );
};

const BlockedUserSearchBar = ({
    placeholder,
    maxLength,
    value,
    isSearching, setSearching,
    onChange,
    onClear,
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
        <div className="blocked-user-searchbar">
            <input 
                className="blocked-user-searchbar__input"
                value={value}
                placeholder={placeholder}
                maxLength={maxLength}
                onChange={onChange}
                onKeyDown={onKeyDown}
            />
            <img 
                className="blocked-user-searchbar__clear-button"
                style={value.length > 0 ? ({
                    opacity: "100%",
                    pointerEvents: "auto",
                }) : ({
                    opacity: "0%",
                    pointerEvents: "none",
                })}
                src={closeIcon}
                alt="CLEAR"
                onClick={(event) => {
                    if (!isSearching) {
                        onClear(event);
                    }
                }}
            />
        </div>
    );
};

