"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { LuGauge, LuMoveHorizontal, LuMoveVertical, LuMountain } from "react-icons/lu";
import { appendToTrail, formatLatitude, formatLongitude } from "../lib/iss-geo";
import type { IssPosition, TrailPoint } from "../lib/iss-types";
import StatCard from "./stat-card";

// Leaflet needs the browser's window object, so the map is only loaded on the client.
const IssMap = dynamic(() => import("./iss-map"), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-[28rem] w-full rounded-xl bg-violet-900/30 motion-safe:animate-pulse" />,
});

const POLL_MS = 5_000;
const MAX_POLL_MS = 60_000;
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const VISIBILITY: Record<string, string> = { daylight: "In sunlight", eclipsed: "In Earth\u2019s shadow" };

async function errorFrom(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? "The ISS tracker is unavailable right now.";
  } catch {
    return "The ISS tracker is unavailable right now.";
  }
}

export default function IssTracker() {
  const [position, setPosition] = useState<IssPosition | null>(null);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [follow, setFollow] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = POLL_MS;

    // The orbit so far, loaded once. Failing here is fine: the live trail still grows.
    async function loadTrail() {
      try {
        const response = await fetch("/api/iss/trail", { signal });
        if (response.ok) setTrail(await response.json());
      } catch {
        /* ignore: the live trail covers for it */
      }
    }

    async function poll() {
      if (signal.aborted) return;

      // Don't spend requests while the tab is in the background.
      if (document.visibilityState === "hidden") {
        timer = setTimeout(poll, POLL_MS);
        return;
      }

      try {
        const response = await fetch("/api/iss", { signal, cache: "no-store" });
        if (!response.ok) throw new Error(await errorFrom(response));
        const next = (await response.json()) as IssPosition;
        setPosition(next);
        setTrail((current) => appendToTrail(current, next));
        setError(null);
        delay = POLL_MS;
      } catch (caught) {
        if (signal.aborted) return;
        setError(
          caught instanceof TypeError
            ? "Couldn\u2019t reach the dashboard server. Retrying\u2026"
            : caught instanceof Error
              ? caught.message
              : "The ISS tracker is unavailable right now.",
        );
        delay = Math.min(delay * 2, MAX_POLL_MS); // back off while it is failing
      }
      timer = setTimeout(poll, delay);
    }

    // Trail first, then live updates, so the two requests don't hit the feed's limit together.
    loadTrail().then(poll);

    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="space-y-8">
      {error && (
        <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4">
          <p className="font-semibold text-rose-200">Live position unavailable</p>
          <p className="mt-1 text-sm">
            {error} {position ? "Showing the last known position." : ""}
          </p>
        </div>
      )}

      <div className="hud-corners panel p-2">
        <IssMap position={position} trail={trail} follow={follow} />
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm transition-colors hover:text-white">
        <input
          type="checkbox"
          checked={follow}
          onChange={(event) => setFollow(event.target.checked)}
          className="size-4 cursor-pointer accent-violet-500"
        />
        Keep the map centered on the ISS
      </label>

      {position ? (
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Latitude" value={formatLatitude(position.latitude)} icon={<LuMoveVertical />} />
          <StatCard label="Longitude" value={formatLongitude(position.longitude)} icon={<LuMoveHorizontal />} />
          <StatCard label="Altitude" value={whole.format(position.altitudeKm)} unit="km" icon={<LuMountain />} />
          <StatCard label="Speed" value={whole.format(position.velocityKmh)} unit="km/h" icon={<LuGauge />} />
        </dl>
      ) : (
        !error && <p role="status">Locating the ISS&hellip;</p>
      )}

      {position && (
        <p className="panel flex flex-wrap items-center gap-x-2 gap-y-1 px-5 py-3 text-sm text-violet-100/80">
          <span className="eyebrow inline-flex items-center gap-2 !text-[0.65rem]">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-fuchsia-400 motion-safe:animate-[ping-soft_1.8s_ease-out_infinite]" />
              <span className="relative inline-flex size-2 rounded-full bg-fuchsia-400" />
            </span>
            Live
          </span>
          {VISIBILITY[position.visibility] ?? position.visibility}. Position time:{" "}
          {new Date(position.timestamp * 1000).toLocaleTimeString("en-PH", {
            timeZone: "Asia/Manila",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}{" "}
          (Philippine time). Updates every few seconds while this tab is open.
        </p>
      )}

      <p className="text-xs text-violet-300/50">
        Orbit data from wheretheiss.at. Map &copy; OpenStreetMap contributors. The purple line is where the ISS has
        been over roughly the last 90 minutes, about one orbit.
      </p>
    </div>
  );
}
