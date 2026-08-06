"use client";

import {
  coverMediaUrl,
  type PostMediaItem,
} from "@/lib/profile/post-media";

export type { PostMediaItem };
export {
  MAX_POST_IMAGES,
  MAX_POST_IMAGE_BYTES,
  MAX_POST_VIDEO_BYTES,
  normalizePostMedia,
  coverMediaUrl,
  isVideoUrl,
} from "@/lib/profile/post-media";

type PostMediaCollageProps = {
  media: PostMediaItem[];
  className?: string;
  /** Kompaktowa siatka (podgląd w compose) */
  compact?: boolean;
};

export function PostMediaCollage({
  media,
  className = "",
  compact = false,
}: PostMediaCollageProps) {
  if (media.length === 0) return null;

  if (media.length === 1) {
    const item = media[0];
    return (
      <div className={`relative overflow-hidden bg-black ${className}`}>
        {item.type === "video" ? (
          <video
            src={item.url}
            controls={!compact}
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.url} alt="" className="h-full w-full object-cover" />
        )}
      </div>
    );
  }

  const gap = compact ? "gap-1" : "gap-0.5";
  const maxH = compact ? "max-h-56 overflow-y-auto" : "";

  return (
    <div className={`overflow-hidden bg-black ${className}`}>
      <div className={`grid grid-cols-3 ${gap} ${maxH}`}>
        {media.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className="relative aspect-square overflow-hidden bg-zinc-900"
          >
            {item.type === "video" ? (
              <>
                <video
                  src={item.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
                <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 translate-x-0.5">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  </span>
                </span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

type PostGridThumbProps = {
  media: PostMediaItem[];
  fallbackText?: string;
};

/** Miniatura w siatce profilu 3×3 */
export function PostGridThumb({ media, fallbackText }: PostGridThumbProps) {
  const cover = coverMediaUrl(media);
  const hasVideo = media.some((m) => m.type === "video");
  const count = media.length;

  if (!cover) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#12121a] p-2">
        <p className="line-clamp-4 text-center text-[10px] leading-snug text-zinc-400">
          {fallbackText || "Post"}
        </p>
      </div>
    );
  }

  return (
    <>
      {hasVideo && media.length === 1 ? (
        <video
          src={cover}
          muted
          playsInline
          preload="metadata"
          className="h-full w-full object-cover"
        />
      ) : count >= 2 ? (
        <div className="grid h-full w-full grid-cols-2 gap-px bg-black">
          {media.slice(0, 4).map((item, i) => (
            <div key={`${item.url}-${i}`} className="relative overflow-hidden bg-zinc-900">
              {item.type === "video" ? (
                <video
                  src={item.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
          ))}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt="" className="h-full w-full object-cover" />
      )}
      {(hasVideo || count > 1) && (
        <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
          {hasVideo && count === 1 ? "▶" : count > 1 ? `${count}` : null}
        </span>
      )}
    </>
  );
}
