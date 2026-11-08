import { describe, expect, it } from "vitest";
import { friendlyMessage } from "./errors";
import { ApiError } from "./http";

describe("friendlyMessage", () => {
  it("explains a rejected key", () => {
    expect(friendlyMessage(new ApiError("x", "http", { status: 403 }))).toMatch(/NASA_API_KEY/);
  });

  it("explains rate limits, timeouts, and network failures", () => {
    expect(friendlyMessage(new ApiError("x", "rate_limited", { status: 429 }))).toMatch(/busy/);
    expect(friendlyMessage(new ApiError("x", "timeout"))).toMatch(/too long/);
    expect(friendlyMessage(new ApiError("x", "network"))).toMatch(/reach/);
  });

  it("never leaks internal details for unknown errors", () => {
    expect(friendlyMessage(new Error("secret stack detail"))).toBe("Something went wrong. Please try again.");
  });
});