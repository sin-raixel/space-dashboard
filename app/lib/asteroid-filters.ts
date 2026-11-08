import type { Asteroid } from "./nasa";

export type SortKey = "date" | "distance" | "size" | "speed";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "date", label: "Date" },
  { value: "distance", label: "Closest first" },
  { value: "size", label: "Largest first" },
  { value: "speed", label: "Fastest first" },
];

export const SIZE_OPTIONS = [0, 50, 100, 250, 500]; // metres

export type Filters = { hazardousOnly: boolean; minSizeM: number; sort: SortKey };

type Params = Record<string, string | string[] | undefined>;
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

// URL parameters are user input: anything unexpected falls back to a safe default.
export function parseFilters(params: Params): Filters {
  const sort = SORT_OPTIONS.find((option) => option.value === first(params.sort))?.value ?? "date";
  const size = Number(first(params.minSize));
  return {
    hazardousOnly: first(params.hazard) === "1",
    minSizeM: SIZE_OPTIONS.includes(size) ? size : 0,
    sort,
  };
}

// Average of NASA's estimated minimum and maximum diameter, in metres.
export const diameterM = (a: Asteroid) => ((a.diameterMinKm + a.diameterMaxKm) / 2) * 1000;

export function filterAsteroids(list: Asteroid[], filters: Filters): Asteroid[] {
  const kept = list.filter(
    (a) => (!filters.hazardousOnly || a.hazardous) && diameterM(a) >= filters.minSizeM,
  );

  switch (filters.sort) {
    case "distance":
      return kept.sort((a, b) => a.missDistanceKm - b.missDistanceKm);
    case "size":
      return kept.sort((a, b) => diameterM(b) - diameterM(a));
    case "speed":
      return kept.sort((a, b) => b.velocityKmh - a.velocityKmh);
    default:
      return kept.sort((a, b) => a.date.localeCompare(b.date) || a.missDistanceKm - b.missDistanceKm);
  }
}

export function summarize(list: Asteroid[]) {
  let closest: Asteroid | undefined;
  let largest: Asteroid | undefined;
  for (const a of list) {
    if (!closest || a.missDistanceKm < closest.missDistanceKm) closest = a;
    if (!largest || diameterM(a) > diameterM(largest)) largest = a;
  }
  return { total: list.length, hazardous: list.filter((a) => a.hazardous).length, closest, largest };
}

export type DayCount = { date: string; hazardous: number; other: number };

export function perDayCounts(list: Asteroid[]): DayCount[] {
  const days = new Map<string, DayCount>();
  for (const a of list) {
    const day = days.get(a.date) ?? { date: a.date, hazardous: 0, other: 0 };
    if (a.hazardous) day.hazardous += 1;
    else day.other += 1;
    days.set(a.date, day);
  }
  return [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export type ScatterPoint = { name: string; sizeM: number; lunar: number; hazardous: boolean };

// Both axes of the chart are logarithmic, so only positive values can be drawn.
export function scatterPoints(list: Asteroid[]): ScatterPoint[] {
  return list
    .map((a) => ({ name: a.name, sizeM: diameterM(a), lunar: a.missDistanceLunar, hazardous: a.hazardous }))
    .filter((p) => p.sizeM > 0 && p.lunar > 0);
}