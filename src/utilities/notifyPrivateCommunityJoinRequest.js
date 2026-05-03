import { notificationsToArray } from "utilities/postLikeNotification";
import { isModeratorMember } from "utilities/communityRoles";

/**
 * Notifies community owner + moderators when someone requests to join a private community.
 * Mirrors notifyOwnerAndModeratorsOfPublicJoin recipient resolution.
 */
export async function notifyOwnerAndModeratorsOfPrivateJoinRequest({
  token,
  groupId,
  creatorId,
  requestingUserId,
  message,
}) {
  const apiPath = process.env.REACT_APP_API_PATH;
  if (!apiPath || !token || !groupId || !creatorId || !requestingUserId || !message) return;

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
      if (isModeratorMember(m) && String(m.userID) !== String(requestingUserId)) {
        recipientIds.add(String(m.userID));
      }
    }
    recipientIds.delete(String(requestingUserId));

    const date = new Date();
    const baseTime = date.getTime();
    let idx = 0;

    for (const recipientId of recipientIds) {
      const toRes = await fetch(`${apiPath}/users/${recipientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!toRes.ok) continue;
      const toData = await toRes.json();
      const previousNotifications = notificationsToArray(toData?.attributes?.notifications);
      const requestId = `private-join-req-${groupId}-${requestingUserId}-${recipientId}-${baseTime}-${idx}`;
      idx += 1;

      const newNotification = {
        id: requestId,
        type: "Request to Join Your Private Community",
        content: message,
        read_status: false,
        user_id: requestingUserId,
        group_id: String(groupId),
        time: date,
      };

      await fetch(`${apiPath}/users/${recipientId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: {
            ...toData?.attributes,
            notifications: [...previousNotifications, newNotification],
          },
        }),
      });
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("goat-notifications-updated"));
    }
  } catch (err) {
    console.error("notifyOwnerAndModeratorsOfPrivateJoinRequest failed:", err);
  }
}
