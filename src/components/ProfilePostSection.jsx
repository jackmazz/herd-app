import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import "../styles/Postcard.css"
import defaultProfileIcon from "../assets/default-profile-black.svg";
import likeIcon from "../assets/heart.svg";
import likeFilledIcon from "../assets/filled_heart.svg";
import { notifyPostAuthorOfLike, resolvePostAuthorId } from "utilities/postLikeNotification";

export const ProfilePostSection = ({ posts, author, profilePhoto, communities}) => {
    const navigate = useNavigate();
    const token = sessionStorage.getItem("user-token");
    const currentUserId = String(sessionStorage.getItem("user"));
    /** Prevents double-submit for the same post while a like/unlike request is in flight (matches Postcard pattern). */
    const [likingPostId, setLikingPostId] = useState(null);

    const [likesState, setLikesState] = useState(() =>
        (posts || []).reduce((acc, post) => {
            const reactions = Array.isArray(post.reactions) ? post.reactions : [];
            acc[post.id] = {
                likeCount: reactions.length,
                userReactionId: (reactions.find(r => String(r.reactorID) === currentUserId) || {}).id ?? null,
            };
            return acc;
        }, {})
    );

    useEffect(() => {
        setLikesState((prev) => {
            const next = {};
            (posts || []).forEach((post) => {
                const reactions = Array.isArray(post.reactions) ? post.reactions : [];
                const existing = reactions.find(r => String(r.reactorID) === currentUserId);
                next[post.id] = {
                    likeCount: reactions.length,
                    userReactionId: existing ? existing.id : null,
                };
            });
            return next;
        });
    }, [posts, currentUserId]);

    const handleToggleLike = (post) => {
        if (!token || !currentUserId || !post?.id) return;
        if (likingPostId === post.id) return;
        setLikingPostId(post.id);

        const state = likesState[post.id] || { likeCount: 0, userReactionId: null };
        const { userReactionId } = state;

        // Optimistic update helpers
        const setOptimistic = (updates) => {
            setLikesState((prev) => ({
                ...prev,
                [post.id]: { ...state, ...updates },
            }));
        };

        if (userReactionId != null) {
            // Unlike: delete existing reaction
            fetch(`${process.env.REACT_APP_API_PATH}/post-reactions/${userReactionId}`, {
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + token,
                },
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to remove reaction");
                    setOptimistic({
                        userReactionId: null,
                        likeCount: state.likeCount > 0 ? state.likeCount - 1 : 0,
                    });
                })
                .catch(() => {})
                .finally(() => {
                    setLikingPostId((id) => (id === post.id ? null : id));
                });
        } else {
            // Like: create new reaction
            fetch(`${process.env.REACT_APP_API_PATH}/post-reactions`, {
                method: "POST",
                headers: {
                    Authorization: "Bearer " + token,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    postID: post.id,
                    reactorID: Number(currentUserId),
                    name: "like",
                }),
            })
                .then((res) => {
                    if (!res.ok) throw new Error("Failed to add reaction");
                    return res.json();
                })
                .then((data) => {
                    const newId = data.id || data.postReactionID;
                    setOptimistic({
                        userReactionId: newId ?? null,
                        likeCount: state.likeCount + 1,
                    });
                    const authorId = resolvePostAuthorId(post, author);
                    const title = post.attributes?.title || "";
                    if (authorId && String(authorId) !== String(currentUserId)) {
                        const preview = [title, post.content].filter(Boolean).join(" — ") || post.content;
                        notifyPostAuthorOfLike({
                            postAuthorId: String(authorId),
                            likerId: currentUserId,
                            postId: post.id,
                            postContentPreview: preview,
                        });
                    }
                })
                .catch(() => {})
                .finally(() => {
                    setLikingPostId((id) => (id === post.id ? null : id));
                });
        }
    };

  const getCommunityName = (groupId) => {
    const community = communities.find((c) => String(c.id) === String(groupId));
    return community ? community.name : "Community";
  };

    return (
        <div className="profile-posts-list">
            {posts.map(post => {
                const likeState = likesState[post.id] || { likeCount: 0, userReactionId: null };
                return (
                <div className="postCard" key={post.id}>
                    <Link
                        to={`/profile/${author.id}`}
                        className="postCardAvatarLink"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={profilePhoto || defaultProfileIcon}
                            alt="avatar"
                            className="postCardAvatar"
                        />
                    </Link>
                    <div className="postCardMain">
                        <div className="postCardTopRow">
                            <div className="postCardIdentity">
                                <span className="postCardName">{author.attributes?.screenname}</span>
                                <span className="postCardUsername">@{author.attributes?.username}</span>
                                <button className="postTag" onClick={() => navigate(`/community/${post.recipientGroupID}`)}>
                                    {getCommunityName(post.recipientGroupID)}
                                </button>
                            </div>
                        </div>

                        <div className="postCardBody">
                            {post.attributes?.title && <div className="postCardTitle">{post.attributes?.title}</div>}
                            <div className="postCardContent">{post.content}</div>
                        </div>
                        <div className="postCardFooter">
                            <button
                                type="button"
                                className={`postCardLikeIconBtn ${likeState.userReactionId != null ? "liked" : ""}`}
                                onClick={() => handleToggleLike(post)}
                                aria-busy={likingPostId === post.id}
                                aria-label={likeState.userReactionId != null ? "Unlike" : "Like"}
                            >
                                <img
                                    src={likeState.userReactionId != null ? likeFilledIcon : likeIcon}
                                    alt=""
                                    className="postCardLikeIcon"
                                />
                            </button>
                            <span className="postCardLikeCount">
                                {likeState.likeCount}
                            </span>
                        </div>
                    </div>
                </div>
            )})}
        </div>
    );
}

export default ProfilePostSection;