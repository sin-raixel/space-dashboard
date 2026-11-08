import { cacheLife } from "next/cache";
import { friendlyMessage } from "./errors";
import { easternDate, getAsteroids, type Asteroid } from "./nasa";

type Window = { asteroids: Asteroid[]; start: string; end: string; fetchedAt: string };

// One NASA request covers the next 7 days, and the result is cached.
// If the fetch throws, nothing is returned, so an error is not stored as if it were data.
export async function getUpcomingAsteroids(): Promise<Window> {
  "use cache";
  cacheLife("hours");

  // Date math lives inside the cached scope, like in apod.ts.
  const start = easternDate(0);
  const end = easternDate(6); // today + 6 = a 7-day window, NASA's maximum
  const asteroids = await getAsteroids(start, end);

  return { asteroids, start, end, fetchedAt: new Date().toISOString() };
}

export type AsteroidsResult = ({ ok: true } & Window) | { ok: false; message: string };

// Not cached: turns success and failure into plain data the page can show.
export async function loadAsteroids(): Promise<AsteroidsResult> {
  try {
    return { ok: true, ...(await getUpcomingAsteroids()) };
  } catch (error) {
    return { ok: false, message: friendlyMessage(error) };
  }
}