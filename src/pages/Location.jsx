import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import DOMPurify from "dompurify";
import { Location } from "@/api/entities";
import { useLanguage } from "@/utils/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Navigation,
  ChevronLeft,
  X,
  Loader2,
  Camera,
  Headphones,
  ChevronDown,
  ChevronUp,
  Download,
} from "lucide-react";
import { createPageUrl } from "@/utils";
import { makeGoogleMapsNavUrl } from "@/utils/geo";
import AccessibleVideo from "@/components/public/AccessibleVideo";
import ShareModal from "@/components/public/ShareModal";
import LocationGallery from "@/components/public/LocationGallery";
import LocationStickyHeader from "@/components/public/LocationStickyHeader";

const getTextContent = (html) => {
  if (!html) return "";
  return new DOMParser().parseFromString(html, "text/html").body.textContent || "";
};

function fmtTime(time) {
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const AudioPlayer = memo(function AudioPlayer({
  variant, isPlaying, onTogglePlay,
  currentTime, duration, onSeek, onKeySeek,
  isMuted, onToggleMute, playbackSpeed, onCycleSpeed,
  audioFileUrl,
}) {
  const isDark = variant === "dark";
  return (
    <div className="flex flex-col items-center space-y-6 w-full">
      <div className="relative flex items-center justify-center">
        {isPlaying && (
          <span className={`absolute rounded-full animate-ping ${
            isDark ? "w-32 h-32 bg-white/15" : "w-24 h-24 bg-[#1D4E8F]/25"
          }`} />
        )}
        <Button
          onClick={onTogglePlay}
          aria-label={isPlaying ? "השהה" : "נגן"}
          className={`relative rounded-full shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 ${
            isDark
              ? "w-28 h-28 bg-white text-[#1E3A5F] hover:bg-white/90"
              : "w-24 h-24 bg-[#1D4E8F] hover:bg-[#2560B0] text-white"
          }`}
        >
          {isPlaying
            ? <Pause className={isDark ? "w-14 h-14" : "w-12 h-12"} />
            : <Play  className={isDark ? "w-14 h-14" : "w-12 h-12"} />
          }
        </Button>
      </div>

      <div className={`w-full space-y-3 ${isDark ? "max-w-xs" : "max-w-md"}`}>
        <div
          role="slider"
          aria-label="מיקום בהקלטה"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration) || 0}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${fmtTime(currentTime)} מתוך ${fmtTime(duration)}`}
          tabIndex={0}
          className={`w-full h-1.5 rounded-full cursor-pointer ${isDark ? "bg-white/20" : "bg-[#F2F2F2]"}`}
          onClick={onSeek}
          onKeyDown={onKeySeek}
        >
          <div
            className={`h-full rounded-full transition-all duration-100 ${isDark ? "bg-white" : "bg-[#1D4E8F]"}`}
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>

        <div className={`flex justify-between items-center text-sm ${isDark ? "text-white/80" : "text-[#555E6D]"}`}>
          <span aria-hidden="true">{fmtTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <Button
              onClick={onToggleMute}
              variant="ghost"
              size="sm"
              aria-label={isMuted ? "בטל השתקה" : "השתק"}
              className={`p-1 ${isDark ? "text-white/60 hover:text-white hover:bg-white/10" : "text-[#555E6D] hover:text-[#1D4E8F]"}`}
            >
              {isMuted ? <VolumeX className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
            </Button>
            <Button
              onClick={onCycleSpeed}
              variant="ghost"
              size="sm"
              aria-label={`מהירות ניגון: ${playbackSpeed}x`}
              className={`px-2 py-1 text-xs font-bold min-w-[36px] ${isDark ? "text-white/60 hover:text-white hover:bg-white/10" : "text-[#555E6D] hover:text-[#1D4E8F]"}`}
            >
              {playbackSpeed}x
            </Button>
            <a
              href={audioFileUrl}
              download
              aria-label="הורד הקלטה"
              className={`inline-flex items-center p-1 transition-colors ${isDark ? "text-white/60 hover:text-white" : "text-[#555E6D] hover:text-[#1D4E8F]"}`}
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
          <span aria-hidden="true">{fmtTime(duration)}</span>
        </div>
      </div>
    </div>
  );
});

export default function LocationPage() {
  const { t, lang, locName, locStoryTitle, locStoryContent } = useLanguage();
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [viewCountUpdated, setViewCountUpdated] = useState(false);
  const [audioStatsUpdated, setAudioStatsUpdated] = useState(false);
  const audioPlayStartTime = useRef(null);
  const [totalListeningTime, setTotalListeningTime] = useState(0);
  const [nextStop, setNextStop] = useState(null);
  const audioRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    if (!location) return;
    document.title = `${locName(location)} – בשביל הזיכרון 7 באוקטובר`;
    return () => {
      document.title = 'בשביל הזיכרון 7 באוקטובר – אתרי הטבח בעוטף עזה';
    };
  }, [location, locName]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get("id");
    if (locationId) {
      loadLocation(locationId);
      try {
        const saved = localStorage.getItem("savedRoute");
        if (saved) {
          const routeData = JSON.parse(saved);
          const route = routeData.locations || [];
          const idx = route.findIndex((loc) => loc.id === locationId);
          if (idx >= 0 && idx < route.length - 1) setNextStop(route[idx + 1]);
        }
      } catch {} // eslint-disable-line no-empty
    } else {
      setError("מזהה המקום לא נמצא");
      setIsLoading(false);
    }
  }, []);

  const loadLocation = async (id, retry = 0) => {
    setIsLoading(true);
    setError(null);
    try {
      if (retry > 0) await new Promise((r) => setTimeout(r, retry * 1000));
      const foundLocation = await Location.get(id);
      if (foundLocation) {
        setLocation(foundLocation);
        try {
          const visited = JSON.parse(localStorage.getItem("visitedLocations") || "[]");
          if (!visited.includes(id))
            localStorage.setItem("visitedLocations", JSON.stringify([...visited, id]));
        } catch { /* best-effort */ }
        if (!viewCountUpdated) {
          try {
            await Location.incrementViewCount(id);
            setViewCountUpdated(true);
            Location.updateLastViewedAt(id).catch(() => {});
            Location.incrementLanguageView(id, lang).catch(() => {});
            const urlSrc = new URLSearchParams(window.location.search).get("src");
            if (urlSrc === "qr") Location.incrementField(id, "qr_views").catch(() => {});
          } catch { /* best-effort */ }
        }
      } else {
        setError("המקום לא נמצא");
      }
    } catch (err) {
      console.error("Error loading location:", err);
      if (err.message?.includes("Network Error") || err.response?.status === 429) {
        setError("בעיית רשת או שרת עמוס. נסה שוב בעוד מספר שניות.");
        if (retry < 2) {
          setTimeout(() => loadLocation(id, retry + 1), (retry + 1) * 2000);
          return;
        }
      } else {
        setError("שגיאה בטעינת המידע. נסה לרענן את הדף.");
      }
    }
    setIsLoading(false);
  };

  const updateAudioStats = async () => {
    if (!location || !audioRef.current || audioStatsUpdated) return;
    try {
      await Location.updateAudioStats(location.id, totalListeningTime, audioRef.current.duration || 0);
      setAudioStatsUpdated(true);
    } catch { /* best-effort */ }
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = createPageUrl("Home");
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      audioPlayStartTime.current = null;
    } else {
      audioRef.current.play();
      audioPlayStartTime.current = Date.now();
      if (!audioStatsUpdated) updateAudioStats();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    setIsMuted(prev => { audioRef.current.muted = !prev; return !prev; });
  }, []);

  const cycleSpeed = useCallback(() => {
    const speeds = [1, 1.25, 1.5, 2];
    setPlaybackSpeed(prev => {
      const next = speeds[(speeds.indexOf(prev) + 1) % speeds.length];
      if (audioRef.current) audioRef.current.playbackRate = next;
      return next;
    });
  }, []);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioPlayStartTime.current && isPlaying) {
      const now = Date.now();
      setTotalListeningTime((p) => p + (now - audioPlayStartTime.current) / 1000);
      audioPlayStartTime.current = now;
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    audioPlayStartTime.current = null;
    if (!audioStatsUpdated) updateAudioStats();
  };

  const handleSeek = useCallback((e) => {
    if (!audioRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (rect.right - e.clientX) / rect.width;
    audioRef.current.currentTime = Math.max(0, Math.min(pos * duration, duration));
  }, [duration]);

  const handleKeySeek = useCallback((e) => {
    if (!audioRef.current || duration <= 0) return;
    const step = 5;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp')
      audioRef.current.currentTime = Math.min(audioRef.current.currentTime + step, duration);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown')
      audioRef.current.currentTime = Math.max(audioRef.current.currentTime - step, 0);
  }, [duration]);

  const toggleVideo = (index) => {
    const video = videoRefs.current[index];
    if (!video) return;
    if (playingVideoIndex === index) {
      video.pause();
      setPlayingVideoIndex(null);
    } else {
      if (location) Location.incrementVideoPlays(location.id).catch(() => {});
      videoRefs.current.forEach((v, i) => { if (v && i !== index) v.pause(); });
      video.play();
      setPlayingVideoIndex(index);
    }
  };

  const navigateToLocation = () => {
    if (!location?.coordinates) return;
    Location.incrementNavigationClicks(location.id).catch(() => {});
    const { lat, lng } = location.coordinates;
    window.open(makeGoogleMapsNavUrl(lat, lng), "_blank");
  };

  const navigateToNext = () => {
    if (!nextStop?.coordinates) return;
    const { lat, lng } = nextStop.coordinates;
    window.open(makeGoogleMapsNavUrl(lat, lng), "_blank");
  };

  const showReadMore = useMemo(
    () => location ? getTextContent(locStoryContent(location)).length > 300 : false,
    [location, locStoryContent]
  );

  const shareText = useMemo(
    () => location ? `${locName(location)} - זיכרון 7.10` : "",
    [location, locName]
  );
  const shareUrl = useMemo(() => window.location.href, []);

  // ── Loading / Error ─────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#1D4E8F]" />
          <p className="text-[#555E6D]">{t("location.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">{t("location.errorTitle")}</h2>
          <p className="text-[#555E6D] mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white">
              {t("location.tryAgain")}
            </Button>
            <Button onClick={goBack} variant="outline" className="border-[#1D4E8F] text-[#1D4E8F] hover:bg-[#F2F2F2]">
              {t("location.back")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="text-[#555E6D]">{t("location.notFound")}</p>
      </div>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F2F2F2]">

      <LocationStickyHeader
        location={location}
        locName={locName}
        onBack={goBack}
        onShare={() => setShowShareModal(true)}
        t={t}
      />

      {/* Single <audio> element — both mobile and desktop panels share it via audioRef */}
      {location.audio_file && (
        <audio
          ref={audioRef}
          src={location.audio_file}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          onPause={() => { audioPlayStartTime.current = null; }}
          onPlay={() => { audioPlayStartTime.current = Date.now(); }}
          aria-hidden="true"
          className="hidden"
        />
      )}

      {/* ── MOBILE HERO: image → audio card, stacked ───────────────────────── */}
      <div className="lg:hidden">
        {location.main_image && (
          <div className="h-52 sm:h-64 bg-gray-200">
            <img src={location.main_image} alt={locName(location)} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="px-4 sm:px-6 py-6">
          {location.audio_file ? (
            <Card className="bg-white border-0 shadow-lg overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Headphones className="w-6 h-6 text-[#1D4E8F]" />
                    <h2 className="text-2xl font-bold text-[#1A1A1A]">{t("location.listen")}</h2>
                  </div>
                  <p className="text-[#555E6D]">{t("location.pressToListen")}</p>
                </div>
                <AudioPlayer
                  variant="light"
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlay}
                  currentTime={currentTime}
                  duration={duration}
                  onSeek={handleSeek}
                  onKeySeek={handleKeySeek}
                  isMuted={isMuted}
                  onToggleMute={toggleMute}
                  playbackSpeed={playbackSpeed}
                  onCycleSpeed={cycleSpeed}
                  audioFileUrl={location.audio_file}
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white border-0 shadow-sm opacity-70">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Headphones className="w-6 h-6 text-[#555E6D]" />
                  <h2 className="text-xl font-bold text-[#555E6D]">{t("location.recordingPending")}</h2>
                </div>
                <p className="text-base text-[#555E6D]">{t("location.recordingPendingDesc")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/*
        ── DESKTOP HERO: two separate cards in a grid ──────────────────────────
        In RTL grid: col-start-1 = rightmost (audio), col-start-2 = leftmost (image).
        Mobile uses the lg:hidden section above; this block is desktop-only.
      */}
      <div className="hidden lg:block">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-2 gap-6">

            {/* Image card — LEFT (col-start-2 in RTL) */}
            <div className="col-start-2 row-start-1 h-[420px] rounded-2xl overflow-hidden shadow-xl bg-gray-200 relative">
              {location.main_image ? (
                <img
                  src={location.main_image}
                  alt={locName(location)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-16 h-16 text-gray-300" />
                </div>
              )}
            </div>

            {/* Audio card — RIGHT (col-start-1 in RTL), dark navy */}
            <div
              className="col-start-1 row-start-1 h-[420px] rounded-2xl shadow-xl flex flex-col justify-center items-center px-10 py-8"
              style={{ backgroundColor: "#1E3A5F" }}
            >
              {location.audio_file ? (
                <>
                  <div className="text-center mb-8 w-full">
                    <Headphones className="w-7 h-7 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.45)" }} />
                    <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.50)" }}>
                      {t("location.pressToListen")}
                    </p>
                    <h2 className="text-2xl font-bold leading-tight" style={{ color: "#ffffff" }}>
                      {locName(location)}
                    </h2>
                    {location.category && (
                      <p className="text-sm mt-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                        {location.category}
                      </p>
                    )}
                  </div>
                  <AudioPlayer
                    variant="dark"
                    isPlaying={isPlaying}
                    onTogglePlay={togglePlay}
                    currentTime={currentTime}
                    duration={duration}
                    onSeek={handleSeek}
                    onKeySeek={handleKeySeek}
                    isMuted={isMuted}
                    onToggleMute={toggleMute}
                    playbackSpeed={playbackSpeed}
                    onCycleSpeed={cycleSpeed}
                    audioFileUrl={location.audio_file}
                  />
                </>
              ) : (
                <div className="text-center">
                  <Headphones className="w-10 h-10 mx-auto mb-4" style={{ color: "rgba(255,255,255,0.35)" }} />
                  <h2 className="text-xl font-bold mb-2" style={{ color: "rgba(255,255,255,0.70)" }}>
                    {t("location.recordingPending")}
                  </h2>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                    {t("location.recordingPendingDesc")}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── Content below the hero ──────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Story */}
        {locStoryTitle(location) && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-4">
                {locStoryTitle(location)}
              </h2>
              {locStoryContent(location) && (
                <div className="prose prose-lg max-w-none text-[#1A1A1A] leading-relaxed">
                  <div
                    className={!isStoryExpanded ? "line-clamp-6 overflow-hidden" : ""}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(locStoryContent(location)) }}
                  />
                  {showReadMore && (
                    <Button
                      onClick={() => {
                        if (!isStoryExpanded)
                          Location.incrementField(location.id, "story_expansions").catch(() => {});
                        setIsStoryExpanded(!isStoryExpanded);
                      }}
                      variant="ghost"
                      className="mt-4 text-[#1D4E8F] hover:bg-[#F2F2F2] p-0 h-auto font-medium"
                    >
                      {isStoryExpanded
                        ? <><ChevronUp className="w-4 h-4 ml-1" aria-hidden="true" />{t("location.readLess")}<span className="sr-only"> — {locStoryTitle(location)}</span></>
                        : <><ChevronDown className="w-4 h-4 ml-1" aria-hidden="true" />{t("location.readMore")}<span className="sr-only"> — {locStoryTitle(location)}</span></>
                      }
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Videos */}
        {location.videos && location.videos.length > 0 && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-6">{t("location.videos")}</h2>
              <div className="space-y-6">
                {location.videos.map((video, index) => (
                  <AccessibleVideo
                    key={index}
                    video={video}
                    index={index}
                    isPlaying={playingVideoIndex === index}
                    onToggle={toggleVideo}
                    onPlay={(idx, el) => { videoRefs.current[idx] = el; }}
                    locationName={locName(location)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gallery */}
        {location.gallery && location.gallery.length > 0 && (
          <LocationGallery
            gallery={location.gallery}
            locationName={locName(location)}
            locationId={location.id}
            t={t}
          />
        )}

        {/* Navigation */}
        {location.coordinates && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8 lg:p-10 text-center">
              <Button onClick={navigateToLocation}
                className="w-full sm:w-auto bg-[#1D4E8F] hover:bg-[#2560B0] text-white px-8 py-4 text-lg font-medium">
                <Navigation className="w-6 h-6 mr-3" />
                {t("location.navigate")}
              </Button>
              <p className="text-base text-[#555E6D] mt-3">{t("location.navigationOpens")}</p>
            </CardContent>
          </Card>
        )}

        {/* Next Stop */}
        {nextStop && (
          <Card className="bg-[#1D4E8F] border-0 shadow-xl">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <p className="text-white/70 text-sm mb-1">{t("location.nextStopHeader")}</p>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-white/60 text-sm">{t("location.nextStopLabel")}</p>
                  <p className="text-white text-xl font-bold">{locName(nextStop)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={navigateToNext}
                    className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                    <Navigation className="w-4 h-4" />
                    {t("location.navigateNext")}
                  </button>
                  <a href={createPageUrl(`Location?id=${nextStop.id}`)}
                    className="flex items-center gap-1 bg-white text-[#1D4E8F] hover:bg-white/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                    {t("location.nextStopBtn")}
                    <ChevronLeft className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        locationId={location.id}
        shareText={shareText}
        shareUrl={shareUrl}
      />
    </div>
  );
}
