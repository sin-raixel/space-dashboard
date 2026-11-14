export default function AsteroidSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading asteroid data" className="space-y-6 motion-safe:animate-pulse">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((n) => (
          <div key={n} className="h-24 rounded-xl bg-violet-900/30" />
        ))}
      </div>
      <div className="h-16 rounded-xl bg-violet-900/30" />
      <div className="h-72 rounded-xl bg-violet-900/30" />
      <div className="h-64 rounded-xl bg-violet-900/30" />
    </div>
  );
}