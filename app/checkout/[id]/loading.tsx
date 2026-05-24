import React from "react";

// Premium skeleton loader for the checkout page
export default function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 antialiased">
      {/* Back button skeleton */}
      <div className="w-full max-w-md mb-6 flex items-center animate-pulse">
        <div className="h-4 w-28 bg-slate-800 rounded"></div>
      </div>

      {/* Checkout Card Skeleton */}
      <div className="w-full max-w-md border border-slate-800 bg-slate-900/40 rounded-2xl p-6 space-y-6 shadow-2xl animate-pulse">
        {/* Header Section */}
        <div className="space-y-2 pb-4 border-b border-slate-800/40">
          <div className="flex justify-between items-center">
            <div className="h-3 w-20 bg-slate-800 rounded"></div>
            <div className="h-5 w-24 bg-slate-800 rounded-full"></div>
          </div>
          <div className="h-6 w-48 bg-slate-800 rounded"></div>
          <div className="h-3.5 w-64 bg-slate-800 rounded"></div>
        </div>

        {/* Content Section */}
        <div className="space-y-6 py-2">
          {/* Timer panel skeleton */}
          <div className="h-16 w-full bg-slate-950/40 border border-slate-800 rounded-xl"></div>
          
          {/* Details specs skeleton */}
          <div className="border border-slate-800/80 bg-slate-950/30 rounded-xl p-4 space-y-4">
            <div className="flex justify-between">
              <div className="h-3.5 w-24 bg-slate-800 rounded"></div>
              <div className="h-3.5 w-32 bg-slate-800 rounded"></div>
            </div>
            <div className="border-t border-slate-800/45"></div>
            <div className="flex justify-between">
              <div className="h-3.5 w-20 bg-slate-800 rounded"></div>
              <div className="h-3.5 w-36 bg-slate-800 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3.5 w-24 bg-slate-800 rounded"></div>
              <div className="h-3.5 w-28 bg-slate-800 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-3.5 w-24 bg-slate-800 rounded"></div>
              <div className="h-5 w-16 bg-slate-800 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Footer actions skeleton */}
        <div className="flex gap-3 pt-4 border-t border-slate-800/40">
          <div className="h-10 flex-1 bg-slate-800 rounded-lg"></div>
          <div className="h-10 flex-1 bg-slate-800 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}
