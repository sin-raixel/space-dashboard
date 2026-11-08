import { cacheLife } from "next/cache";
import { friendlyMessage } from "./errors";
import { ApiError } from "./http";
import { getRecentApods, type Apod } from "./nasa";

type Week = { items: Apod[]; fetchedAt: string };

// ONE NASA request covers the whole week, and the result is cached.
// Arguments and return values must be serializable, so this returns plain data.
// If the fetch throws, nothing is returned, so an error is not stored as if it were data.
export async function getWeekOfApod(): Promise<Week> {
  "use cache";
  cacheLife("hours");

  const items = await getRecentApods(7);
  if (items.length === 0) {
    throw new ApiError("NASA returned no usable pictures", "http");
  }

  // `new Date()` is allowed inside a cached scope (the build rejects it elsewhere).
  return { items, fetchedAt: new Date().toISOString() };
}

export type WeekResult = ({ ok: true } & Week) | { ok: false; message: string };

// Not cached: turns success and failure into plain data the page can show.
export async function loadWeek(): Promise<WeekResult> {
  try {
    return { ok: true, ...(await getWeekOfApod()) };
  } catch (error) {
    return { ok: false, message: friendlyMessage(error) };
  }
}