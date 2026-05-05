import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Location } from "@/api/entities";

export default function LocationGallery({ gallery, locationName, locationId, t }) {
  const [currentCarouselIndex, setCurrentCarouselIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0);
  const touchStartX = useRef(null);
  const lightboxRef = useRef(null);
  const lightboxOpenRef = useRef(false);

  useEffect(() => {
    const isOpen = !!selectedImage;
    if (isOpen && !lightboxOpenRef.current) {
      lightboxRef.current?.focus();
    }
    lightboxOpenRef.current = isOpen;
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') setSelectedImage(null); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedImage]);

  const openLightbox = (image, index) => {
    setSelectedImage(image);
    setCurrentGalleryIndex(index);
    Location.incrementField(locationId, "gallery_opens").catch(() => {});
  };

  const closeLightbox = () => setSelectedImage(null);

  const nextImage = () => {
    if (gallery && currentGalleryIndex < gallery.length - 1) {
      const i = currentGalleryIndex + 1;
      setCurrentGalleryIndex(i);
      setSelectedImage(gallery[i]);
    }
  };

  const prevImage = () => {
    if (gallery && currentGalleryIndex > 0) {
      const i = currentGalleryIndex - 1;
      setCurrentGalleryIndex(i);
      setSelectedImage(gallery[i]);
    }
  };

  const nextCarouselImage = () => {
    if (currentCarouselIndex < gallery.length - 1)
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

  return (
    <>
      <Card className="bg-white border-0 shadow-lg">
        <CardContent className="p-6 sm:p-8 lg:p-10">
          <div className="flex items-center gap-2 mb-6">
            <Camera className="w-5 h-5 text-[#1D4E8F]" />
            <h2 className="text-xl font-bold text-[#1A1A1A]">{t("location.photos")}</h2>
          </div>

          {/* Desktop: 2-column grid */}
          <div className="hidden lg:grid lg:grid-cols-2 lg:gap-4">
            {gallery.map((image, index) => (
              <div
                key={index}
                role="button"
                tabIndex={0}
                aria-label={`הגדל תמונה: ${image.caption || `${locationName} — תמונה ${index + 1}`}`}
                className="aspect-video bg-gray-200 rounded-xl overflow-hidden cursor-pointer group relative focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => openLightbox(image, index)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(image, index); } }}
              >
                <img
                  src={image.image_url}
                  alt={image.caption || `${locationName} — תמונה ${index + 1}`}
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
                {gallery.map((image, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <div
                      role="button"
                      tabIndex={0}
                      aria-label={`הגדל תמונה: ${image.caption || `${locationName} — תמונה ${index + 1}`}`}
                      className="aspect-video cursor-pointer hover:opacity-90 transition-opacity bg-gray-200 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-offset-2 rounded"
                      onClick={() => openLightbox(image, index)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(image, index); } }}
                    >
                      <img
                        src={image.image_url}
                        alt={image.caption || `${locationName} — תמונה ${index + 1}`}
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
            {gallery.length > 1 && (
              <>
                <Button onClick={prevCarouselImage} disabled={currentCarouselIndex === 0} aria-label="תמונה קודמת"
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#1D4E8F] shadow-lg hover:bg-white disabled:opacity-50">
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </Button>
                <Button onClick={nextCarouselImage} disabled={currentCarouselIndex === gallery.length - 1} aria-label="תמונה הבאה"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-[#1D4E8F] shadow-lg hover:bg-white disabled:opacity-50">
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </Button>
                <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="תמונות">
                  {gallery.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentCarouselIndex(index)}
                      role="tab"
                      aria-selected={index === currentCarouselIndex}
                      aria-label={`תמונה ${index + 1} מתוך ${gallery.length}`}
                      className={`w-2 h-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D4E8F] ${index === currentCarouselIndex ? "bg-[#1D4E8F]" : "bg-gray-300"}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      {selectedImage && (
        <div
          ref={lightboxRef}
          tabIndex={-1}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 outline-none"
          role="dialog"
          aria-modal="true"
          aria-label={selectedImage.caption || "תצוגת תמונה מוגדלת"}
        >
          <div className="max-w-5xl max-h-full relative">
            <Button onClick={closeLightbox} aria-label="סגור תמונה"
              className="absolute -top-12 right-0 text-white hover:text-gray-300 bg-transparent hover:bg-white/10 p-2 focus:outline-2 focus:outline-offset-2 focus:outline-white rounded">
              <X className="w-6 h-6" aria-hidden="true" />
            </Button>
            <img src={selectedImage.image_url} alt={selectedImage.caption || `${locationName} — תמונה ${currentGalleryIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg" loading="lazy" />
            {selectedImage.caption && (
              <p className="text-white text-center mt-4 px-4">{selectedImage.caption}</p>
            )}
            {gallery.length > 1 && (
              <div className="flex justify-center gap-4 mt-4">
                <Button onClick={prevImage} disabled={currentGalleryIndex === 0} aria-label="תמונה קודמת"
                  className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 focus:outline-2 focus:outline-offset-2 focus:outline-white">
                  <ChevronRight className="w-5 h-5" aria-hidden="true" />
                </Button>
                <Button onClick={nextImage} disabled={currentGalleryIndex === gallery.length - 1} aria-label="תמונה הבאה"
                  className="bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 focus:outline-2 focus:outline-offset-2 focus:outline-white">
                  <ChevronLeft className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
