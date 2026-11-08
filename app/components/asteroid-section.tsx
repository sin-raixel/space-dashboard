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
const field = "rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100";

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-semibold tracking-widest text-violet-300 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {note && <p className="mt-1 truncate text-sm">{note}</p>}
    </div>
  );
}

export default async function AsteroidsSection({ searchParams }: Props) {
  // Reading searchParams makes this part render at request time, inside <Suspense>.
  const filters = parseFilters(await searchParams);
  const result = await loadAsteroids();

  if (!result.ok) {
    return (
      <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6">
        <p className="font-semibold text-red-200">Couldn&rsquo;t load the asteroid data</p>
        <p className="mt-2">{result.message}</p>
        <Link href="/asteroids" className="mt-4 inline-block underline underline-offset-4 hover:text-white">
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
      <p>
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
      <form method="get" action="/asteroids" className="flex flex-wrap items-end gap-x-6 gap-y-4 rounded-xl border border-slate-800 p-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="hazard" value="1" defaultChecked={filters.hazardousOnly} className="size-4 accent-violet-500" />
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
        <button type="submit" className="rounded-md bg-violet-600 px-5 py-2 font-medium text-white hover:bg-violet-500">
          Apply
        </button>
        <Link href="/asteroids" className="py-2 text-sm underline underline-offset-4 hover:text-white">
          Reset
        </Link>
      </form>

      {rows.length === 0 ? (
        <p role="status">No asteroids match these filters. Try a smaller minimum size.</p>
      ) : (
        <>
          <AsteroidCharts days={perDayCounts(rows)} points={scatterPoints(rows)} />

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Near-Earth asteroids and their close approaches</caption>
              <thead className="bg-slate-900 text-xs tracking-widest text-violet-300 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3">Name</th>
                  <th scope="col" className="px-4 py-3">Date</th>
                  <th scope="col" className="px-4 py-3">Size</th>
                  <th scope="col" className="px-4 py-3">Miss distance</th>
                  <th scope="col" className="px-4 py-3">Speed</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {rows.map((a) => {
                  const link = safeNasaUrl(a.jplUrl);
                  return (
                    <tr key={`${a.id}-${a.date}`} className="hover:bg-slate-900/60">
                      <th scope="row" className="px-4 py-3 font-medium text-white">
                        {link ? (
                          <a href={link} target="_blank" rel="noreferrer" className="underline decoration-slate-600 underline-offset-4 hover:decoration-violet-300">
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
                        <span className="block text-xs text-slate-500">{whole.format(a.missDistanceKm)} km</span>
                      </td>
                      <td className="px-4 py-3">{whole.format(a.velocityKmh)} km/h</td>
                      <td className="px-4 py-3">
                        {a.hazardous ? (
                          <span className="rounded-full bg-red-500/15 px-2 py-1 text-xs text-red-300">Potentially hazardous</span>
                        ) : (
                          <span className="text-slate-500">&mdash;</span>
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

      <p className="text-xs text-slate-500">
        LD = lunar distance, the average distance from Earth to the Moon (about 384,400 km). Data from
        NASA&rsquo;s NeoWs, loaded {fetchedAt} (Philippine time) and cached for hours.
      </p>
    </div>
  );
}