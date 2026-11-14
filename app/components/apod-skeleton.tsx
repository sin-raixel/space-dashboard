export default function ApodSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading the astronomy picture"
      className="flex flex-wrap items-start gap-6 motion-safe:animate-pulse"
    >
      <div className="aspect-[4/3] w-full rounded-2xl bg-violet-900/30 lg:w-[62%]" />
      <div className="min-w-[18.75rem] flex-1 space-y-4">
        <div className="h-4 w-1/3 rounded bg-violet-900/30" />
        <div className="h-8 w-2/3 rounded bg-violet-900/30" />
        <div className="space-y-3">
          <div className="h-4 w-full rounded bg-violet-900/30" />
          <div className="h-4 w-full rounded bg-violet-900/30" />
          <div className="h-4 w-3/4 rounded bg-violet-900/30" />
        </div>
      </div>
    </div>
  );
}
