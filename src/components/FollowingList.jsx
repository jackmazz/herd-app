import React, {useEffect, useRef} from 'react';
import {useNavigate} from "react-router-dom";
import { useTranslation } from "react-i18next";
import defaultProfileIcon from "assets/default-profile-black.svg"

const FollowingList = ({following, onClose, unfollow, owning}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const modalRef = useRef(null);

    useEffect(() => {
        // Only set focus programmatic once on mount
        if (modalRef.current) {
            modalRef.current.focus();
        }
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) { // Shift + Tab
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else { // Tab
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handlePopupContentClick = (e) => {
        e.stopPropagation();
    };

    const handleViewProfileClick = (userId) => {
        navigate(`/profile/${userId}`);
        onClose();
    };

    const handleUnfollowClick = (e, targetUserId) => {
        e.stopPropagation();
        unfollow(targetUserId);
    };

    return(
        <div className="postModalOverlay" onClick={onClose}>
            <div
                className="postModal"
                onClick={handlePopupContentClick}
                ref={modalRef}
                tabIndex="-1"
                role="dialog"
                aria-modal="true"
                aria-labelledby="following-list-title"
                style={{ position: "relative" }}
            >
                <button
                    className="profile-page-invis-icon-btn"
                    style={{ position: "absolute", top: "15px", right: "15px", zIndex: 10 }}
                    onClick={onClose}
                    aria-label={t("profilePage.buttons.close")}
                >
                    ✕
                </button>
                <div className="postTitleOverflow">
                    <h2 id="following-list-title">{t("profilePage.followingList.title")}</h2>
                </div>
                {following.length === 0 &&
                    <div className="empty-list-item">
                        <h2>{t("profilePage.followingList.empty")}</h2>
                    </div>
                }
                <div className="follow-list">
                    {following.length !== 0 && following.map((follower) => (
                        <div key={follower.userId} className="follow-list-item" style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                className="follow-list-item-btn"
                                onClick={() => handleViewProfileClick(follower.userId)}
                                style={{ flexGrow: 1, border: 'none', background: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', cursor: 'pointer', padding: 0 }}
                                aria-label={t("profilePage.accessibility.viewProfile", { name: follower.screenname })}
                            >
                                <img className="follow-list-profile-pic"
                                     src={follower.profilePhoto ? follower.profilePhoto : defaultProfileIcon}
                                     alt=""/>
                                <div className="follow-list-names-container">
                                    <p className="follow-list-screenname">{follower.screenname}</p>
                                    <p className="follow-list-username">@{follower.username}</p>
                                </div>
                            </button>
                            {owning &&
                                <button className="follow-list-unfollow-button" style={{marginLeft: "auto", flexShrink: 0}}
                                        onClick={(e) => handleUnfollowClick(e, follower.userId)}>
                                    {t("profilePage.buttons.unfollow")}
                                </button>
                            }
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default FollowingList;