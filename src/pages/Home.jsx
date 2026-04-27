
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Location } from "@/api/entities";
import { useLanguage } from "@/utils/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Map, Route, Play, Clock, MapPin } from "lucide-react";

const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export default function Home() {
  const { t, locName, locStoryTitle } = useLanguage();
  const [nearbyLocations, setNearbyLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadNearbyLocations();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  const loadNearbyLocations = async () => {
    try {
      const locations = await Location.list("-created_date");
      const activeLocations = locations.filter(loc => loc.is_active !== false && loc.coordinates);
      setNearbyLocations(activeLocations.slice(0, 3));
    } catch (error) {
      console.error("Error loading nearby locations:", error);
    }
  };

  const getSortedLocations = () => {
    if (!userLocation) return nearbyLocations;
    return [...nearbyLocations].sort((a, b) => {
      const dA = calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng);
      const dB = calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng);
      return dA - dB;
    });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-[#0C1C2E] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-44">
          <div className="text-center space-y-8">
            <p className="text-xs font-semibold tracking-[0.35em] text-white/40 uppercase">
              7.10.2023
            </p>

            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight">
              {t('home.title')}
            </h1>

            <div className="w-10 h-px bg-white/25 mx-auto" />

            <p className="text-lg lg:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
              {t('home.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to={createPageUrl("Map")}>
                <Button size="lg" className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-4 text-lg w-full sm:w-auto font-semibold shadow-none">
                  <Map className="w-5 h-5 mr-2" />
                  {t('home.openMap')}
                </Button>
              </Link>
              <Link to={createPageUrl("Route")}>
                <Button variant="outline" size="lg" className="border-white/70 bg-white/10 text-white hover:bg-white/20 hover:border-white px-8 py-4 text-lg w-full sm:w-auto font-semibold">
                  <Route className="w-5 h-5 mr-2" />
                  {t('home.startRoute')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-[#F2F2F2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-[#1D4E8F]/40 mb-4">01</p>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{t('home.step1Title')}</h3>
              <p className="text-[#6B7280] leading-relaxed">{t('home.step1Desc')}</p>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-[#1D4E8F]/40 mb-4">02</p>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{t('home.step2Title')}</h3>
              <p className="text-[#6B7280] leading-relaxed">{t('home.step2Desc')}</p>
            </div>

            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-[#1D4E8F]/40 mb-4">03</p>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{t('home.step3Title')}</h3>
              <p className="text-[#6B7280] leading-relaxed">{t('home.step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Route */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F2F2F2] rounded-2xl p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">{t('home.memorialRouteTitle')}</h2>
                <p className="text-xl text-[#6B7280] mb-6">{t('home.memorialRouteDesc')}</p>
                <div className="flex items-center gap-4 text-[#6B7280] mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{t('home.duration')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{nearbyLocations.length} {t('home.routePoints')}</span>
                  </div>
                </div>
                <Link to={createPageUrl("Route")}>
                  <Button size="lg" className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white">
                    <Route className="w-5 h-5 mr-2" />
                    {t('home.showOnMap')}
                  </Button>
                </Link>
              </div>

              <div className="lg:w-1/3">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="font-semibold text-[#1A1A1A] mb-4">{t('home.routeStops')}</h3>
                  <div className="space-y-3">
                    {nearbyLocations.slice(0, 3).map((location, index) => (
                      <div key={location.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F2F2F2] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-[#1D4E8F]">{index + 1}</span>
                        </div>
                        <span className="text-[#6B7280]">{locName(location)}</span>
                      </div>
                    ))}
                    <div className="text-sm text-[#6B7280] pt-2">{t('home.andMore')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Locations */}
      <section className="py-16 bg-[#F2F2F2]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              {userLocation ? t('home.nearbyTitle') : t('home.recommendedTitle')}
            </h2>
            <p className="text-xl text-[#6B7280]">{t('home.nearbySubtitle')}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {getSortedLocations().map((location) => {
              const distanceKm = userLocation
                ? Math.round(calculateDistance(userLocation.lat, userLocation.lng, location.coordinates.lat, location.coordinates.lng))
                : null;
              return (
              <Card key={location.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-white border-0">
                <div className="aspect-video relative">
                  {location.main_image ? (
                    <img
                      src={location.main_image}
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F2F2F2] flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-[#6B7280]" />
                    </div>
                  )}
                  {distanceKm !== null && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium text-[#6B7280]">
                      {distanceKm} ק"מ
                    </div>
                  )}
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">{locName(location)}</h3>
                  <p className="text-[#6B7280] text-base mb-4 line-clamp-2">
                    {locStoryTitle(location) || t('home.defaultStory')}
                  </p>

                  <Link to={createPageUrl(`Location?id=${location.id}`)}>
                    <Button className="w-full bg-[#1D4E8F] hover:bg-[#2560B0] text-white">
                      <Play className="w-4 h-4 mr-2" />
                      {t('home.openStory')}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
              );
            })}
          </div>
          
          <div className="text-center mt-8">
            <Link to={createPageUrl("Search")}>
              <Button variant="outline" size="lg" className="border-[#1D4E8F] text-[#1D4E8F] hover:bg-[#F2F2F2]">
                {t('home.viewAll')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
