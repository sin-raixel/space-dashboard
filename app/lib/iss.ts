import { cacheLife } from "next/cache";
import { fetchJson } from "./http";
import { parsePosition, parseTrail } from "./iss-parse";
import type { IssPosition, TrailPoint } from "./iss-types";
import { FAILURE_LIFE, toFailure, type Result } from "./result";

const BASE = "https://api.wheretheiss.at/v1/satellites/25544";

// The feed allows about one request per second. The 'seconds' preset (revalidate 1s, expire 1 min)
// keeps visitors from each triggering their own upstream call, and Next.js leaves anything that
// expires in under 5 minutes out of the build, so the position is never frozen at build time.
// A failure is returned as plain data and given a near-zero lifetime, so it is never remembered.
export async function getIssPosition(): Promise<Result<IssPosition>> {
  "use cache";

  try {
    const position = parsePosition(await fetchJson<unknown>(`${BASE}?units=kilometers`));
    cacheLife("seconds");
    return { ok: true, data: position };
  } catch (error) {
    cacheLife(FAILURE_LIFE);
    return { ok: false, failure: toFailure(error) };
  }
}

// The last 90 minutes in 10-minute steps (the feed accepts up to 10 timestamps per request),
// so the map can show the orbit before the live trail has grown.
export async function getIssTrail(): Promise<Result<TrailPoint[]>> {
  "use cache";

  try {
    // Date.now() is allowed inside a cached scope.
    const now = Math.floor(Date.now() / 1000);
    const timestamps = Array.from({ length: 10 }, (_, i) => now - (9 - i) * 600);
    const trail = parseTrail(
      await fetchJson<unknown>(`${BASE}/positions?timestamps=${timestamps.join(",")}&units=kilometers`),
    );

    // An explicit profile with an expiry under 5 minutes keeps this request-time too.
    cacheLife({ stale: 30, revalidate: 60, expire: 240 });
    return { ok: true, data: trail };
  } catch (error) {
    cacheLife(FAILURE_LIFE);
    return { ok: false, failure: toFailure(error) };
  }
}
