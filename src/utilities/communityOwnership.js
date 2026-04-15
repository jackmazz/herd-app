import { isModeratorMember } from "utilities/communityRoles";

export function getOwnershipTransferCandidates(members, creatorID) {
  return (Array.isArray(members) ? members : []).filter((member) => {
    const isCurrentOwner = String(member?.userID) === String(creatorID);
    return !isCurrentOwner && isModeratorMember(member);
  });
}

export function formatMemberDisplayName(member) {
  if (member?.user?.attributes) {
    return (
      member.user.attributes.screenname ||
      member.user.attributes.username ||
      `User ${member.userID}`
    );
  }
  return `User ${member?.userID}`;
}

async function patchMembershipRole({ member, role, token }) {
  if (!member?.id) return;

  const nextAttributes = { ...(member.attributes || {}) };
  if (role) nextAttributes.role = role;
  else delete nextAttributes.role;

  const response = await fetch(`${process.env.REACT_APP_API_PATH}/group-members/${member.id}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ attributes: nextAttributes }),
  });

  if (!response.ok) throw new Error("Failed to update membership role");
}

async function fetchFreshGroupMembers({ groupID, token }) {
  const res = await fetch(`${process.env.REACT_APP_API_PATH}/group-members?groupID=${groupID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load community members");
  const data = await res.json();
  return data[0] || [];
}

async function fetchFreshGroup({ groupID, token }) {
  const res = await fetch(`${process.env.REACT_APP_API_PATH}/groups/${groupID}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to load current community details");
  return res.json();
}

export async function transferCommunityOwnership({
  groupID,
  creatorID: _clientCreatorID,
  currentUserId,
  members: _staleMembers,
  token,
  newOwnerUserId,
}) {
  const freshMembers = await fetchFreshGroupMembers({ groupID, token });
  const groupData = await fetchFreshGroup({ groupID, token });
  const serverCreatorID = groupData?.attributes?.creatorID ?? groupData?.creatorID;

  if (String(serverCreatorID) !== String(currentUserId)) {
    return { ok: false, reason: "not-owner" };
  }

  const candidates = getOwnershipTransferCandidates(freshMembers, serverCreatorID);
  if (candidates.length === 0) {
    return { ok: false, reason: "no-moderators" };
  }

  const stillInCommunity = freshMembers.some(
    (m) => String(m.userID) === String(newOwnerUserId)
  );
  if (!stillInCommunity) {
    return { ok: false, reason: "member-left" };
  }

  const selectedModerator = candidates.find(
    (member) => String(member.userID) === String(newOwnerUserId)
  );
  if (!selectedModerator) return { ok: false, reason: "invalid-selection" };
  const selectedModeratorId = Number(newOwnerUserId);

  const groupPatchResponse = await fetch(`${process.env.REACT_APP_API_PATH}/groups/${groupID}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      attributes: { ...(groupData.attributes || {}), creatorID: selectedModeratorId },
    }),
  });
  if (!groupPatchResponse.ok) throw new Error("Failed to transfer community ownership");

  const previousOwnerMembership = freshMembers.find(
    (member) => String(member.userID) === String(currentUserId)
  );
  await patchMembershipRole({ member: previousOwnerMembership, role: "", token });

  return { ok: true, newOwnerUserId: selectedModeratorId };
}
