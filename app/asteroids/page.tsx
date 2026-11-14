import { Suspense } from "react";
import AsteroidSkeleton from "../components/asteroid-skeleton";
import AsteroidsSection from "../components/asteroid-section";
import PageShell from "../components/page-shell";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export const metadata = { title: "Near-Earth asteroids" };

export default function Page({ searchParams }: PageProps) {
  return (
    <PageShell current="asteroids" title="Near-Earth asteroids">
      <Suspense fallback={<AsteroidSkeleton />}>
        <AsteroidsSection searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
