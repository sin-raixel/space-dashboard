import { ApiError } from "./http";

// Turns any error into a message that is safe and helpful to show on screen.
export function friendlyMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) {
      return "NASA rejected the request. Check that NASA_API_KEY is set correctly.";
    }
    switch (error.kind) {
      case "rate_limited":
        return "NASA's API is busy right now. Please try again in a little while.";
      case "timeout":
        return "NASA took too long to respond. Please try again.";
      case "network":
        return "Couldn't reach NASA. Check your connection and try again.";
      default:
        return "NASA sent an unexpected response. Please try again later.";
    }
  }
  return "Something went wrong. Please try again.";
}