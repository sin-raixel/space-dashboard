import { describe, expect, it } from "vitest";
import type { Apod } from "./nasa";
import { formatApodDate, selectApod } from "./select-apod";

const make = (date: string): Apod => ({
  date,
  title: `Picture ${date}`,
  explanation: "text",
  mediaType: "image",
  url: `https://apod.nasa.gov/${date}.jpg`,
});

const week = [make("2026-11-07"), make("2026-11-06"), make("2026-11-05")];

describe("selectApod", () => {
  it("returns the requested day when it is in the loaded week", () => {
    expect(selectApod(week, "2026-11-06")?.date).toBe("2026-11-06");
  });

  it("falls back to the newest picture when the date is unknown", () => {
    expect(selectApod(week, "1999-01-01")?.date).toBe("2026-11-07");
    expect(selectApod(week, "not-a-date")?.date).toBe("2026-11-07");
  });

  it("falls back to the newest picture when no date is given", () => {
    expect(selectApod(week)?.date).toBe("2026-11-07");
  });

  it("returns undefined for an empty list", () => {
    expect(selectApod([])).toBeUndefined();
  });
});

describe("formatApodDate", () => {
  it("formats a calendar date without shifting the day", () => {
    expect(formatApodDate("2026-11-07")).toBe("November 7, 2026");
  });
});