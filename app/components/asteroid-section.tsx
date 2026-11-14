import Link from "next/link";
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
import { safeNasaUrl } from "../lib/nasa";
import AsteroidCharts from "./asteroid-charts";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const field = "field";

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="panel panel-hover p-4">
      <p className="eyebrow !text-[0.65rem] !tracking-[0.2em]">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold text-white">{value}</p>
      {note && <p className="mt-1 truncate text-sm text-violet-200/70">{note}</p>}
    </div>
  );
}

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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Showing" value={String(stats.total)} note={`of ${result.asteroids.length} objects`} />
        <Stat label="Potentially hazardous" value={String(stats.hazardous)} />
        <Stat
          label="Closest approach"
          value={stats.closest ? `${stats.closest.missDistanceLunar.toFixed(1)} LD` : "-"}
          note={stats.closest?.name}
        />
        <Stat
          label="Largest"
          value={stats.largest ? `${whole.format(diameterM(stats.largest))} m` : "-"}
          note={stats.largest?.name}
        />
      </div>

      {/* A plain GET form: filters live in the URL, so a filtered view can be shared or bookmarked. */}
      <form method="get" action="/asteroids" className="panel flex flex-wrap items-end gap-x-6 gap-y-4 p-4">
        <label className="flex cursor-pointer items-center gap-2 transition-colors hover:text-white">
          <input type="checkbox" name="hazard" value="1" defaultChecked={filters.hazardousOnly} className="size-4 cursor-pointer accent-violet-500" />
          Potentially hazardous only
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Minimum size
          <select name="minSize" defaultValue={String(filters.minSizeM)} className={field}>
            {SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size === 0 ? "Any size" : `${size} m or more`}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Sort by
          <select name="sort" defaultValue={filters.sort} className={field}>
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

          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Near-Earth asteroids and their close approaches</caption>
              <thead className="bg-violet-950/70 font-display text-[0.7rem] tracking-[0.18em] text-violet-300 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">Name</th>
                  <th scope="col" className="px-4 py-3">Date</th>
                  <th scope="col" className="px-4 py-3">Size</th>
                  <th scope="col" className="px-4 py-3">Miss distance</th>
                  <th scope="col" className="px-4 py-3">Speed</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-violet-400/10">
                {rows.map((a) => {
                  const link = safeNasaUrl(a.jplUrl);
                  return (
                    <tr key={`${a.id}-${a.date}`} className="transition-colors hover:bg-violet-500/10">
                      <th scope="row" className="px-4 py-3 font-medium text-white">
                        {link ? (
                          <a href={link} target="_blank" rel="noreferrer" className="glow-link !text-white">
                            {a.name}
                          </a>
                        ) : (
                          a.name
                        )}
                      </th>
                      <td className="px-4 py-3">{a.date}</td>
                      <td className="px-4 py-3">
                        {whole.format(a.diameterMinKm * 1000)}&ndash;{whole.format(a.diameterMaxKm * 1000)} m
                      </td>
                      <td className="px-4 py-3">
                        {a.missDistanceLunar.toFixed(1)} LD
                        <span className="block text-xs text-violet-300/50">{whole.format(a.missDistanceKm)} km</span>
                      </td>
                      <td className="px-4 py-3">{whole.format(a.velocityKmh)} km/h</td>
                      <td className="px-4 py-3">
                        {a.hazardous ? (
                          <span className="rounded-full border border-rose-400/30 bg-rose-500/15 px-2 py-1 text-xs text-rose-300 shadow-[0_0_12px_-2px_rgb(251_113_133/0.6)]">Potentially hazardous</span>
                        ) : (
                          <span className="text-violet-300/40">&mdash;</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <p className="text-xs text-violet-300/50">
        LD = lunar distance, the average distance from Earth to the Moon (about 384,400 km). Data from
        NASA&rsquo;s NeoWs, loaded {fetchedAt} (Philippine time) and cached for hours.
      </p>
    </div>
  );
}