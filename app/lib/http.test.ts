import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, fetchJson } from "./http";

const fast = { baseDelayMs: 1, maxWaitMs: 5 };
const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init);

afterEach(() => vi.restoreAllMocks());

describe("fetchJson", () => {
  it("returns parsed JSON on success", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => json({ ok: true }));
    await expect(fetchJson("https://example.test", fast)).resolves.toEqual({ ok: true });
  });

  it("retries a 429 and recovers", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(async () => new Response(null, { status: 429 }))
      .mockImplementationOnce(async () => new Response(null, { status: 429 }))
      .mockImplementation(async () => json({ recovered: true }));

    await expect(fetchJson("https://example.test", { ...fast, retries: 2 })).resolves.toEqual({
      recovered: true,
    });
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("retries a 503 once and recovers", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(async () => new Response(null, { status: 503 }))
      .mockImplementation(async () => json({ recovered: true }));

    await expect(fetchJson("https://example.test", fast)).resolves.toEqual({ recovered: true });
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("does not retry a 404", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(null, { status: 404 }));

    await expect(fetchJson("https://example.test", fast)).rejects.toMatchObject({
      kind: "http",
      status: 404,
      retryable: false,
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("gives up immediately when Retry-After is longer than we can wait", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(null, { status: 429, headers: { "retry-after": "120" } }));

    await expect(fetchJson("https://example.test", fast)).rejects.toMatchObject({
      kind: "rate_limited",
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("stops after the retry limit on persistent 500s", async () => {
    const spy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation(async () => new Response(null, { status: 500 }));

    await expect(fetchJson("https://example.test", { ...fast, retries: 2 })).rejects.toBeInstanceOf(ApiError);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it("reports a timeout", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(Object.assign(new Error("timed out"), { name: "TimeoutError" }));
    await expect(fetchJson("https://example.test", { ...fast, retries: 0 })).rejects.toMatchObject({
      kind: "timeout",
    });
  });

  it("reports a network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    await expect(fetchJson("https://example.test", { ...fast, retries: 0 })).rejects.toMatchObject({
      kind: "network",
    });
  });

  it("rejects invalid JSON without retrying", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => new Response("not json"));
    await expect(fetchJson("https://example.test", fast)).rejects.toMatchObject({ kind: "http" });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});