import React, { useState, useEffect } from "react";
import { Location } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, MapPin, Clock, Play, Navigation, Car, AlertTriangle, Info, X, MapIcon, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// Global cache for route locations
let routeLocationsCache = null;
let routeCacheTimestamp = null;
const ROUTE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Throttled view count update queue  
const routeViewCountQueue = new Set();

export default function RoutePage() {
  const [allLocations, setAllLocations] = useState([]);
  const [routeLocations, setRouteLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    loadAllLocations();
    loadSavedRoute();
    initializeWithSderotAsDefault();
  }, []);

  useEffect(() => {
    if (!map && typeof window !== 'undefined' && !isLoading) {
      initRouteMap();
    }
  }, [isLoading]);

  useEffect(() => {
    if (map && routeLocations.length > 0) {
      addRouteToMap(map, routeLocations);
    } else if (map && allLocations.length > 0 && routeLocations.length === 0) {
      showDefaultMap();
    }
  }, [map, routeLocations, allLocations, userLocation, locationPermission]);

  useEffect(() => {
    if (userLocation && allLocations.length > 0 && routeLocations.length === 0) {
      generateOptimalRoute();
    }
  }, [userLocation, allLocations]);

  // Initialize with Sderot as default location for route planning
  const initializeWithSderotAsDefault = () => {
    const sderotLocation = { lat: 31.5244, lng: 34.5951 }; // Sderot coordinates
    setUserLocation(sderotLocation);
    setLocationPermission('denied'); // Default to denied until user explicitly shares location
  };

  // Save route to localStorage
  const saveRoute = (route, userLoc, permission) => {
    const routeData = {
      locations: route,
      userLocation: userLoc,
      permission: permission,
      timestamp: Date.now()
    };
    localStorage.setItem('savedRoute', JSON.stringify(routeData));
  };

  // Load saved route from localStorage
  const loadSavedRoute = () => {
    try {
      const saved = localStorage.getItem('savedRoute');
      if (saved) {
        const routeData = JSON.parse(saved);
        // Check if saved route is not too old (24 hours)
        if (Date.now() - routeData.timestamp < 24 * 60 * 60 * 1000) {
          setRouteLocations(routeData.locations || []);
          if (routeData.userLocation) {
            setUserLocation(routeData.userLocation);
          }
          setLocationPermission(routeData.permission || 'denied');
        } else {
          localStorage.removeItem('savedRoute');
        }
      }
    } catch (error) {
      console.log("Could not load saved route:", error);
    }
  };

  const loadAllLocations = async () => {
    setIsLoading(true);
    try {
      // Check cache first
      if (routeLocationsCache && routeCacheTimestamp && (Date.now() - routeCacheTimestamp < ROUTE_CACHE_DURATION)) {
        const activeLocations = routeLocationsCache.filter(loc => loc.is_active !== false && loc.coordinates);
        setAllLocations(activeLocations);
        setIsLoading(false);
        return;
      }

      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const locations = await Location.list("-created_date");
      const activeLocations = locations.filter(loc => loc.is_active !== false && loc.coordinates);
      
      // Update cache
      routeLocationsCache = locations;
      routeCacheTimestamp = Date.now();
      
      setAllLocations(activeLocations);
    } catch (error) {
      console.error("Error loading locations:", error);
      // Don't retry immediately to avoid rate limiting
      if (error.response?.status === 429) {
        setTimeout(() => {
          if (allLocations.length === 0) { // Only retry if locations haven't been loaded yet
            loadAllLocations();
          }
        }, 5000); // Wait 5 seconds before retry
      } else {
        // For other errors, still try to retry after a delay, but not too aggressively
        setTimeout(() => {
            if (allLocations.length === 0) {
                loadAllLocations();
            }
        }, 2000);
      }
    }
    setIsLoading(false);
  };

  const getUserLocation = () => {
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          setLocationPermission('granted');
          setIsLoadingLocation(false);
          
          // Generate route immediately after getting user location
          if (allLocations.length > 0) {
            const optimizedRoute = generateOptimalRouteForLocation(newLocation, 'granted');
            setRouteLocations(optimizedRoute);
            saveRoute(optimizedRoute, newLocation, 'granted');
          }
        },
        (error) => {
          console.log("Location access denied or failed:", error.message);
          setLocationPermission('denied');
          setIsLoadingLocation(false);
          
          // Keep Sderot as default location
          const sderotLocation = { lat: 31.5244, lng: 34.5951 }; // Sderot coordinates
          setUserLocation(sderotLocation);
          
          // Generate route from Sderot
          if (allLocations.length > 0) {
            const optimizedRoute = createLogicalRoute(allLocations, sderotLocation);
            setRouteLocations(optimizedRoute);
            saveRoute(optimizedRoute, sderotLocation, 'denied');
          }
        }
      );
    } else {
      setLocationPermission('denied');
      setIsLoadingLocation(false);
      // Keep Sderot as default
      const sderotLocation = { lat: 31.5244, lng: 34.5951 };
      setUserLocation(sderotLocation);
      
      if (allLocations.length > 0) {
        const optimizedRoute = createLogicalRoute(allLocations, sderotLocation);
        setRouteLocations(optimizedRoute);
        saveRoute(optimizedRoute, sderotLocation, 'denied');
      }
    }
  };

  const requestLocationPermission = () => {
    getUserLocation();
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check if user is in Gaza envelope area
  const isInGazaEnvelope = (userLat, userLng) => {
    const gazaEnvelopeBounds = {
      north: 31.6,
      south: 31.2,
      east: 34.7,
      west: 34.2
    };
    
    return userLat >= gazaEnvelopeBounds.south &&
           userLat <= gazaEnvelopeBounds.north &&
           userLng >= gazaEnvelopeBounds.west &&
           userLng <= gazaEnvelopeBounds.east;
  };

  const generateOptimalRouteForLocation = (location, permissionStatus) => {
    if (!location || allLocations.length === 0) return [];

    const userInGaza = isInGazaEnvelope(location.lat, location.lng);

    if (userInGaza && permissionStatus === 'granted') {
      // User is in Gaza envelope and gave permission - sort by proximity only
      return [...allLocations].sort((a, b) => {
        const distanceA = calculateDistance(location.lat, location.lng, a.coordinates.lat, a.coordinates.lng);
        const distanceB = calculateDistance(location.lat, location.lng, b.coordinates.lat, b.coordinates.lng);
        return distanceA - distanceB;
      });
    } else {
      // User is outside Gaza envelope OR denied location - create logical route
      return createLogicalRoute(allLocations, location);
    }
  };

  const generateOptimalRoute = () => {
    if (!userLocation || allLocations.length === 0) return;

    const optimizedRoute = generateOptimalRouteForLocation(userLocation, locationPermission);
    setRouteLocations(optimizedRoute);
    saveRoute(optimizedRoute, userLocation, locationPermission);
  };

  const createLogicalRoute = (locations, startPoint) => {
    if (locations.length === 0) return [];

    // First, try to find "תחנת המשטרה בשדרות" as the starting point
    let startLocation = locations.find(loc => 
      loc.name && loc.name.includes("תחנת המשטרה") && loc.name.includes("שדרות")
    );

    // If not found, try variations
    if (!startLocation) {
      startLocation = locations.find(loc => 
        loc.name && (loc.name.includes("תחנת משטרה") || 
        (loc.name.includes("שדרות") && loc.name.includes("משטרה")))
      );
    }

    // If still not found, find the northernmost location
    if (!startLocation && locations.length > 0) {
      startLocation = locations.reduce((northernmost, current) => {
        if (!northernmost.coordinates && current.coordinates) return current;
        if (!current.coordinates && northernmost.coordinates) return northernmost;
        if (!northernmost.coordinates && !current.coordinates) return northernmost;
        
        return current.coordinates.lat > northernmost.coordinates.lat ? current : northernmost;
      }, locations[0]);
    }

    // If we still don't have a start location, fall back to closest to start point
    if (!startLocation && locations.length > 0) {
      let closestDistance = Infinity;
      locations.forEach(location => {
        if (!location.coordinates) return;
        const distance = calculateDistance(
          startPoint.lat, 
          startPoint.lng,
          location.coordinates.lat,
          location.coordinates.lng
        );
        if (distance < closestDistance) {
          closestDistance = distance;
          startLocation = location;
        }
      });
    }

    if (!startLocation) return [];

    const route = [startLocation];
    const remainingLocations = locations.filter(loc => loc.id !== startLocation.id);
    
    // Continue building route from the start location
    let currentPoint = startLocation.coordinates;
    
    while (remainingLocations.length > 0) {
      let nextClosest = null;
      let nextDistance = Infinity;

      // Find the closest remaining location to current point
      remainingLocations.forEach(location => {
        if (!location.coordinates) return;
        const distance = calculateDistance(
          currentPoint.lat,
          currentPoint.lng,
          location.coordinates.lat,
          location.coordinates.lng
        );
        
        if (distance < nextDistance) {
          nextDistance = distance;
          nextClosest = location;
        }
      });

      if (nextClosest) {
        route.push(nextClosest);
        currentPoint = nextClosest.coordinates;
        const index = remainingLocations.findIndex(loc => loc.id === nextClosest.id);
        remainingLocations.splice(index, 1);
      } else {
        break;
      }
    }

    return route;
  };

  // Function to get recommended time per location based on category and content
  const getRecommendedTime = (location) => {
    // Base time by category - more specific and dynamic
    let baseTime = 30; // Default 30 minutes
    
    // Enhanced category-based timing
    switch (location.category) {
      case 'יישוב':
        baseTime = 30; // Villages - moderate time
        break;
      case 'בסיס צבאי':
        baseTime = 45; // Military bases - more time
        break;
      case 'אירוע':
        // Special case for Nova Festival and other events
        if (location.name && (location.name.includes('נובה') || location.name.includes('Nova') || location.name.includes('פסטיבל'))) {
          baseTime = 90; // Nova festival - much longer visit
        } else {
          baseTime = 60; // Other events - longer visits
        }
        break;
      default:
        baseTime = 30;
    }
    
    // Add time based on content richness
    if (location.videos && location.videos.length > 0) {
      baseTime += Math.min(location.videos.length * 8, 25); // 8 minutes per video, max 25 minutes
    }
    
    if (location.gallery && location.gallery.length > 3) {
      baseTime += Math.min((location.gallery.length - 3) * 2, 15); // 2 minutes per additional photo, max 15 minutes
    }
    
    if (location.audio_file) {
      baseTime += 15; // Extra time for audio content
    }
    
    // Bonus time for locations with rich full_story content
    if (location.full_story && location.full_story.content && location.full_story.content.length > 500) {
      baseTime += 10; // Extra time for detailed stories
    }
    
    // Special locations get more time
    const specialKeywords = ['מטכ"ל', 'מפקדה', 'מרכז', 'עיקרי'];
    if (location.name && specialKeywords.some(keyword => location.name.includes(keyword))) {
      baseTime += 15;
    }
    
    // Cap at reasonable limits
    return Math.max(20, Math.min(baseTime, 120)); // Minimum 20 minutes, maximum 2 hours
  };

  const removeFromRoute = (locationId) => {
    const updatedRoute = routeLocations.filter(loc => loc.id !== locationId);
    setRouteLocations(updatedRoute);
    saveRoute(updatedRoute, userLocation, locationPermission);
  };

  const initRouteMap = () => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      // Center on Sderot by default
      const mapInstance = window.L.map('route-map').setView([31.5244, 34.5951], 11);
      
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);

      setMap(mapInstance);
    };
    document.head.appendChild(script);
  };

  const showDefaultMap = () => {
    if (!map || allLocations.length === 0) return;

    // Clear existing layers (route lines, numbered markers, user marker)
    map.eachLayer(layer => {
      if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline) {
        map.removeLayer(layer);
      }
    });

    // Add all locations as markers
    allLocations.forEach((location) => {
      const marker = window.L.marker([location.coordinates.lat, location.coordinates.lng], {
        icon: window.L.divIcon({
          className: 'default-marker',
          html: `<div style="background-color: #666; color: white; width: 25px; height: 25px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">?</div>`,
          iconSize: [25, 25],
          iconAnchor: [12, 12]
        })
      })
      .addTo(map)
      .bindPopup(`
        <div style="text-align: right; direction: rtl; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #222222;">${location.name}</h3>
          ${location.main_image ? `<img src="${location.main_image}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />` : ''}
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #555555;">${location.full_story?.title || 'מקום זיכרון משמעותי'}</p>
          <a href="${createPageUrl(`Location?id=${location.id}`)}" 
             style="background: #1E3A5F; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 12px;">
            למידע נוסף
          </a>
        </div>
      `);
    });

    // Fit map to show all locations
    if (allLocations.length > 0) {
      const group = new window.L.featureGroup(
        allLocations.map(loc => window.L.marker([loc.coordinates.lat, loc.coordinates.lng]))
      );
      map.fitBounds(group.getBounds().pad(0.1));
    }
  };

  const addRouteToMap = (mapInstance, locations) => {
    if (!mapInstance || locations.length === 0) return;

    // Clear existing layers
    mapInstance.eachLayer(layer => {
      if (layer instanceof window.L.Marker || layer instanceof window.L.Polyline) {
        mapInstance.removeLayer(layer);
      }
    });

    // Add user location marker if available and permission granted
    if (userLocation && locationPermission === 'granted') {
      window.L.marker([userLocation.lat, userLocation.lng], {
        icon: window.L.divIcon({
          className: 'user-marker',
          html: `<div style="background-color: #4CAF50; color: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">אני</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(mapInstance).bindPopup('המיקום שלך');
    } else if (userLocation && locationPermission === 'denied') {
      // Show Sderot as starting point when location is denied
      window.L.marker([userLocation.lat, userLocation.lng], {
        icon: window.L.divIcon({
          className: 'start-marker',
          html: `<div style="background-color: #FF9800; color: white; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 10px;">התחלה</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        })
      }).addTo(mapInstance).bindPopup('נקודת התחלה: שדרות');
    }

    // Create route line
    const routeCoordinates = locations.map(loc => [loc.coordinates.lat, loc.coordinates.lng]);
    
    if (userLocation && locationPermission === 'granted') { // Only add user location to route line if permission granted
      routeCoordinates.unshift([userLocation.lat, userLocation.lng]);
    } else if (userLocation && locationPermission === 'denied') { // Add Sderot if permission denied
      routeCoordinates.unshift([userLocation.lat, userLocation.lng]);
    }
    
    const routeLine = window.L.polyline(routeCoordinates, {
      color: '#1E3A5F',
      weight: 4,
      opacity: 0.8
    }).addTo(mapInstance);

    // Add numbered markers for locations
    locations.forEach((location, index) => {
      const marker = window.L.marker([location.coordinates.lat, location.coordinates.lng], {
        icon: window.L.divIcon({
          className: 'route-marker',
          html: `<div style="background-color: #1E3A5F; color: white; width: 30px; height: 30px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px;">${index + 1}</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      })
      .addTo(mapInstance)
      .bindPopup(`
        <div style="text-align: right; direction: rtl; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #222222;">תחנה ${index + 1}: ${location.name}</h3>
          ${location.main_image ? `<img src="${location.main_image}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 6px; margin-bottom: 8px;" />` : ''}
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #555555;">${location.full_story?.title || 'מקום זיכרון משמעותי'}</p>
          <a href="${createPageUrl(`Location?id=${location.id}`)}" 
             style="background: #1E3A5F; color: white; padding: 6px 12px; text-decoration: none; border-radius: 4px; display: inline-block; font-size: 12px;">
            למידע נוסף
          </a>
        </div>
      `);
    });

    // Fit map to show entire route
    if (routeLine) {
      mapInstance.fitBounds(routeLine.getBounds().pad(0.1));
    }
  };

  const scrollToMap = () => {
    document.getElementById('route-map-section')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const startNavigation = () => {
    if (routeLocations.length > 0 && routeLocations[0].coordinates) {
      const firstLocation = routeLocations[0];
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${firstLocation.coordinates.lat},${firstLocation.coordinates.lng}&travelmode=driving`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  // Throttled view count update
  const incrementViewCount = async (locationId) => {
    if (routeViewCountQueue.has(locationId)) return;
    
    try {
      routeViewCountQueue.add(locationId);
      const lastUpdate = localStorage.getItem(`routeViewUpdate_${locationId}`);
      const now = Date.now();
      
      if (!lastUpdate || now - parseInt(lastUpdate, 10) > 60000) { // Update only if no previous update or if more than 1 minute has passed
        const location = allLocations.find(l => l.id === locationId);
        if (location) {
          await Location.update(locationId, {
            view_count: (location.view_count || 0) + 1
          });
          localStorage.setItem(`routeViewUpdate_${locationId}`, now.toString());
        }
      }
    } catch (error) {
      console.error("Error updating view count:", error);
    } finally {
      routeViewCountQueue.delete(locationId);
    }
  };

  // Calculate totals with dynamic time
  const totalDuration = routeLocations.reduce((total, location) => {
    return total + getRecommendedTime(location);
  }, 0);
  
  const totalDistance = userLocation && routeLocations.length > 0 ? 
    routeLocations.reduce((total, location, index) => {
      if (index === 0 && userLocation) {
        return total + calculateDistance(userLocation.lat, userLocation.lng, location.coordinates.lat, location.coordinates.lng);
      } else if (index > 0) {
        return total + calculateDistance(
          routeLocations[index - 1].coordinates.lat,
          routeLocations[index - 1].coordinates.lng,
          location.coordinates.lat,
          location.coordinates.lng
        );
      }
      return total;
    }, 0) : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#1E3A5F]" />
          <p className="text-[#555555]">טוען מקומות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]" dir="rtl">
      {/* Header */}
      <section className="bg-white border-b border-[#F5F5F5]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-[#1E3A5F] rounded-2xl flex items-center justify-center">
                <Route className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-[#222222]">מסלול מומלץ</h1>
            </div>
            
            {locationPermission === 'prompt' ? (
              <div className="bg-[#F5F5F5] rounded-lg p-6 mb-8">
                <MapIcon className="w-12 h-12 text-[#555555] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#222222] mb-2">שתף את המיקום שלך</h3>
                <p className="text-[#555555] mb-4">
                  כדי ליצור מסלול מותאם אישית, נצטרך לגשת למיקום שלך ולהציע את המסלול הטוב ביותר עבורך
                </p>
                <div className="space-y-3">
                  <Button 
                    onClick={requestLocationPermission}
                    disabled={isLoadingLocation}
                    className="bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white w-full sm:w-auto"
                  >
                    {isLoadingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        מאתר מיקום...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4 mr-2" />
                        שתף מיקום
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-[#555555]">
                    או שנתחיל עם מסלול כללי משדרות
                  </p>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xl text-[#555555] max-w-3xl mx-auto mb-8 leading-relaxed">
                  {userLocation && isInGazaEnvelope(userLocation.lat, userLocation.lng) && locationPermission === 'granted'
                    ? "זוהה שאתם נמצאים באזור עוטף עזה. המסלול מותאם למיקום שלכם."
                    : "המסלול נבנה בצורה אופטימלית החל משדרות עם סדר ביקור הגיוני בין האתרים."
                  }
                </p>
                
                {routeLocations.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-[#555555] mb-8">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>משך משוער: {Math.ceil(totalDuration / 60)} שעות</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      <span>{routeLocations.length} תחנות</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Car className="w-5 h-5" />
                      <span>מרחק כולל: ~{Math.round(totalDistance)} ק"מ</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={scrollToMap}
                    className="bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white px-6 py-3"
                  >
                    {routeLocations.length > 0 ? 'התחל את המסלול' : 'צפה במפה'}
                  </Button>
                  
                  {locationPermission === 'denied' && (
                    <Button 
                      onClick={requestLocationPermission}
                      variant="outline"
                      disabled={isLoadingLocation}
                      className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#F5F5F5] px-6 py-3"
                    >
                      {isLoadingLocation ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          מאתר...
                        </>
                      ) : (
                        <>
                          <MapIcon className="w-4 h-4 mr-2" />
                          התאם למיקום שלי
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Route Map - Always show */}
      <section id="route-map-section" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-[#222222]">
              {routeLocations.length > 0 ? 'מפת המסלול' : 'מפת המקומות'}
            </h2>
            <p className="text-[#555555]">
              {routeLocations.length > 0 
                ? 'לחצו על התחנות במפה לקבלת מידע נוסף'
                : locationPermission === 'denied' 
                  ? 'המסלול מתחיל בשדרות ומותאם לסדר מסלול הגיוני'
                  : 'שתפו את המיקום שלכם כדי לקבל מסלול מותאם אישית'
              }
            </p>
          </div>
          
          <Card className="overflow-hidden bg-white border-0 shadow-lg">
            <div id="route-map" className="h-96 sm:h-[500px] w-full bg-[#F5F5F5]"></div>
          </Card>
        </div>
      </section>

      {/* Route Stations - Only show if route exists */}
      {routeLocations.length > 0 && (
        <section className="py-16 bg-[#F5F5F5]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-[#222222]">תחנות המסלול</h2>
              {locationPermission === 'denied' && (
                <Button 
                  onClick={requestLocationPermission}
                  variant="outline"
                  size="sm"
                  disabled={isLoadingLocation}
                  className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#F5F5F5]"
                >
                  {isLoadingLocation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      מאתר...
                    </>
                  ) : (
                    <>
                      <MapIcon className="w-4 h-4 mr-2" />
                      התאם למיקום שלי
                    </>
                  )}
                </Button>
              )}
            </div>
            
            <div className="space-y-4 lg:space-y-6">
              {routeLocations.map((location, index) => {
                const distanceFromPrevious = index === 0 && userLocation ? 
                  calculateDistance(userLocation.lat, userLocation.lng, location.coordinates.lat, location.coordinates.lng) :
                  index > 0 ? calculateDistance(
                    routeLocations[index - 1].coordinates.lat,
                    routeLocations[index - 1].coordinates.lng,
                    location.coordinates.lat,
                    location.coordinates.lng
                  ) : 0;
                
                const duration = Math.ceil(distanceFromPrevious / 50 * 60); // Assuming 50 km/h average
                const recommendedTime = getRecommendedTime(location);
                
                return (
                  <Card key={location.id} className="bg-white hover:shadow-lg transition-shadow border-0 overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col lg:flex-row">
                        {/* Station Number and Info */}
                        <div className="p-4 sm:p-6 flex gap-3 sm:gap-4 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#1E3A5F] rounded-full flex items-center justify-center">
                              <span className="text-white font-bold text-sm sm:text-lg">{index + 1}</span>
                            </div>
                            {index < routeLocations.length - 1 && (
                              <div className="w-0.5 h-12 sm:h-16 bg-[#F5F5F5] mx-auto mt-4"></div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col lg:flex-row lg:items-start gap-3 sm:gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <Link 
                                    to={createPageUrl(`Location?id=${location.id}`)}
                                    onClick={() => incrementViewCount(location.id)}
                                    className="hover:text-[#2C5E9E] transition-colors flex-1"
                                  >
                                    <h3 className="text-lg sm:text-xl font-semibold text-[#222222] break-words">{location.name}</h3>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFromRoute(location.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 mr-2"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                <p className="text-[#555555] mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base break-words">
                                  {location.full_story?.title || 'אתר זיכרון משמעותי מאירועי 7 באוקטובר 2023'}
                                </p>
                                
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#555555] mb-3 sm:mb-4">
                                  {distanceFromPrevious > 0 && (
                                    <>
                                      <span className="break-words">מרחק מהתחנה הקודמת: {Math.round(distanceFromPrevious)} ק"מ</span>
                                      <span className="hidden sm:inline">•</span>
                                      <span className="break-words">זמן נסיעה: {duration} דקות</span>
                                      <span className="hidden sm:inline">•</span>
                                    </>
                                  )}
                                  <span className="break-words font-medium text-[#1E3A5F]">זמן מומלץ באתר: {recommendedTime} דקות</span>
                                  <Badge className="bg-[#F5F5F5] text-[#1E3A5F] border-[#1E3A5F] text-xs">
                                    {location.category}
                                  </Badge>
                                </div>
                              </div>
                              
                              {/* Location Image - Clickable */}
                              <div className="w-full lg:w-40 xl:w-48 flex-shrink-0">
                                <Link 
                                  to={createPageUrl(`Location?id=${location.id}`)}
                                  onClick={() => incrementViewCount(location.id)}
                                >
                                  <div className="aspect-video rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 hover:border-[#1E3A5F]">
                                    {location.main_image ? (
                                      <img
                                        src={location.main_image}
                                        alt={location.name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-[#F5F5F5] flex items-center justify-center">
                                        <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-[#555555]" />
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4">
                              <Link to={createPageUrl(`Location?id=${location.id}`)}>
                                <Button className="bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white w-full sm:w-auto text-sm">
                                  <Info className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                  למידע נוסף
                                </Button>
                              </Link>
                              {location.coordinates && (
                                <Button 
                                  variant="outline" 
                                  className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#F5F5F5] w-full sm:w-auto text-sm"
                                  onClick={() => {
                                    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}&travelmode=driving`;
                                    window.open(googleMapsUrl, '_blank');
                                  }}
                                >
                                  <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                  נווט למקום
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Important Notes */}
      <section className="py-12 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#222222]">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                הערות חשובות למטיילים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-[#555555]">
                <p>• <strong>שעות פעילות:</strong> מומלץ לבקר בשעות היום בלבד (06:00-18:00)</p>
                <p>• <strong>ביטחון:</strong> יש להישאר בשטחים המותרים ולציית להנחיות הביטחון המקומיות</p>
                <p>• <strong>מים ושירותים:</strong> המלצה להביא מים ולתכנן הפסקות בישובים עם שירותים</p>
                <p>• <strong>טלפון חירום:</strong> 100 משטרה, 101 מד"א, 102 כיבוי אש</p>
                <p>• <strong>מזג אויר:</strong> בדקו תחזית מזג האוויר לפני היציאה</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Fixed Navigation Button - Only show if route exists */}
      {routeLocations.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-6 z-50">
          <Button 
            onClick={startNavigation}
            className="bg-[#1E3A5F] hover:bg-[#2C5E9E] text-white shadow-lg px-6 py-3 rounded-full"
          >
            <Navigation className="w-5 h-5 mr-2" />
            התחל ניווט
          </Button>
        </div>
      )}
    </div>
  );
}