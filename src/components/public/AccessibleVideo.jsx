/* eslint-disable react/prop-types */
import { useRef, useEffect } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * AccessibleVideo — WCAG 2.1 AA compliant video player.
 *
 * Play-state is managed by the parent (Location.jsx) so sibling videos
 * can be paused when one starts. Pass isPlaying / onToggle / onPlay callbacks.
 *
 * video prop shape: { video_url, thumbnail, title, description, caption, credits }
 * captionSrc: optional path to a .vtt file; if absent, caption text is shown as transcript
 */
export default function AccessibleVideo({
  video,
  index,
  isPlaying,
  onToggle,
  onPlay,
  locationName = "",
  captionSrc,
  captionLang = "he",
}) {
  const videoRef = useRef(null);

  // Expose the raw <video> element to the parent via onPlay callback
  useEffect(() => {
    if (onPlay && videoRef.current) onPlay(index, videoRef.current);
  }, [index, onPlay]);

  const label = video.title || `${locationName} — סרטון ${index + 1}`;
  const uniqueId = `vid-${index}`;
  const transcriptId = `transcript-${uniqueId}`;
  const descId = video.description ? `desc-${uniqueId}` : undefined;

  const handleKeyDown = (e) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      onToggle(index);
    }
  };

  return (
    <figure
      role="group"
      aria-labelledby={`title-${uniqueId}`}
      className="space-y-3"
      dir="rtl"
    >
      {/* Visible title doubles as the accessible group label */}
      {video.title && (
        <h3
          id={`title-${uniqueId}`}
          className="font-semibold text-[#1A1A1A]"
        >
          {video.title}
        </h3>
      )}
      {/* sr-only fallback title when there's no visible title element */}
      {!video.title && (
        <span id={`title-${uniqueId}`} className="sr-only">
          {label}
        </span>
      )}

      {/* Video wrapper — focus-within ring ensures keyboard focus is visible */}
      <div
        className="aspect-video rounded-lg overflow-hidden bg-black relative group focus-within:ring-4 focus-within:ring-blue-500 focus-within:ring-offset-2"
      >
        <video
          ref={videoRef}
          src={video.video_url}
          poster={video.thumbnail}
          aria-label={label}
          aria-describedby={[descId, video.caption ? transcriptId : null]
            .filter(Boolean)
            .join(" ") || undefined}
          className="w-full h-full object-contain focus:outline-none"
          controls={isPlaying}
          tabIndex={0}
          onClick={() => onToggle(index)}
          onKeyDown={handleKeyDown}
        >
          {captionSrc && (
            <track
              kind="captions"
              src={captionSrc}
              srcLang={captionLang}
              label="כתוביות"
              default
            />
          )}
          {/* Fallback for browsers without <video> support */}
          <p>
            הדפדפן שלך אינו תומך בוידאו.{" "}
            <a href={video.video_url} className="underline">
              הורד את הסרטון
            </a>
          </p>
        </video>

        {/* Play overlay — hidden when controls are active */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors cursor-pointer"
            onClick={() => onToggle(index)}
            // aria-hidden: the focusable <video> above already handles keyboard; this is a visual affordance only
            aria-hidden="true"
          >
            <Button
              tabIndex={-1}
              className="w-16 h-16 rounded-full bg-white/90 text-[#1D4E8F] hover:bg-white shadow-lg pointer-events-none"
            >
              <Play className="w-8 h-8" />
            </Button>
          </div>
        )}
      </div>

      {/* Poster/description — gives screen readers visual context */}
      {video.description && (
        <p id={descId} className="text-base text-[#555E6D]">
          {video.description}
        </p>
      )}

      {/* Credits */}
      {video.credits && (
        <p className="text-xs text-[#888] mt-1">
          {/* translators: photo/video credit line */}
          © {video.credits}
        </p>
      )}

      {/* Transcript — satisfies WCAG 1.2.3 (Audio Description or Media Alternative) */}
      {video.caption && (
        <details className="text-sm">
          <summary
            className="cursor-pointer text-[#1D4E8F] underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded w-fit"
          >
            תמלול / תיאור הסרטון
          </summary>
          <div
            id={transcriptId}
            className="mt-2 p-3 bg-gray-50 rounded leading-relaxed text-[#333] whitespace-pre-wrap"
            tabIndex={0}
            aria-label={`תמלול: ${label}`}
          >
            {video.caption}
          </div>
        </details>
      )}
    </figure>
  );
}
