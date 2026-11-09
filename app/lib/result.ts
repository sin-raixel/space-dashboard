import { ApiError, type ApiErrorKind } from "./http";

export type Failure = { kind: ApiErrorKind | "unknown"; status?: number };
export type Result<T> = { ok: true; data: T } | { ok: false; failure: Failure };

// In production, an error thrown inside a `use cache` function reaches the caller as a bare
// Error whose message has been removed (its class, kind, and status are lost too).
// So cached functions catch failures and return them as plain data instead.
export function toFailure(error: unknown): Failure {
  if (error instanceof ApiError) {
    return error.status === undefined ? { kind: error.kind } : { kind: error.kind, status: error.status };
  }
  return { kind: "unknown" };
}

// Failures should never be remembered: this keeps a failure from being served after the outage is over.
// (Used inside each cached function, right next to its other cacheLife call.)
export const FAILURE_LIFE = { stale: 0, revalidate: 0, expire: 1 } as const;
