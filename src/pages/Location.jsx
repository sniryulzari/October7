import { useState, useEffect, useRef } from "react";
import DOMPurify from "dompurify";
import { Location } from "@/api/entities";
import { useLanguage } from "@/utils/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Navigation,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Camera,
  Headphones,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Download,
  MessageCircle,
  Smartphone,
} from "lucide-react";
import { createPageUrl } from "@/utils";

const getTextContent = (html) => {
  if (!html) return "";
  return new DOMParser().parseFromString(html, "text/html").body.textContent || "";
};

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
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [viewCountUpdated, setViewCountUpdated] = useState(false);
  const [audioStatsUpdated, setAudioStatsUpdated] = useState(false);
  const [audioPlayStartTime, setAudioPlayStartTime] = useState(null);
  const [totalListeningTime, setTotalListeningTime] = useState(0);
  const [nextStop, setNextStop] = useState(null);
  const audioRef = useRef(null);
  const videoRefs = useRef([]);
  const touchStartX = useRef(null);

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
          } catch (err) {
            console.log("Could not update view count:", err);
          }
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
    } catch (err) {
      console.log("Could not update audio stats:", err);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = createPageUrl("Home");
  };

  const shareLocation = () => setShowShareModal(true);

  const copyToClipboard = (text) => {
    const markCopied = () => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    };
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(markCopied).catch(() => { fallbackCopy(text); markCopied(); });
    } else {
      fallbackCopy(text);
      markCopied();
    }
  };

  const fallbackCopy = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setAudioPlayStartTime(null);
    } else {
      audioRef.current.play();
      setAudioPlayStartTime(Date.now());
      if (!audioStatsUpdated) updateAudioStats();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    if (audioPlayStartTime && isPlaying) {
      const now = Date.now();
      setTotalListeningTime((p) => p + (now - audioPlayStartTime) / 1000);
      setAudioPlayStartTime(now);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioPlayStartTime(null);
    if (!audioStatsUpdated) updateAudioStats();
  };

  const handleSeek = (e) => {
    if (!audioRef.current || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (rect.right - e.clientX) / rect.width;
    audioRef.current.currentTime = Math.max(0, Math.min(pos * duration, duration));
  };

  const formatTime = (time) => {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

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

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentGalleryIndex(index);
    if (location) Location.incrementField(location.id, "gallery_opens").catch(() => {});
  };

  const closeLightbox = () => setSelectedImage(null);

  const nextImage = () => {
    if (location.gallery && currentGalleryIndex < location.gallery.length - 1) {
      const i = currentGalleryIndex + 1;
      setCurrentGalleryIndex(i);
      setSelectedImage(location.gallery[i]);
    }
  };

  const prevImage = () => {
    if (location.gallery && currentGalleryIndex > 0) {
      const i = currentGalleryIndex - 1;
      setCurrentGalleryIndex(i);
      setSelectedImage(location.gallery[i]);
    }
  };

  const nextCarouselImage = () => {
    if (location.gallery && currentCarouselIndex < location.gallery.length - 1)
      setCurrentCarouselIndex(currentCarouselIndex + 1);
  };

  const prevCarouselImage = () => {
    if (currentCarouselIndex > 0) setCurrentCarouselIndex(currentCarouselIndex - 1);
  };

  const handleCarouselTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleCarouselTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) delta > 0 ? nextCarouselImage() : prevCarouselImage();
    touchStartX.current = null;
  };

  const navigateToLocation = () => {
    if (!location?.coordinates) return;
    Location.incrementNavigationClicks(location.id).catch(() => {});
    const { lat, lng } = location.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
  };

  const navigateToNext = () => {
    if (!nextStop?.coordinates) return;
    const { lat, lng } = nextStop.coordinates;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, "_blank");
  };

  const shouldShowReadMore = (content) => getTextContent(content).length > 300;

  const shareText = location ? `${locName(location)} - זיכרון 7.10` : "";
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  // ── Audio controls: shared between mobile card and desktop panel ────────────

  const audioControls = (variant) => {
    const isDark = variant === "dark";
    return (
      <div className="flex flex-col items-center space-y-6 w-full">
        {/* Play button */}
        <div className="relative flex items-center justify-center">
          {isPlaying && (
            <span
              className={`absolute rounded-full animate-ping ${
                isDark ? "w-32 h-32 bg-white/15" : "w-24 h-24 bg-[#1D4E8F]/25"
              }`}
            />
          )}
          <Button
            onClick={togglePlay}
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

        {/* Progress + controls */}
        <div className={`w-full space-y-3 ${isDark ? "max-w-xs" : "max-w-md"}`}>
          <div
            role="slider"
            aria-label="מיקום בהקלטה"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration) || 0}
            aria-valuenow={Math.round(currentTime)}
            aria-valuetext={`${formatTime(currentTime)} מתוך ${formatTime(duration)}`}
            tabIndex={0}
            className={`w-full h-1.5 rounded-full cursor-pointer ${isDark ? "bg-white/20" : "bg-[#F2F2F2]"}`}
            onClick={handleSeek}
            onKeyDown={(e) => {
              if (!audioRef.current || duration <= 0) return;
              const step = 5;
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                audioRef.current.currentTime = Math.min(audioRef.current.currentTime + step, duration);
              } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                audioRef.current.currentTime = Math.max(audioRef.current.currentTime - step, 0);
              }
            }}
          >
            <div
              className={`h-full rounded-full transition-all duration-100 ${isDark ? "bg-white" : "bg-[#1D4E8F]"}`}
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          <div className={`flex justify-between items-center text-sm ${isDark ? "text-white/60" : "text-[#555E6D]"}`}>
            <span aria-hidden="true">{formatTime(currentTime)}</span>
            <div className="flex items-center gap-1">
              <Button
                onClick={toggleMute}
                variant="ghost"
                size="sm"
                aria-label={isMuted ? "בטל השתקה" : "השתק"}
                className={`p-1 ${isDark ? "text-white/60 hover:text-white hover:bg-white/10" : "text-[#555E6D] hover:text-[#1D4E8F]"}`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
              </Button>
              <Button
                onClick={cycleSpeed}
                variant="ghost"
                size="sm"
                aria-label={`מהירות ניגון: ${playbackSpeed}x`}
                className={`px-2 py-1 text-xs font-bold min-w-[36px] ${isDark ? "text-white/60 hover:text-white hover:bg-white/10" : "text-[#555E6D] hover:text-[#1D4E8F]"}`}
              >
                {playbackSpeed}x
              </Button>
              <a
                href={location.audio_file}
                download
                aria-label="הורד הקלטה"
                className={`inline-flex items-center p-1 transition-colors ${isDark ? "text-white/60 hover:text-white" : "text-[#555E6D] hover:text-[#1D4E8F]"}`}
              >
                <Download className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
            <span aria-hidden="true">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    );
  };

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

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={goBack} variant="ghost" size="sm" aria-label={t("location.back")}
                className="text-[#1D4E8F] hover:bg-[#F2F2F2] p-3 rounded-full">
                <ArrowRight className="w-6 h-6" aria-hidden="true" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] line-clamp-1">
                  {locName(location)}
                </h1>
                {location.category && (
                  <Badge className="mt-1 bg-[#F2F2F2] text-[#1D4E8F] border-[#1D4E8F]">
                    {location.category}
                  </Badge>
                )}
              </div>
            </div>
            <Button onClick={shareLocation} variant="ghost" size="sm" aria-label={t("location.share")}
              className="text-[#555E6D] hover:text-[#1D4E8F] hover:bg-[#F2F2F2] p-3 rounded-full">
              <Share2 className="w-5 h-5" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* Single <audio> element — both mobile and desktop panels share it via audioRef */}
      {location.audio_file && (
        <audio
          ref={audioRef}
          src={location.audio_file}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleAudioEnded}
          onPause={() => setAudioPlayStartTime(null)}
          onPlay={() => setAudioPlayStartTime(Date.now())}
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
                {audioControls("light")}
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
                  {audioControls("dark")}
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
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-4">
                {locStoryTitle(location)}
              </h3>
              {locStoryContent(location) && (
                <div className="prose prose-lg max-w-none text-[#1A1A1A] leading-relaxed">
                  <div
                    className={!isStoryExpanded ? "line-clamp-6 overflow-hidden" : ""}
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(locStoryContent(location)) }}
                  />
                  {shouldShowReadMore(locStoryContent(location)) && (
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
                        ? <><ChevronUp className="w-4 h-4 ml-1" />{t("location.readLess")}</>
                        : <><ChevronDown className="w-4 h-4 ml-1" />{t("location.readMore")}</>
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
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-6">{t("location.videos")}</h3>
              <div className="space-y-6">
                {location.videos.map((video, index) => (
                  <div key={index}>
                    <div className="aspect-video rounded-lg overflow-hidden bg-black relative group">
                      <video
                        ref={(el) => (videoRefs.current[index] = el)}
                        src={video.video_url}
                        poster={video.thumbnail}
                        className="w-full h-full object-contain"
                        controls={playingVideoIndex === index}
                        onClick={() => toggleVideo(index)}
                      />
                      {playingVideoIndex !== index && (
                        <div
                          className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors cursor-pointer"
                          onClick={() => toggleVideo(index)}
                        >
                          <Button className="w-16 h-16 rounded-full bg-white/90 text-[#1D4E8F] hover:bg-white shadow-lg">
                            <Play className="w-8 h-8" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {(video.title || video.description) && (
                      <div className="mt-3">
                        {video.title && <h4 className="font-semibold text-[#1A1A1A] mb-1">{video.title}</h4>}
                        {video.description && <p className="text-base text-[#555E6D]">{video.description}</p>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gallery */}
        {location.gallery && location.gallery.length > 0 && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-center gap-2 mb-6">
                <Camera className="w-5 h-5 text-[#1D4E8F]" />
                <h3 className="text-xl font-bold text-[#1A1A1A]">{t("location.photos")}</h3>
              </div>

              {/* Desktop: 2-column grid */}
              <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
                {location.gallery.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-video bg-gray-200 rounded-xl overflow-hidden cursor-pointer group relative"
                    onClick={() => openLightbox(image, index)}
                  >
                    <img
                      src={image.image_url}
                      alt={image.caption || `תמונה ${index + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {image.caption && (
                      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm">{image.caption}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Mobile: carousel */}
              <div className="lg:hidden relative">
                <div
                  className="overflow-hidden rounded-lg"
                  onTouchStart={handleCarouselTouchStart}
                  onTouchEnd={handleCarouselTouchEnd}
                >
                  <div
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(${currentCarouselIndex * -100}%)` }}
                  >
                    {location.gallery.map((image, index) => (
                      <div key={index} className="w-full flex-shrink-0">
                        <div
                          className="aspect-video cursor-pointer hover:opacity-90 transition-opacity bg-gray-200"
                          onClick={() => openLightbox(image, index)}
                        >
                          <img
                            src={image.image_url}
                            alt={image.caption || `תמונה ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {image.caption && (
                          <p className="text-sm text-[#555E6D] mt-2 text-center">{image.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                {location.gallery.length > 1 && (
                  <>
                    <Button onClick={prevCarouselImage} disabled={currentCarouselIndex === 0} aria-label="תמונה קודמת"
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#1D4E8F] shadow-lg hover:bg-white disabled:opacity-50">
                      <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                    </Button>
                    <Button onClick={nextCarouselImage} disabled={currentCarouselIndex === location.gallery.length - 1} aria-label="תמונה הבאה"
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#1D4E8F] shadow-lg hover:bg-white disabled:opacity-50">
                      <ChevronRight className="w-5 h-5" aria-hidden="true" />
                    </Button>
                    <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="תמונות">
                      {location.gallery.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentCarouselIndex(index)}
                          role="tab"
                          aria-selected={index === currentCarouselIndex}
                          aria-label={`תמונה ${index + 1} מתוך ${location.gallery.length}`}
                          className={`w-2 h-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4E8F] ${index === currentCarouselIndex ? "bg-[#1D4E8F]" : "bg-gray-300"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
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

      {/* ── Share Modal ─────────────────────────────────────────────────────── */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
          onClick={() => setShowShareModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          <div className="bg-white w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 id="share-modal-title" className="text-lg font-bold text-[#1A1A1A]">שיתוף</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowShareModal(false)} aria-label="סגור חלון שיתוף"
                className="p-2 rounded-full text-[#555E6D] hover:bg-[#F2F2F2]">
                <X className="w-5 h-5" aria-hidden="true" />
              </Button>
            </div>
            <div className="space-y-3">
              {/* WhatsApp */}
              <a href={`https://wa.me/?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors"
                onClick={() => { Location.incrementShareCount(location.id).catch(() => {}); setShowShareModal(false); }}>
                <div className="w-11 h-11 bg-[#25D366] rounded-full flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </div>
                <span className="text-[#1A1A1A] font-medium text-base">שיתוף בווטסאפ</span>
              </a>
              {/* Telegram */}
              <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-sky-50 hover:bg-sky-100 transition-colors"
                onClick={() => { Location.incrementShareCount(location.id).catch(() => {}); setShowShareModal(false); }}>
                <div className="w-11 h-11 bg-[#229ED9] rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-[#1A1A1A] font-medium text-base">שיתוף בטלגרם</span>
              </a>
              {/* SMS */}
              <a href={`sms:?body=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`}
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
                onClick={() => { Location.incrementShareCount(location.id).catch(() => {}); setShowShareModal(false); }}>
                <div className="w-11 h-11 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <span className="text-[#1A1A1A] font-medium text-base">שלח ב-SMS</span>
              </a>
              {/* Copy Link */}
              <button onClick={() => copyToClipboard(shareUrl)}
                className="flex items-center gap-4 w-full p-4 rounded-xl bg-[#F2F2F2] hover:bg-gray-200 transition-colors">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${linkCopied ? "bg-green-500" : "bg-[#1D4E8F]"}`}>
                  {linkCopied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
                </div>
                <span className="text-[#1A1A1A] font-medium text-base">
                  {linkCopied ? "הקישור הועתק!" : "העתק קישור"}
                </span>
              </button>
            </div>
            <p className="text-xs text-[#555E6D] text-center mt-4">
              ניתן להדביק את הקישור באינסטגרם, פייסבוק או כל פלטפורמה אחרת
            </p>
          </div>
        </div>
      )}

      {/* ── Lightbox ────────────────────────────────────────────────────────── */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.caption || "תצוגת תמונה מוגדלת"}
        >
          <div className="max-w-5xl max-h-full relative">
            <Button onClick={closeLightbox} aria-label="סגור תמונה"
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-transparent hover:bg-white/10 p-2">
              <X className="w-6 h-6" aria-hidden="true" />
            </Button>
            <img src={selectedImage.image_url} alt={selectedImage.caption || "תמונה מהגלריה"}
              className="max-w-full max-h-[80vh] object-contain rounded-lg" loading="lazy" />
            {selectedImage.caption && (
              <p className="text-white text-center mt-4 px-4">{selectedImage.caption}</p>
            )}
            {location.gallery.length > 1 && (
              <div className="flex justify-center gap-4 mt-4">
                <Button onClick={prevImage} disabled={currentGalleryIndex === 0} aria-label="תמונה קודמת"
                  className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50">
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </Button>
                <Button onClick={nextImage} disabled={currentGalleryIndex === location.gallery.length - 1} aria-label="תמונה הבאה"
                  className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50">
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
