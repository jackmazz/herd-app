import React from 'react';
import {useNavigate} from "react-router-dom";
import defaultProfileIcon from "assets/default-profile-black.svg"

const FollowingList = ({following, onClose, unfollow, owning}) => {
    const navigate = useNavigate();

    const handlePopupContentClick = (e) => {
        e.stopPropagation();
    };

    const handleViewProfileClick = (userId) => {
        navigate(`/profile/${userId}`);
        onClose(); // Close the popup after navigating
    };

    const handleUnfollowClick = (e, targetUserId) => {
        e.stopPropagation();
        unfollow(targetUserId);
    };

    return(
        <div className="popup-overlay" onClick={onClose}>
            <div className={ "follow-list-popup"} onClick={handlePopupContentClick}>
                <button className="popup-close-btn" onClick={onClose}>&times;</button>
                <h1 className="popup-title">Following</h1>
                { following.length === 0 &&
                    <div className="follow-list-item">
                        <h1 className="follow-list-screenname">
                            This user isn't following anyone...
                        </h1>
                    </div>
                }
                { following.length !== 0 && following.map((follower) => (
                    <div
                        key={follower.userId}
                        className="follow-list-item"
                        onClick={() => handleViewProfileClick(follower.userId)}
                        style={{ cursor: 'pointer' }}>
                        <img className="follow-list-profile-pic"
                             src={follower.profilePhoto ? follower.profilePhoto : defaultProfileIcon}
                             alt={follower.screenname}/>
                        <div className="follow-list-names-container">
                            <p className="follow-list-screenname">{follower.screenname}</p>
                            <p className="follow-list-username">@{follower.username}</p>
                        </div>
                        {owning &&
                            <button className="unfollow-button" style={{marginLeft: "auto", flexShrink: 0}}
                                    onClick={(e) => handleUnfollowClick(e, follower.userId)}>
                                Unfollow
                            </button>
                        }
                    </div>
                ))
                }
            </div>
        </div>
    )
}

export default FollowingList;