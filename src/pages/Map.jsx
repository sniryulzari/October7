
import { useState, useEffect, useRef } from "react";
import { Location } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, MapPin, X, Headphones, Navigation2, AlertCircle, ArrowUpDown } from "lucide-react";
import { createPageUrl } from "@/utils";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const categoryConfig = {
  "יישוב":     { color: "#DC2626" },
  "מיגונית":  { color: "#D97706" },
  "אירוע":     { color: "#7C3AED" },
  "מקום אחר": { color: "#6B7280" },
};
const categories = Object.keys(categoryConfig);

let locationsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtDist(km) {
  return km < 1 ? `${Math.round(km * 1000)} מ'` : `${km.toFixed(1)} ק"מ`;
}

function markerSvg(color) {
  return `<svg width="36" height="48" viewBox="0 0 36 48" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 0C8 0 0 8 0 18C0 32 18 48 18 48S36 32 36 18C36 8 28 0 18 0Z"
          fill="${color}" stroke="white" stroke-width="2.5"/>
    <circle cx="18" cy="18" r="7" fill="white" opacity="0.95"/>
  </svg>`;
}

function makeInfoContent(location, color, category, dist) {
  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}`;
  const detailUrl = createPageUrl(`Location?id=${location.id}`);
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 280px; min-width: 220px;">
      ${location.main_image ? `
        <div style="margin: -8px -8px 10px; overflow: hidden; height: 130px; border-radius: 8px 8px 0 0;">
          <img src="${location.main_image}" alt="${location.name}" style="width:100%;height:130px;object-fit:cover;" />
        </div>` : ''}
      <h3 style="margin:0 0 6px;font-size:17px;font-weight:700;color:#1A1A1A;">${location.name}</h3>
      <span style="background:${color};color:white;padding:2px 10px;border-radius:10px;font-size:12px;">${category}</span>
      ${dist ? `<p style="margin:8px 0 2px;font-size:12px;color:#888;">📍 ${dist} ממיקומך</p>` : ''}
      <p style="margin:10px 0;font-size:13px;color:#5C5750;line-height:1.5;">
        ${location.full_story?.title || 'מקום זיכרון מאירועי 7 באוקטובר 2023'}
      </p>
      <div style="display:flex;gap:8px;margin-top:12px;">
        <a href="${detailUrl}"
           style="flex:1;background:#1D4E8F;color:white;padding:8px;text-decoration:none;border-radius:6px;font-size:13px;text-align:center;display:block;">
          פרטים מלאים
        </a>
        <a href="${navUrl}" target="_blank" rel="noopener"
           style="background:#f0f4ff;color:#1D4E8F;padding:8px 12px;text-decoration:none;border-radius:6px;font-size:13px;text-align:center;display:block;border:1px solid #c5d5f0;">
          🧭 נווט
        </a>
      </div>
    </div>
  `;
}

export default function Map() {
  const mapDivRef     = useRef(null);
  const mapRef        = useRef(null);
  const popupRef      = useRef(null);  // single shared popup
  const markersRef    = useRef({});
  const userLocationRef   = useRef(null);
  const setSelectedIdRef  = useRef(null);

  const [locations, setLocations]                   = useState([]);
  const [filteredLocations, setFilteredLocations]   = useState([]);
  const [searchTerm, setSearchTerm]                 = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedId, setSelectedId]                 = useState(null);
  const [userLocation, setUserLocation]             = useState(null);
  const [sortByDistance, setSortByDistance]         = useState(false);
  const [isLoading, setIsLoading]                   = useState(true);
  const [error, setError]                           = useState(null);
  const [scriptLoaded, setScriptLoaded]             = useState(false);
  const [mapReady, setMapReady]                     = useState(false);

  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);
  useEffect(() => { setSelectedIdRef.current = setSelectedId; }, []);

  // ── Load MapLibre GL JS ────────────────────────────────────────────────────
  useEffect(() => {
    if (window.maplibregl) { setScriptLoaded(true); return; }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
    document.head.appendChild(link);

    const s = document.createElement('script');
    s.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    s.onload = () => {
      window.maplibregl.setRTLTextPlugin(
        'https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js',
        null,
        true
      );
      setScriptLoaded(true);
    };
    document.head.appendChild(s);
  }, []);

  // ── Initialize map after script loads ─────────────────────────────────────
  useEffect(() => {
    if (!scriptLoaded || !mapDivRef.current || mapRef.current) return;

    const map = new window.maplibregl.Map({
      container: mapDivRef.current,
      style: MAPTILER_KEY
        ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
        : 'https://demotiles.maplibre.org/style.json',
      center: [34.5951, 31.5244], // MapLibre uses [lng, lat]
      zoom: 11,
    });

    map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new window.maplibregl.FullscreenControl(), 'top-right');
    map.addControl(new window.maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    popupRef.current = new window.maplibregl.Popup({
      offset: 25,
      maxWidth: '300px',
      className: 'map-popup-rtl',
    });

    mapRef.current = map;

    map.on('load', () => {
      if (MAPTILER_KEY) {
        // Override all symbol text fields to prefer Hebrew (name:he → name fallback)
        map.getStyle().layers.forEach(layer => {
          if (layer.type === 'symbol') {
            try {
              map.setLayoutProperty(layer.id, 'text-field', [
                'coalesce',
                ['get', 'name:he'],
                ['get', 'name'],
              ]);
            } catch {
              // some layers may not support text-field
            }
          }
        });
      }
      setMapReady(true);
    });
  }, [scriptLoaded]);

  // ── Load data + user location on mount ────────────────────────────────────
  useEffect(() => {
    loadData();
    getUserLocation();
  }, []);

  // ── Filter + sort ──────────────────────────────────────────────────────────
  useEffect(() => {
    let list = [...locations];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.full_story?.title?.toLowerCase().includes(q) ||
        (l.search_keywords || []).some(k => k.toLowerCase().includes(q))
      );
    }
    if (selectedCategories.length > 0) {
      list = list.filter(l => selectedCategories.includes(l.category));
    }
    if (sortByDistance && userLocation) {
      list = [...list].sort((a, b) => {
        if (!a.coordinates) return 1;
        if (!b.coordinates) return -1;
        return haversineKm(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng)
             - haversineKm(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng);
      });
    }
    setFilteredLocations(list);
  }, [locations, searchTerm, selectedCategories, sortByDistance, userLocation]);

  // ── Sync location markers ──────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    // Close shared popup and remove all location markers
    popupRef.current?.remove();
    const userMarker = markersRef.current['__user__'];
    Object.entries(markersRef.current).forEach(([id, m]) => {
      if (id !== '__user__') m.remove();
    });
    markersRef.current = userMarker ? { '__user__': userMarker } : {};

    // Add markers
    const locs = filteredLocations.filter(l => l.coordinates);
    locs.forEach(location => {
      const category = location.category || "מקום אחר";
      const color = categoryConfig[category]?.color || "#6B7280";

      const el = document.createElement('div');
      el.style.cssText = 'display:flex;flex-direction:column;align-items:center;cursor:pointer;';
      el.innerHTML = markerSvg(color) + `<div style="background:${color};color:white;font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px;white-space:nowrap;margin-top:-2px;box-shadow:0 1px 4px rgba(0,0,0,0.4);font-family:Arial,sans-serif;max-width:120px;overflow:hidden;text-overflow:ellipsis;direction:rtl;">${location.name}</div>`;

      el.addEventListener('click', () => {
        setSelectedIdRef.current?.(location.id);
        const ul = userLocationRef.current;
        const dist = ul
          ? fmtDist(haversineKm(ul.lat, ul.lng, location.coordinates.lat, location.coordinates.lng))
          : null;
        popupRef.current
          .setLngLat([location.coordinates.lng, location.coordinates.lat])
          .setHTML(makeInfoContent(location, color, category, dist))
          .addTo(map);
      });

      const marker = new window.maplibregl.Marker({ element: el })
        .setLngLat([location.coordinates.lng, location.coordinates.lat])
        .addTo(map);

      markersRef.current[location.id] = marker;
    });

    // Fit bounds
    if (locs.length > 0) {
      const bounds = new window.maplibregl.LngLatBounds();
      locs.forEach(l => bounds.extend([l.coordinates.lng, l.coordinates.lat]));
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [filteredLocations, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── User location marker ───────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation || !mapReady) return;

    if (markersRef.current['__user__']) {
      markersRef.current['__user__'].setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      const el = document.createElement('div');
      el.style.cssText =
        'width:20px;height:20px;border-radius:50%;background:#22C55E;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);';
      markersRef.current['__user__'] = new window.maplibregl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    }
  }, [userLocation, mapReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ────────────────────────────────────────────────────────────────
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (locationsCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setLocations(locationsCache.filter(l => l.is_active !== false));
        setIsLoading(false);
        return;
      }
      const data = await Location.list("-created_date");
      locationsCache = data;
      cacheTimestamp = Date.now();
      setLocations(data.filter(l => l.is_active !== false));
    } catch {
      setError("שגיאה בטעינת המידע. אנא נסה שוב.");
    }
    setIsLoading(false);
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  };

  const focusOnLocation = (location) => {
    const map = mapRef.current;
    if (!map || !location.coordinates) return;
    map.flyTo({ center: [location.coordinates.lng, location.coordinates.lat], zoom: 15 });
    setSelectedId(location.id);
    const ul = userLocationRef.current;
    const dist = ul
      ? fmtDist(haversineKm(ul.lat, ul.lng, location.coordinates.lat, location.coordinates.lng))
      : null;
    const category = location.category || "מקום אחר";
    const color = categoryConfig[category]?.color || "#6B7280";
    popupRef.current
      .setLngLat([location.coordinates.lng, location.coordinates.lat])
      .setHTML(makeInfoContent(location, color, category, dist))
      .addTo(map);
  };

  const centerOnUser = () => {
    if (mapRef.current && userLocation) {
      mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 14 });
    } else {
      getUserLocation();
    }
  };


  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#EDE9E3]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[#1D4E8F] rounded-xl flex items-center justify-center">
              <MapPin className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A]">מפת המקומות</h1>
          </div>
          <p className="text-base text-[#5C5750]">גלו את המקומות שנפגעו באירועי 7 באוקטובר 2023</p>
        </div>

        {/* Error */}
        {error && locations.length === 0 && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardContent className="p-5 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-red-800">שגיאה בטעינת המידע</p>
                <p className="text-red-600 text-sm">{error}</p>
              </div>
              <Button onClick={loadData} variant="outline" size="sm" className="border-red-300 text-red-700">
                נסה שוב
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search & Filters */}
        <Card className="mb-6 bg-white border-0 shadow-sm">
          <CardContent className="p-4 space-y-3">
            {/* Search row */}
            <div className="flex gap-2 items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5C5750] w-5 h-5" aria-hidden="true" />
                <Input
                  placeholder="חפש מקום..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  aria-label="חיפוש מקום במפה"
                  type="search"
                  className="pr-12 text-base py-5 border-[#EDE9E3] focus:border-[#1D4E8F] text-[#1A1A1A]"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    aria-label="נקה חיפוש"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5C5750] hover:text-[#1A1A1A]"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <Button
                variant="outline" size="icon"
                onClick={centerOnUser}
                title="מצא אותי"
                className="shrink-0 h-11 w-11 text-[#1D4E8F] border-[#1D4E8F] hover:bg-[#EDE9E3]"
              >
                <Navigation2 className="w-5 h-5" />
              </Button>
              {userLocation && (
                <Button
                  variant="outline" size="icon"
                  onClick={() => setSortByDistance(v => !v)}
                  title="מיין לפי מרחק"
                  className={`shrink-0 h-11 w-11 ${sortByDistance
                    ? "bg-[#1D4E8F] text-white border-[#1D4E8F] hover:bg-[#1D4E8F]"
                    : "text-[#1D4E8F] border-[#1D4E8F] hover:bg-[#EDE9E3]"}`}
                >
                  <ArrowUpDown className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Category pills + count */}
            <div className="flex flex-wrap items-center gap-2">
              {categories.map(cat => {
                const active = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    onClick={() =>
                      setSelectedCategories(prev =>
                        active ? prev.filter(c => c !== cat) : [...prev, cat]
                      )
                    }
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-colors border"
                    style={active
                      ? { background: categoryConfig[cat].color, borderColor: categoryConfig[cat].color, color: 'white' }
                      : { background: 'white', borderColor: categoryConfig[cat].color, color: '#444' }
                    }
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: active ? 'white' : categoryConfig[cat].color }} />
                    {cat}
                  </button>
                );
              })}
              <span className="text-sm text-[#5C5750] mr-auto">
                {isLoading ? "טוען..." : `${filteredLocations.length} מקומות`}
              </span>
              {(searchTerm || selectedCategories.length > 0) && (
                <button
                  onClick={() => { setSearchTerm(""); setSelectedCategories([]); }}
                  className="text-xs text-[#5C5750] hover:text-[#1A1A1A] underline"
                >
                  נקה הכל
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="overflow-hidden bg-white border-0 shadow-sm">
              <div ref={mapDivRef} className="h-96 lg:h-[700px] w-full bg-[#EDE9E3]">
                {!mapReady && (
                  <div className="h-full flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-[#1D4E8F] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[#5C5750] text-sm">טוען מפה...</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar list */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="bg-white border-0 shadow-sm">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-base text-[#1A1A1A]">
                  מקומות ({filteredLocations.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 lg:max-h-[648px] overflow-y-auto">
                  {isLoading && locations.length === 0 ? (
                    <div className="space-y-3 p-4">
                      {Array(6).fill(0).map((_, i) => (
                        <div key={i} className="animate-pulse flex gap-3">
                          <div className="w-14 h-14 bg-[#EDE9E3] rounded-lg shrink-0" />
                          <div className="flex-1 space-y-2 pt-1">
                            <div className="h-4 bg-[#EDE9E3] rounded w-3/4" />
                            <div className="h-3 bg-[#EDE9E3] rounded w-1/2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EDE9E3]">
                      {filteredLocations.map(location => {
                        const dist = userLocation && location.coordinates
                          ? fmtDist(haversineKm(userLocation.lat, userLocation.lng, location.coordinates.lat, location.coordinates.lng))
                          : null;
                        const color = categoryConfig[location.category]?.color || "#6B7280";
                        return (
                          <button
                            key={location.id}
                            onClick={() => focusOnLocation(location)}
                            aria-label={`${location.name}${dist ? `, ${dist}` : ''}`}
                            aria-pressed={selectedId === location.id}
                            className={`w-full text-right p-4 cursor-pointer hover:bg-[#F5F3F0] transition-colors border-r-4 ${
                              selectedId === location.id
                                ? 'bg-blue-50 border-[#1D4E8F]'
                                : 'border-transparent'
                            }`}
                          >
                            <div className="flex gap-3">
                              <div className="w-14 h-16 rounded-lg overflow-hidden shrink-0 bg-[#EDE9E3]">
                                {location.main_image ? (
                                  <img src={location.main_image} alt={location.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-[#5C5750]" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-[#1A1A1A] text-sm leading-tight line-clamp-2">
                                  {location.name}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                                  <span className="text-xs text-[#5C5750]">{location.category}</span>
                                  {location.audio_file && (
                                    <Headphones className="w-3 h-3 text-[#1D4E8F] mr-auto" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-1.5">
                                  {dist
                                    ? <span className="text-xs text-[#555E6D]">📍 {dist}</span>
                                    : <span />
                                  }
                                  {selectedId === location.id && (
                                    <a
                                      href={createPageUrl(`Location?id=${location.id}`)}
                                      onClick={e => e.stopPropagation()}
                                      className="text-xs text-[#1D4E8F] font-medium hover:underline"
                                    >
                                      פרטים ←
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}

                      {filteredLocations.length === 0 && !isLoading && (
                        <div className="p-10 text-center">
                          <MapPin className="w-10 h-10 text-[#5C5750] mx-auto mb-3 opacity-40" />
                          <p className="text-[#5C5750] text-sm">לא נמצאו מקומות</p>
                          <p className="text-xs text-[#5C5750] mt-1">נסו לשנות את מונחי החיפוש או הסינון</p>
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
