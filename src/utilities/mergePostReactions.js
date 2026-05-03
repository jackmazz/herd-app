/**
 * Merge fresh reaction data into existing posts without replacing the whole list
 * (avoids obvious feed “refresh” while keeping like counts in sync).
 */
export function mergePostsReactionsOnly(prevList, nextList) {
  const nextById = new Map(nextList.map((p) => [String(p.id), p]));
  const merged = prevList.map((p) => {
    const updated = nextById.get(String(p.id));
    if (!updated) return p;
    return {
      ...p,
      reactions: updated.reactions,
      _count: updated._count,
    };
  });
  const existingIds = new Set(prevList.map((p) => String(p.id)));
  nextList.forEach((p) => {
    if (!existingIds.has(String(p.id))) merged.push(p);
  });
  return merged;
}
