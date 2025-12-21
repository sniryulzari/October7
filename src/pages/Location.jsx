
import React, { useState, useEffect, useRef } from "react";
import { Location } from "@/api/entities";
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
  // New state variables for audio statistics
  const [audioStatsUpdated, setAudioStatsUpdated] = useState(false);
  const [audioPlayStartTime, setAudioPlayStartTime] = useState(null);
  const [totalListeningTime, setTotalListeningTime] = useState(0);
  const audioRef = useRef(null);
  const videoRefs = useRef([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get('id');
    if (locationId) {
      loadLocation(locationId);
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
      
      const locations = await Location.list();
      const foundLocation = locations.find(l => l.id === id);
      
      if (foundLocation) {
        setLocation(foundLocation);
        
        if (!viewCountUpdated) {
          try {
            await Location.update(id, {
              view_count: (foundLocation.view_count || 0) + 1
            });
            setViewCountUpdated(true);
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
      const currentAudioPlays = (location.audio_plays || 0) + 1;
      const audioDuration = audioRef.current.duration || 0;
      
      // Calculate listening percentage based on current session's listening time
      let listeningPercentage = 0;
      if (audioDuration > 0 && totalListeningTime > 0) {
        listeningPercentage = Math.min(Math.round((totalListeningTime / audioDuration) * 100), 100);
      }
      
      // Calculate new total listening time and average listening percentage
      const currentTotalListeningTime = (location.total_listening_time || 0) + totalListeningTime;
      const newAveragePercentage = currentAudioPlays > 0 ? 
        Math.round((currentTotalListeningTime / (currentAudioPlays * audioDuration)) * 100) : 0;
      
      await Location.update(location.id, {
        audio_plays: currentAudioPlays,
        total_listening_time: currentTotalListeningTime,
        average_listening_percentage: Math.min(newAveragePercentage, 100)
      });
      
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
        alert('הקישור הועתק ללוח');
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
    alert('הקישור הועתק ללוח');
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
      const { lat, lng } = location.coordinates;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
      window.open(googleMapsUrl, '_blank');
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
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#1E3A5F]" />
          <p className="text-[#555555]">טוען את פרטי המקום...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#222222] mb-2">שגיאה בטעינת המקום</h2>
          <p className="text-[#555555] mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()}
              className="bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white"
            >
              נסה שוב
            </Button>
            <Button 
              onClick={goBack}
              variant="outline"
              className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#F5F5F5]"
            >
              חזור
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center" dir="rtl">
        <p className="text-[#555555]">המקום לא נמצא</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]" dir="rtl">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={goBack}
                variant="ghost"
                size="sm"
                className="text-[#1E3A5F] hover:bg-[#F5F5F5] p-3 rounded-full"
              >
                <ArrowRight className="w-6 h-6" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#222222] line-clamp-1">
                  {location.name}
                </h1>
                {location.category && (
                  <Badge className="mt-1 bg-[#F5F5F5] text-[#1E3A5F] border-[#1E3A5F]">
                    {location.category}
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              onClick={shareLocation}
              variant="ghost"
              size="sm"
              className="text-[#555555] hover:text-[#1E3A5F] hover:bg-[#F5F5F5] p-3 rounded-full"
            >
              <Share2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Audio Player */}
        {location.audio_file && (
          <Card className="bg-white border-0 shadow-lg overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Headphones className="w-6 h-6 text-[#1E3A5F]" />
                  <h2 className="text-2xl font-bold text-[#222222]">האזן לסיפור המקום</h2>
                </div>
                <p className="text-[#555555]">לחץ על הכפתור כדי להתחיל האזנה</p>
              </div>

              <div className="flex flex-col items-center space-y-6">
                <Button
                  onClick={togglePlay}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white shadow-lg transition-all duration-200 hover:scale-105"
                >
                  {isPlaying ? <Pause className="w-8 h-8 sm:w-10 sm:h-10" /> : <Play className="w-8 h-8 sm:w-10 sm:h-10" />}
                </Button>

                <div className="w-full max-w-md space-y-4">
                  <div className="relative">
                    <div 
                      className="w-full h-2 bg-[#F5F5F5] rounded-full cursor-pointer"
                      onClick={handleSeek}
                    >
                      <div 
                        className="h-full bg-[#1E3A5F] rounded-full transition-all duration-100"
                        style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm text-[#555555]">
                    <span>{formatTime(currentTime)}</span>
                    <Button
                      onClick={toggleMute}
                      variant="ghost"
                      size="sm"
                      className="text-[#555555] hover:text-[#1E3A5F] p-1"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <audio
                  ref={audioRef}
                  src={location.audio_file}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleAudioEnded}
                  onPause={() => setAudioPlayStartTime(null)} // Update on browser pause
                  onPlay={() => setAudioPlayStartTime(Date.now())} // Update on browser play
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Image */}
        {location.main_image && (
          <Card className="bg-white border-0 shadow-lg overflow-hidden">
            <div className="aspect-video sm:aspect-[21/9] relative">
              <img
                src={location.main_image}
                alt={location.name}
                className="w-full h-full object-cover"
              />
            </div>
          </Card>
        )}

        {/* Story Summary */}
        {location.full_story?.title && (
          <Card className="bg-white border-0 shadow-lg">
            <CardContent className="p-6 sm:p-8">
              <h3 className="text-xl sm:text-2xl font-bold text-[#222222] mb-4">
                {location.full_story.title}
              </h3>
              
              {location.full_story.content && (
                <div className="prose prose-lg max-w-none text-[#555555] leading-relaxed">
                  <div 
                    dangerouslySetInnerHTML={{ 
                      __html: getDisplayText(location.full_story.content) 
                    }} 
                  />
                  
                  {shouldShowReadMore(location.full_story.content) && (
                    <Button
                      onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                      variant="ghost"
                      className="mt-4 text-[#1E3A5F] hover:bg-[#F5F5F5] p-0 h-auto font-medium"
                    >
                      {isStoryExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4 ml-1" />
                          הסתר טקסט
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 ml-1" />
                          המשך לקרוא
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
                <Camera className="w-5 h-5 text-[#1E3A5F]" />
                <h3 className="text-xl font-bold text-[#222222]">תמונות מהמקום</h3>
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
                          <p className="text-sm text-[#555555] mt-2 text-center">{image.caption}</p>
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
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#1E3A5F] shadow-lg hover:bg-white disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <Button
                      onClick={nextCarouselImage}
                      disabled={currentCarouselIndex === location.gallery.length - 1}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#1E3A5F] shadow-lg hover:bg-white disabled:opacity-50"
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
                          index === currentCarouselIndex ? 'bg-[#1E3A5F]' : 'bg-[#F5F5F5]'
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
              <h3 className="text-xl font-bold text-[#222222] mb-6">קטעי וידאו</h3>

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
                            className="w-16 h-16 rounded-full bg-white/90 text-[#1E3A5F] hover:bg-white shadow-lg"
                          >
                            <Play className="w-8 h-8" />
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {(video.title || video.description) && (
                      <div className="mt-3">
                        {video.title && (
                          <h4 className="font-semibold text-[#222222] mb-1">{video.title}</h4>
                        )}
                        {video.description && (
                          <p className="text-sm text-[#555555]">{video.description}</p>
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
                className="w-full sm:w-auto bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white px-8 py-4 text-lg font-medium shadow-lg"
              >
                <Navigation className="w-6 h-6 mr-3" />
                נווט למקום
              </Button>
              <p className="text-sm text-[#555555] mt-3">
                יפתח את אפליקציית הניווט במכשיר שלך
              </p>
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
