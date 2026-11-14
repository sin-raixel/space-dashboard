import { Suspense } from "react";
import ApodSection from "./components/apod-section";
import ApodSkeleton from "./components/apod-skeleton";
import PageShell from "./components/page-shell";

type PageProps = { searchParams: Promise<{ date?: string | string[] }> };

export default function Page({ searchParams }: PageProps) {
  return (
    <PageShell current="apod" title="Astronomy picture of the day">
      <Suspense fallback={<ApodSkeleton />}>
        <ApodSection searchParams={searchParams} />
      </Suspense>
    </PageShell>
  );
}
