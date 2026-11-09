import { describe, expect, it } from "vitest";
import { parsePosition, parseTrail } from "./iss-parse";

// Shaped like the example in wheretheiss.at's documentation
const sample = {
  name: "iss",
  id: 25544,
  latitude: 50.11496269845,
  longitude: 118.07900427317,
  altitude: 408.05526028199,
  velocity: 27635.971970874,
  visibility: "daylight",
  footprint: 4446.1877699772,
  timestamp: 1364069476,
  units: "kilometers",
};

describe("parsePosition", () => {
  it("keeps only the fields we use and renames units", () => {
    expect(parsePosition(sample)).toEqual({
      latitude: 50.11496269845,
      longitude: 118.07900427317,
      altitudeKm: 408.05526028199,
      velocityKmh: 27635.971970874,
      visibility: "daylight",
      timestamp: 1364069476,
    });
  });

  it("falls back to 'unknown' visibility", () => {
    expect(parsePosition({ ...sample, visibility: undefined }).visibility).toBe("unknown");
  });

  it("rejects missing, non-numeric, or impossible values", () => {
    expect(() => parsePosition(null)).toThrow(/unexpected/);
    expect(() => parsePosition("nope")).toThrow(/unexpected/);
    expect(() => parsePosition({ ...sample, latitude: "50" })).toThrow(/unexpected/);
    expect(() => parsePosition({ ...sample, latitude: 120 })).toThrow(/unexpected/);
    expect(() => parsePosition({ ...sample, longitude: -200 })).toThrow(/unexpected/);
    expect(() => parsePosition({ ...sample, altitude: undefined })).toThrow(/unexpected/);
    expect(() => parsePosition({ ...sample, timestamp: NaN })).toThrow(/unexpected/);
  });
});

describe("parseTrail", () => {
  it("returns points sorted oldest first", () => {
    const trail = parseTrail([
      { ...sample, timestamp: 300 },
      { ...sample, timestamp: 100 },
      { ...sample, timestamp: 200 },
    ]);
    expect(trail.map((p) => p.timestamp)).toEqual([100, 200, 300]);
    expect(trail[0]).toEqual({ latitude: sample.latitude, longitude: sample.longitude, timestamp: 100 });
  });

  it("rejects anything that is not a list of valid points", () => {
    expect(() => parseTrail({ error: "rate limit" })).toThrow(/unexpected/);
    expect(() => parseTrail([sample, { latitude: 1 }])).toThrow(/unexpected/);
  });
});
