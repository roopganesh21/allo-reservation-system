import React from "react";

// Premium skeleton loader for the main products page
export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col antialiased">
      {/* Header Skeleton */}
      <div className="border-b border-slate-800/80 bg-slate-950/50 py-4.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-10 w-10 rounded-xl bg-slate-800"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-800 rounded"></div>
              <div className="h-3 w-48 bg-slate-800 rounded"></div>
            </div>
          </div>
          <div className="h-7 w-36 bg-slate-800 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
        {/* Banner Panel Skeleton */}
        <div className="h-44 w-full bg-slate-900/40 border border-slate-800/60 rounded-2xl animate-pulse"></div>

        {/* Product Cards Grid Skeleton */}
        <div className="space-y-6">
          <div className="h-5 w-48 bg-slate-800 rounded animate-pulse"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-6 animate-pulse"
              >
                {/* Product Title Skeleton */}
                <div className="space-y-2">
                  <div className="h-5 w-2/3 bg-slate-800 rounded"></div>
                  <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
                </div>

                {/* Warehouse Slots Skeleton */}
                <div className="space-y-4">
                  {[1, 2].map((j) => (
                    <div key={j} className="border border-slate-800 rounded-xl p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="h-4 w-24 bg-slate-800 rounded"></div>
                        <div className="h-5 w-16 bg-slate-800 rounded-full"></div>
                      </div>
                      <div className="h-8 bg-slate-800/50 rounded-lg"></div>
                      <div className="h-10 bg-slate-800 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
