import { describe, expect, it } from "vitest";
import { ApiError } from "./http";
import { toFailure } from "./result";

describe("toFailure", () => {
  it("keeps the kind and status of an ApiError as plain data", () => {
    expect(toFailure(new ApiError("x", "http", { status: 403 }))).toEqual({ kind: "http", status: 403 });
    expect(toFailure(new ApiError("x", "timeout"))).toEqual({ kind: "timeout" });
  });

  it("marks anything else as unknown, without leaking its message", () => {
    expect(toFailure(new Error("secret detail"))).toEqual({ kind: "unknown" });
    expect(toFailure("a string")).toEqual({ kind: "unknown" });
  });

  it("returns something that survives serialization unchanged", () => {
    const failure = toFailure(new ApiError("x", "rate_limited", { status: 429 }));
    expect(JSON.parse(JSON.stringify(failure))).toEqual(failure);
  });
});
