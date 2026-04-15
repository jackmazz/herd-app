import * as Config from "config.js";

const ACCEPT_MIME = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/svg+xml",
  "image/webp",
];

const ACCEPT_EXTENSION = [
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".webp",
];

/**
 * Same rules as settings Profile upload: types and 1KB–MAX_IMAGE_SIZE.
 * @param {File | null} file
 * @returns {{ valid: boolean, errorMessage: string }}
 */
export function validateProfilePictureFile(file) {
  const minSize = Config.MIN_IMAGE_SIZE;
  const maxSize = Config.MAX_IMAGE_SIZE;

  if (!file) {
    return { valid: false, errorMessage: "No file was selected." };
  }

  const fileName = file.name.toLowerCase();
  const fileType = (file.type || "").toLowerCase();

  if (
    !ACCEPT_MIME.includes(fileType) ||
    !ACCEPT_EXTENSION.some((ext) => fileName.endsWith(ext))
  ) {
    return {
      valid: false,
      errorMessage:
        "Invalid file type. Only .png, .jpg, .gif, .svg, or .webp files are allowed.",
    };
  }

  if (file.size < minSize) {
    return {
      valid: false,
      errorMessage: "File size must be over 1KB, please choose another file.",
    };
  }

  if (file.size > maxSize) {
    const maxMb = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      errorMessage: `File size must be under ${maxMb}MB, please choose another file.`,
    };
  }

  return { valid: true, errorMessage: "" };
}

export const PROFILE_PICTURE_ACCEPT =
  "image/png, image/jpeg, image/gif, image/svg+xml, image/webp";
