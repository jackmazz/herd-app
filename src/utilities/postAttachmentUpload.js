/**
 * Post attachment file picker: accepted types and validation (images, video, audio).
 * Kept separate from CommunityPage to reduce merge conflicts.
 */

export const POST_ATTACHMENT_ACCEPT =
  "image/png, image/jpeg, image/gif, image/svg+xml, image/webp, video/mp4, audio/wav, audio/x-wav, audio/wave, audio/mpeg, audio/mp3, .wav, .mp3";

const ACCEPT_MIME = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/webp",
  "video/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mpeg",
  "audio/mp3",
];

const ACCEPT_EXTENSION = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
  ".mp4",
  ".wav",
  ".mp3",
];

const TYPE_ERROR =
  "Only .png, .jpg, .gif, .svg, .webp, .mp4, .wav, or .mp3 files are allowed";

/**
 * @param {File | null} file
 * @param {{
 *   imageMin: number,
 *   imageMax: number,
 *   videoMin: number,
 *   videoMax: number,
 *   audioMin: number,
 *   audioMax: number,
 * }} limits
 * @returns {{ valid: boolean, errorMessage: string }}
 */
export function validatePostAttachmentFile(file, limits) {
  if (!file) {
    return { valid: false, errorMessage: "No file selected" };
  }

  const fileName = file.name.toLowerCase();
  const fileType = (file.type || "").toLowerCase();
  const isVideo = fileName.endsWith(".mp4");
  const isAudio = fileName.endsWith(".wav") || fileName.endsWith(".mp3");

  const extensionOk = ACCEPT_EXTENSION.some((ext) => fileName.endsWith(ext));
  const mimeOk =
    !fileType ||
    ACCEPT_MIME.includes(fileType) ||
    (isAudio && fileType.startsWith("audio/")) ||
    (isVideo && fileType === "video/mp4") ||
    (!isVideo &&
      !isAudio &&
      fileType.startsWith("image/") &&
      ACCEPT_MIME.includes(fileType));

  if (!extensionOk || !mimeOk) {
    return { valid: false, errorMessage: TYPE_ERROR };
  }

  if (isVideo && file.size < limits.videoMin) {
    return { valid: false, errorMessage: "Video size must be over 1KB" };
  }
  if (isVideo && file.size > limits.videoMax) {
    return { valid: false, errorMessage: "Video size must be under 50MB" };
  }
  if (isAudio && file.size < limits.audioMin) {
    return { valid: false, errorMessage: "Audio size must be over 1KB" };
  }
  if (isAudio && file.size > limits.audioMax) {
    return { valid: false, errorMessage: "Audio size must be under 10MB" };
  }
  if (!isVideo && !isAudio && file.size < limits.imageMin) {
    return { valid: false, errorMessage: "Image size must be over 1KB" };
  }
  if (!isVideo && !isAudio && file.size > limits.imageMax) {
    return { valid: false, errorMessage: "Image size must be under 10MB" };
  }

  return { valid: true, errorMessage: "" };
}
