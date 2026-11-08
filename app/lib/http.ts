// A small fetch wrapper for flaky or rate-limited APIs.
// - times out slow requests
// - retries network errors, timeouts, 429, and 5xx with exponential backoff
// - never retries other 4xx errors (those are your bug, not the server's)
// - throws one error type, so the UI can show a clear message

export type ApiErrorKind = "rate_limited" | "timeout" | "network" | "http";

export class ApiError extends Error {
  kind: ApiErrorKind;
  status?: number;
  retryable: boolean;
  retryAfterMs?: number;

  constructor(
    message: string,
    kind: ApiErrorKind,
    options: { status?: number; retryable?: boolean; retryAfterMs?: number } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status;
    this.retryable = options.retryable ?? false;
    this.retryAfterMs = options.retryAfterMs;
  }
}

export type FetchJsonOptions = {
  timeoutMs?: number; // per attempt
  retries?: number; // extra attempts after the first
  baseDelayMs?: number; // first backoff delay; doubles each retry
  maxWaitMs?: number; // never wait longer than this between attempts
  init?: RequestInit;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// "Retry-After" is either a number of seconds or a date.
function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (!Number.isNaN(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - Date.now());
}

async function attemptOnce<T>(url: string, timeoutMs: number, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new ApiError("The request timed out", "timeout", { retryable: true });
    }
    throw new ApiError("Could not reach the server", "network", { retryable: true });
  }

  if (res.ok) {
    try {
      return (await res.json()) as T;
    } catch {
      throw new ApiError("The server sent an invalid response", "http", { status: res.status });
    }
  }

  if (res.status === 429) {
    throw new ApiError("Rate limit reached", "rate_limited", {
      status: 429,
      retryable: true,
      retryAfterMs: parseRetryAfter(res.headers.get("retry-after")),
    });
  }

  throw new ApiError(`Request failed with status ${res.status}`, "http", {
    status: res.status,
    retryable: res.status >= 500,
  });
}

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const { timeoutMs = 8000, retries = 2, baseDelayMs = 500, maxWaitMs = 5000, init } = options;

  for (let attempt = 0; ; attempt++) {
    try {
      return await attemptOnce<T>(url, timeoutMs, init);
    } catch (error) {
      if (!(error instanceof ApiError) || !error.retryable || attempt >= retries) throw error;

      // If the server asks us to wait longer than we can afford, give up now.
      if (error.retryAfterMs !== undefined && error.retryAfterMs > maxWaitMs) throw error;

      const backoff = baseDelayMs * 2 ** attempt + Math.random() * 250;
      await sleep(Math.min(error.retryAfterMs ?? backoff, maxWaitMs));
    }
  }
}