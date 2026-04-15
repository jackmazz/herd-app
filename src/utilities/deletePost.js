export async function deletePost(postId, token) {
  const res = await fetch(
    `${process.env.REACT_APP_API_PATH}/posts/${postId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  if (!res.ok) {
    throw new Error("Failed to delete post");
  }
}