// /lib/file-url-transform.ts
import { logger } from "@/lib/logger";

/**
 * Transform MantisBT file_download.php URLs to Next.js API endpoints
 *
 * Converts:
 *   file_download.php?file_id=123&type=bug
 * To:
 *   /api/files/123?type=bug&show_inline=1
 */
export function transformFileUrl(url: string, showInline: boolean = true): string {
  try {
    // Handle relative URLs
    const urlObj = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");

    // Check if this is a file_download.php URL
    if (urlObj.pathname.includes("file_download.php")) {
      const fileId = urlObj.searchParams.get("file_id");
      const type = urlObj.searchParams.get("type") || "bug";

      if (fileId) {
        // Build new API endpoint URL
        const newUrl = `/api/files/${fileId}?type=${type}&show_inline=${showInline ? "1" : "0"}`;
        return newUrl;
      }
    }

    // Return original URL if not a file_download.php URL
    return url;
  } catch (err) {
    logger.error("Failed to transform file URL:", err);
    return url;
  }
}

/**
 * Transform all file_download.php URLs in HTML content
 */
export function transformHtmlFileUrls(html: string, showInline: boolean = true): string {
  // Replace all occurrences of file_download.php URLs
  return html.replace(
    /file_download\.php\?([^"'\s]+)/g,
    (match, queryString) => {
      try {
        const params = new URLSearchParams(queryString);
        const fileId = params.get("file_id");
        const type = params.get("type") || "bug";

        if (fileId) {
          return `/api/files/${fileId}?type=${type}&show_inline=${showInline ? "1" : "0"}`;
        }
      } catch (err) {
        logger.error("Failed to parse file URL:", err);
      }
      return match;
    }
  );
}