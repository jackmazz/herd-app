import React, {useEffect, useState} from 'react';

const ProfilePageCounters = ({followers, following, posts, onFollowerListOpened, onFollowingListOpened}) => {
    return(
        <div className="profile-page-counter-box">
            <div className="profile-page-counter-column">
                {/*Needs to be made adaptive to this user's follower count*/}
                <button className="profile-page-counter-number" onClick={onFollowerListOpened}>
                    <p>{followers.length}</p>
                </button>
                <p className="profile-page-counter-desc">
                    Followers
                </p>
            </div>
            <div className="profile-page-counter-column">
                {/*Needs to be made adaptive to this user's following count*/}
                <button className="profile-page-counter-number" onClick={onFollowingListOpened}>
                    <p>{following.length}</p>
                </button>
                <p className="profile-page-counter-desc">
                    Following
                </p>
            </div>
            <div className="profile-page-counter-column">
                {/*Needs to be made adaptive to this user's number of posts*/}
                <p className="profile-page-counter-number" style={{cursor: "default"}}>
                    {posts.length}
                </p>
                <p className="profile-page-counter-desc">
                    Posts
                </p>
            </div>
        </div>
    )
}

export default ProfilePageCounters;
