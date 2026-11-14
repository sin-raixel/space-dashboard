import Link from "next/link";
import { LuCrosshair, LuEye, LuMaximize2, LuTriangleAlert } from "react-icons/lu";
import { loadAsteroids } from "../lib/asteroids";
import {
  SIZE_OPTIONS,
  SORT_OPTIONS,
  diameterM,
  filterAsteroids,
  parseFilters,
  perDayCounts,
  scatterPoints,
  summarize,
} from "../lib/asteroid-filters";
import AsteroidCard from "./asteroid-card";
import AsteroidCharts from "./asteroid-charts";
import StatCard from "./stat-card";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export default async function AsteroidsSection({ searchParams }: Props) {
  // Reading searchParams makes this part render at request time, inside <Suspense>.
  const filters = parseFilters(await searchParams);
  const result = await loadAsteroids();

  if (!result.ok) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
        <p className="font-semibold text-rose-200">Couldn&rsquo;t load the asteroid data</p>
        <p className="mt-2">{result.message}</p>
        <Link href="/asteroids" className="glow-link mt-4 inline-block">
          Try again
        </Link>
      </div>
    );
  }

  const rows = filterAsteroids([...result.asteroids], filters);
  const stats = summarize(rows);
  const fetchedAt = new Date(result.fetchedAt).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-10">
      <p className="text-violet-100/80">
        Predicted close approaches from {result.start} to {result.end} (US Eastern dates).{" "}
        {result.asteroids.length} objects in total.
      </p>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Showing"
          value={String(stats.total)}
          note={`of ${result.asteroids.length} objects`}
          icon={<LuEye />}
        />
        <StatCard label="Potentially hazardous" value={String(stats.hazardous)} icon={<LuTriangleAlert />} />
        <StatCard
          label="Closest approach"
          value={stats.closest ? stats.closest.missDistanceLunar.toFixed(1) : "-"}
          unit={stats.closest ? "LD" : undefined}
          note={stats.closest?.name}
          icon={<LuCrosshair />}
        />
        <StatCard
          label="Largest"
          value={stats.largest ? whole.format(diameterM(stats.largest)) : "-"}
          unit={stats.largest ? "m" : undefined}
          note={stats.largest?.name}
          icon={<LuMaximize2 />}
        />
      </dl>

      {/* A plain GET form: filters live in the URL, so a filtered view can be shared or bookmarked. */}
      <form method="get" action="/asteroids" className="panel flex flex-wrap items-end gap-x-6 gap-y-4 p-4">
        <label className="flex cursor-pointer items-center gap-2 transition-colors hover:text-white">
          <input type="checkbox" name="hazard" value="1" defaultChecked={filters.hazardousOnly} className="size-4 cursor-pointer accent-violet-500" />
          Potentially hazardous only
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Minimum size
          <select name="minSize" defaultValue={String(filters.minSizeM)} className="field">
            {SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size === 0 ? "Any size" : `${size} m or more`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sort by
          <select name="sort" defaultValue={filters.sort} className="field">
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" className="btn-cosmic">
          Apply
        </button>
        <Link href="/asteroids" className="glow-link py-2 text-sm">
          Reset
        </Link>
      </form>

      {rows.length === 0 ? (
        <p role="status">No asteroids match these filters. Try a smaller minimum size.</p>
      ) : (
        <>
          <AsteroidCharts days={perDayCounts(rows)} points={scatterPoints(rows)} />

          <section aria-labelledby="approaches-heading">
            <h2 id="approaches-heading" className="eyebrow mb-5">
              Every close approach
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {rows.map((a) => (
                <li key={`${a.id}-${a.date}`}>
                  <AsteroidCard asteroid={a} />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <p className="text-xs text-violet-300/50">
        LD = lunar distance, the average distance from Earth to the Moon (about 384,400 km). Data from
        NASA&rsquo;s NeoWs, loaded {fetchedAt} (Philippine time) and cached for hours.
      </p>
    </div>
  );
}
