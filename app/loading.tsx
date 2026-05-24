export default function Loading() {
  return (
    <div className="min-h-screen bg-background dot-grid mesh-bg flex flex-col">
      <div className="h-16 border-b border-white/[0.06] bg-background/80 flex items-center px-6">
        <div className="flex items-center gap-3 animate-pulse">
          <div className="h-9 w-9 rounded-xl bg-white/10" />
          <div className="space-y-1.5">
            <div className="h-3 w-32 bg-white/10 rounded" />
            <div className="h-2 w-20 bg-white/5 rounded" />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">
        {/* Stats skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-card border border-white/[0.06] rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/10" />
                <div className="space-y-1.5">
                  <div className="h-5 w-8 bg-white/10 rounded" />
                  <div className="h-2 w-16 bg-white/5 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Panel skeleton */}
        <div className="h-52 bg-card border border-white/[0.06] rounded-2xl animate-pulse" />

        {/* Cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-white/[0.06] rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="h-4 w-2/3 bg-white/10 rounded" />
              <div className="h-24 bg-white/5 rounded-xl" />
              <div className="h-24 bg-white/5 rounded-xl" />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
