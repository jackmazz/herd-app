/** API may return notifications as an array or as an object map — always work with an array. */
export function notificationsToArray(raw) {
  if (Array.isArray(raw)) return [...raw];
  if (raw && typeof raw === "object") return Object.values(raw);
  return [];
}

/** Resolve post author id from embedded author and common post fields (API shape varies). */
export function resolvePostAuthorId(post, profileAuthor = null) {
  if (!post || typeof post !== "object") return null;
  const a = post.author ?? profileAuthor;
  const fromAuthor =
    a && typeof a === "object"
      ? a.id ?? a.userID ?? a.authorID ?? a.userId ?? a.authorId
      : null;
  const id =
    fromAuthor ??
    post.authorID ??
    post.authorId ??
    post.userID ??
    post.userId;
  return id != null ? id : null;
}

/**
 * Appends a notification to the post author's user.attributes.notifications
 * when another user likes their post (same pattern as follow / join-request notifs).
 */
export async function notifyPostAuthorOfLike({
  postAuthorId,
  likerId,
  postId,
  postContentPreview,
}) {
  const LIKE_NOTIF_DEDUPE_WINDOW_MS = 15_000; // Prevent spam on repeated like/unlike bursts.
  const apiPath = process.env.REACT_APP_API_PATH;
  const token = sessionStorage.getItem("user-token");
  if (!apiPath || !token) return;
  if (!postAuthorId || !likerId || String(postAuthorId) === String(likerId)) return;

  try {
    const fromRes = await fetch(`${apiPath}/users/${likerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!fromRes.ok) return;
    const fromData = await fromRes.json();
    const fromUsername = fromData.attributes?.username || "Someone";

    const toRes = await fetch(`${apiPath}/users/${postAuthorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!toRes.ok) return;
    const toData = await toRes.json();
    const existingNotifs = notificationsToArray(toData.attributes?.notifications);

    const preview = String(postContentPreview || "")
      .trim()
      .replace(/\s+/g, " ");
    const short = preview.length > 72 ? `${preview.slice(0, 72)}…` : preview;
    const content = short
      ? `@${fromUsername} liked your post: “${short}”`
      : `@${fromUsername} liked your post.`;

    const getTimeMs = (t) => {
      if (typeof t === "number") return t;
      if (typeof t === "string") {
        const ms = Date.parse(t);
        return Number.isFinite(ms) ? ms : null;
      }
      return null;
    };

    const getNotifFromUserId = (n) =>
      n?.fromUserId ?? n?.fromUserID ?? n?.fromUserID ?? n?.user_id ?? n?.userId;

    const getNotifPostId = (n) =>
      n?.post_id ?? n?.postId ?? n?.postID;

    const nowMs = Date.now();
    const existingLikeNotif = existingNotifs.find((n) => {
      if (n?.type !== "Post Liked") return false;
      if (String(getNotifFromUserId(n)) !== String(likerId)) return false;
      if (postId != null && String(getNotifPostId(n)) !== String(postId)) return false;
      return true;
    });

    // Match style of other notifs (e.g. follow: `follow-${fromUserId}-${Date.now()}`)
    const notifId =
      postId != null
        ? `like-${postId}-${likerId}-${Date.now()}`
        : `like-${likerId}-${Date.now()}`;

    const newNotif = {
      id: notifId,
      type: "Post Liked",
      content,
      read_status: false,
      time: new Date().toISOString(),
      user_id: String(likerId),
      post_id: postId != null ? String(postId) : undefined,
      fromUserId: String(likerId),
      toUserId: String(postAuthorId),
    };

    // If a "Post Liked" notif from the same liker for the same post is very recent,
    // update the existing one instead of appending a new notification.
    if (existingLikeNotif) {
      const existingTimeMs = getTimeMs(existingLikeNotif.time);
      const withinWindow =
        existingTimeMs != null && nowMs - existingTimeMs <= LIKE_NOTIF_DEDUPE_WINDOW_MS;

      if (withinWindow) {
        const patchedNotifs = existingNotifs.map((n) =>
          n.id === existingLikeNotif.id
            ? {
                ...n,
                content,
                time: new Date().toISOString(),
              }
            : n
        );

        const patchRes = await fetch(`${apiPath}/users/${postAuthorId}`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attributes: {
              ...toData.attributes,
              notifications: patchedNotifs,
            },
          }),
        });

        if (!patchRes.ok) {
          const errText = await patchRes.text().catch(() => "");
          console.error(
            "notifyPostAuthorOfLike PATCH(update) failed:",
            patchRes.status,
            errText.slice(0, 200)
          );
        } else if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("goat-notifications-updated"));
        }
        return;
      }
    }

    const patchRes = await fetch(`${apiPath}/users/${postAuthorId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        attributes: {
          ...toData.attributes,
          notifications: [...existingNotifs, newNotif],
        },
      }),
    });
    if (!patchRes.ok) {
      const errText = await patchRes.text().catch(() => "");
      console.error(
        "notifyPostAuthorOfLike PATCH failed:",
        patchRes.status,
        errText.slice(0, 200)
      );
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("goat-notifications-updated"));
    }
  } catch (e) {
    console.error("notifyPostAuthorOfLike failed:", e);
  }
}