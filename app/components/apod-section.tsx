import Link from "next/link";
import { loadWeek } from "../lib/apod";
import { formatApodDate, selectApod } from "../lib/select-apod";

type Props = { searchParams: Promise<{ date?: string | string[] }> };

const linkClass = "text-violet-300 underline underline-offset-4 hover:text-white";

export default async function ApodSection({ searchParams }: Props) {
  // Reading searchParams makes this part render at request time, inside <Suspense>.
  const { date } = await searchParams;
  const result = await loadWeek();

  if (!result.ok) {
    return (
      <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6">
        <p className="font-semibold text-red-200">Couldn&rsquo;t load the astronomy picture</p>
        <p className="mt-2">{result.message}</p>
        <Link href="/" className="mt-4 inline-block underline underline-offset-4 hover:text-white">
          Try again
        </Link>
      </div>
    );
  }

  const selected = selectApod(result.items, typeof date === "string" ? date : undefined);
  if (!selected) {
    return <p role="status">NASA has no pictures for this week yet. Please check back later.</p>;
  }

  const fetchedAt = new Date(result.fetchedAt).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div>
      <figure>
        {selected.imageUrl ? (
          // NASA's image host isn't configured for next/image, so a plain <img> is used.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={selected.imageUrl}
            alt={selected.alt ?? selected.title}
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 object-contain"
          />
        ) : (
          <div className="grid aspect-video place-items-center rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center">
            This one is a video, so there&rsquo;s no still picture to show here.
          </div>
        )}
        <figcaption className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {selected.mediaType === "video" && (
            <a href={selected.url} target="_blank" rel="noreferrer" className={linkClass}>
              Watch on NASA&rsquo;s site
            </a>
          )}
          {selected.hdUrl && (
            <a href={selected.hdUrl} target="_blank" rel="noreferrer" className={linkClass}>
              Open full resolution
            </a>
          )}
          {selected.copyright && <span>Credit: {selected.copyright}</span>}
        </figcaption>
      </figure>

      <p className="mt-8 text-sm text-violet-300">{formatApodDate(selected.date)}</p>
      <h2 className="mt-1 text-3xl font-bold tracking-tight text-white">{selected.title}</h2>
      <p className="mt-4 max-w-3xl leading-relaxed whitespace-pre-line">{selected.explanation}</p>

      <nav aria-label="Pictures from the past week" className="mt-12">
        <h3 className="text-lg font-semibold text-white">The past week</h3>
        <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {result.items.map((item) => {
            const current = item.date === selected.date;
            return (
              <li key={item.date}>
                <Link
                  href={`/?date=${item.date}`}
                  scroll={false}
                  aria-current={current ? "true" : undefined}
                  className={`block overflow-hidden rounded-lg border transition-all ${
                    current ? "border-violet-400" : "border-slate-800 opacity-70 hover:opacity-100"
                  }`}
                >
                  {item.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbUrl} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                  ) : (
                    <div className="grid aspect-square place-items-center bg-slate-900 text-xs">Video</div>
                  )}
                  <span className="block px-2 py-1 text-xs">{formatApodDate(item.date).replace(/, \d{4}$/, "")}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mt-10 text-xs text-slate-500">
        Data from NASA Science&rsquo;s picture-of-the-day feed, loaded {fetchedAt} (Philippine time) and cached for hours.
      </p>
    </div>
  );
}