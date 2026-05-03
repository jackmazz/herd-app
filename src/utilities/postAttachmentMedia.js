/**
 * Infer attachment display type from stored file URL/path (used by Postcard).
 */

export function getAttachmentMediaFlags(path) {
  if (!path) {
    return { isVideo: false, isAudio: false };
  }
  const pathLower = path.split("?")[0].toLowerCase();
  return {
    isVideo: pathLower.endsWith(".mp4"),
    isAudio: pathLower.endsWith(".wav") || pathLower.endsWith(".mp3"),
  };
}
