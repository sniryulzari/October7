
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Location } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, Route, Play, Navigation, Clock, MapPin, Headphones, BookOpen, Info } from "lucide-react";

export default function Home() {
  const [nearbyLocations, setNearbyLocations] = useState([]);

  useEffect(() => {
    loadNearbyLocations();
  }, []);

  const loadNearbyLocations = async () => {
    try {
      const locations = await Location.list("-created_date");
      const activeLocations = locations.filter(loc => loc.is_active !== false);
      setNearbyLocations(activeLocations.slice(0, 3));
    } catch (error) {
      console.error("Error loading nearby locations:", error);
    }
  };

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      {/* Hero Section */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-[#1E3A5F] rounded-2xl flex items-center justify-center mx-auto shadow-lg mb-6">
                <Route className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl lg:text-6xl font-bold text-[#222222] mb-6">
                צועדים בשביל הזיכרון
              </h1>
              <p className="text-xl lg:text-2xl text-[#555555] max-w-4xl mx-auto leading-relaxed mb-12">
                אפליקציה זו מלווה אותך במסע בין אתרי הטבח בעוטף עזה, ומספרת את סיפורם של המקומות באותו יום נורא – 7 באוקטובר 2023.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={createPageUrl("Map")}>
                  <Button size="lg" className="bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white px-8 py-4 text-lg w-full sm:w-auto shadow-lg">
                    <Map className="w-5 h-5 mr-2" />
                    פתח את המפה
                  </Button>
                </Link>
                <Link to={createPageUrl("Route")}>
                  <Button variant="outline" size="lg" className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#F5F5F5] px-8 py-4 text-lg w-full sm:w-auto">
                    <Route className="w-5 h-5 mr-2" />
                    התחל מסלול מומלץ
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-[#F5F5F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#222222] mb-4">איך זה עובד?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1E3A5F] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-[#222222] mb-2">נווט אל אתר</h3>
              <p className="text-[#555555]">בחר מקום במפה או במסלול המומלץ</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1E3A5F] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-[#222222] mb-2">סרוק את הקוד במקום</h3>
              <p className="text-[#555555]">כדי לוודא שאתה בנקודה המדויקת</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-[#1E3A5F] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-[#222222] mb-2">האזן לסיפור</h3>
              <p className="text-[#555555]">בליווי תמונות וקטעי וידאו</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recommended Route */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-[#F5F5F5] rounded-2xl p-8 lg:p-12">
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#222222] mb-4">מסלול הזיכרון</h2>
                <p className="text-xl text-[#555555] mb-6">
                  צא למסע בעקבות אתרי הזיכרון המרכזיים ברצועת עזה. המסלול המומלץ יוביל אותך דרך הנקודות המשמעותיות ביותר באירועי 7 באוקטובר.
                </p>
                <div className="flex items-center gap-4 text-[#555555] mb-6">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>משך משוער: כ-4 שעות</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{nearbyLocations.length} נקודות</span>
                  </div>
                </div>
                <Link to={createPageUrl("Route")}>
                  <Button size="lg" className="bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white">
                    <Route className="w-5 h-5 mr-2" />
                    הצג מסלול במפה
                  </Button>
                </Link>
              </div>
              
              <div className="lg:w-1/3">
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h3 className="font-semibold text-[#222222] mb-4">נקודות במסלול:</h3>
                  <div className="space-y-3">
                    {nearbyLocations.slice(0, 3).map((location, index) => (
                      <div key={location.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F5F5F5] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-[#1E3A5F]">{index + 1}</span>
                        </div>
                        <span className="text-[#555555]">{location.name}</span>
                      </div>
                    ))}
                    <div className="text-sm text-[#555555] pt-2">ועוד...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nearby Locations */}
      <section className="py-16 bg-[#F5F5F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#222222] mb-4">מקומות קרובים אליך</h2>
            <p className="text-xl text-[#555555]">התחל את המסע שלך מאחד המקומות הקרובים</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {nearbyLocations.map((location, index) => (
              <Card key={location.id} className="overflow-hidden hover:shadow-lg transition-shadow bg-white border-0">
                <div className="aspect-video relative">
                  {location.main_image ? (
                    <img
                      src={location.main_image}
                      alt={location.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center">
                      <MapPin className="w-12 h-12 text-[#555555]" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-sm font-medium text-[#555555]">
                    {Math.floor(Math.random() * 20) + 5} ק"מ
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-[#222222] mb-2">{location.name}</h3>
                  <p className="text-[#555555] mb-4 line-clamp-2">
                    {location.full_story?.title || 'מקום זיכרון משמעותי מאירועי 7 באוקטובר'}
                  </p>
                  
                  <Link to={createPageUrl(`Location?id=${location.id}`)}>
                    <Button className="w-full bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white">
                      <Play className="w-4 h-4 mr-2" />
                      פתח סיפור המקום
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to={createPageUrl("Search")}>
              <Button variant="outline" size="lg" className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#F5F5F5]">
                צפה בכל המקומות
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
