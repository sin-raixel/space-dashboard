import { cacheLife } from "next/cache";
import { friendlyMessage } from "./errors";
import { ApiError } from "./http";
import { getRecentApods, type Apod } from "./nasa";
import { FAILURE_LIFE, toFailure, type Result } from "./result";

type Week = { items: Apod[]; fetchedAt: string };

// ONE NASA request covers the whole week, and a good result is cached for hours.
// A failure is returned as plain data (errors thrown inside a cached function lose
// their details in production) and is given a near-zero lifetime so it is never remembered.
export async function getWeekOfApod(): Promise<Result<Week>> {
  "use cache";

  try {
    const items = await getRecentApods(7);
    if (items.length === 0) throw new ApiError("NASA returned no usable pictures", "http");

    cacheLife("hours");
    // `new Date()` is allowed inside a cached scope (the build rejects it elsewhere).
    return { ok: true, data: { items, fetchedAt: new Date().toISOString() } };
  } catch (error) {
    cacheLife(FAILURE_LIFE);
    return { ok: false, failure: toFailure(error) };
  }
}

export type WeekResult = ({ ok: true } & Week) | { ok: false; message: string };

// Not cached: turns the result into what the page shows.
export async function loadWeek(): Promise<WeekResult> {
  try {
    const result = await getWeekOfApod();
    return result.ok ? { ok: true, ...result.data } : { ok: false, message: friendlyMessage(result.failure) };
  } catch (error) {
    return { ok: false, message: friendlyMessage(error) };
  }
}
