import { notificationsToArray } from "utilities/postLikeNotification";
import { isModeratorMember } from "utilities/communityRoles";

/** Matches Navbar / Notifications display pattern (see Post Liked, follow notifs). */
export const PUBLIC_COMMUNITY_JOIN_NOTIF_TYPE = "User Joined Public Community";

/**
 * Notifies community owner + moderators when someone joins a public community.
 * Fire-and-forget friendly; logs errors only.
 */
export async function notifyOwnerAndModeratorsOfPublicJoin({
  token,
  groupId,
  communityName,
  creatorId,
  joiningUserId,
}) {
  const apiPath = process.env.REACT_APP_API_PATH;
  if (!apiPath || !token || !groupId || !creatorId || !joiningUserId) return;

  try {
    const membersRes = await fetch(`${apiPath}/group-members?groupID=${groupId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!membersRes.ok) return;
    const membersData = await membersRes.json();
    const members = membersData[0] || [];

    const recipientIds = new Set();
    recipientIds.add(String(creatorId));
    for (const m of members) {
      if (isModeratorMember(m) && String(m.userID) !== String(joiningUserId)) {
        recipientIds.add(String(m.userID));
      }
    }
    recipientIds.delete(String(joiningUserId));

    const fromRes = await fetch(`${apiPath}/users/${joiningUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!fromRes.ok) return;
    const fromData = await fromRes.json();
    const username = fromData.attributes?.username || "Someone";

    const safeName = String(communityName || "the community").trim() || "the community";
    const content = `@${username} joined your public community "${safeName}".`;

    const baseTime = Date.now();
    let idx = 0;
    for (const recipientId of recipientIds) {
      const toRes = await fetch(`${apiPath}/users/${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!toRes.ok) continue;
      const toData = await toRes.json();
      const existingNotifs = notificationsToArray(toData.attributes?.notifications);
      const notifId = `public-join-${groupId}-${joiningUserId}-${recipientId}-${baseTime}-${idx}`;
      idx += 1;

      const newNotif = {
        id: notifId,
        type: PUBLIC_COMMUNITY_JOIN_NOTIF_TYPE,
        content,
        read_status: false,
        time: new Date().toISOString(),
        user_id: String(joiningUserId),
        group_id: String(groupId),
        fromUserId: String(joiningUserId),
        toUserId: String(recipientId),
      };

      await fetch(`${apiPath}/users/${recipientId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: {
            ...toData.attributes,
            notifications: [...existingNotifs, newNotif],
          },
        }),
      });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("goat-notifications-updated"));
    }
  } catch (err) {
    console.error("notifyOwnerAndModeratorsOfPublicJoin failed:", err);
  }
}
