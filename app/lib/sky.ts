import { CONSTELLATIONS, type Constellation } from "./constellations";

const RAD = Math.PI / 180;

// A constellation counts as "up" once its centre is this many degrees above the horizon.
// Closer than that, haze and buildings usually hide it.
export const MIN_ALTITUDE = 10;

const mod = (x: number, n: number) => ((x % n) + n) % n;
const julianDay = (date: Date) => date.getTime() / 86_400_000 + 2_440_587.5;

// Local sidereal time in degrees: which point of the sky is crossing the observer's meridian.
// Longitude is positive to the east.
export function localSiderealTime(date: Date, longitude: number): number {
  return mod(280.46061837 + 360.98564736629 * (julianDay(date) - 2_451_545.0) + longitude, 360);
}

// Where a point of the sky (right ascension and declination, in degrees) appears for an observer.
// Altitude is degrees above the horizon; azimuth is degrees clockwise from north (90 = east).
export function altAz(raDeg: number, decDeg: number, latitude: number, lst: number) {
  const hourAngle = (lst - raDeg) * RAD;
  const dec = decDeg * RAD;
  const lat = latitude * RAD;
  const altitude = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(hourAngle));
  const azimuth = Math.atan2(
    -Math.cos(dec) * Math.sin(hourAngle),
    Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(hourAngle),
  );
  return { altitude: altitude / RAD, azimuth: mod(azimuth / RAD, 360) };
}

export type SunPhase = "day" | "twilight" | "night";

// A low-precision Sun position (good to a few hundredths of a degree), plenty for telling day from night.
export function sunAltitude(date: Date, latitude: number, longitude: number): number {
  const days = julianDay(date) - 2_451_545.0;
  const meanLongitude = 280.46 + 0.9856474 * days;
  const anomaly = (357.528 + 0.9856003 * days) * RAD;
  const eclipticLongitude = (meanLongitude + 1.915 * Math.sin(anomaly) + 0.02 * Math.sin(2 * anomaly)) * RAD;
  const obliquity = (23.439 - 0.0000004 * days) * RAD;
  const ra = Math.atan2(Math.cos(obliquity) * Math.sin(eclipticLongitude), Math.cos(eclipticLongitude)) / RAD;
  const dec = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude)) / RAD;
  return altAz(ra, dec, latitude, localSiderealTime(date, longitude)).altitude;
}

// Sunrise and sunset happen when the Sun's centre is about 0.83 degrees below the horizon.
// The sky is fully dark once it is 18 degrees below.
export function sunPhase(altitude: number): SunPhase {
  if (altitude > -0.83) return "day";
  return altitude > -18 ? "twilight" : "night";
}

const POINTS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

export const compassPoint = (azimuth: number) => POINTS[Math.round(mod(azimuth, 360) / 22.5) % 16];

export function describeAltitude(altitude: number): string {
  if (altitude >= 75) return "Almost overhead";
  if (altitude >= 45) return "High in the sky";
  if (altitude >= 25) return "Halfway up the sky";
  return "Low, near the horizon";
}

// The next time the clock shows `hour`:00. A time that passed less than `graceMinutes` ago still counts as now.
export function nextClockTime(hour: number, from: Date, graceMinutes = 30): Date {
  const target = new Date(from);
  target.setHours(hour, 0, 0, 0);
  if (target.getTime() < from.getTime() - graceMinutes * 60_000) target.setDate(target.getDate() + 1);
  return target;
}

export type SkyEntry = Constellation & {
  altitude: number;
  azimuth: number;
  alwaysUp: boolean; // never dips below the horizon at this latitude
};

export type SkyReport = {
  visible: SkyEntry[]; // centre at least MIN_ALTITUDE above the horizon, highest first
  partial: SkyEntry[]; // centre is low or below the horizon, but part of the constellation reaches MIN_ALTITUDE
  aboveHorizon: SkyEntry[]; // everything with its centre above the horizon, highest first (for the chart)
  circumpolar: SkyEntry[]; // always above the horizon from this latitude
  sun: { altitude: number; phase: SunPhase };
};

export function skyAt(date: Date, latitude: number, longitude: number): SkyReport {
  const lst = localSiderealTime(date, longitude);

  const entries: SkyEntry[] = CONSTELLATIONS.map((c) => {
    const { altitude, azimuth } = altAz(c.raHours * 15, c.decDeg, latitude, lst);
    const alwaysUp = latitude >= 0 ? c.decDeg >= 90 - latitude : c.decDeg <= -90 - latitude;
    return { ...c, altitude, azimuth, alwaysUp };
  }).sort((a, b) => b.altitude - a.altitude);

  const sunAlt = sunAltitude(date, latitude, longitude);

  return {
    visible: entries.filter((c) => c.altitude >= MIN_ALTITUDE),
    partial: entries.filter((c) => c.altitude < MIN_ALTITUDE && c.altitude + c.radiusDeg >= MIN_ALTITUDE),
    aboveHorizon: entries.filter((c) => c.altitude >= 0),
    circumpolar: entries.filter((c) => c.alwaysUp),
    sun: { altitude: sunAlt, phase: sunPhase(sunAlt) },
  };
}

export type CoordinatesResult = { ok: true; latitude: number; longitude: number } | { ok: false; error: string };

function parseDegrees(text: string, limit: number): number | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  const value = Number(trimmed);
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : undefined;
}

// Checks coordinates typed in by hand. Both are plain decimal degrees: 14.7 and 120.5, or -33.9 for south and west.
export function parseCoordinates(latitudeText: string, longitudeText: string): CoordinatesResult {
  const latitude = parseDegrees(latitudeText, 90);
  if (latitude === undefined) {
    return { ok: false, error: "Latitude should be a number from -90 to 90, like 14.7. Use a minus sign for south." };
  }
  const longitude = parseDegrees(longitudeText, 180);
  if (longitude === undefined) {
    return { ok: false, error: "Longitude should be a number from -180 to 180, like 120.5. Use a minus sign for west." };
  }
  return { ok: true, latitude, longitude };
}

// Browser geolocation error codes: 1 = permission denied, 2 = position unavailable, 3 = timeout.
export function locationErrorMessage(code: number): string {
  switch (code) {
    case 1:
      return "Location access was blocked. Allow it in your browser's site settings, or enter coordinates below.";
    case 2:
      return "Your device couldn\u2019t work out where you are. Enter coordinates below instead.";
    case 3:
      return "Finding your location took too long. Try again, or enter coordinates below.";
    default:
      return "Couldn\u2019t get your location. Enter coordinates below instead.";
  }
}
