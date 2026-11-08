import { Suspense } from "react";
import ApodSection from "./components/apod-section";
import ApodSkeleton from "./components/apod-skeleton";
import SiteNav from "./components/site-nav";

type PageProps = { searchParams: Promise<{ date?: string | string[] }> };

export default function Page({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <main className="mx-auto max-w-4xl px-6 py-14">
        <SiteNav current="apod" />
        <header className="mb-10">
          <p className="text-sm font-semibold tracking-widest text-violet-300 uppercase">Space dashboard</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Astronomy picture of the day
          </h1>
        </header>

        <Suspense fallback={<ApodSkeleton />}>
          <ApodSection searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}