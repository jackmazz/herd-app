/** Extensions allowed for community banner uploads (must match server expectations). */
const ALLOWED_BANNER_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".avif",
]);

/** Use on file inputs so the picker nudges toward images (still validate in JS). */
export const COMMUNITY_BANNER_INPUT_ACCEPT =
  "image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/bmp,image/avif,.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.avif";

/**
 * Rejects non-images by MIME (when present) and by file suffix.
 * @param {File} file
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validateCommunityBannerFile(file) {
  if (!file) return { ok: false, message: "No file selected." };

  const name = (file.name || "").trim();
  const lastDot = name.lastIndexOf(".");
  const ext = lastDot >= 0 ? name.slice(lastDot).toLowerCase() : "";

  const mime = (file.type || "").toLowerCase();
  if (mime && !mime.startsWith("image/")) {
    return {
      ok: false,
      message: "Banner must be an image file (PNG, JPG, GIF, WebP, SVG, etc.).",
    };
  }

  if (ext) {
    if (!ALLOWED_BANNER_EXTENSIONS.has(ext)) {
      return {
        ok: false,
        message: "Banner must use an image extension (e.g. .jpg, .png, .gif, .webp, .svg).",
      };
    }
  } else if (!mime.startsWith("image/")) {
    return {
      ok: false,
      message: "Please choose an image file with a recognizable type.",
    };
  }

  return { ok: true };
}
