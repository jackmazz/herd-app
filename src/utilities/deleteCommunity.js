import { deletePost } from "./deletePost";

/** Post-order IDs so comments/replies are removed before their parent posts. */
export function getCommunityPostDeletionOrder(posts) {
  const list = Array.isArray(posts) ? posts : [];
  const byId = new Map(list.map((p) => [String(p.id), p]));
  const order = [];
  const visited = new Set();

  function dfs(id) {
    if (visited.has(id)) return;
    visited.add(id);
    const children = list.filter((p) => String(p.parentID) === String(id));
    for (const c of children) {
      dfs(String(c.id));
    }
    order.push(String(id));
  }

  for (const p of list) {
    const pid = p.parentID != null && p.parentID !== undefined ? String(p.parentID) : "";
    if (!pid || !byId.has(pid)) {
      dfs(String(p.id));
    }
  }

  for (const p of list) {
    if (!visited.has(String(p.id))) {
      dfs(String(p.id));
    }
  }

  return order;
}

async function fetchPostsForGroup(groupID, token) {
  const response = await fetch(
    `${process.env.REACT_APP_API_PATH}/posts?recipientGroupID=${groupID}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!response.ok) throw new Error("Failed to load posts");
  const data = await response.json();
  return data[0] || [];
}

export async function deleteCommunityAndPosts({ groupID, token }) {
  const posts = await fetchPostsForGroup(groupID, token);
  const order = getCommunityPostDeletionOrder(posts);
  for (const id of order) {
    try {
      await deletePost(id, token);
    } catch (err) {
      console.warn("Post delete failed:", id, err);
    }
  }

  const groupRes = await fetch(`${process.env.REACT_APP_API_PATH}/groups/${groupID}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!groupRes.ok) throw new Error("Failed to delete community");
}
