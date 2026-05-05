import { useState, useEffect } from "react";

const MAPLIBRE_VERSION = "4.7.1";
const RTL_PLUGIN_URL = "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js";

export function useMapLibre() {
  const [scriptLoaded, setScriptLoaded] = useState(() => !!window.maplibregl);

  useEffect(() => {
    if (window.maplibregl) {
      setScriptLoaded(true);
      return;
    }

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
    document.head.appendChild(link);

    const s = document.createElement("script");
    s.src = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
    s.onload = () => {
      window.maplibregl.setRTLTextPlugin(RTL_PLUGIN_URL, false);
      setScriptLoaded(true);
    };
    s.onerror = () => {
      console.error("Failed to load MapLibre GL from CDN");
    };
    document.head.appendChild(s);
  }, []);

  return scriptLoaded;
}
