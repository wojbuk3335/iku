export type PostMediaItem = {
  url: string;
  type: "image" | "video";
};

export const MAX_POST_IMAGES = 12;
export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_POST_VIDEO_BYTES = 50 * 1024 * 1024;

const VIDEO_EXT = /\.(mp4|webm|mov|m4v)(\?|$)/i;

export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT.test(url);
}

export function normalizePostMedia(
  imageUrl: string | null | undefined,
  mediaUrls: unknown,
): PostMediaItem[] {
  if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
    return mediaUrls
      .map((item): PostMediaItem | null => {
        if (typeof item === "string" && item.trim()) {
          const url = item.trim();
          return { url, type: isVideoUrl(url) ? "video" : "image" };
        }
        if (item && typeof item === "object" && "url" in item) {
          const url = String((item as { url: unknown }).url ?? "").trim();
          if (!url) return null;
          const rawType = (item as { type?: unknown }).type;
          const type: "image" | "video" =
            rawType === "video" || isVideoUrl(url) ? "video" : "image";
          return { url, type };
        }
        return null;
      })
      .filter((m): m is PostMediaItem => m !== null);
  }
  if (imageUrl?.trim()) {
    const url = imageUrl.trim();
    return [{ url, type: isVideoUrl(url) ? "video" : "image" }];
  }
  return [];
}

export function coverMediaUrl(media: PostMediaItem[]): string | null {
  if (media.length === 0) return null;
  const image = media.find((m) => m.type === "image");
  return image?.url ?? media[0].url;
}
