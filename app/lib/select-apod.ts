import type { Apod } from "./nasa";

// Pick the picture the visitor asked for, but only from the week we already
// loaded. Anything else (typos, old dates, junk) falls back to the newest one,
// so a visitor can never trigger extra NASA requests by editing the URL.
export function selectApod(items: Apod[], requestedDate?: string): Apod | undefined {
  return items.find((item) => item.date === requestedDate) ?? items[0];
}

// "2026-11-07" -> "November 7, 2026" (no timezone surprises)
export function formatApodDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}