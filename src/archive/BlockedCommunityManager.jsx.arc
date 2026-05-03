/* ============================================================================================= */
/* | IMPORTS | */
/* =========== */

    import React, { useCallback, useEffect, useRef, useState } from "react";
    import { Link } from "react-router-dom";

    import "styles/settings-page/BlockedCommunityManager.css";

    import closeIcon from "assets/close-icon-light.png";

    import * as Config from "config.js"

/* ============================================================================================= */
/* | BLOCKED COMMUNITY MANAGER | */
/* ============================= */

    const BlockedCommunityManager = ({
        userId,
        userToken,
        setAlertMessage,
        setCurrentModal,
    }) => {

/* ============================================================================================= */
/* | BLOCKED COMMUNITY MANAGER :: STATE VARIABLES | */
/* ================================================ */

        const [searchValue, setSearchValue] = useState("");
        const [communityList, setCommunityList] = useState([]);
        const [updatePending, setUpdatePending] = useState(false);

/* ============================================================================================= */
/* | BLOCKED COMMUNITY MANAGER :: REQUESTS | */
/* ========================================= */

        const loadBlockedCommunities = useCallback(async (controller, isActive) => {            
            // clear user list
            if (isActive()) {
                setCommunityList([]);
            } else {
                return;
            }
            
            try {
                // fetch blocked communities
                const connectionsQuery = encodeURIComponent(JSON.stringify({
                    path: "type",
                    equals: "block-community",
                }));
                const connectionsURL = (
                    `${process.env.REACT_APP_API_PATH}/connections?`
                    + `fromUserID=${userId}&`
                    + `attributes=${connectionsQuery}`
                );
                const connectionsResponse = await fetch(connectionsURL, {
                    method: "GET",
                    signal: controller.signal,
                });
                
                // if the request failed, throw error
                if (!connectionsResponse.ok) {
                    throw new Error("request failed");
                }
                
                // extract data
                const connectionsData = await connectionsResponse.json();
                const communityListData = [];
                const blockedCommunityIds = {};
                for (const connection of connectionsData[0]) {
                    if (!isActive()) {
                        return;
                    }
                
                    const blockedCommunity = {attributes: {}};
                    blockedCommunity.id = connection.toUser?.id || "INVALID-ID";
                    blockedCommunity.attributes.name = connection.toUser?.name || "Unknown";
                    blockedCommunity.attributes.blocked = true;
                    blockedCommunity.attributes.connectionId = connection.id || "INVALID-ID";
                    
                    // skip duplicate communities
                    if (blockedCommunityIds[blockedCommunity.id]) {
                        continue;
                    }
                    
                    // skip community with invalid ids
                    if (blockedCommunity.id === "INVALID-ID") {
                        continue;
                    }
                    
                    // skip connections with invalid ids
                    if (blockedCommunity.attributes.connectionId === "INVALID-ID") {
                        continue;
                    }
                    
                    // update id set
                    blockedCommunityIds[blockedCommunity.id] = true;
                    
                    // update local community list
                    communityListData.push(blockedCommunity);
                }
                                
                // update community list after iterations
                if (isActive()) {
                    setCommunityList(communityListData);
                } else {
                    return;
                }
            }
            
            // show error message
            catch (error) {
                if (isActive()) {
                    setAlertMessage("Failed to fetch blocked communities, check your internet connection.");
                    setCurrentModal("show-alert");
                } else {
                    return;
                }
            }
        }, [userId, setAlertMessage, setCurrentModal]);

        const searchCommunities = useCallback(async (controller, isActive) => {            
            // clear community list
            if (isActive()) {
                setCommunityList([]);
            } else {
                return;
            }
            
            // get trimmed search value
            const trimmedSearchValue = searchValue.trim();
        
            try {
                // search communities by community name
                const searchQuery = encodeURIComponent(JSON.stringify({
                    path: "name",
                    stringContains: trimmedSearchValue,
                }));
                const searchURL = `${process.env.REACT_APP_API_PATH}/groups?attributes=${searchQuery}`;
                const searchResponse = await fetch(searchURL, {
                    method: "GET",
                    signal: controller.signal,
                });
                
                // if the request failed, throw error
                if (!searchResponse.ok) {
                    throw new Error("request failed");
                }
                
                // extract data
                const searchData = await searchResponse.json();
                const communityListData = [];
                const searchedCommunityIds = {};
                for (let i = 0; i < searchData[0].length; i++) {
                    if (!isActive()) {
                        return;
                    }
                    
                    const community_i = searchData[0][i];
                    const searchedCommunity = {attributes: {}};
                    searchedCommunity.id = community_i.id || "INVALID-ID";
                    searchedCommunity.attributes.name = community_i.name || "Unknown";
                    searchedCommunity.attributes.color = community_i.attributes?.color || "#FFF";
                    
                    // skip duplicate communities
                    if (searchedCommunityIds[searchedCommunity.id]) {
                        continue;
                    }
                    
                    // skip communities with invalid ids
                    if (searchedCommunity.id === "INVALID-ID") {
                        continue;
                    }
                    
                    // fetch whether the searched community is blocked
                    const connectionsQuery = encodeURIComponent(JSON.stringify({
                        path: "type",
                        equals: "block",
                    }));
                    const connectionsURL = (
                        `${process.env.REACT_APP_API_PATH}/connections?`
                        + `fromUserID=${userId}&`
                        + `toUserID=${searchedCommunity.id}&`
                        + `attributes=${connectionsQuery}`
                    );
                    const connectionsResponse = await fetch(connectionsURL, {method: "GET"});
                    
                    // if the request failed, throw error
                    if (!connectionsResponse.ok) {
                        throw new Error("request failed");
                    }
                    
                    // extract data
                    const connectionsData = await connectionsResponse.json();
                    
                    // if the response has at least one blocked connection, the community is blocked
                    searchedCommunity.attributes.blocked = connectionsData[0].length > 0;
                    searchedCommunity.attributes.connectionId = connectionsData.id || "INVALID-ID";
                    
                    // update id set
                    searchedCommunityIds[searchedCommunity.id] = true;
                    
                    // update local community list
                    communityListData.push(searchedCommunity);
                }
                
                // update community list after iterations
                if (isActive()) {
                    setCommunityList(communityListData);
                } else {
                    return;
                }
            }
            
            // show error message
            catch (error) {
                if (isActive()) {
                    setAlertMessage("Failed to search communities, check your internet connection and try again.");
                    setCurrentModal("show-alert");
                } else {
                    return;
                }
            }
        }, [userId, searchValue, setAlertMessage, setCurrentModal]);

/* ============================================================================================= */
/* | BLOCKED COMMUNITY MANAGER :: RETURN VALUE | */
/* ============================================= */

        return (
            <div className="blocked-community-manager">
                <div className="blocked-community-manager__title">Blocked Communities</div>
                <BlockedCommunitySearchbar
                    value={searchValue}
                    placeholder="Search Communities..."
                    maxLength={Config.MAX_COMMUNITY_NAME_LENGTH}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onClear={() => setSearchValue("")}
                    effectCallback={
                        searchValue.length === 0 ? (
                            loadBlockedCommunities
                        ) : (
                            searchCommunities
                        )
                    }
                    updatePending={updatePending}
                    setUpdatePending={setUpdatePending}
                />
                <div className="blocked-community-manager__list">
                    {updatePending ? (
                        <div className="blocked-community-manager__empty-message">Loading...</div>
                    )
                    
                    : communityList.length === 0 ? (
                        searchValue.length === 0 ? (
                            <div className="blocked-community-manager__empty-message">You have no blocked communities</div>
                        ) : (
                            <div className="blocked-community-manager__empty-message">No results found</div>
                        )
                    )
                    
                    : communityList.map((listedCommunity, index) => (
                        <BlockedCommunityListItem 
                            key={index}
                            userId={userId}
                            userToken={userToken}
                            listedCommunity={listedCommunity}
                            setAlertMessage={setAlertMessage}
                            setCurrentModal={setCurrentModal}
                        />
                    ))}
                </div>
            </div>
        );
    };

/* ============================================================================================= */
/* | BLOCKED COMMUNITY LIST ITEM | */
/* =============================== */

    const BlockedCommunityListItem = ({
        userId, 
        userToken,
        listedCommunity,
        connectionId,
        updatePending,
        setUpdatePending,
        setAlertMessage,
        setCurrentModal,
    }) => {

/* ============================================================================================= */
/* | BLOCKED COMMUNITY LIST ITEM :: STATE VARIABLES | */
/* ================================================== */

        const [blocked, setBlocked] = useState(listedCommunity.attributes.blocked);

/* ============================================================================================= */
/* | BLOCKED COMMUNITY LIST ITEM :: REQUESTS | */
/* =========================================== */
        
        const submitBlockRequest = async () => {
            /*
            try {
                // request block connection
                const url = `${process.env.REACT_APP_API_PATH}/group-members`;
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${userToken}`,
                    },
                    body: JSON.stringify({
                        fromUserID: userId,
                        toUserID: listedCommunity.id,
                        attributes: {type: "block-community"},
                    }),
                });
                
                // if the request failed, throw error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // extract data
                const data = await response.json();
                const connectionIdData = data.id || "INVALID_ID";
                
                // remove listed community if connection has an invalid id
                if (connectionIdData === "INVALID_ID") {
                    // nimp
                }
                
                // update blocked state
                setBlocked(true);
                listedCommunity.attributes.blocked = true;
                
                // update connection id
                listedCommunity.attributes.connectionId = connectionIdData;
            }
            
            // show error message
            catch (error) {            
                setAlertMessage("Failed to block community, check your internet connection.");
                setCurrentModal("show-alert");
            }
            */
        };
        
        const submitUnblockRequest = async () => {
            /*
            try {
                // request block connection
                const url = `${process.env.REACT_APP_API_PATH}/connections/${listedCommunity.attributes.connectionId}`;
                const response = await fetch(url, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${userToken}`,
                    },
                });
                
                // if the request failed, throw error
                if (!response.ok) {
                    throw new Error("request failed");
                }
                
                // update blocked state
                setBlocked(false);
            }
            
            // show error message
            catch (error) {            
                setAlertMessage("Failed to unblock community, check your internet connection.");
                setCurrentModal("show-alert");
            }
            */
        };

/* ============================================================================================= */
/* | BLOCKED COMMUNITY LIST ITEM :: RETURN VALUE | */
/* =============================================== */

        const iconStyle = {
            background: listedCommunity.attributes.color,
        };

        return (
            <div className="blocked-community-list-item">
                <Link 
                    className="blocked-community-list-item__profile-package"
                    to={`/community/${listedCommunity.id}`}
                    >
                    <div 
                        className="blocked-community-list-item__icon" 
                        style={iconStyle}
                        alt="COMMUNITY"
                    ></div>
                    <div className="blocked-community-list-item__name">
                        {listedCommunity.attributes.name}
                    </div>
                </Link>
                <BlockedCommunityToggle
                    blocked={blocked}
                    disabled={updatePending}
                    onClick={() => {
                        if (!updatePending) {
                            if (blocked) {
                                submitUnblockRequest();
                            } else {
                                submitBlockRequest();
                            }
                        }
                    }}
                />
            </div>
        );
    };

/* ============================================================================================= */
/* | BLOCKED COMMUNITY TOGGLE | */
/* ============================ */

    const BlockedCommunityToggle = ({ blocked, disabled, onClick }) => {        
        return (
            <button 
                className={blocked ? (
                    "blocked-community-toggle__blocked" 
                ) : ( 
                    "blocked-community-toggle__unblocked"
                )}
                disabled={disabled}
                onClick={(event) => {
                    onClick(event);
                }}
                >{blocked ? "Unblock" : "Block"}
            </button>
        );
    }

/* ============================================================================================= */
/* | BLOCKED COMMUNITY SEARCHBAR | */
/* =============================== */

    const BlockedCommunitySearchbar = ({
        value,
        placeholder,
        maxLength,
        onChange,
        onClear,
        effectCallback,
        updatePending,
        setUpdatePending,
    }) => {
        const requestIdRef = useRef(0);
        
        useEffect(() => {
            const controller = new AbortController();
            const requestId = ++requestIdRef.current;
            let active = true;
            
            // pending
            setUpdatePending(true);
        
            const isActive = () => (
                active &&
                !controller.signal.aborted &&
                requestId === requestIdRef.current
            );
            
            const timeout = setTimeout(async () => {
                await effectCallback(controller, isActive);
                
                // finished
                if (isActive()) {
                    setUpdatePending(false);
                } else {
                    return;
                }
            }, Config.INPUT_DELAY);
            
            return () => {
                active = false;
                controller.abort();
                clearTimeout(timeout);
                
                // finished
                setUpdatePending(false);
            };
        }, [value, effectCallback, setUpdatePending]);
    
        return (
            <div className="blocked-community-searchbar">
                <input 
                    className="blocked-community-searchbar__input"
                    value={value}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    onChange={onChange}
                />
                <img 
                    className="blocked-community-searchbar__clear-button"
                    src={closeIcon}
                    alt="CLEAR"
                    onClick={(event) => {
                        if (!updatePending) {
                            onClear(event);
                        }
                    }}
                />
            </div>
        );
    };

/* ============================================================================================= */
/* | EXPORTS | */
/* =========== */

    export default BlockedCommunityManager;

