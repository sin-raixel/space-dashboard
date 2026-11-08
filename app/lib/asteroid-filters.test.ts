import { describe, expect, it } from "vitest";
import {
  filterAsteroids,
  parseFilters,
  perDayCounts,
  scatterPoints,
  summarize,
  type Filters,
} from "./asteroid-filters";
import type { Asteroid } from "./nasa";

const make = (id: string, over: Partial<Asteroid> = {}): Asteroid => ({
  id,
  name: `Rock ${id}`,
  date: "2026-11-08",
  diameterMinKm: 0.04,
  diameterMaxKm: 0.06, // average 50 m
  hazardous: false,
  velocityKmh: 20000,
  missDistanceKm: 1_000_000,
  missDistanceLunar: 2.6,
  jplUrl: "https://ssd.jpl.nasa.gov/x",
  ...over,
});

const base: Filters = { hazardousOnly: false, minSizeM: 0, sort: "date" };

const list = [
  make("a", { date: "2026-11-09", missDistanceKm: 500_000, velocityKmh: 90000 }),
  make("b", { hazardous: true, diameterMinKm: 0.2, diameterMaxKm: 0.4, missDistanceKm: 3_000_000 }), // 300 m
  make("c", { date: "2026-11-10", diameterMinKm: 0.8, diameterMaxKm: 1.2, missDistanceKm: 9_000_000, velocityKmh: 50000 }), // 1000 m
];

describe("parseFilters", () => {
  it("uses safe defaults when nothing is given", () => {
    expect(parseFilters({})).toEqual({ hazardousOnly: false, minSizeM: 0, sort: "date" });
  });

  it("reads valid values", () => {
    expect(parseFilters({ hazard: "1", minSize: "100", sort: "size" })).toEqual({
      hazardousOnly: true,
      minSizeM: 100,
      sort: "size",
    });
  });

  it("ignores junk, unknown options, and arrays of values", () => {
    expect(parseFilters({ hazard: "yes", minSize: "99999", sort: "drop table" })).toEqual({
      hazardousOnly: false,
      minSizeM: 0,
      sort: "date",
    });
    expect(parseFilters({ sort: ["speed", "size"], minSize: ["250"] })).toMatchObject({
      sort: "speed",
      minSizeM: 250,
    });
  });
});

describe("filterAsteroids", () => {
  it("keeps only potentially hazardous objects when asked", () => {
    expect(filterAsteroids(list, { ...base, hazardousOnly: true }).map((a) => a.id)).toEqual(["b"]);
  });

  it("applies a minimum size in metres", () => {
    expect(filterAsteroids(list, { ...base, minSizeM: 250 }).map((a) => a.id)).toEqual(["b", "c"]);
  });

  it("sorts by date, distance, size, and speed", () => {
    expect(filterAsteroids(list, { ...base, sort: "date" }).map((a) => a.id)).toEqual(["b", "a", "c"]);
    expect(filterAsteroids(list, { ...base, sort: "distance" }).map((a) => a.id)).toEqual(["a", "b", "c"]);
    expect(filterAsteroids(list, { ...base, sort: "size" }).map((a) => a.id)).toEqual(["c", "b", "a"]);
    expect(filterAsteroids(list, { ...base, sort: "speed" }).map((a) => a.id)).toEqual(["a", "c", "b"]);
  });

  it("does not change the list it was given", () => {
    const copy = [...list];
    filterAsteroids(list, { ...base, sort: "size" });
    expect(list).toEqual(copy);
  });
});

describe("summarize, perDayCounts, scatterPoints", () => {
  it("finds the totals, the closest, and the largest", () => {
    const s = summarize(list);
    expect(s).toMatchObject({ total: 3, hazardous: 1 });
    expect(s.closest?.id).toBe("a");
    expect(s.largest?.id).toBe("c");
  });

  it("handles an empty list", () => {
    expect(summarize([])).toEqual({ total: 0, hazardous: 0, closest: undefined, largest: undefined });
  });

  it("counts objects per day, split by hazard, in date order", () => {
    expect(perDayCounts(list)).toEqual([
      { date: "2026-11-08", hazardous: 1, other: 0 },
      { date: "2026-11-09", hazardous: 0, other: 1 },
      { date: "2026-11-10", hazardous: 0, other: 1 },
    ]);
  });

  it("drops points that a log chart cannot draw", () => {
    const points = scatterPoints([make("ok"), make("zero", { missDistanceLunar: 0 })]);
    expect(points.map((p) => p.name)).toEqual(["Rock ok"]);
    expect(points[0].sizeM).toBeCloseTo(50);
  });
});