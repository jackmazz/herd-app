import React from 'react';
import { useTranslation } from "react-i18next";

const ProfilePageCounters = ({followers, following, posts, onFollowerListOpened, onFollowingListOpened}) => {
    const { t } = useTranslation();

    return(
        <div className="infoPanel">
            <div className="profile-page-counter-column">
                <button className="profile-page-counter-number" onClick={onFollowerListOpened}>
                    <p>{followers.length}</p>
                </button>
                <p className="profile-page-counter-desc">
                    {t("profilePage.counters.followers")}
                </p>
            </div>

            <div className="profile-page-counter-column">
                <button className="profile-page-counter-number" onClick={onFollowingListOpened}>
                    <p>{following.length}</p>
                </button>
                <p className="profile-page-counter-desc">
                    {t("profilePage.counters.following")}
                </p>
            </div>

            <div className="profile-page-counter-column">
                <div className="profile-page-counter-number" style={{cursor: "default"}}>
                    <p>{posts.length}</p>
                </div>
                <p className="profile-page-counter-desc">
                    {t("profilePage.counters.posts")}
                </p>
            </div>
        </div>
    )
}
export default ProfilePageCounters;
