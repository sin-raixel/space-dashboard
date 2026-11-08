import { Suspense } from "react";
import AsteroidSkeleton from "../components/asteroid-skeleton";
import AsteroidsSection from "../components/asteroid-section";
import SiteNav from "../components/site-nav";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Near-Earth asteroids | Space dashboard" };

export default function Page({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <main className="mx-auto max-w-5xl px-6 py-14">
        <SiteNav current="asteroids" />
        <header className="mb-10">
          <p className="text-sm font-semibold tracking-widest text-violet-300 uppercase">Space dashboard</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">Near-Earth asteroids</h1>
        </header>

        <Suspense fallback={<AsteroidSkeleton />}>
          <AsteroidsSection searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}