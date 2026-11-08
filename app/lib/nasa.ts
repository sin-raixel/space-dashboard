import { fetchJson } from "./http";
import { htmlToText } from "./text";

/* ---------- Dates ---------- */

// Asteroid windows are measured in US Eastern days, the same calendar NASA uses.
// (The Philippines is half a day ahead of New York.)
export function easternDate(offsetDays = 0, now = new Date()): string {
  const shifted = new Date(now.getTime() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(shifted); // en-CA gives YYYY-MM-DD
}

function daysBetween(start: string, end: string): number {
  return Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000);
}

/* ---------- Helpers ---------- */

// Only https links on NASA's own domains are ever put into the page.
export function safeNasaUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const host = url.hostname;
    const nasaHost = host === "nasa.gov" || host.endsWith(".nasa.gov");
    return url.protocol === "https:" && nasaHost ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

// NASA's image host takes a width parameter (w). Smaller images load much faster.
const RESIZE_IMAGES = true;
export function resizeImage(value: string | undefined, width: number): string | undefined {
  if (!value || !RESIZE_IMAGES) return value;
  try {
    const url = new URL(value);
    if (url.hostname !== "assets.science.nasa.gov") return value;
    url.searchParams.set("w", String(width));
    return url.toString();
  } catch {
    return undefined;
  }
}

/* ---------- Astronomy Picture of the Day (NASA Science feed, no key needed) ---------- */

const APOD_URL = "https://science.nasa.gov/wp-json/wp/v2/apod-basic";

export type Apod = {
  date: string;
  title: string;
  explanation: string; // plain text
  mediaType: "image" | "video";
  url: string; // the article page on science.nasa.gov
  imageUrl?: string; // display-size image (images only)
  thumbUrl?: string; // small image for lists (images only)
  hdUrl?: string; // full-resolution original (images only)
  alt?: string;
  copyright?: string;
};

type ApodRaw = {
  date: string;
  title: string;
  permalink?: string;
  media_type: string;
  explanation: string;
  credit?: string;
  copyright?: string;
  alt?: string;
  url?: string;
  hdurl?: string;
};

function toApod(raw: ApodRaw): Apod | undefined {
  const mediaType = raw.media_type === "video" ? "video" : "image";
  const original = safeNasaUrl(raw.hdurl);
  const pageUrl = safeNasaUrl(raw.permalink) ?? safeNasaUrl(raw.url);
  if (!pageUrl) return undefined;

  if (mediaType === "image") {
    // Skip entries without a real picture. The old NASA endpoint sent its logo instead.
    if (!original || /nasa-logo/i.test(original)) return undefined;
  }

  const isImage = mediaType === "image";
  return {
    date: raw.date,
    title: htmlToText(raw.title),
    explanation: htmlToText(raw.explanation),
    mediaType,
    url: pageUrl,
    imageUrl: isImage ? resizeImage(original, 1280) : undefined,
    thumbUrl: isImage ? resizeImage(original, 320) : undefined,
    hdUrl: isImage ? original : undefined,
    alt: raw.alt ? htmlToText(raw.alt) : undefined,
    copyright: htmlToText(raw.copyright ?? raw.credit ?? "") || undefined,
  };
}

// The newest `count` pictures, newest first.
export async function getRecentApods(count = 7): Promise<Apod[]> {
  const url = new URL(APOD_URL);
  url.searchParams.set("per_page", String(count));
  // Ask only for the fields we use; each entry also carries a whole HTML page.
  url.searchParams.set(
    "_fields",
    "date,title,permalink,media_type,explanation,credit,copyright,alt,url,hdurl",
  );

  const raw = await fetchJson<ApodRaw[]>(url.toString());
  return raw
    .map(toApod)
    .filter((item): item is Apod => item !== undefined)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/* ---------- Near-Earth objects (needs your NASA_API_KEY) ---------- */

const NASA_API = "https://api.nasa.gov";

function nasaUrl(path: string, params: Record<string, string> = {}): string {
  const url = new URL(path, NASA_API);
  // `||` (not `??`) so an empty NASA_API_KEY= line also falls back to the demo key.
  url.searchParams.set("api_key", process.env.NASA_API_KEY?.trim() || "DEMO_KEY");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url.toString();
}

export type Asteroid = {
  id: string;
  name: string;
  date: string; // close approach date
  diameterMinKm: number;
  diameterMaxKm: number;
  hazardous: boolean;
  velocityKmh: number;
  missDistanceKm: number;
  missDistanceLunar: number; // 1 = the distance to the Moon
  jplUrl: string;
};

type NeoObjectRaw = {
  id: string;
  name: string;
  nasa_jpl_url: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: {
    kilometers: { estimated_diameter_min: number; estimated_diameter_max: number };
  };
  close_approach_data: {
    close_approach_date: string;
    relative_velocity: { kilometers_per_hour: string };
    miss_distance: { kilometers: string; lunar: string };
  }[];
};

type NeoFeedRaw = { near_earth_objects: Record<string, NeoObjectRaw[]> };

// NASA allows at most a 7-day window per request.
export async function getAsteroids(startDate: string, endDate: string): Promise<Asteroid[]> {
  const span = daysBetween(startDate, endDate);
  if (span < 0 || span > 7) {
    throw new RangeError("The date range must be between 0 and 7 days.");
  }

  const raw = await fetchJson<NeoFeedRaw>(
    nasaUrl("/neo/rest/v1/feed", { start_date: startDate, end_date: endDate }),
  );

  const asteroids: Asteroid[] = [];
  for (const [date, objects] of Object.entries(raw.near_earth_objects)) {
    for (const object of objects) {
      const approach =
        object.close_approach_data.find((a) => a.close_approach_date === date) ??
        object.close_approach_data[0];
      if (!approach) continue;

      asteroids.push({
        id: object.id,
        name: object.name.replace(/[()]/g, "").trim(),
        date,
        diameterMinKm: object.estimated_diameter.kilometers.estimated_diameter_min,
        diameterMaxKm: object.estimated_diameter.kilometers.estimated_diameter_max,
        hazardous: object.is_potentially_hazardous_asteroid,
        velocityKmh: Number(approach.relative_velocity.kilometers_per_hour),
        missDistanceKm: Number(approach.miss_distance.kilometers),
        missDistanceLunar: Number(approach.miss_distance.lunar),
        jplUrl: object.nasa_jpl_url,
      });
    }
  }

  // Earliest day first, and closest approach first within a day
  return asteroids.sort((a, b) => a.date.localeCompare(b.date) || a.missDistanceKm - b.missDistanceKm);
}