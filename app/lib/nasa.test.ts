import { afterEach, describe, expect, it, vi } from "vitest";
import { easternDate, getAsteroids, getRecentApods, resizeImage, safeNasaUrl } from "./nasa";

const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("easternDate", () => {
  it("uses the US Eastern calendar day, not UTC", () => {
    expect(easternDate(0, new Date("2026-11-08T01:00:00Z"))).toBe("2026-11-07");
  });

  it("applies day offsets", () => {
    expect(easternDate(-6, new Date("2026-11-08T12:00:00Z"))).toBe("2026-11-02");
  });
});

describe("safeNasaUrl and resizeImage", () => {
  const image =
    "https://assets.science.nasa.gov/dynamicimage/assets/science/cds/apod/apod/2026/november/meteor_1200.jpg?w=0&h=0&fit=clip";

  it("accepts only https links on NASA domains", () => {
    expect(safeNasaUrl(image)).toBe(image);
    expect(safeNasaUrl("http://apod.nasa.gov/a.jpg")).toBeUndefined();
    expect(safeNasaUrl("https://evil.example.com/a.jpg")).toBeUndefined();
    expect(safeNasaUrl("https://nasa.gov.evil.com/a.jpg")).toBeUndefined();
    expect(safeNasaUrl("javascript:alert(1)")).toBeUndefined();
    expect(safeNasaUrl(undefined)).toBeUndefined();
  });

  it("sets the width on NASA's image host and keeps other parameters", () => {
    const resized = new URL(resizeImage(image, 320)!);
    expect(resized.searchParams.get("w")).toBe("320");
    expect(resized.searchParams.get("fit")).toBe("clip");
  });

  it("leaves other hosts untouched", () => {
    const other = "https://apod.nasa.gov/apod/image/a.jpg";
    expect(resizeImage(other, 320)).toBe(other);
  });
});

describe("getRecentApods", () => {
  const entry = (date: string, extra: Record<string, unknown> = {}) => ({
    date,
    post_id: 1,
    title: "Major <em>Fireball</em> Meteor",
    permalink: `https://science.nasa.gov/image-article/apod-${date}/`,
    media_type: "image",
    explanation: '<strong>Explanation:</strong> <a href="https://x.test">The sky glows</a> pink.',
    credit: '<a href="https://www.instagram.com/olliemtaylor/">Ollie Taylor</a>',
    copyright: '<a href="https://www.instagram.com/olliemtaylor/">Ollie Taylor</a>',
    alt: "A mountain landscape with a bright meteor trail.",
    url: `https://science.nasa.gov/image-article/apod-${date}/`,
    hdurl: `https://assets.science.nasa.gov/dynamicimage/assets/science/cds/apod/apod/${date}.jpg?w=0&h=0&fit=clip`,
    ...extra,
  });

  it("maps fields, strips HTML, and requests the right URL", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => json([entry("2026-11-08")]));

    const [apod] = await getRecentApods(7);

    const requested = new URL(String(spy.mock.calls[0][0]));
    expect(requested.searchParams.get("per_page")).toBe("7");
    expect(requested.searchParams.get("api_key")).toBeNull(); // this feed needs no key

    expect(apod).toMatchObject({
      date: "2026-11-08",
      title: "Major Fireball Meteor",
      explanation: "The sky glows pink.",
      mediaType: "image",
      alt: "A mountain landscape with a bright meteor trail.",
      copyright: "Ollie Taylor",
    });
    expect(new URL(apod.imageUrl!).searchParams.get("w")).toBe("1280");
    expect(new URL(apod.thumbUrl!).searchParams.get("w")).toBe("320");
    expect(apod.hdUrl).toContain("w=0"); // the original is left alone
  });

  it("sorts newest first", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json([entry("2026-11-06"), entry("2026-11-08"), entry("2026-11-07")]),
    );
    const apods = await getRecentApods();
    expect(apods.map((a) => a.date)).toEqual(["2026-11-08", "2026-11-07", "2026-11-06"]);
  });

  it("skips the NASA logo placeholder the old endpoint returned", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json([
        entry("2026-11-08", { hdurl: "https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png" }),
        entry("2026-11-07"),
      ]),
    );
    const apods = await getRecentApods();
    expect(apods.map((a) => a.date)).toEqual(["2026-11-07"]);
  });

  it("keeps videos, linking to the article instead of an image", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json([entry("2026-11-08", { media_type: "video", hdurl: undefined })]),
    );
    const [video] = await getRecentApods();
    expect(video.mediaType).toBe("video");
    expect(video.imageUrl).toBeUndefined();
    expect(video.url).toContain("science.nasa.gov");
  });

  it("drops entries whose image is not on a NASA domain", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      json([entry("2026-11-08", { hdurl: "https://evil.example.com/x.jpg" })]),
    );
    expect(await getRecentApods()).toEqual([]);
  });
});

describe("getAsteroids", () => {
  const sample = {
    near_earth_objects: {
      "2026-11-08": [
        {
          id: "2",
          name: "(2026 BB)",
          nasa_jpl_url: "https://ssd.jpl.nasa.gov/b",
          is_potentially_hazardous_asteroid: true,
          estimated_diameter: { kilometers: { estimated_diameter_min: 0.1, estimated_diameter_max: 0.2 } },
          close_approach_data: [
            {
              close_approach_date: "2026-11-08",
              relative_velocity: { kilometers_per_hour: "50000.5" },
              miss_distance: { kilometers: "900000", lunar: "2.3" },
            },
          ],
        },
        {
          id: "1",
          name: "(2026 AA)",
          nasa_jpl_url: "https://ssd.jpl.nasa.gov/a",
          is_potentially_hazardous_asteroid: false,
          estimated_diameter: { kilometers: { estimated_diameter_min: 0.01, estimated_diameter_max: 0.02 } },
          close_approach_data: [
            {
              close_approach_date: "2026-11-08",
              relative_velocity: { kilometers_per_hour: "20000" },
              miss_distance: { kilometers: "100000", lunar: "0.26" },
            },
          ],
        },
      ],
      "2026-11-07": [
        {
          id: "3",
          name: "(2026 CC)",
          nasa_jpl_url: "https://ssd.jpl.nasa.gov/c",
          is_potentially_hazardous_asteroid: false,
          estimated_diameter: { kilometers: { estimated_diameter_min: 0.3, estimated_diameter_max: 0.5 } },
          close_approach_data: [
            {
              close_approach_date: "2026-11-07",
              relative_velocity: { kilometers_per_hour: "30000" },
              miss_distance: { kilometers: "5000000", lunar: "13" },
            },
          ],
        },
      ],
    },
  };

  it("flattens the feed, converts numbers, and sorts by date then distance", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => json(sample));

    const asteroids = await getAsteroids("2026-11-07", "2026-11-08");

    expect(asteroids.map((a) => a.id)).toEqual(["3", "1", "2"]);
    expect(asteroids[2]).toMatchObject({
      name: "2026 BB",
      hazardous: true,
      velocityKmh: 50000.5,
      missDistanceKm: 900000,
      missDistanceLunar: 2.3,
    });
  });

  it("rejects ranges longer than 7 days before calling NASA", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    await expect(getAsteroids("2026-11-01", "2026-11-12")).rejects.toBeInstanceOf(RangeError);
    expect(spy).not.toHaveBeenCalled();
  });

  it("sends your key, and falls back to DEMO_KEY when it is missing or blank", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => json({ near_earth_objects: {} }));

    vi.stubEnv("NASA_API_KEY", "my-real-key");
    await getAsteroids("2026-11-07", "2026-11-08");
    expect(new URL(String(spy.mock.calls[0][0])).searchParams.get("api_key")).toBe("my-real-key");

    vi.stubEnv("NASA_API_KEY", "");
    await getAsteroids("2026-11-07", "2026-11-08");
    expect(new URL(String(spy.mock.calls[1][0])).searchParams.get("api_key")).toBe("DEMO_KEY");

    vi.stubEnv("NASA_API_KEY", "   ");
    await getAsteroids("2026-11-07", "2026-11-08");
    expect(new URL(String(spy.mock.calls[2][0])).searchParams.get("api_key")).toBe("DEMO_KEY");
  });
});