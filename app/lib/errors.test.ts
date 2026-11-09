import { describe, expect, it } from "vitest";
import { friendlyMessage } from "./errors";
import { ApiError } from "./http";

describe("friendlyMessage", () => {
  it("explains a rejected NASA key", () => {
    expect(friendlyMessage(new ApiError("x", "http", { status: 403 }))).toMatch(/NASA_API_KEY/);
  });

  it("explains rate limits, timeouts, and network failures", () => {
    expect(friendlyMessage(new ApiError("x", "rate_limited", { status: 429 }))).toMatch(/busy/);
    expect(friendlyMessage(new ApiError("x", "timeout"))).toMatch(/too long/);
    expect(friendlyMessage(new ApiError("x", "network"))).toMatch(/reach/);
  });

  it("gives the same messages for the plain failure objects cached functions return", () => {
    expect(friendlyMessage({ kind: "rate_limited", status: 429 })).toMatch(/busy/);
    expect(friendlyMessage({ kind: "timeout" })).toMatch(/too long/);
    expect(friendlyMessage({ kind: "network" })).toMatch(/reach/);
    expect(friendlyMessage({ kind: "http", status: 403 })).toMatch(/NASA_API_KEY/);
    expect(friendlyMessage({ kind: "http", status: 500 })).toMatch(/unexpected/);
  });

  it("names the service that failed", () => {
    expect(friendlyMessage({ kind: "timeout" }, "The ISS tracker")).toMatch(/^The ISS tracker took too long/);
    expect(friendlyMessage({ kind: "http", status: 403 }, "The ISS tracker")).not.toMatch(/NASA_API_KEY/);
  });

  it("never leaks internal details for unknown errors", () => {
    expect(friendlyMessage(new Error("secret stack detail"))).toBe("Something went wrong. Please try again.");
    expect(friendlyMessage({ kind: "unknown" })).toBe("Something went wrong. Please try again.");
    expect(friendlyMessage({ kind: "<script>" })).toBe("Something went wrong. Please try again.");
    expect(friendlyMessage(undefined)).toBe("Something went wrong. Please try again.");
  });
});
