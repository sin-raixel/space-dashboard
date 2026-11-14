export default function ApodSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading the astronomy picture" className="space-y-6 motion-safe:animate-pulse">
      <div className="aspect-video w-full rounded-2xl bg-violet-900/30" />
      <div className="h-8 w-2/3 rounded bg-violet-900/30" />
      <div className="space-y-3">
        <div className="h-4 w-full rounded bg-violet-900/30" />
        <div className="h-4 w-full rounded bg-violet-900/30" />
        <div className="h-4 w-3/4 rounded bg-violet-900/30" />
      </div>
    </div>
  );
}