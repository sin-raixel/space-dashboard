import Link from "next/link";
import { loadWeek } from "../lib/apod";
import { formatApodDate, selectApod } from "../lib/select-apod";
import ApodViewer from "./apod-viewer";

type Props = { searchParams: Promise<{ date?: string | string[] }> };

export default async function ApodSection({ searchParams }: Props) {
  // Reading searchParams makes this part render at request time, inside <Suspense>.
  const { date } = await searchParams;
  const result = await loadWeek();

  if (!result.ok) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-6">
        <p className="font-semibold text-rose-200">Couldn&rsquo;t load the astronomy picture</p>
        <p className="mt-2">{result.message}</p>
        <Link href="/" className="glow-link mt-4 inline-block">
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
      <ApodViewer
        media={
          selected.imageUrl ? (
            <>
              {/* A blurred copy fills the empty space around the picture when the frame is resized. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.imageUrl}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="absolute inset-0 size-full scale-125 object-cover opacity-50 blur-2xl"
              />
              {/* NASA's image host isn't configured for next/image, so a plain <img> is used. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selected.imageUrl}
                alt={selected.alt ?? selected.title}
                draggable={false}
                className="relative size-full object-contain"
              />
            </>
          ) : (
            <div className="grid size-full place-items-center bg-violet-950/40 p-6 text-center">
              This one is a video, so there&rsquo;s no still picture to show here.
            </div>
          )
        }
        aside={
          <article className="panel p-6 sm:p-7 lg:max-h-[var(--frame-h)] lg:overflow-y-auto">
            <p className="eyebrow">{formatApodDate(selected.date)}</p>
            <h2 className="mt-3 font-display text-xl font-bold tracking-wide text-white sm:text-2xl">{selected.title}</h2>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm">
              {selected.mediaType === "video" && (
                <a href={selected.url} target="_blank" rel="noreferrer" className="btn-cosmic">
                  Watch on NASA&rsquo;s site
                </a>
              )}
              {selected.hdUrl && (
                <a href={selected.hdUrl} target="_blank" rel="noreferrer" className="btn-cosmic">
                  Open full resolution
                </a>
              )}
              {selected.copyright && <span className="text-violet-200/70">Credit: {selected.copyright}</span>}
            </div>

            <p className="mt-6 border-t border-violet-400/15 pt-5 leading-relaxed whitespace-pre-line text-violet-100/80">{selected.explanation}</p>

          </article>
        }
      />

      <nav aria-label="Pictures from the past week" className="mt-12">
        <h3 className="eyebrow">The past week</h3>
        <ul className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {result.items.map((item) => {
            const current = item.date === selected.date;
            return (
              <li key={item.date}>
                <Link
                  href={`/?date=${item.date}`}
                  scroll={false}
                  aria-current={current ? "true" : undefined}
                  className={`group relative block aspect-square overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_30px_-8px_rgb(139_92_246/0.85)] ${
                    current
                      ? "border-fuchsia-300 shadow-[0_0_24px_-2px_rgb(217_70_239/0.8)]"
                      : "border-violet-400/20 opacity-75 hover:border-violet-300/70 hover:opacity-100"
                  }`}
                >
                  {item.thumbUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.thumbUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    <div className="grid size-full place-items-center bg-violet-950/60 text-xs">Video</div>
                  )}
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-2 pt-6 pb-1.5 text-xs font-medium text-white">
                    {formatApodDate(item.date).replace(/, \d{4}$/, "")}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <p className="mt-10 text-xs text-violet-300/50">
        Data from NASA Science&rsquo;s picture-of-the-day feed, loaded {fetchedAt} (Philippine time) and cached for hours.
      </p>
    </div>
  );
}