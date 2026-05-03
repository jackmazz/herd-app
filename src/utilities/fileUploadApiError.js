/**
 * Parses error bodies from POST /file-uploads (and similar) into short user-facing text.
 * Example: {"headers":{"error":"FILE_STORAGE_EXCEEDED","message":"Application file storage exceeded"}}
 *
 * @param {string} [responseText]
 * @returns {string}
 */
export function parseFileUploadErrorBody(responseText) {
  if (responseText == null) return "";
  const raw = String(responseText).trim();
  if (!raw) return "";

  try {
    const parsed = JSON.parse(raw);
    const h = parsed.headers && typeof parsed.headers === "object" ? parsed.headers : null;
    const code = (h && h.error) || parsed.error || parsed.code;
    const msg = (h && h.message) || parsed.message || "";

    if (
      code === "FILE_STORAGE_EXCEEDED" ||
      (typeof msg === "string" && /file storage exceeded/i.test(msg))
    ) {
      return "File storage for this application is full, you can not upload files at this time. Free space by deleting old uploads or attachments.";
    }
    if (typeof msg === "string" && msg.trim()) return msg.trim();
    if (typeof code === "string" && code.trim()) return code.replace(/_/g, " ");
  } catch {
    // not JSON — fall through
  }

  if (raw.length > 220) return `${raw.slice(0, 220)}…`;
  return raw;
}
