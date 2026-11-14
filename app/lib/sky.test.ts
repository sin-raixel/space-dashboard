import { describe, expect, it } from "vitest";
import { CONSTELLATIONS } from "./constellations";
import {
  altAz,
  compassPoint,
  describeAltitude,
  locationErrorMessage,
  localSiderealTime,
  nextClockTime,
  parseCoordinates,
  skyAt,
  sunAltitude,
  sunPhase,
} from "./sky";

describe("localSiderealTime", () => {
  it("matches the known value at the J2000 epoch", () => {
    // At 2000-01-01 12:00 UTC, Greenwich sidereal time is 280.4606 degrees.
    expect(localSiderealTime(new Date("2000-01-01T12:00:00Z"), 0)).toBeCloseTo(280.4606, 3);
  });

  it("adds longitude to the east and wraps at 360", () => {
    const date = new Date("2000-01-01T12:00:00Z");
    expect(localSiderealTime(date, 90)).toBeCloseTo(10.4606, 3);
    expect(localSiderealTime(date, -90)).toBeCloseTo(190.4606, 3);
  });
});

describe("altAz", () => {
  it("puts a point at the zenith when its declination equals the latitude and it is on the meridian", () => {
    expect(altAz(100, 30, 30, 100).altitude).toBeCloseTo(90, 5);
  });

  it("puts the celestial equator due south, at 90 minus latitude, when on the meridian", () => {
    const { altitude, azimuth } = altAz(100, 0, 30, 100);
    expect(altitude).toBeCloseTo(60, 5);
    expect(azimuth).toBeCloseTo(180, 5);
  });

  it("keeps a point near the north celestial pole at about the observer's latitude, due north", () => {
    const { altitude, azimuth } = altAz(37.95, 89.99, 14.7, 200);
    expect(altitude).toBeCloseTo(14.7, 1);
    expect(Math.min(azimuth, 360 - azimuth)).toBeLessThan(1);
  });

  it("puts a rising point in the east and a setting one in the west", () => {
    // An hour angle of -6 hours (90 degrees before the meridian) on the equator is on the eastern horizon.
    expect(altAz(100, 0, 0, 10).azimuth).toBeCloseTo(90, 5);
    expect(altAz(100, 0, 0, 190).azimuth).toBeCloseTo(270, 5);
  });
});

describe("sun", () => {
  it("is nearly overhead at noon on the equator near an equinox and well below the horizon at midnight", () => {
    expect(sunAltitude(new Date("2026-03-20T12:00:00Z"), 0, 0)).toBeGreaterThan(85);
    expect(sunAltitude(new Date("2026-03-20T00:00:00Z"), 0, 0)).toBeLessThan(-80);
  });

  it("peaks at 90 minus the gap to its declination at solar noon on the June solstice", () => {
    // Solar noon at 120.5 E is around 04:00 UTC. At 14.7 N the Sun's declination of 23.4 N puts it about 81 degrees up.
    const noon = sunAltitude(new Date("2026-06-21T04:00:00Z"), 14.7, 120.5);
    expect(noon).toBeGreaterThan(80.5);
    expect(noon).toBeLessThan(82);
  });

  it("sorts altitudes into day, twilight and night", () => {
    expect(sunPhase(30)).toBe("day");
    expect(sunPhase(-0.5)).toBe("day");
    expect(sunPhase(-10)).toBe("twilight");
    expect(sunPhase(-25)).toBe("night");
  });
});

describe("compassPoint and describeAltitude", () => {
  it("names the compass direction", () => {
    expect(compassPoint(0)).toBe("N");
    expect(compassPoint(350)).toBe("N");
    expect(compassPoint(45)).toBe("NE");
    expect(compassPoint(90)).toBe("E");
    expect(compassPoint(180)).toBe("S");
    expect(compassPoint(202.5)).toBe("SSW");
    expect(compassPoint(270)).toBe("W");
  });

  it("describes how high something is", () => {
    expect(describeAltitude(80)).toBe("Almost overhead");
    expect(describeAltitude(50)).toBe("High in the sky");
    expect(describeAltitude(30)).toBe("Halfway up the sky");
    expect(describeAltitude(12)).toBe("Low, near the horizon");
  });
});

describe("nextClockTime", () => {
  it("picks later today when the time has not come yet", () => {
    const result = nextClockTime(20, new Date(2026, 10, 14, 15, 0));
    expect([result.getDate(), result.getHours(), result.getMinutes()]).toEqual([14, 20, 0]);
  });

  it("still counts a time that passed a few minutes ago", () => {
    const result = nextClockTime(20, new Date(2026, 10, 14, 20, 10));
    expect([result.getDate(), result.getHours()]).toEqual([14, 20]);
  });

  it("moves to tomorrow once the time is well past", () => {
    const result = nextClockTime(20, new Date(2026, 10, 14, 21, 0));
    expect([result.getDate(), result.getHours()]).toEqual([15, 20]);
  });

  it("treats midnight as the coming midnight", () => {
    const result = nextClockTime(0, new Date(2026, 10, 14, 15, 0));
    expect([result.getDate(), result.getHours()]).toEqual([15, 0]);
  });
});

describe("skyAt", () => {
  // 14 Nov 2026, 22:00 at roughly 14.7 N, 120.5 E (Philippine time, UTC+8 = 14:00 UTC).
  const evening = new Date("2026-11-14T14:00:00Z");
  const report = skyAt(evening, 14.7, 120.5);
  const names = (list: { name: string }[]) => list.map((c) => c.name);

  it("shows Orion rising in the east and the evening dark", () => {
    const orion = report.visible.find((c) => c.name === "Orion");
    expect(orion).toBeDefined();
    expect(orion!.azimuth).toBeGreaterThan(70);
    expect(orion!.azimuth).toBeLessThan(120);
    expect(report.sun.phase).toBe("night");
  });

  it("leaves out constellations that are below the horizon", () => {
    expect(names(report.visible)).not.toContain("Ursa Major");
    expect(names(report.aboveHorizon)).not.toContain("Ursa Major");
  });

  it("shows a low, large constellation as partly in view instead of up", () => {
    // Canis Major's centre is only a few degrees up, but the constellation is wide enough to reach higher.
    expect(names(report.visible)).not.toContain("Canis Major");
    expect(names(report.partial)).toContain("Canis Major");
  });

  it("sorts visible constellations from highest to lowest", () => {
    const altitudes = report.visible.map((c) => c.altitude);
    expect(altitudes).toEqual([...altitudes].sort((a, b) => b - a));
  });

  it("never lists the same constellation as both visible and partial", () => {
    const visible = new Set(names(report.visible));
    expect(names(report.partial).some((name) => visible.has(name))).toBe(false);
  });

  it("flags constellations that never set, using the observer's latitude", () => {
    expect(names(skyAt(evening, 50, 0).circumpolar)).toContain("Ursa Minor");
    expect(names(skyAt(evening, 50, 0).circumpolar)).not.toContain("Orion");
    expect(names(skyAt(evening, -33, 0).circumpolar)).toContain("Octans");
    expect(skyAt(evening, 0, 0).circumpolar).toEqual([]);
  });

  it("keeps far-southern constellations out of view from the north", () => {
    expect(names(skyAt(evening, 50, 8).aboveHorizon)).not.toContain("Octans");
  });
});

describe("parseCoordinates", () => {
  it("accepts decimal degrees, including negatives and surrounding spaces", () => {
    expect(parseCoordinates(" 14.7 ", "120.5")).toEqual({ ok: true, latitude: 14.7, longitude: 120.5 });
    expect(parseCoordinates("-33.9", "-70")).toEqual({ ok: true, latitude: -33.9, longitude: -70 });
  });

  it("rejects empty, non-numeric and out-of-range values", () => {
    expect(parseCoordinates("", "10").ok).toBe(false);
    expect(parseCoordinates("abc", "10").ok).toBe(false);
    expect(parseCoordinates("91", "10").ok).toBe(false);
    expect(parseCoordinates("10", "181").ok).toBe(false);
    expect(parseCoordinates("10", "").ok).toBe(false);
  });

  it("says which field is wrong", () => {
    const badLatitude = parseCoordinates("200", "10");
    const badLongitude = parseCoordinates("10", "200");
    expect(!badLatitude.ok && badLatitude.error).toMatch(/Latitude/);
    expect(!badLongitude.ok && badLongitude.error).toMatch(/Longitude/);
  });
});

describe("locationErrorMessage", () => {
  it("gives a different message for each geolocation error", () => {
    const messages = [1, 2, 3, 0].map(locationErrorMessage);
    expect(new Set(messages).size).toBe(4);
  });
});

describe("CONSTELLATIONS", () => {
  it("lists all 88 constellations, with Serpens in two pieces", () => {
    expect(CONSTELLATIONS).toHaveLength(89);
  });

  it("has unique names and codes", () => {
    expect(new Set(CONSTELLATIONS.map((c) => c.name)).size).toBe(CONSTELLATIONS.length);
    expect(new Set(CONSTELLATIONS.map((c) => c.abbr)).size).toBe(CONSTELLATIONS.length);
  });

  it("keeps every coordinate in range", () => {
    for (const c of CONSTELLATIONS) {
      expect(c.raHours).toBeGreaterThanOrEqual(0);
      expect(c.raHours).toBeLessThan(24);
      expect(Math.abs(c.decDeg)).toBeLessThanOrEqual(90);
      expect(c.radiusDeg).toBeGreaterThan(0);
    }
  });
});
