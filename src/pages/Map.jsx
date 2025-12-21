
import React, { useState, useEffect } from "react";
import { Location } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, MapPin, Filter, Eye, RotateCcw, Navigation2, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Global cache for locations to avoid multiple API calls
let mapLocationsCache = null;
let mapCacheTimestamp = null;
const MAP_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const categoryColors = {
  "יישוב": { bg: "bg-red-100", text: "text-red-800", pin: "#DC2626" },
  "בסיס צבאי": { bg: "bg-blue-100", text: "text-blue-800", pin: "#2563EB" },
  "אירוע": { bg: "bg-purple-100", text: "text-purple-800", pin: "#7C3AED" },
  "מקום אחר": { bg: "bg-gray-100", text: "text-gray-800", pin: "#6B7280" }
};

export default function Map() {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadLocations();
    getUserLocation();
  }, []);

  useEffect(() => {
    filterLocations();
  }, [locations, searchTerm, selectedCategories]);

  useEffect(() => {
    if (!map && typeof window !== 'undefined') {
      initMap();
    }
  }, []);

  const loadLocations = async (retry = 0) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check cache first
      if (mapLocationsCache && mapCacheTimestamp && (Date.now() - mapCacheTimestamp < MAP_CACHE_DURATION)) {
        const activeLocations = mapLocationsCache.filter(loc => loc.is_active !== false);
        setLocations(activeLocations);
        setRetryCount(0);
        setIsLoading(false); // Set loading to false when served from cache
        return; 
      }

      // Add delay between retries to prevent rate limiting
      if (retry > 0) {
        await new Promise(resolve => setTimeout(resolve, retry * 2000)); // 2s, 4s
      } else {
        await new Promise(resolve => setTimeout(resolve, 300)); // Initial small delay
      }

      const data = await Location.list("-created_date");
      const activeLocations = data.filter(loc => loc.is_active !== false);
      
      // Update cache
      mapLocationsCache = data;
      mapCacheTimestamp = Date.now();
      
      setLocations(activeLocations);
      setRetryCount(0); // Reset retry count on successful load
    } catch (error) {
      console.error("Error loading locations:", error);
      
      let errorMessage = "שגיאה בטעינת המידע";
      
      if (error.message && error.message.includes('Network Error')) {
        errorMessage = "בעיית חיבור לאינטרנט. בדק/י את החיבור שלך ונסה/י שוב.";
      } else if (error.response?.status === 429) {
        errorMessage = "השרת עמוס מדי כרגע. אנא המתן מעט ונסה/י שוב.";
      } else if (error.response?.status >= 500) {
        errorMessage = "בעיה בשרת. נסה/י שוב בעוד מספר דקות.";
      } else if (error.message) {
        errorMessage = error.message; // Use the specific error message if available and not a common network/server one
      }
      
      setError(errorMessage);
      
      // Auto retry up to 2 times for network errors, 429, or 5xx errors
      if (retry < 2 && ( (error.message && error.message.includes('Network Error')) || error.response?.status === 429 || error.response?.status >= 500)) {
        const delay = Math.pow(2, retry + 2) * 1000; // 4s, 8s
        setTimeout(() => {
          setRetryCount(retry + 1);
          loadLocations(retry + 1);
        }, delay);
      }
    }
    
    setIsLoading(false); // Set loading to false after the try-catch block completes or after retry logic initiated.
  };

  const retryLoad = () => {
    setRetryCount(0); // Reset retry count for manual retry
    loadLocations();
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Could not get user location:", error);
        }
      );
    }
  };

  const filterLocations = () => {
    let filtered = locations;

    if (searchTerm) {
      filtered = filtered.filter(location =>
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.full_story?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (location.search_keywords || []).some(keyword =>
          keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(location =>
        selectedCategories.includes(location.category)
      );
    }

    setFilteredLocations(filtered);
  };

  const initMap = () => {
    // Load Leaflet CSS and JS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      try {
        // שדרות כמרכז המפה - ברירת המחדל
        const mapInstance = window.L.map('interactive-map').setView([31.5244, 34.5951], 12); // שדרות coordinates

        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);

        setMap(mapInstance);
      } catch (error) {
        console.error("Error initializing map:", error);
        // Potentially set a map-specific error state if needed, though less critical for data display
      }
    };
    document.head.appendChild(script);
  };

  const addMarkersToMap = (mapInstance, locationsToShow) => {
    try {
      // Clear existing markers (except user location)
      mapInstance.eachLayer(layer => {
        if (layer instanceof window.L.Marker && !layer.options.isUserLocation) {
          mapInstance.removeLayer(layer);
        }
      });

      locationsToShow.forEach(location => {
        if (location.coordinates) {
          const category = location.category || "מקום אחר";
          const color = categoryColors[category]?.pin || "#6B7280";

          const marker = window.L.marker([location.coordinates.lat, location.coordinates.lng], {
            icon: window.L.divIcon({
              className: 'custom-marker',
              html: `<div style="background-color: ${color}; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          })
          .addTo(mapInstance)
          .bindPopup(`
            <div style="text-align: right; direction: rtl; min-width: 250px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
              <div style="border-bottom: 1px solid #eee; padding-bottom: 8px; margin-bottom: 8px;">
                <h3 style="margin: 0; font-weight: bold; color: #222222; font-size: 18px;">${location.name}</h3>
                <span style="background: ${color}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; display: inline-block; margin-top: 4px;">${category}</span>
              </div>
              ${location.main_image ? `<img src="${location.main_image}" style="width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;" />` : ''}
              <p style="margin: 0 0 12px 0; font-size: 14px; color: #555555; line-height: 1.4;">${location.full_story?.title || 'מקום זיכרון משמעותי מאירועי 7 באוקטובר'}</p>
              <a href="${createPageUrl(`Location?id=${location.id}`)}"
                 style="background: #1E3A5F; color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px; transition: background-color 0.2s;"
                 onmouseover="this.style.backgroundColor='#2C5E9E'"
                 onmouseout="this.style.backgroundColor='#1E3A5F'">
                פרטים מלאים →
              </a>
            </div>
          `);

          marker.on('click', () => {
            setSelectedLocation(location);
            marker.openPopup();
          });
        }
      });

      // Add user location marker if available
      if (userLocation) {
        // Check if user marker already exists before adding, to avoid duplicates on rerenders
        let userMarkerLayer = null;
        mapInstance.eachLayer(layer => {
          if (layer instanceof window.L.Marker && layer.options.isUserLocation) {
            userMarkerLayer = layer;
          }
        });

        if (!userMarkerLayer) {
          const newUserMarker = window.L.marker([userLocation.lat, userLocation.lng], {
            icon: window.L.divIcon({
              className: 'user-location-marker',
              html: `<div style="background-color: #4CAF50; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            }),
            isUserLocation: true
          }).addTo(mapInstance);

          newUserMarker.bindPopup(`
            <div style="text-align: right; direction: rtl;">
              <p style="margin: 0; color: #222222; font-weight: bold;">המיקום שלך</p>
            </div>
          `);
        }
      }
    } catch (error) {
      console.error("Error adding markers to map:", error);
    }
  };

  useEffect(() => {
    if (map) { // Ensure map instance exists
      // Only add markers if locations are loaded and not in error state that clears locations
      if (!error && filteredLocations.length > 0) {
        addMarkersToMap(map, filteredLocations);
        // Fit map bounds to show all markers
        try {
          if (filteredLocations.length > 0) {
            const group = new window.L.featureGroup(
              filteredLocations
                .filter(loc => loc.coordinates)
                .map(loc => window.L.marker([loc.coordinates.lat, loc.coordinates.lng]))
            );
            if (group.getLayers().length > 0) { // Only fit bounds if there are actual markers in the group
              map.fitBounds(group.getBounds().pad(0.1));
            }
          }
        } catch (error) {
          console.error("Error fitting map bounds:", error);
        }
      } else if (!isLoading && !error && filteredLocations.length === 0) {
         // If no locations are found after filtering, clear existing markers (excluding user marker)
         map.eachLayer(layer => {
          if (layer instanceof window.L.Marker && !layer.options.isUserLocation) {
            map.removeLayer(layer);
          }
        });
      }
    }
  }, [map, filteredLocations, error, isLoading]); // Added error and isLoading to dependencies

  const handleCategoryChange = (category, checked) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, category]);
    } else {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategories([]);
  };

  const focusOnLocation = (location) => {
    if (map && location.coordinates) {
      map.setView([location.coordinates.lat, location.coordinates.lng], 15);
      setSelectedLocation(location);
    }
  };

  const centerOnUser = () => {
    if (map && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 13);
    } else {
      getUserLocation();
    }
  };

  const incrementViewCount = async (locationId) => {
    try {
      // Throttle view count updates
      const lastUpdate = localStorage.getItem(`viewUpdate_${locationId}`);
      const now = Date.now();
      
      if (!lastUpdate || now - parseInt(lastUpdate) > 60000) { // 1 minute throttle
        const location = locations.find(l => l.id === locationId);
        if (location) {
          await Location.update(locationId, {
            view_count: (location.view_count || 0) + 1
          });
          localStorage.setItem(`viewUpdate_${locationId}`, now.toString());
          
          // Update local state
          setLocations(prev => 
            prev.map(loc => 
              loc.id === locationId 
                ? { ...loc, view_count: (loc.view_count || 0) + 1 }
                : loc
            )
          );
        }
      }
    } catch (error) {
      // Silently fail - view count is not critical
      console.log("Could not update view count:", error);
    }
  };

  const categories = ["יישוב", "בסיס צבאי", "אירוע", "מקום אחר"];

  return (
    <div className="min-h-screen bg-[#F5F5F5]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-[#1E3A5F] rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#222222]">מפת האתרים</h1>
          </div>
          <p className="text-lg text-[#555555] max-w-2xl mx-auto">
            גלו את האתרים המרכזיים מאירועי 7 באוקטובר באמצעות המפה האינטראקטיבית
          </p>
        </div>

        {/* Error State */}
        {error && locations.length === 0 && ( // Only show global error if no locations loaded
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">שגיאה בטעינת המידע</h3>
                  <p className="text-red-600 text-sm">{error}</p>
                  {retryCount > 0 && retryCount <= 2 && ( // Now max retry is 2
                    <p className="text-red-500 text-xs mt-1">ניסיון {retryCount}/2</p>
                  )}
                </div>
                <Button 
                  onClick={retryLoad}
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  disabled={isLoading} // Disable retry button while loading/retrying
                >
                  נסה שוב
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filters - Only show if we have data or are loading without a critical error */}
        {(!error || locations.length > 0 || isLoading) && (
          <Card className="mb-6 bg-white border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#555555] w-5 h-5" />
                  <Input
                    placeholder="חפש אתר או מיקום..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-12 text-lg py-6 border-[#F5F5F5] focus:border-[#1E3A5F] text-[#222222]"
                  />
                </div>

                {/* Category Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-[#555555]" />
                    <span className="text-sm font-medium text-[#222222]">סינון לפי קטגוריות:</span>
                  </div>

                  {categories.map((category) => (
                    <div key={category} className="flex items-center space-x-2 space-x-reverse">
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => handleCategoryChange(category, checked)}
                        className="border-[#1E3A5F] data-[state=checked]:bg-[#1E3A5F]"
                      />
                      <label
                        htmlFor={category}
                        className="text-sm font-medium text-[#222222] cursor-pointer"
                      >
                        {category}
                      </label>
                    </div>
                  ))}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                    className="text-[#555555] border-[#F5F5F5] hover:bg-[#F5F5F5]"
                  >
                    <RotateCcw className="w-4 h-4 ml-1" />
                    נקה סינונים
                  </Button>
                </div>

                {/* Results count */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#555555]">
                    {isLoading && locations.length === 0 ? "טוען..." : `נמצאו ${filteredLocations.length} אתרים מתוך ${locations.length}`}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={centerOnUser}
                    className="text-[#1E3A5F] border-[#1E3A5F] hover:bg-[#F5F5F5]"
                  >
                    <Navigation2 className="w-4 h-4 ml-1" />
                    מצא אותי
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Interactive Map */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="overflow-hidden bg-white border-0 shadow-sm">
              <div id="interactive-map" className="h-96 lg:h-[700px] w-full bg-[#F5F5F5]"></div>
            </Card>
          </div>

          {/* Sites List */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-[#222222]">
                  רשימת אתרים ({filteredLocations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 lg:max-h-[640px] overflow-y-auto">
                  {isLoading && locations.length === 0 ? ( // Show skeleton only when initially loading with no data
                    <div className="space-y-3 p-4">
                      {Array(5).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-[#F5F5F5] rounded-lg flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-[#F5F5F5] rounded w-3/4"></div>
                              <div className="h-3 bg-[#F5F5F5] rounded w-1/2"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error && locations.length === 0 ? ( // Show error message if fetch failed and no data exists
                    <div className="p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4 opacity-50" />
                      <p className="text-red-600 mb-2">שגיאה בטעינת המידע</p>
                      <p className="text-sm text-red-500">נסה לרענן את הדף או להמתין מעט</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#F5F5F5]">
                      {filteredLocations.map((location) => (
                        <Link
                          key={location.id}
                          to={createPageUrl(`Location?id=${location.id}`)}
                          onClick={() => incrementViewCount(location.id)}
                          className={`block p-4 cursor-pointer hover:bg-[#F5F5F5] transition-colors ${
                            selectedLocation?.id === location.id ? 'bg-[#F5F5F5]' : ''
                          }`}
                        >
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-[#F5F5F5] rounded-lg overflow-hidden flex-shrink-0">
                              {location.main_image ? (
                                <img
                                  src={location.main_image}
                                  alt={location.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <MapPin className="w-6 h-6 text-[#555555]" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-[#222222] text-sm truncate hover:text-[#2C5E9E] transition-colors">
                                {location.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  className={`text-xs ${categoryColors[location.category]?.bg} ${categoryColors[location.category]?.text} border-0`}
                                >
                                  {location.category}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-[#555555] flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  {location.view_count || 0}
                                </span>
                                <span className="text-xs text-[#2C5E9E] hover:text-[#1E3A5F] font-medium">
                                  גלה עוד →
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}

                      {filteredLocations.length === 0 && !isLoading && !error && ( // Show no results only if not loading and no error
                        <div className="p-8 text-center">
                          <MapPin className="w-12 h-12 text-[#555555] mx-auto mb-4 opacity-50" />
                          <p className="text-[#555555] mb-2">לא נמצאו אתרים</p>
                          <p className="text-sm text-[#555555]">נסו לשנות את מונחי החיפוש או הסינון</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
