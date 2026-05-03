export function getMembershipRole(member) {
  return member?.attributes?.role || "";
}

export function isModeratorMember(member) {
  return getMembershipRole(member) === "moderator";
}

export function isOwnerMember(member, creatorId) {
  return String(member?.userID) === String(creatorId);
}

export function getMemberRoleLabel(member, creatorId) {
  if (isOwnerMember(member, creatorId)) return "owner";
  if (isModeratorMember(member)) return "mod";
  return "";
}