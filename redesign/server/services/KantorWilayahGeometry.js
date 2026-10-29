// Preserve the source's separate-ring semantics; never invent a boundary.
export function fromSourceGeometry(entry) {
  const polygons = [];
  const rings = [];
  function collect(value) {
    if (!Array.isArray(value) || !value.length) return;
    if (Array.isArray(value[0]) && typeof value[0][0] === 'number') rings.push(value);
    else for (const child of value) collect(child);
  }
  collect(entry.rings);
  for (const sourceRing of rings) {
    const ring = sourceRing.map(([lat, lng]) => [Number(lng), Number(lat)]);
    if (ring.length < 3 || ring.some(([lng, lat]) => !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) continue;
    if (ring[0][0] !== ring.at(-1)[0] || ring[0][1] !== ring.at(-1)[1]) ring.push([...ring[0]]);
    if (ring.length >= 4) polygons.push([ring]);
  }
  if (!polygons.length) return null;
  const bounds = { west: 180, south: 90, east: -180, north: -90 };
  for (const [ring] of polygons) for (const [lng, lat] of ring) {
    bounds.west = Math.min(bounds.west, lng); bounds.east = Math.max(bounds.east, lng);
    bounds.south = Math.min(bounds.south, lat); bounds.north = Math.max(bounds.north, lat);
  }
  return { geometry: { type: 'MultiPolygon', coordinates: polygons }, bounds };
}

function inRing(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    const cross = (lng - xi) * (yj - yi) - (lat - yi) * (xj - xi);
    if (Math.abs(cross) < 1e-10 && lng >= Math.min(xi, xj) && lng <= Math.max(xi, xj) && lat >= Math.min(yi, yj) && lat <= Math.max(yi, yj)) return true;
    if ((yi > lat) !== (yj > lat) && lng < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function containsPoint(geometry, lng, lat) {
  return geometry.coordinates.some(([outer, ...holes]) => inRing(lng, lat, outer) && !holes.some(hole => inRing(lng, lat, hole)));
}

// Only the national preview is simplified. Point lookup uses full source geometry.
export function previewGeometry(geometry, tolerance = 0.015) {
  return { ...geometry, coordinates: geometry.coordinates.map(polygon => polygon.map(ring => {
    const kept = [ring[0]];
    for (let i = 1; i < ring.length - 1; i++) {
      const last = kept.at(-1);
      if (Math.hypot(ring[i][0] - last[0], ring[i][1] - last[1]) >= tolerance) kept.push(ring[i]);
    }
    kept.push(ring.at(-1));
    return kept.length >= 4 ? kept : ring;
  })) };
}
