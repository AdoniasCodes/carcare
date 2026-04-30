// Detect platform + extract video ID from common URL formats.
// Returns null if URL is not recognized.

export type VideoPlatform = "tiktok" | "facebook" | "youtube";

export interface VideoMeta {
  platform: VideoPlatform;
  embedUrl: string;
  originalUrl: string;
}

export function detectPlatform(url: string): VideoPlatform | null {
  const u = url.toLowerCase();
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("facebook.com") || u.includes("fb.watch")) return "facebook";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  return null;
}

export function buildEmbedUrl(url: string): VideoMeta | null {
  const platform = detectPlatform(url);
  if (!platform) return null;

  if (platform === "tiktok") {
    // TikTok URLs: https://www.tiktok.com/@user/video/1234567890
    const match = url.match(/\/video\/(\d+)/);
    if (!match) return null;
    return {
      platform,
      originalUrl: url,
      embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`,
    };
  }

  if (platform === "facebook") {
    // Facebook plugin embed accepts the original URL encoded
    return {
      platform,
      originalUrl: url,
      embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
    };
  }

  if (platform === "youtube") {
    let videoId: string | null = null;
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split(/[?&]/)[0] || null;
    } else if (url.includes("watch?v=")) {
      videoId = url.split("watch?v=")[1]?.split("&")[0] || null;
    } else if (url.includes("/shorts/")) {
      videoId = url.split("/shorts/")[1]?.split(/[?&]/)[0] || null;
    }
    if (!videoId) return null;
    return {
      platform,
      originalUrl: url,
      embedUrl: `https://www.youtube.com/embed/${videoId}`,
    };
  }

  return null;
}
