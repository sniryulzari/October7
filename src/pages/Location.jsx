
import React, { useState, useEffect, useRef } from "react";
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
  BookOpen,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { createPageUrl } from "@/utils";

export default function LocationPage() {
  const { t, lang, locName, locStoryTitle, locStoryContent } = useLanguage();
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [playingVideoIndex, setPlayingVideoIndex] = useState(null);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [viewCountUpdated, setViewCountUpdated] = useState(false);
  const [audioStatsUpdated, setAudioStatsUpdated] = useState(false);
  const [audioPlayStartTime, setAudioPlayStartTime] = useState(null);
  const [totalListeningTime, setTotalListeningTime] = useState(0);
  const [nextStop, setNextStop] = useState(null);
  const audioRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get('id');
    if (locationId) {
      loadLocation(locationId);
      try {
        const saved = localStorage.getItem('savedRoute');
        if (saved) {
          const routeData = JSON.parse(saved);
          const route = routeData.locations || [];
          const idx = route.findIndex(loc => loc.id === locationId);
          if (idx >= 0 && idx < route.length - 1) {
            setNextStop(route[idx + 1]);
          }
        }
      } catch {}
    } else {
      setError("מזהה המקום לא נמצא");
      setIsLoading(false);
    }
  }, []);

  const loadLocation = async (id, retry = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (retry > 0) {
        await new Promise(resolve => setTimeout(resolve, retry * 1000));
      }
      
      const foundLocation = await Location.get(id);

      if (foundLocation) {
        setLocation(foundLocation);

        try {
          const visited = JSON.parse(localStorage.getItem('visitedLocations') || '[]');
          if (!visited.includes(id)) {
            localStorage.setItem('visitedLocations', JSON.stringify([...visited, id]));
          }
        } catch { /* best-effort */ }

        if (!viewCountUpdated) {
          try {
            await Location.incrementViewCount(id);
            setViewCountUpdated(true);

            // Fire-and-forget analytics — fail silently until Supabase columns exist
            Location.updateLastViewedAt(id).catch(() => {});
            Location.incrementLanguageView(id, lang).catch(() => {});
            const urlSrc = new URLSearchParams(window.location.search).get('src');
            if (urlSrc === 'qr') Location.incrementField(id, 'qr_views').catch(() => {});
          } catch (error) {
            console.log("Could not update view count:", error);
          }
        }
      } else {
        setError("המקום לא נמצא");
      }
    } catch (error) {
      console.error("Error loading location:", error);
      
      if (error.message?.includes('Network Error') || error.response?.status === 429) {
        setError("בעיית רשת או שרת עמוס. נסה שוב בעוד מספר שניות.");
        
        if (retry < 2) {
          setTimeout(() => {
            loadLocation(id, retry + 1);
          }, (retry + 1) * 2000);
          return;
        }
      } else {
        setError("שגיאה בטעינת המידע: " + error.message);
      }
    }
    
    setIsLoading(false);
  };

  const updateAudioStats = async () => {
    if (!location || !audioRef.current || audioStatsUpdated) return;

    try {
      const audioDuration = audioRef.current.duration || 0;
      await Location.updateAudioStats(location.id, totalListeningTime, audioDuration);
      setAudioStatsUpdated(true);
    } catch (error) {
      console.log("Could not update audio stats:", error);
    }
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = createPageUrl("Home");
    }
  };

  const shareLocation = async () => {
    const url = window.location.href;
    if (location) Location.incrementShareCount(location.id).catch(() => {});
    if (navigator.share) {
      try {
        await navigator.share({
          title: location.name,
          text: `גלה את סיפור ${location.name} - 7 באוקטובר 2023`,
          url: url,
        });
      } catch (error) {
        console.log('Error sharing:', error);
        copyToClipboard(url);
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        alert(t('location.linkCopied'));
      }).catch(() => {
        fallbackCopyTextToClipboard(text);
      });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert(t('location.linkCopied'));
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setAudioPlayStartTime(null); // Explicitly set to null on pause
      } else {
        audioRef.current.play();
        setAudioPlayStartTime(Date.now()); // Start tracking time
        
        // Update audio plays count only on first play for this visit
        if (!audioStatsUpdated) {
          updateAudioStats();
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      
      // Track listening time if currently playing and startTime is set
      if (audioPlayStartTime && isPlaying) {
        const now = Date.now();
        const sessionTimeDelta = (now - audioPlayStartTime) / 1000; // Convert to seconds
        setTotalListeningTime(prev => prev + sessionTimeDelta);
        setAudioPlayStartTime(now); // Reset for next interval
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setAudioPlayStartTime(null);
    
    // Ensure final stats are updated when audio ends naturally
    if (!audioStatsUpdated) {
      updateAudioStats();
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      // Fix for RTL: calculate position from the right edge
      const pos = (rect.right - e.clientX) / rect.width;
      const newTime = pos * duration;
      audioRef.current.currentTime = Math.max(0, Math.min(newTime, duration));
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleVideo = (index) => {
    const video = videoRefs.current[index];
    if (video) {
      if (playingVideoIndex === index) {
        video.pause();
        setPlayingVideoIndex(null);
      } else {
        if (location) Location.incrementVideoPlays(location.id).catch(() => {});
        // Pause all other videos
        videoRefs.current.forEach((v, i) => {
          if (v && i !== index) {
            v.pause();
          }
        });
        video.play();
        setPlayingVideoIndex(index);
      }
    }
  };

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentGalleryIndex(index);
    if (location) Location.incrementField(location.id, 'gallery_opens').catch(() => {});
  };

  const closeLightbox = () => {
    setSelectedImage(null);
  };

  const nextImage = () => {
    if (location.gallery && currentGalleryIndex < location.gallery.length - 1) {
      const newIndex = currentGalleryIndex + 1;
      setCurrentGalleryIndex(newIndex);
      setSelectedImage(location.gallery[newIndex]);
    }
  };

  const prevImage = () => {
    if (location.gallery && currentGalleryIndex > 0) {
      const newIndex = currentGalleryIndex - 1;
      setCurrentGalleryIndex(newIndex);
      setSelectedImage(location.gallery[newIndex]);
    }
  };

  const nextCarouselImage = () => {
    if (location.gallery && currentCarouselIndex < location.gallery.length - 1) {
      setCurrentCarouselIndex(currentCarouselIndex + 1);
    }
  };

  const prevCarouselImage = () => {
    if (currentCarouselIndex > 0) {
      setCurrentCarouselIndex(currentCarouselIndex - 1);
    }
  };

  const nextVideo = () => {
    if (location.videos && currentVideoIndex < location.videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };

  const prevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };

  const navigateToLocation = () => {
    if (location && location.coordinates) {
      Location.incrementNavigationClicks(location.id).catch(() => {});
      const { lat, lng } = location.coordinates;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
    }
  };

  const navigateToNext = () => {
    if (nextStop && nextStop.coordinates) {
      const { lat, lng } = nextStop.coordinates;
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank');
    }
  };

  const shareAudio = () => {
    if (location && location.audio_file) {
      copyToClipboard(location.audio_file);
    }
  };

  const shouldShowReadMore = (content) => {
    return content && content.length > 300;
  };

  const getDisplayText = (content) => {
    if (!content) return '';
    if (!isStoryExpanded && shouldShowReadMore(content)) {
      return content.substring(0, 300) + '...';
    }
    return content;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#1D4E8F]" />
          <p className="text-[#6B7280]">{t('location.loading')}</p>
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
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">{t('location.errorTitle')}</h2>
          <p className="text-[#6B7280] mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => window.location.reload()}
              className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white"
            >
              {t('location.tryAgain')}
            </Button>
            <Button
              onClick={goBack}
              variant="outline"
              className="border-[#1D4E8F] text-[#1D4E8F] hover:bg-[#F2F2F2]"
            >
              {t('location.back')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <p className="text-[#6B7280]">{t('location.notFound')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F2F2]">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={goBack}
                variant="ghost"
                size="sm"
                className="text-[#1D4E8F] hover:bg-[#F2F2F2] p-3 rounded-full"
              >
                <ArrowRight className="w-6 h-6" />
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
            
            <Button
              onClick={shareLocation}
              variant="ghost"
              size="sm"
              className="text-[#6B7280] hover:text-[#1D4E8F] hover:bg-[#F2F2F2] p-3 rounded-full"
              title={t('location.share')}
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Image — full bleed, before constrained content */}
      {location.main_image && (
        <div className="w-full bg-black">
          <div className="aspect-video sm:aspect-[21/9]">
            <img
              src={location.main_image}
              alt={locName(location)}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Audio Player */}
        {location.audio_file ? (
          <Card className="bg-white border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Headphones className="w-6 h-6 text-[#1D4E8F]" />
                  <h2 className="text-2xl font-bold text-[#1A1A1A]">{t('location.listen')}</h2>
                </div>
                <p className="text-[#6B7280]">{t('location.pressToListen')}</p>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <Button
                  onClick={togglePlay}
                  className="w-24 h-24 rounded-full bg-[#1D4E8F] hover:bg-[#2560B0] text-white shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {isPlaying ? <Pause className="w-12 h-12" /> : <Play className="w-12 h-12" />}
                </Button>

                <div className="w-full max-w-md space-y-4">
                  <div className="relative">
                    <div
                      className="w-full h-3 bg-[#F2F2F2] rounded-full cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div
                        className="h-full bg-[#1D4E8F] rounded-full transition-all duration-100"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-[#6B7280]">
                    <span>{formatTime(currentTime)}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        onClick={toggleMute}
                        variant="ghost"
                        size="sm"
                        className="text-[#6B7280] hover:text-[#1D4E8F] p-1"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <Button
                        onClick={shareAudio}
                        variant="ghost"
                        size="sm"
                        className="text-[#6B7280] hover:text-[#1D4E8F] p-1"
                        title={t('location.shareAudio')}
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

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
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border-0 shadow-sm overflow-hidden opacity-70">
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Headphones className="w-6 h-6 text-[#6B7280]" />
                <h2 className="text-xl font-bold text-[#6B7280]">{t('location.recordingPending')}</h2>
              </div>
              <p className="text-base text-[#6B7280]">{t('location.recordingPendingDesc')}</p>
            </CardContent>
          </Card>
        )}

        {/* Story Summary */}
        {locStoryTitle(location) && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-[#1A1A1A] mb-4">
                {locStoryTitle(location)}
              </h3>

              {locStoryContent(location) && (
                <div className="prose prose-lg max-w-none text-[#1A1A1A] leading-relaxed">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: getDisplayText(locStoryContent(location))
                    }}
                  />

                  {shouldShowReadMore(locStoryContent(location)) && (
                    <Button
                      onClick={() => {
                        if (!isStoryExpanded) Location.incrementField(location.id, 'story_expansions').catch(() => {});
                        setIsStoryExpanded(!isStoryExpanded);
                      }}
                      variant="ghost"
                      className="mt-4 text-[#1D4E8F] hover:bg-[#F2F2F2] p-0 h-auto font-medium"
                    >
                      {isStoryExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 ml-1" />
                          {t('location.readLess')}
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 ml-1" />
                          {t('location.readMore')}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Gallery */}
        {location.gallery && location.gallery.length > 0 && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Camera className="w-5 h-5 text-[#1D4E8F]" />
                <h3 className="text-xl font-bold text-[#1A1A1A]">{t('location.photos')}</h3>
              </div>

              <div className="relative">
                <div className="overflow-hidden rounded-lg">
                  <div 
                    className="flex transition-transform duration-300 ease-in-out"
                    style={{ transform: `translateX(${currentCarouselIndex * -100}%)` }}
                  >
                    {location.gallery.map((image, index) => (
                      <div key={index} className="w-full flex-shrink-0">
                        <div 
                          className="aspect-video cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => openLightbox(image, index)}
                        >
                          <img
                            src={image.image_url}
                            alt={image.caption || `תמונה ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {image.caption && (
                          <p className="text-sm text-[#6B7280] mt-2 text-center">{image.caption}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {location.gallery.length > 1 && (
                  <>
                    <Button
                      onClick={prevCarouselImage}
                      disabled={currentCarouselIndex === 0}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#1D4E8F] shadow-lg hover:bg-white disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={nextCarouselImage}
                      disabled={currentCarouselIndex === location.gallery.length - 1}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#1D4E8F] shadow-lg hover:bg-white disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </>
                )}

                {location.gallery.length > 1 && (
                  <div className="flex justify-center gap-2 mt-4">
                    {location.gallery.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentCarouselIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentCarouselIndex ? 'bg-[#1D4E8F]' : 'bg-[#F2F2F2]'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Videos */}
        {location.videos && location.videos.length > 0 && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-6">{t('location.videos')}</h3>

              <div className="space-y-6">
                {location.videos.map((video, index) => (
                  <div key={index} className="relative">
                    <div className="aspect-video rounded-lg overflow-hidden bg-black relative group">
                      <video
                        ref={el => videoRefs.current[index] = el}
                        src={video.video_url}
                        poster={video.thumbnail}
                        className="w-full h-full object-contain"
                        controls={playingVideoIndex === index}
                        onClick={() => toggleVideo(index)}
                      />
                      
                      {playingVideoIndex !== index && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors cursor-pointer">
                          <Button
                            onClick={() => toggleVideo(index)}
                            className="w-16 h-16 rounded-full bg-white/90 text-[#1D4E8F] hover:bg-white shadow-lg"
                          >
                            <Play className="w-8 h-8" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {(video.title || video.description) && (
                      <div className="mt-3">
                        {video.title && (
                          <h4 className="font-semibold text-[#1A1A1A] mb-1">{video.title}</h4>
                        )}
                        {video.description && (
                          <p className="text-base text-[#6B7280]">{video.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation Button */}
        {location.coordinates && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8 text-center">
              <Button
                onClick={navigateToLocation}
                className="w-full sm:w-auto bg-[#1D4E8F] hover:bg-[#2560B0] text-white px-8 py-4 text-lg font-medium"
              >
                <Navigation className="w-6 h-6 mr-3" />
                {t('location.navigate')}
              </Button>
              <p className="text-base text-[#6B7280] mt-3">
                {t('location.navigationOpens')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Next Stop Banner */}
        {nextStop && (
          <Card className="bg-[#1D4E8F] border-0 shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <p className="text-white/70 text-sm mb-1">{t('location.nextStopHeader')}</p>
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-white/60 text-sm">{t('location.nextStopLabel')}</p>
                  <p className="text-white text-xl font-bold">{nextStop.name}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={navigateToNext}
                    className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white border border-white/40 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    <Navigation className="w-4 h-4" />
                    {t('location.navigateNext')}
                  </button>
                  <a
                    href={createPageUrl(`Location?id=${nextStop.id}`)}
                    className="flex items-center gap-1 bg-white text-[#1D4E8F] hover:bg-white/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                  >
                    {t('location.nextStopBtn')}
                    <ChevronLeft className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl max-h-full relative">
            <Button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-transparent hover:bg-white/10 p-2"
            >
              <X className="w-6 h-6" />
            </Button>
            
            <img
              src={selectedImage.image_url}
              alt={selectedImage.caption || 'תמונה'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            
            {selectedImage.caption && (
              <p className="text-white text-center mt-4 px-4">{selectedImage.caption}</p>
            )}
            
            {location.gallery.length > 1 && (
              <div className="flex justify-center gap-4 mt-4">
                <Button
                  onClick={prevImage}
                  disabled={currentGalleryIndex === 0}
                  className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
                <Button
                  onClick={nextImage}
                  disabled={currentGalleryIndex === location.gallery.length - 1}
                  className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
