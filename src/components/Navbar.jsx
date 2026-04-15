import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import logoutIcon from "../assets/logout.png";
import gearIcon from "../assets/gear_test.png";
import aboutDevsIcon from "../assets/aboutDev.svg";
import homeIcon from "../assets/home.svg";
import styleIcon from "../assets/styleIcon.svg";
import logoIcon from "../assets/logo.png";
import hamburgerIcon from "../assets/hamburgerMenu.svg";
import defaultProfileIcon from "../assets/default-profile.svg";
import bellIcon from "../assets/bell.png";
import searchIcon from "assets/search-icon.png";
import usersIcon from "assets/users-icon.png";
import "../styles/Navbar.css";

import logout from "utilities/logout.js";
import * as Config from "config.js"
import { notificationsToArray } from "utilities/postLikeNotification";

import { UserSearchModal } from "components/UserSearchModal.jsx";

const Navbar = ({ user }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState(null);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isUserSearchOpen, setUserSearchOpen] = useState(false);
    
    const [searchValue, setSearchValue] = useState("");

    const userId = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("user-token");
    const SEEN_KEY = `notif-seen-${userId}`;

    const [seenIds, setSeenIds] = useState(() => {
        try {
            const stored = localStorage.getItem(SEEN_KEY);
            return stored ? new Set(JSON.parse(stored)) : new Set();
        } catch { return new Set(); }
    });

    const [followerStates, setFollowerStates] = useState({});
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

    const desktopNotifRef = useRef(null);
    const mobileNotifRef = useRef(null);
    const navigate = useNavigate();

    const toggleMenu = () => setMenuOpen(!menuOpen);
    const handleMenuNavigate = () => setMenuOpen(false);

    const handleLogout = async (event) => {
        event.preventDefault();
        const logoutResult = await logout();
        if (logoutResult) navigate("/");
    };
    
    const onSearch = (event) => {
        event.preventDefault();
        
        // trim search value
        const trimmedSearchValue = searchValue.trim();
        
        navigate(`/search/${encodeURIComponent(trimmedSearchValue)}`);
        window.location.reload();
    };

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 1024);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            const clickedDesktop = desktopNotifRef.current && desktopNotifRef.current.contains(e.target);
            const clickedMobile = mobileNotifRef.current && mobileNotifRef.current.contains(e.target);
            const portalDropdown = document.querySelector(".notif-dropdown-portal");
            const clickedPortal = portalDropdown && portalDropdown.contains(e.target);
            if (!clickedDesktop && !clickedMobile && !clickedPortal) {
                setNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        getProfilePhoto();
        fetchNotifications();
    }, []);

    useEffect(() => {
        const onNotifsUpdated = () => {
            fetchNotifications();
        };
        window.addEventListener("goat-notifications-updated", onNotifsUpdated);
        return () => window.removeEventListener("goat-notifications-updated", onNotifsUpdated);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getProfilePhoto = () => {
        fetch(`${process.env.REACT_APP_API_PATH}/file-uploads?uploaderID=${userId}`)
            .then(res => res.json())
            .then(data => {
                const files = data[0] || [];
                files.forEach(file => {
                    if (file.attributes.type === "profile-pic") {
                        setProfilePhoto(process.env.REACT_APP_API_PATH_SOCKET + file.path);
                    }
                });
            })
            .catch(err => console.error("Error fetching photos:", err));
    };

    async function fetchNotifications() {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`);
            const data = await res.json();

            const attributes = data.attributes || {};
            const allNotificationsEnabled = attributes.allNotifications ?? true;

            let active = notificationsToArray(attributes.notifications)
                .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

            // Filter notifications if "All Notifications" is toggled off
            if (allNotificationsEnabled === false) {
                active = active.filter(n =>
                    n.type === "Request to Follow" ||
                    n.type === "Request to Join Your Private Community"
                );
            }

            setNotifications(active);

            const followNotifs = active.filter((n) => n.type === "Someone Followed You");
            if (followNotifs.length > 0) {
              checkFollowerStates(followNotifs);
            } else {
              setFollowerStates({});
            }
          } catch (err) {
            console.error("Failed to fetch notifications:", err);
          }
    }

    async function checkFollowerStates(followNotifs) {
        const states = {};
        await Promise.all(
            followNotifs.map(async (n) => {
                try {
                    const res = await fetch(
                        `${process.env.REACT_APP_API_PATH}/connections?fromUserID=${n.fromUserId}&toUserID=${n.toUserId}`
                    );
                    const data = await res.json();
                    const stillFollowing = (data[0] || []).some(
                        c => String(c.fromUserID) === String(n.fromUserId) &&
                             String(c.toUserID) === String(n.toUserId) &&
                             c.attributes?.type === "follow"
                    );
                    const revRes = await fetch(
                        `${process.env.REACT_APP_API_PATH}/connections?fromUserID=${n.toUserId}&toUserID=${n.fromUserId}`
                    );
                    const revData = await revRes.json();
                    const alreadyBack = (revData[0] || []).some(
                        c => String(c.fromUserID) === String(n.toUserId) &&
                             String(c.toUserID) === String(n.fromUserId) &&
                             c.attributes?.type === "follow"
                    );
                    states[n.id] = { stillFollowing, alreadyBack };
                } catch {
                    states[n.id] = { stillFollowing: false, alreadyBack: false };
                }
            })
        );
        setFollowerStates(states);
    }

    function handleOpenNotif() {
        setNotifOpen(prev => {
            if (!prev) {
                const newSeen = new Set(notifications.map(n => n.id));
                setSeenIds(newSeen);
                try {
                    localStorage.setItem(SEEN_KEY, JSON.stringify([...newSeen]));
                } catch {}
            }
            return !prev;
        });
    }
    
    const hasNew = notifications.some(n => n.read_status === false && !seenIds.has(n.id));

    async function deleteNotification(notifId) {
        try {
            const res = await fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`);
            const data = await res.json();
            const updatedNotifs = notificationsToArray(data.attributes?.notifications).filter(n => n.id !== notifId);
            await fetch(`${process.env.REACT_APP_API_PATH}/users/${userId}`, {
                method: "PATCH",
                headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
                body: JSON.stringify({ attributes: { ...data.attributes, notifications: updatedNotifs } }),
            });
            setNotifications(prev => prev.filter(n => n.id !== notifId));
        } catch (err) {
            console.error("Failed to delete notification:", err);
        }
    }

    async function handleAcceptRequest(notif) {
        await fetch(`${process.env.REACT_APP_API_PATH}/group-members`, {
            method: "POST",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({ userID: notif.user_id, groupID: notif.group_id, attributes: {} }),
        });
        const grpRes = await fetch(`${process.env.REACT_APP_API_PATH}/groups/${notif.group_id}`);
        const grpData = await grpRes.json();
        await fetch(`${process.env.REACT_APP_API_PATH}/groups/${notif.group_id}`, {
            method: "PATCH",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({
                attributes: {
                    ...grpData.attributes,
                    requested: { ...grpData.attributes?.requested, [Number(notif.user_id)]: false },
                },
            }),
        });
        deleteNotification(notif.id);
    }

    async function handleDenyRequest(notif) {
        const grpRes = await fetch(`${process.env.REACT_APP_API_PATH}/groups/${notif.group_id}`);
        const grpData = await grpRes.json();
        await fetch(`${process.env.REACT_APP_API_PATH}/groups/${notif.group_id}`, {
            method: "PATCH",
            headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify({
                attributes: {
                    ...grpData.attributes,
                    requested: { ...grpData.attributes?.requested, [Number(notif.user_id)]: false },
                },
            }),
        });
        deleteNotification(notif.id);
    }

    async function handleAcceptFollow(notif) {
    try {
        const followRes = await fetch(`${process.env.REACT_APP_API_PATH}/connections`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                fromUserID: parseInt(notif.fromUserId),
                toUserID: parseInt(notif.toUserId),
                attributes: { type: "follow" },
            }),
        });

        if (!followRes.ok) {
            throw new Error("Failed to create follow connection");
        }

        const ownerRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${notif.toUserId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const ownerData = await ownerRes.json();

        const existingNotifs = notificationsToArray(ownerData?.attributes?.notifications);

        const cleanedNotifs = existingNotifs.map((n) =>
            n.id === notif.id ? { ...n, read_status: true } : n
        );

        const patchRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${notif.toUserId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                attributes: {
                    ...ownerData.attributes,
                    notifications: cleanedNotifs,
                    followRequests: {
                        ...(ownerData.attributes?.followRequests || {}),
                        [Number(notif.fromUserId)]: false,
                    },
                },
            }),
        });

        if (!patchRes.ok) {
            throw new Error("Failed to update follow request");
        }

        fetchNotifications();
    } catch (err) {
        console.error("Error accepting follow request:", err);
    }
}

    async function handleDenyFollow(notif) {
        const userRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${notif.toUserId}`);
        const userData = await userRes.json();
        await fetch(`${process.env.REACT_APP_API_PATH}/users/${notif.toUserId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                attributes: {
                    ...userData.attributes,
                    followRequests: { ...(userData.attributes?.followRequests || {}), [Number(notif.fromUserId)]: false },
                },
            }),
        });
        deleteNotification(notif.id);
    }

    async function handleFollowBack(notif) {
    await fetch(`${process.env.REACT_APP_API_PATH}/connections`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
            fromUserID: parseInt(notif.toUserId),
            toUserID: parseInt(notif.fromUserId),
            attributes: { type: "follow" },
        }),
    });
    try {
        const fromRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${notif.toUserId}`);
        const fromData = await fromRes.json();
        const fromUsername = fromData.attributes?.username || "Someone";
        const toRes = await fetch(`${process.env.REACT_APP_API_PATH}/users/${notif.fromUserId}`);
        const toData = await toRes.json();
        const existingNotifs = notificationsToArray(toData.attributes?.notifications);

        // ← Only add if no existing follow-back notif from this user
        const alreadyNotified = existingNotifs.some(
            n => n.type === "Someone Followed You" &&
                 String(n.fromUserId) === String(notif.toUserId)
        );

        if (!alreadyNotified) {
            const newNotif = {
                id: `follow-${notif.toUserId}-${Date.now()}`,
                type: "Someone Followed You",
                content: `@${fromUsername} followed you back.`,
                fromUserId: String(notif.toUserId),
                toUserId: String(notif.fromUserId),
                read_status: false,
                time: new Date().toISOString(),
            };
            await fetch(`${process.env.REACT_APP_API_PATH}/users/${notif.fromUserId}`, {
                method: "PATCH",
                headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
                body: JSON.stringify({
                    attributes: { ...toData.attributes, notifications: [...existingNotifs, newNotif] },
                }),
            });
        }
    } catch (err) {
        console.error("Failed to send follow-back notification:", err);
    }
    deleteNotification(notif.id);
}

    async function handleRemoveFollower(notif) {
        const res = await fetch(
            `${process.env.REACT_APP_API_PATH}/connections?fromUserID=${notif.fromUserId}&toUserID=${notif.toUserId}`
        );
        const data = await res.json();
        const conn = (data[0] || []).find(
            c => String(c.fromUserID) === String(notif.fromUserId) &&
                 String(c.toUserID) === String(notif.toUserId) &&
                 c.attributes?.type === "follow"
        );
        if (conn) {
            await fetch(`${process.env.REACT_APP_API_PATH}/connections/${conn.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
        }
        deleteNotification(notif.id);
    }

    const profileUrl = `/profile/${userId}`;

    function renderActions(notif) {
        if (notif.type === "Request to Join Your Private Community") {
            return (
                <div className="notif-actions">
                    <button className="notif-btn-accept" onClick={() => handleAcceptRequest(notif)}>Accept</button>
                    <button className="notif-btn-deny" onClick={() => handleDenyRequest(notif)}>Deny</button>
                </div>
            );
        }
        if (notif.type === "Request to Follow") {
            return (
                <div className="notif-actions">
                    <button className="notif-btn-accept" onClick={() => handleAcceptFollow(notif)}>Accept</button>
                    <button className="notif-btn-deny" onClick={() => handleDenyFollow(notif)}>Deny</button>
                </div>
            );
        }
        if (notif.type === "Someone Followed You") {
            const state = followerStates[notif.id];
            if (!state) return null;
            if (!state.stillFollowing) return null;
            return (
                <div className="notif-actions">
                    {!state.alreadyBack && (
                        <button className="notif-btn-accept" onClick={() => handleFollowBack(notif)}>Follow Back</button>
                    )}
                    <button className="notif-btn-deny" onClick={() => handleRemoveFollower(notif)}>Remove</button>
                </div>
            );
        }
        return null;
    }

    const visibleNotifs = notifications;

    // Shared notification list content
    const notifContent = (
        <div className="notif-dropdown-inner">
            <div className="notif-dropdown-header">Notifications</div>
            {visibleNotifs.length === 0 ? (
                <div className="notif-empty">No notifications</div>
            ) : (
                visibleNotifs.map(notif => {
                    const isNew = !seenIds.has(notif.id);
                    return (
                        <div key={notif.id} className={`notif-item ${isNew ? "notif-item--new" : ""}`}>
                            <button className="notif-delete-btn" onClick={() => deleteNotification(notif.id)} aria-label="Delete notification">×</button>
                            <div className="notif-item-type">{notif.type}</div>
                            <div className="notif-item-content">{notif.content}</div>
                            {renderActions(notif)}
                        </div>
                    );
                })
            )}
        </div>
    );

    // Desktop dropdown — normal, with triangle
    const desktopDropdown = notifOpen && !isMobile && (
        <div className="notif-dropdown">
            {notifContent}
        </div>
    );

    // Mobile dropdown — portal, no triangle
    const mobileDropdown = notifOpen && isMobile && createPortal(
        <div className="notif-dropdown notif-dropdown-portal">
            <div className="notif-dropdown-portal-triangle" />
            {notifContent}
        </div>,
        document.body
    );
    
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

    return (
        <nav className="topnav">
            {/* LEFT: LOGO + APP NAME */}
            <div className="nav-logo">
                <Link to="/home">
                    <img src={logoIcon} alt="Herd Logo" className="topnav-icon" />
                </Link>
                <span className="app-name">Herd</span>
            </div>

            {/* RIGHT: MAIN NAV ICONS — desktop only */}
            <ul className="navRight">
                <div className="nav-searchbar">
                    <input
                        className="nav-searchbar-input"
                        type="text"
                        placeholder="Search Communities..."
                        maxLength={Config.MAX_COMMUNITY_NAME_LENGTH}
                        value={searchValue}
                        onChange={(event) => setSearchValue(event.target.value)}
                        onKeyDown={onKeyDown}
                    />
                    <img 
                        className="nav-searchbar-button"
                        src={searchIcon}
                        alt="SEARCH"
                        onClick={onSearch}
                    />
                </div>
            
                <li>
                    <Link to="/home">
                        <img src={homeIcon} alt="Home" className="topnav-icon" />
                    </Link>
                </li>

                {/* BELL — desktop */}
                <li className="notif-bell-wrapper" ref={desktopNotifRef}>
                    <button className="notif-bell-btn" onClick={handleOpenNotif}>
                        <img src={bellIcon} alt="Notifications" className="topnav-icon" />
                        {hasNew && <span className="notif-orange-dot" />}
                    </button>
                    {desktopDropdown}
                </li>

                {/* HAMBURGER MENU */}
                <li className="hamburger-menu">
                    <button onClick={toggleMenu} className="hamburger-btn">
                        <img src={hamburgerIcon} alt="Hamburger" className="topnav-icon" />
                    </button>
                    {menuOpen && (
                        <ul className="dropdown-menu">
                            <li><Link to="/settings" onClick={handleMenuNavigate}><img src={gearIcon} alt="Settings" className="topnav-icon" />Settings</Link></li>
                            <li><div onClick={() => {setMenuOpen(false); setUserSearchOpen(true);}}><img src={usersIcon} alt="Find Users" className="topnav-icon"/>Find Users</div></li>
                            <li><Link to="/about-us" onClick={handleMenuNavigate}><img src={aboutDevsIcon} alt="About Developers" className="topnav-icon" />About Us</Link></li>
                            <li><Link to="/style-guide" onClick={handleMenuNavigate}><img src={styleIcon} alt="Style Guide" className="topnav-icon" />Style Guide</Link></li>
                            <li><button onClick={handleLogout} className="logout-btn"><img src={logoutIcon} alt="Logout" className="topnav-icon" />Logout</button></li>
                        </ul>
                    )}
                </li>

                <li>
                    <Link to={profileUrl}>
                        <img src={profilePhoto || defaultProfileIcon} alt="Profile" className="topnav-icon" style={{ borderRadius: "50%" }} />
                    </Link>
                </li>
            </ul>
            
            <div className="nav-searchbar-mobile">
                <input
                    className="nav-searchbar-input"
                    type="text"
                    placeholder="Search..."
                    maxLength={Config.MAX_COMMUNITY_NAME_LENGTH}
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    onKeyDown={onKeyDown}
                />
                <img 
                    className="nav-searchbar-button"
                    src={searchIcon}
                    alt="SEARCH"
                    onClick={onSearch}
                    onKeyDown={onKeyDown}
                />
            </div>

            {/* BELL — mobile only, top right, uses portal */}
            <div className="notif-bell-wrapper notif-bell-mobile" ref={mobileNotifRef}>
                <button className="notif-bell-btn" onClick={handleOpenNotif}>
                    <img src={bellIcon} alt="Notifications" className="topnav-icon" />
                    {hasNew && <span className="notif-orange-dot" />}
                </button>
                {mobileDropdown}
            </div>

            {/* BOTTOM NAV — mobile only */}
            <div className="bottomNav">
                <Link to="/home" className="bottomNavItem">
                    <img src={homeIcon} alt="Home" className="bottomNavIcon" />
                </Link>
                <Link to={profileUrl} className="bottomNavItem">
                    <img src={profilePhoto || defaultProfileIcon} alt="Profile" className="bottomNavIcon bottomNavIcon--profile" />
                </Link>
                <button className="bottomNavItem bottomNavItem--btn" onClick={toggleMenu}>
                    <img src={hamburgerIcon} alt="Menu" className="bottomNavIcon" />
                </button>
                {menuOpen && (
                    <ul className="dropdown-menu">
                        <li><Link to="/settings" onClick={handleMenuNavigate}><img src={gearIcon} alt="Settings" className="topnav-icon" />Settings</Link></li>
                        <li><div onClick={() => {setMenuOpen(false); setUserSearchOpen(true);}}><img src={usersIcon} alt="Find Users" className="topnav-icon"/>Find Users</div></li>
                        <li><Link to="/about-us" onClick={handleMenuNavigate}><img src={aboutDevsIcon} alt="About Developers" className="topnav-icon" />About Us</Link></li>
                        <li><Link to="/style-guide" onClick={handleMenuNavigate}><img src={styleIcon} alt="Style Guide" className="topnav-icon" />Style Guide</Link></li>
                        <li><button onClick={handleLogout} className="logout-btn"><img src={logoutIcon} alt="Logout" className="topnav-icon" />Logout</button></li>
                    </ul>
                )}
            </div>
            
            <UserSearchModal
                userId={userId}
                userToken={token}
                isOpen={isUserSearchOpen}
                onClose={() => setUserSearchOpen(false)}
                showAlert={(message) => console.log(message)}
            />
        </nav>
    );
};

export default Navbar;
