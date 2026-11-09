import { cacheLife } from "next/cache";
import { friendlyMessage } from "./errors";
import { easternDate, getAsteroids, type Asteroid } from "./nasa";
import { FAILURE_LIFE, toFailure, type Result } from "./result";

type Window = { asteroids: Asteroid[]; start: string; end: string; fetchedAt: string };

// One NASA request covers the next 7 days, and a good result is cached for hours.
// A failure is returned as plain data and given a near-zero lifetime, so it is never remembered.
export async function getUpcomingAsteroids(): Promise<Result<Window>> {
  "use cache";

  try {
    // Date math lives inside the cached scope, like in apod.ts.
    const start = easternDate(0);
    const end = easternDate(6); // today + 6 = a 7-day window, NASA's maximum
    const asteroids = await getAsteroids(start, end);

    cacheLife("hours");
    return { ok: true, data: { asteroids, start, end, fetchedAt: new Date().toISOString() } };
  } catch (error) {
    cacheLife(FAILURE_LIFE);
    return { ok: false, failure: toFailure(error) };
  }
}

export type AsteroidsResult = ({ ok: true } & Window) | { ok: false; message: string };

// Not cached: turns the result into what the page shows.
export async function loadAsteroids(): Promise<AsteroidsResult> {
  try {
    const result = await getUpcomingAsteroids();
    return result.ok ? { ok: true, ...result.data } : { ok: false, message: friendlyMessage(result.failure) };
  } catch (error) {
    return { ok: false, message: friendlyMessage(error) };
  }
}
