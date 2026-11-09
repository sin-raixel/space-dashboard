import { ApiError } from "./http";
import type { IssPosition, TrailPoint } from "./iss-types";

type Obj = Record<string, unknown>;
const isObject = (value: unknown): value is Obj => typeof value === "object" && value !== null;
const finite = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const unexpected = () => new ApiError("The ISS feed sent an unexpected response", "http");

function parsePoint(raw: unknown): TrailPoint {
  if (!isObject(raw)) throw unexpected();
  const latitude = finite(raw.latitude);
  const longitude = finite(raw.longitude);
  const timestamp = finite(raw.timestamp);
  if (latitude === undefined || longitude === undefined || timestamp === undefined) throw unexpected();
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) throw unexpected();
  return { latitude, longitude, timestamp };
}

// Never trust an upstream response: check every field before it reaches the cache or the map.
export function parsePosition(raw: unknown): IssPosition {
  const point = parsePoint(raw);
  const source = raw as Obj;
  const altitudeKm = finite(source.altitude);
  const velocityKmh = finite(source.velocity);
  if (altitudeKm === undefined || velocityKmh === undefined) throw unexpected();

  return {
    ...point,
    altitudeKm,
    velocityKmh,
    visibility: typeof source.visibility === "string" ? source.visibility : "unknown",
  };
}

export function parseTrail(raw: unknown): TrailPoint[] {
  if (!Array.isArray(raw)) throw unexpected();
  return raw.map(parsePoint).sort((a, b) => a.timestamp - b.timestamp);
}
