export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-14 border-b border-gray-200 bg-white shadow-sm flex items-center px-6">
        <div className="flex items-center gap-2.5 animate-pulse">
          <div className="h-8 w-8 rounded-lg bg-teal-100" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
      </div>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 space-y-2 animate-pulse">
          <div className="h-8 w-36 bg-gray-200 rounded" />
          <div className="h-4 w-52 bg-gray-100 rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gray-100" />
                <div className="space-y-1.5">
                  <div className="h-3.5 w-28 bg-gray-200 rounded" />
                  <div className="h-2.5 w-16 bg-gray-100 rounded" />
                </div>
              </div>
              <div className="p-4 space-y-3">
                {[1, 2].map((j) => (
                  <div key={j} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="h-3.5 w-24 bg-gray-200 rounded" />
                      <div className="h-5 w-20 bg-gray-100 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-9 bg-gray-100 rounded-lg" />
                      <div className="h-9 bg-gray-100 rounded-lg" />
                    </div>
                    <div className="h-10 rounded-lg" style={{ background: "#e6faf7" }} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
