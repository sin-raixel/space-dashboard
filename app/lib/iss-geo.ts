import type { TrailPoint } from "./iss-types";

export type LatLng = [number, number];

// The ISS crosses the 180 degree line every orbit. Drawing one line through it would
// streak across the whole map, so the path is cut into separate pieces there.
export function splitAtAntimeridian(points: TrailPoint[]): LatLng[][] {
  const segments: LatLng[][] = [];
  let current: LatLng[] = [];
  let previous: TrailPoint | undefined;

  for (const point of points) {
    if (previous && Math.abs(point.longitude - previous.longitude) > 180) {
      segments.push(current);
      current = [];
    }
    current.push([point.latitude, point.longitude]);
    previous = point;
  }
  if (current.length > 0) segments.push(current);
  return segments;
}

// Adds a new point, ignores repeats and out-of-order points, and caps the length.
export function appendToTrail(trail: TrailPoint[], point: TrailPoint, max = 240): TrailPoint[] {
  const last = trail[trail.length - 1];
  if (last && last.timestamp >= point.timestamp) return trail;

  const next = [...trail, { latitude: point.latitude, longitude: point.longitude, timestamp: point.timestamp }];
  return next.length > max ? next.slice(next.length - max) : next;
}

export const formatLatitude = (value: number) => `${Math.abs(value).toFixed(2)}\u00B0 ${value < 0 ? "S" : "N"}`;
export const formatLongitude = (value: number) => `${Math.abs(value).toFixed(2)}\u00B0 ${value < 0 ? "W" : "E"}`;
