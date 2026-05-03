import React, { useState, useEffect, useRef } from "react";
import { Location } from "@/api/entities";
import { useLanguage } from "@/utils/language";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Route, MapPin, Clock, Navigation, Navigation2, Car, Info, X, Loader2, CheckCircle2, Circle, Plus, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const SDEROT = { lat: 31.5244, lng: 34.5951 };
const GAZA_ENVELOPE = { north: 31.6, south: 31.2, east: 34.7, west: 34.2 };

let routeLocationsCache = null;
let routeCacheTimestamp = null;
const ROUTE_CACHE_DURATION = 5 * 60 * 1000;

// ── Geo helpers ────────────────────────────────────────────────────────────────

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function inGazaEnvelope(lat, lng) {
  return lat >= GAZA_ENVELOPE.south && lat <= GAZA_ENVELOPE.north &&
         lng >= GAZA_ENVELOPE.west  && lng <= GAZA_ENVELOPE.east;
}

// ── Route algorithms ───────────────────────────────────────────────────────────

function nearestNeighbor(locations, startPoint) {
  if (locations.length === 0) return [];
  const remaining = [...locations];
  let current = startPoint;
  const route = [];
  while (remaining.length > 0) {
    let bestIdx = 0, bestDist = Infinity;
    remaining.forEach((loc, i) => {
      if (!loc.coordinates) return;
      const d = haversine(current.lat, current.lng, loc.coordinates.lat, loc.coordinates.lng);
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    const next = remaining[bestIdx];
    route.push(next);
    current = next.coordinates;
    remaining.splice(bestIdx, 1);
  }
  return route;
}

function twoOpt(route) {
  if (route.length < 4) return route;
  let best = [...route];
  let improved = true;
  while (improved) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 2; j < best.length; j++) {
        const ci = best[i].coordinates, ci1 = best[i + 1].coordinates;
        const cj = best[j].coordinates, cj1 = j + 1 < best.length ? best[j + 1].coordinates : null;
        const before = haversine(ci.lat, ci.lng, ci1.lat, ci1.lng) + (cj1 ? haversine(cj.lat, cj.lng, cj1.lat, cj1.lng) : 0);
        const after  = haversine(ci.lat, ci.lng, cj.lat, cj.lng)   + (cj1 ? haversine(ci1.lat, ci1.lng, cj1.lat, cj1.lng) : 0);
        if (after < before - 0.001) {
          best = [...best.slice(0, i + 1), ...best.slice(i + 1, j + 1).reverse(), ...best.slice(j + 1)];
          improved = true;
        }
      }
    }
  }
  return best;
}

function buildOptimalRoute(locations, startPoint) {
  const valid = locations.filter(l => l.coordinates);
  if (valid.length === 0) return [];
  return twoOpt(nearestNeighbor(valid, startPoint));
}

// ── Route mode selection ───────────────────────────────────────────────────────
//
// 'custom' mode algorithm:
//   1. Essential locations always included (the guaranteed base)
//   2. Remaining budget filled by proximity to the existing route —
//      the location that adds the least extra travel is picked next,
//      regardless of its priority tier (recommended vs extended).
//      A nearby "extended" stop beats a far "recommended" one.
//   3. 2-opt improvement on the final selection.

function selectLocations(locations, mode, hoursBudget, startPoint) {
  const essential    = locations.filter(l => (l.priority || 'recommended') === 'essential');
  const nonEssential = locations.filter(l => (l.priority || 'recommended') !== 'essential');
  const hasEssential = essential.length > 0;

  if (mode === 'essential') {
    return buildOptimalRoute(hasEssential ? essential : locations, startPoint);
  }

  if (mode === 'recommended') {
    const subset = locations.filter(l => (l.priority || 'recommended') !== 'extended');
    return buildOptimalRoute(subset.length > 0 ? subset : locations, startPoint);
  }

  if (mode === 'full') {
    return buildOptimalRoute(locations, startPoint);
  }

  if (mode === 'custom') {
    const budgetMinutes = hoursBudget * 60;
    const base      = [...essential];
    let usedTime    = base.reduce((sum, l) => sum + getRecommendedTime(l), 0);
    const remaining = nonEssential.filter(l => l.coordinates);

    while (remaining.length > 0) {
      let bestIdx = -1, bestDist = Infinity;

      remaining.forEach((loc, i) => {
        if (usedTime + getRecommendedTime(loc) > budgetMinutes) return;
        // Distance to nearest stop already in the route (or start point)
        const minDist = base.length > 0
          ? Math.min(...base.map(b => haversine(b.coordinates.lat, b.coordinates.lng, loc.coordinates.lat, loc.coordinates.lng)))
          : haversine(startPoint.lat, startPoint.lng, loc.coordinates.lat, loc.coordinates.lng);
        if (minDist < bestDist) { bestDist = minDist; bestIdx = i; }
      });

      if (bestIdx === -1) break;
      const next = remaining[bestIdx];
      base.push(next);
      usedTime += getRecommendedTime(next);
      remaining.splice(bestIdx, 1);
    }

    const fallback = hasEssential ? essential : locations.slice(0, Math.min(3, locations.length));
    return buildOptimalRoute(base.length > 0 ? base : fallback, startPoint);
  }

  return buildOptimalRoute(locations, startPoint);
}

// ── Content helpers ────────────────────────────────────────────────────────────

function getRecommendedTime(location) {
  let base = location.category === 'אירוע'
    ? (location.name?.match(/נובה|Nova|פסטיבל/) ? 90 : 60)
    : 30;
  if (location.videos?.length)          base += Math.min(location.videos.length * 8, 25);
  if (location.gallery?.length > 3)     base += Math.min((location.gallery.length - 3) * 2, 15);
  if (location.audio_file)              base += 15;
  if (location.full_story?.content?.length > 500) base += 10;
  return Math.max(20, Math.min(base, 120));
}

function safeText(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function safeImageUrl(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol) ? url : null;
  } catch {
    return null;
  }
}

function makePopupHTML(location, index, recommendedTime) {
  const navUrl    = `https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}&travelmode=driving`;
  const detailUrl = createPageUrl(`Location?id=${location.id}`);
  const imgUrl = safeImageUrl(location.main_image);
  return `
    <div dir="rtl" style="font-family:Arial,sans-serif;max-width:280px;min-width:220px;">
      ${imgUrl ? `
        <div style="margin:-8px -8px 10px;overflow:hidden;height:130px;border-radius:8px 8px 0 0;">
          <img src="${imgUrl}" style="width:100%;height:130px;object-fit:cover;" loading="lazy" />
        </div>` : ''}
      <div style="font-size:12px;color:#888;margin-bottom:4px;">תחנה ${index + 1}</div>
      <h3 style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1A1A1A;">${safeText(location.name)}</h3>
      <p style="margin:0 0 8px;font-size:13px;color:#5C5750;line-height:1.4;">
        ${safeText(location.full_story?.title || 'מקום זיכרון מאירועי 7 באוקטובר 2023')}
      </p>
      <div style="font-size:12px;color:#1D4E8F;margin-bottom:10px;">⏱ זמן מומלץ: ${safeText(String(recommendedTime))} דקות</div>
      <div style="display:flex;gap:8px;">
        <a href="${detailUrl}"
           style="flex:1;background:#1D4E8F;color:white;padding:8px;text-decoration:none;border-radius:6px;font-size:13px;text-align:center;display:block;">
          פרטים מלאים
        </a>
        <a href="${navUrl}" target="_blank" rel="noopener"
           style="background:#f0f4ff;color:#1D4E8F;padding:8px 12px;text-decoration:none;border-radius:6px;font-size:13px;text-align:center;display:block;border:1px solid #c5d5f0;">
          🧭 נווט
        </a>
      </div>
    </div>`;
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function RoutePage() {
  const { t, locName, locStoryTitle, isRTL } = useLanguage();

  const [allLocations, setAllLocations]     = useState([]);
  const [routeLocations, setRouteLocations] = useState([]);
  const [isLoading, setIsLoading]           = useState(true);

  // 'sderot' | 'granted' | 'loading'
  const [locationPermission, setLocationPermission] = useState('sderot');
  const [userLocation, setUserLocation]             = useState(SDEROT);

  // Route mode
  const [routeMode, setRouteMode]     = useState('recommended');
  const [hoursBudget, setHoursBudget] = useState(6);

  // UI
  const [visitedLocations, setVisitedLocations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('visitedLocations') || '[]'); } catch { return []; }
  });
  const [showNotInRoute, setShowNotInRoute] = useState(false);

  // Map
  const mapDivRef  = useRef(null);
  const mapRef     = useRef(null);
  const popupRef   = useRef(null);
  const markersRef = useRef({});
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [mapReady, setMapReady]         = useState(false);

  // ── Load MapLibre ────────────────────────────────────────────────────────────
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
        false
      );
      setScriptLoaded(true);
    };
    document.head.appendChild(s);
  }, []);

  // ── Initialize map ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scriptLoaded || !mapDivRef.current || mapRef.current) return;
    const map = new window.maplibregl.Map({
      container: mapDivRef.current,
      style: MAPTILER_KEY
        ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_KEY}`
        : 'https://demotiles.maplibre.org/style.json',
      center: [SDEROT.lng, SDEROT.lat],
      zoom: 10,
    });
    map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new window.maplibregl.FullscreenControl(), 'top-right');
    map.addControl(new window.maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');
    popupRef.current = new window.maplibregl.Popup({ offset: 25, maxWidth: '300px', className: 'map-popup-rtl' });
    mapRef.current = map;
    map.on('load', () => {
      if (MAPTILER_KEY) {
        map.getStyle().layers.forEach(layer => {
          if (layer.type === 'symbol') {
            try { map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:he'], ['get', 'name']]); }
            catch { /* some layers don't support text-field */ }
          }
        });
      }
      setMapReady(true);
    });
    return () => { map.remove(); mapRef.current = null; };
  }, [scriptLoaded, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Data loading ─────────────────────────────────────────────────────────────
  useEffect(() => {
    loadAllLocations();
    loadSavedRoute();
  }, []);

  useEffect(() => {
    if (allLocations.length > 0 && routeLocations.length === 0) {
      const route = selectLocations(allLocations, routeMode, hoursBudget, userLocation);
      setRouteLocations(route);
      saveRoute(route, userLocation, locationPermission, routeMode, hoursBudget);
    }
  }, [allLocations]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Map update ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mapReady && routeLocations.length > 0) updateRouteMap();
  }, [mapReady, routeLocations, visitedLocations, userLocation, locationPermission]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const loadAllLocations = async () => {
    setIsLoading(true);
    try {
      if (routeLocationsCache && routeCacheTimestamp && Date.now() - routeCacheTimestamp < ROUTE_CACHE_DURATION) {
        setAllLocations(routeLocationsCache.filter(l => l.is_active !== false && l.coordinates));
        setIsLoading(false);
        return;
      }
      await new Promise(r => setTimeout(r, 400));
      const data = await Location.list("-created_date");
      routeLocationsCache = data;
      routeCacheTimestamp = Date.now();
      setAllLocations(data.filter(l => l.is_active !== false && l.coordinates));
    } catch (err) {
      console.error("Error loading locations:", err);
    }
    setIsLoading(false);
  };

  const loadSavedRoute = () => {
    try {
      const raw = localStorage.getItem('savedRoute');
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Date.now() - data.timestamp > 24 * 60 * 60 * 1000) { localStorage.removeItem('savedRoute'); return; }
      if (data.locations?.length) setRouteLocations(data.locations);
      if (data.userLocation)      setUserLocation(data.userLocation);
      if (data.permission)        setLocationPermission(data.permission);
      if (data.routeMode)         setRouteMode(data.routeMode);
      if (data.hoursBudget)       setHoursBudget(data.hoursBudget);
    } catch { /* corrupt localStorage */ }
  };

  const saveRoute = (route, userLoc, permission, mode, budget) => {
    localStorage.setItem('savedRoute', JSON.stringify({
      locations: route, userLocation: userLoc, permission,
      routeMode: mode, hoursBudget: budget, timestamp: Date.now(),
    }));
  };

  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setLocationPermission('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocationPermission('granted');
        const route = selectLocations(allLocations, routeMode, hoursBudget, loc);
        setRouteLocations(route);
        saveRoute(route, loc, 'granted', routeMode, hoursBudget);
      },
      () => { setLocationPermission('sderot'); setUserLocation(SDEROT); }
    );
  };

  const applyMode = (mode, budget = hoursBudget) => {
    setRouteMode(mode);
    if (mode === 'custom') setHoursBudget(budget);
    const route = selectLocations(allLocations, mode, budget, userLocation);
    setRouteLocations(route);
    saveRoute(route, userLocation, locationPermission, mode, budget);
  };

  const removeFromRoute = (locationId) => {
    const updated = routeLocations.filter(l => l.id !== locationId);
    setRouteLocations(updated);
    saveRoute(updated, userLocation, locationPermission, routeMode, hoursBudget);
  };

  const addToRoute = (location) => {
    const updated = twoOpt([...routeLocations, location]);
    setRouteLocations(updated);
    saveRoute(updated, userLocation, locationPermission, routeMode, hoursBudget);
  };

  const resetRoute = () => {
    const route = selectLocations(allLocations, routeMode, hoursBudget, userLocation);
    setRouteLocations(route);
    saveRoute(route, userLocation, locationPermission, routeMode, hoursBudget);
  };

  const toggleVisited = (locationId) => {
    setVisitedLocations(prev => {
      const next = prev.includes(locationId) ? prev.filter(id => id !== locationId) : [...prev, locationId];
      localStorage.setItem('visitedLocations', JSON.stringify(next));
      return next;
    });
  };

  const incrementViewCount = async (locationId) => {
    try { await Location.incrementViewCount(locationId); } catch { /* best-effort */ }
  };

  const startNavigation = () => {
    const stops = routeLocations.filter(l => l.coordinates);
    if (stops.length === 0) return;
    const origin      = locationPermission === 'granted'
      ? `${userLocation.lat},${userLocation.lng}` : `${SDEROT.lat},${SDEROT.lng}`;
    const destination = stops[stops.length - 1];
    const waypoints   = stops.slice(0, -1).slice(0, 8).map(l => `${l.coordinates.lat},${l.coordinates.lng}`).join('|');
    window.open(
      `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination.coordinates.lat},${destination.coordinates.lng}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`,
      '_blank'
    );
  };

  // ── Map rendering ─────────────────────────────────────────────────────────────

  const updateRouteMap = () => {
    const map = mapRef.current;
    if (!map || !mapReady || !window.maplibregl) return;

    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    popupRef.current?.remove();

    const coords = [[userLocation.lng, userLocation.lat]];
    routeLocations.forEach(l => { if (l.coordinates) coords.push([l.coordinates.lng, l.coordinates.lat]); });
    const lineData = { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } };
    if (map.getSource('route-line')) map.getSource('route-line').setData(lineData);
    else {
      map.addSource('route-line', { type: 'geojson', data: lineData });
      map.addLayer({ id: 'route-line-layer', type: 'line', source: 'route-line',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#1D4E8F', 'line-width': 4, 'line-opacity': 0.8 },
      });
    }

    const startEl = document.createElement('div');
    if (locationPermission === 'granted') {
      startEl.style.cssText = 'width:20px;height:20px;border-radius:50%;background:#22C55E;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);';
    } else {
      startEl.style.cssText = 'width:36px;height:36px;border-radius:50%;background:#FF9800;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:10px;font-family:Arial,sans-serif;';
      startEl.textContent = 'התחלה';
    }
    markersRef.current['__start__'] = new window.maplibregl.Marker({ element: startEl })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new window.maplibregl.Popup({ offset: 15 }).setHTML(
        `<div dir="rtl">${locationPermission === 'granted' ? 'המיקום שלי' : 'נקודת התחלה: שדרות'}</div>`
      ))
      .addTo(map);

    routeLocations.forEach((location, index) => {
      if (!location.coordinates) return;
      const isVisited = visitedLocations.includes(location.id);
      const color = isVisited ? '#22C55E' : '#1D4E8F';
      const name = locName(location);
      const textDir = isRTL ? 'rtl' : 'ltr';
      const el = document.createElement('div');
      el.style.cssText = 'cursor:pointer;position:relative;width:32px;height:32px;';
      const numDiv = document.createElement('div');
      numDiv.style.cssText = `background:${color};color:white;width:32px;height:32px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;font-family:Arial,sans-serif;`;
      numDiv.textContent = String(index + 1);
      const nameLabel = document.createElement('div');
      nameLabel.style.cssText = `position:absolute;top:36px;left:50%;transform:translateX(-50%);background:${color};color:white;font-size:11px;font-weight:600;padding:2px 6px;border-radius:4px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.4);font-family:Arial,sans-serif;max-width:110px;overflow:hidden;text-overflow:ellipsis;direction:${textDir};`;
      nameLabel.textContent = name;
      el.appendChild(numDiv);
      el.appendChild(nameLabel);
      el.addEventListener('click', () => {
        popupRef.current
          .setLngLat([location.coordinates.lng, location.coordinates.lat])
          .setHTML(makePopupHTML(location, index, getRecommendedTime(location)))
          .addTo(map);
      });
      markersRef.current[location.id] = new window.maplibregl.Marker({ element: el })
        .setLngLat([location.coordinates.lng, location.coordinates.lat])
        .addTo(map);
    });

    const locs = routeLocations.filter(l => l.coordinates);
    if (locs.length > 0) {
      const bounds = new window.maplibregl.LngLatBounds();
      bounds.extend([userLocation.lng, userLocation.lat]);
      locs.forEach(l => bounds.extend([l.coordinates.lng, l.coordinates.lat]));
      map.fitBounds(bounds, { padding: 50, maxZoom: 14 });
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────────

  const totalDuration = routeLocations.reduce((sum, l) => sum + getRecommendedTime(l), 0);
  const totalDistance = routeLocations.reduce((sum, l, i) => {
    if (!l.coordinates) return sum;
    const prev = i === 0 ? userLocation : routeLocations[i - 1]?.coordinates;
    return prev ? sum + haversine(prev.lat, prev.lng, l.coordinates.lat, l.coordinates.lng) : sum;
  }, 0);
  const visitedCount  = routeLocations.filter(l => visitedLocations.includes(l.id)).length;
  const notInRoute    = allLocations.filter(l => !routeLocations.find(r => r.id === l.id));

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-[#1D4E8F]" />
          <p className="text-[#555E6D]">{t('route.loadingLocations')}</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F2F2F2]" dir="rtl">

      {/* ── Header ── */}
      <section className="bg-white border-b border-[#EBEBEB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Title row */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-[#1D4E8F] rounded-xl flex items-center justify-center shrink-0">
                  <Route className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-[#1A1A1A]">{t('route.title')}</h1>
              </div>
              <p className="text-[#555E6D] text-base mr-[60px]">
                {locationPermission === 'granted' && inGazaEnvelope(userLocation.lat, userLocation.lng)
                  ? t('route.inGazaEnvelope') : t('route.fromSderot')}
              </p>
            </div>

            {/* Stats */}
            {routeLocations.length > 0 && (
              <div className="flex flex-wrap gap-4 text-sm text-[#555E6D] lg:justify-end">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#1D4E8F]" />
                  <span>{routeLocations.length} {t('route.stops')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#1D4E8F]" />
                  <span>{Math.ceil(totalDuration / 60)} {t('route.hours')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Car className="w-4 h-4 text-[#1D4E8F]" />
                  <span>~{Math.round(totalDistance)} {t('route.km')}</span>
                </div>
                {visitedCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-600 font-medium">{visitedCount}/{routeLocations.length} {t('route.visited')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 lg:shrink-0">
              {locationPermission !== 'granted' && (
                <Button onClick={requestLocation} disabled={locationPermission === 'loading'}
                  variant="outline" className="border-[#1D4E8F] text-[#1D4E8F] hover:bg-[#F2F2F2]">
                  {locationPermission === 'loading'
                    ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" />{t('route.locatingPosition')}</>
                    : <><Navigation2 className="w-4 h-4 ml-2" />{t('route.adjustToMyLocation')}</>}
                </Button>
              )}
              {routeLocations.length > 0 && (
                <Button onClick={startNavigation} className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white">
                  <Navigation className="w-4 h-4 ml-2" />
                  {t('route.startNavigation')}
                </Button>
              )}
            </div>
          </div>

          {/* ── Route mode selector ── */}
          {allLocations.length > 0 && (
            <div className="mt-6 pt-5 border-t border-[#EBEBEB]">
              <p className="text-sm font-medium text-[#1A1A1A] mb-3">{t('route.mode.label')}</p>
              <div className="flex flex-wrap gap-2 items-center">
                {[
                  { id: 'essential',   labelKey: 'route.mode.essential',   descKey: 'route.mode.essentialDesc',   dot: 'bg-red-500'   },
                  { id: 'recommended', labelKey: 'route.mode.recommended', descKey: 'route.mode.recommendedDesc', dot: 'bg-[#1D4E8F]' },
                  { id: 'full',        labelKey: 'route.mode.full',        descKey: 'route.mode.fullDesc',        dot: 'bg-[#6B7280]' },
                  { id: 'custom',      labelKey: 'route.mode.custom',      descKey: null,                         dot: 'bg-amber-500' },
                ].map(({ id, labelKey, descKey, dot }) => {
                  const active = routeMode === id;
                  return (
                    <button key={id} onClick={() => applyMode(id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                        active ? 'bg-[#1D4E8F] text-white border-[#1D4E8F]'
                               : 'bg-white text-[#444] border-[#D0D5DD] hover:border-[#1D4E8F] hover:text-[#1D4E8F]'
                      }`}>
                      <span className={`w-2 h-2 rounded-full shrink-0 ${active ? 'bg-white' : dot}`} />
                      {t(labelKey)}
                      {descKey && <span className={`text-xs ${active ? 'text-blue-200' : 'text-[#555E6D]'}`}> — {t(descKey)}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Time budget slider */}
              {routeMode === 'custom' && (
                <div className="mt-4 max-w-sm">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-[#555E6D]">{t('route.mode.budgetLabel')}</span>
                    <span className="font-semibold text-[#1D4E8F]">{hoursBudget} {t('route.mode.hours')}</span>
                  </div>
                  <input type="range" min={2} max={9} step={0.5} value={hoursBudget}
                    onChange={e => applyMode('custom', parseFloat(e.target.value))}
                    className="w-full accent-[#1D4E8F] cursor-pointer" />
                  <div className="flex justify-between text-xs text-[#555E6D] mt-1">
                    <span>2 {t('route.mode.hours')}</span>
                    <span>9 {t('route.mode.hours')}</span>
                  </div>
                </div>
              )}

              {/* No essential locations hint */}
              {routeMode === 'essential' && !allLocations.some(l => l.priority === 'essential') && (
                <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 max-w-lg">
                  💡 {t('route.mode.noPriorityHint')}
                </p>
              )}

              {/* Customization hint */}
              <p className="mt-3 text-xs text-[#555E6D]">
                {t('route.customizeHint')}
              </p>
            </div>
          )}

          {/* Progress bar */}
          {routeLocations.length > 0 && visitedCount > 0 && (
            <div className="mt-5 max-w-lg">
              <div className="flex justify-between text-xs text-[#555E6D] mb-1">
                <span>{t('route.visited')}: {visitedCount} / {routeLocations.length}</span>
                <span>{Math.round(visitedCount / routeLocations.length * 100)}%</span>
              </div>
              <div className="h-2 bg-[#F2F2F2] rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${visitedCount / routeLocations.length * 100}%` }} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Main: stops list + sticky map ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* Stops list */}
          <div className="lg:col-span-3 space-y-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1A1A1A]">{t('route.stopsTitle')}</h2>
              {routeLocations.length < allLocations.length && (
                <Button variant="ghost" size="sm" onClick={resetRoute}
                  className="text-xs text-[#555E6D] hover:text-[#1D4E8F] gap-1">
                  <RotateCcw className="w-3 h-3" />
                  {t('route.resetRoute')}
                </Button>
              )}
            </div>

            {routeLocations.map((location, index) => {
              const prev = index === 0 ? userLocation : routeLocations[index - 1]?.coordinates;
              const distFromPrev  = prev && location.coordinates
                ? haversine(prev.lat, prev.lng, location.coordinates.lat, location.coordinates.lng) : 0;
              const driveMinutes  = Math.ceil(distFromPrev / 50 * 60);
              const recommendedTime = getRecommendedTime(location);
              const isVisited     = visitedLocations.includes(location.id);

              return (
                <React.Fragment key={location.id}>
                  {index > 0 && distFromPrev > 0 && (
                    <div className="flex items-center gap-2 px-3 py-0.5">
                      <div className="w-px h-4 bg-[#D0D5DD] mx-[19px]" />
                      <span className="text-xs text-[#555E6D]">
                        <Car className="w-3 h-3 inline ml-1" />
                        {Math.round(distFromPrev)} {t('route.km')} — {driveMinutes} {t('route.minutes')} נסיעה
                      </span>
                    </div>
                  )}

                  <Card className={`bg-white hover:shadow-md transition-shadow overflow-hidden ${isVisited ? 'border-2 border-green-400' : 'border-0 shadow-sm'}`}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Number */}
                        <div className="flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${isVisited ? 'bg-green-500' : 'bg-[#1D4E8F]'}`}>
                            {isVisited ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <Link to={createPageUrl(`Location?id=${location.id}`)}
                              onClick={() => incrementViewCount(location.id)}
                              className="flex-1 hover:text-[#2560B0] transition-colors">
                              <h3 className="text-base font-semibold text-[#1A1A1A] leading-tight">{locName(location)}</h3>
                            </Link>
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                              <Button variant="ghost" size="sm" onClick={() => toggleVisited(location.id)}
                                title={t('route.markVisited')}
                                className={`p-1 h-auto ${isVisited ? 'text-green-600' : 'text-[#555E6D] hover:text-green-600'}`}>
                                {isVisited ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => removeFromRoute(location.id)}
                                className="p-1 h-auto text-[#555E6D] hover:text-red-500">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <p className="text-sm text-[#555E6D] mb-2 leading-relaxed line-clamp-2">
                            {locStoryTitle(location) || t('route.defaultStory')}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge variant="outline" className="text-xs border-[#1D4E8F] text-[#1D4E8F] px-2">
                              {location.category}
                            </Badge>
                            <span className="text-xs text-[#1D4E8F] font-medium">⏱ {recommendedTime} {t('route.minutes')}</span>
                            {location.audio_file && <span className="text-xs text-purple-600">🎧 הקלטה</span>}
                          </div>

                          <div className="flex gap-2">
                            <Link to={createPageUrl(`Location?id=${location.id}`)}>
                              <Button size="sm" className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white text-xs h-8">
                                <Info className="w-3 h-3 ml-1" />{t('route.moreInfo')}
                              </Button>
                            </Link>
                            {location.coordinates && (
                              <Button size="sm" variant="outline"
                                className="border-[#1D4E8F] text-[#1D4E8F] hover:bg-[#F2F2F2] text-xs h-8"
                                onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${location.coordinates.lat},${location.coordinates.lng}&travelmode=driving`, '_blank')}>
                                <Navigation className="w-3 h-3 ml-1" />{t('route.navigateTo')}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Thumbnail */}
                        <div className="hidden sm:block w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[#F2F2F2]">
                          {location.main_image
                            ? <Link to={createPageUrl(`Location?id=${location.id}`)} onClick={() => incrementViewCount(location.id)}>
                                <img src={location.main_image} alt={location.name} className="w-full h-full object-cover hover:opacity-80 transition-opacity" loading="lazy" />
                              </Link>
                            : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-6 h-6 text-[#555E6D]" /></div>
                          }
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </React.Fragment>
              );
            })}

            {/* ── Not in route — add back section ── */}
            {notInRoute.length > 0 && (
              <div className="mt-6">
                <button
                  onClick={() => setShowNotInRoute(v => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-dashed border-[#D0D5DD] hover:border-[#1D4E8F] text-sm text-[#555E6D] hover:text-[#1D4E8F] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    {t('route.notInRoute')} ({notInRoute.length})
                  </span>
                  {showNotInRoute ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showNotInRoute && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-[#555E6D] px-1 pb-1">{t('route.notInRouteHint')}</p>
                    {notInRoute.map(location => (
                      <Card key={location.id} className="bg-white border-0 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                        <CardContent className="p-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-[#F2F2F2]">
                              {location.main_image
                                ? <img src={location.main_image} alt={location.name} className="w-full h-full object-cover" loading="lazy" />
                                : <div className="w-full h-full flex items-center justify-center"><MapPin className="w-4 h-4 text-[#555E6D]" /></div>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#1A1A1A] truncate">{locName(location)}</p>
                              <p className="text-xs text-[#555E6D] truncate">{locStoryTitle(location) || location.category}</p>
                            </div>
                            <Button size="sm" onClick={() => addToRoute(location)}
                              className="bg-[#1D4E8F] hover:bg-[#2560B0] text-white text-xs h-8 shrink-0 gap-1">
                              <Plus className="w-3 h-3" />
                              {t('route.addToRoute')}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sticky map */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-6">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">{t('route.mapTitle')}</h2>
              <Card className="overflow-hidden bg-white border-0 shadow-sm">
                <div ref={mapDivRef} className="h-80 sm:h-96 lg:h-[calc(100vh-160px)] min-h-[400px] max-h-[700px] w-full bg-[#EDE9E3]">
                  {!mapReady && (
                    <div className="h-full flex flex-col items-center justify-center gap-3">
                      <div className="w-10 h-10 border-4 border-[#1D4E8F] border-t-transparent rounded-full animate-spin" />
                      <p className="text-[#555E6D] text-sm">טוען מפה...</p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
