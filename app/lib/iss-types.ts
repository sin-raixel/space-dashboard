export type IssPosition = {
  latitude: number;
  longitude: number;
  altitudeKm: number;
  velocityKmh: number;
  visibility: string; // "daylight", "eclipsed", or "visible"
  timestamp: number; // unix seconds
};

export type TrailPoint = { latitude: number; longitude: number; timestamp: number };
