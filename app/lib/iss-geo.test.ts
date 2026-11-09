import { describe, expect, it } from "vitest";
import { appendToTrail, formatLatitude, formatLongitude, splitAtAntimeridian } from "./iss-geo";
import type { TrailPoint } from "./iss-types";

const p = (longitude: number, timestamp: number, latitude = 10): TrailPoint => ({ latitude, longitude, timestamp });

describe("splitAtAntimeridian", () => {
  it("keeps a normal path in one piece", () => {
    expect(splitAtAntimeridian([p(10, 1), p(20, 2), p(30, 3)])).toEqual([
      [
        [10, 10],
        [10, 20],
        [10, 30],
      ],
    ]);
  });

  it("cuts the path where it jumps across the 180 degree line", () => {
    const pieces = splitAtAntimeridian([p(170, 1), p(178, 2), p(-176, 3), p(-168, 4)]);
    expect(pieces).toHaveLength(2);
    expect(pieces[0].map((point) => point[1])).toEqual([170, 178]);
    expect(pieces[1].map((point) => point[1])).toEqual([-176, -168]);
  });

  it("handles empty and single-point input", () => {
    expect(splitAtAntimeridian([])).toEqual([]);
    expect(splitAtAntimeridian([p(5, 1)])).toEqual([[[10, 5]]]);
  });
});

describe("appendToTrail", () => {
  it("adds newer points", () => {
    expect(appendToTrail([p(1, 100)], p(2, 105)).map((x) => x.timestamp)).toEqual([100, 105]);
  });

  it("ignores repeated and older timestamps", () => {
    const trail = [p(1, 100)];
    expect(appendToTrail(trail, p(2, 100))).toBe(trail);
    expect(appendToTrail(trail, p(2, 90))).toBe(trail);
  });

  it("keeps only the most recent points", () => {
    let trail: TrailPoint[] = [];
    for (let i = 1; i <= 10; i++) trail = appendToTrail(trail, p(i, i), 5);
    expect(trail.map((x) => x.timestamp)).toEqual([6, 7, 8, 9, 10]);
  });

  it("does not modify the original list", () => {
    const trail = [p(1, 100)];
    appendToTrail(trail, p(2, 105));
    expect(trail).toHaveLength(1);
  });
});

describe("coordinate formatting", () => {
  it("shows the hemisphere instead of a minus sign", () => {
    expect(formatLatitude(-24.872)).toBe("24.87\u00B0 S");
    expect(formatLatitude(50.1)).toBe("50.10\u00B0 N");
    expect(formatLongitude(-122.4)).toBe("122.40\u00B0 W");
    expect(formatLongitude(118.07)).toBe("118.07\u00B0 E");
  });
});
