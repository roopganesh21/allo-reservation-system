export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header skeleton */}
      <div className="h-14 border-b border-gray-200 bg-white shadow-sm flex items-center px-6">
        <div className="flex items-center gap-2.5 animate-pulse">
          <div className="h-8 w-8 rounded-lg bg-gray-100" />
          <div className="h-4 w-28 bg-gray-200 rounded" />
        </div>
      </div>

      <main className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-4 animate-pulse">

          {/* Back link skeleton */}
          <div className="h-4 w-24 bg-gray-200 rounded" />

          {/* Card skeleton */}
          <div
            className="bg-white rounded-2xl border border-gray-200 overflow-hidden"
            style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
          >
            {/* Card header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 space-y-2">
              <div className="flex justify-between items-center">
                <div className="h-3 w-20 bg-gray-200 rounded" />
                <div className="h-5 w-20 bg-gray-100 rounded-full" />
              </div>
              <div className="h-6 w-40 bg-gray-200 rounded" />
              <div className="h-3.5 w-56 bg-gray-100 rounded" />
            </div>

            <div className="p-6 space-y-5">
              {/* Timer skeleton */}
              <div
                className="h-16 w-full rounded-xl"
                style={{ background: "var(--teal-lt)", border: "1px solid color-mix(in srgb, var(--teal) 20%, transparent)" }}
              />

              {/* Details skeleton */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i}>
                    {i > 1 && <div className="border-t border-gray-100 mb-3" />}
                    <div className="flex justify-between">
                      <div className="h-3.5 w-20 bg-gray-200 rounded" />
                      <div className="h-3.5 w-28 bg-gray-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Buttons skeleton */}
              <div className="flex gap-3 pt-2">
                <div className="h-10 flex-1 bg-gray-100 rounded-lg" />
                <div
                  className="h-10 flex-1 rounded-lg"
                  style={{ background: "var(--teal-lt)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
