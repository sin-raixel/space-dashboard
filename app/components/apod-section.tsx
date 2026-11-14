import Link from "next/link";
import { loadWeek } from "../lib/apod";
import { formatApodDate, selectApod } from "../lib/select-apod";
import GlowCard from "./glow-card";

type Props = { searchParams: Promise<{ date?: string | string[] }> };

const linkClass = "glow-link";

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
      <figure className="hud-corners panel group p-2">
        <div className="relative overflow-hidden rounded-xl">
          {selected.imageUrl ? (
            // NASA's image host isn't configured for next/image, so a plain <img> is used.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.imageUrl}
              alt={selected.alt ?? selected.title}
              className="w-full bg-violet-950/40 object-contain transition-transform duration-700 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid aspect-video place-items-center bg-violet-950/40 p-6 text-center">
              This one is a video, so there&rsquo;s no still picture to show here.
            </div>
          )}

          <span className="absolute top-4 left-4 rounded-full border border-violet-300/40 bg-black/50 px-3 py-1 font-display text-[0.65rem] tracking-[0.2em] text-violet-100 uppercase backdrop-blur">
            {formatApodDate(selected.date)}
          </span>

          <figcaption className="absolute inset-x-0 bottom-0 flex flex-wrap gap-x-6 gap-y-1 bg-gradient-to-t from-black/80 to-transparent px-4 pt-12 pb-9 text-sm">
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
            {selected.copyright && <span className="text-violet-100/80">Credit: {selected.copyright}</span>}
          </figcaption>
        </div>
      </figure>

      <GlowCard className="accent-line relative z-10 mx-3 -mt-5 p-6 pb-8 sm:mx-8 sm:p-8 sm:pb-10">
        <p className="eyebrow">Today&rsquo;s feature</p>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-wide text-white sm:text-3xl">{selected.title}</h2>
        <p className="mt-4 max-w-3xl leading-relaxed whitespace-pre-line text-violet-100/80">{selected.explanation}</p>
      </GlowCard>

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