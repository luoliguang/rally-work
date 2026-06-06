import type { Media } from "@/lib/types";
import { mediaUrl } from "@/lib/mediaUrl";

/**
 * Renders one image or video. Videos use their `poster` and only load on play
 * (preload="none") — see README §8/§9 performance principles.
 */
export function MediaItem({ media }: { media: Media }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900">
      {media.type === "image" ? (
        // Plain <img> keeps remote sources simple; switch to next/image once sources stabilize.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(media.url)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <video
          src={mediaUrl(media.url)}
          poster={mediaUrl(media.poster)}
          preload="none"
          controls
          className="h-full w-full"
        />
      )}
    </figure>
  );
}
