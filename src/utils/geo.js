export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function makeGoogleMapsNavUrl(lat, lng) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function makeGoogleMapsRouteUrl(origin, stops) {
  const destination = stops[stops.length - 1];
  const waypoints = stops.slice(0, -1).slice(0, 8)
    .map(l => `${l.coordinates.lat},${l.coordinates.lng}`)
    .join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination.coordinates.lat},${destination.coordinates.lng}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
}
