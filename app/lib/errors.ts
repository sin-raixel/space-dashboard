import { ApiError } from "./http";
import type { Failure } from "./result";

const KINDS = ["rate_limited", "timeout", "network", "http"];

// Accepts a real ApiError, or the plain Failure object a cached function returns.
function describe(error: unknown): Failure | undefined {
  if (error instanceof ApiError) return { kind: error.kind, status: error.status };
  if (typeof error === "object" && error !== null && "kind" in error) {
    const { kind, status } = error as { kind: unknown; status?: unknown };
    if (typeof kind === "string" && KINDS.includes(kind)) {
      return { kind: kind as Failure["kind"], status: typeof status === "number" ? status : undefined };
    }
  }
  return undefined;
}

// Turns any failure into a message that is safe and helpful to show on screen.
// `source` names the service so the message is accurate for every data feed.
export function friendlyMessage(error: unknown, source = "NASA"): string {
  const failure = describe(error);
  if (!failure) return "Something went wrong. Please try again.";

  if (failure.status === 401 || failure.status === 403) {
    return source === "NASA"
      ? "NASA rejected the request. Check that NASA_API_KEY is set correctly."
      : `${source} was refused access to its data feed.`;
  }

  switch (failure.kind) {
    case "rate_limited":
      return `${source}'s data feed is busy right now. Please try again in a little while.`;
    case "timeout":
      return `${source} took too long to respond. Please try again.`;
    case "network":
      return `Couldn't reach ${source}. Check your connection and try again.`;
    default:
      return `${source} sent an unexpected response. Please try again later.`;
  }
}
