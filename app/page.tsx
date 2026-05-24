import React from "react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ReserveButton from "@/components/ReserveButton";
import { Database, ShieldAlert, Cpu, Warehouse as WarehouseIcon, Box, Sparkles } from "lucide-react";

// Server component to fetch products and render the reservation portal
export default async function ProductsPage() {
  // Fetch products and inventory directly from the database (fully server-side!)
  const products = await prisma.product.findMany({
    include: {
      inventory: {
        include: {
          warehouse: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  // Calculate available units: available = total - reserved
  const productsWithAvailability = products.map((product) => ({
    id: product.id,
    name: product.name,
    inventory: product.inventory.map((inv) => ({
      id: inv.id,
      productId: inv.productId,
      warehouseId: inv.warehouseId,
      warehouseName: inv.warehouse.name,
      totalUnits: inv.totalUnits,
      reservedUnits: inv.reservedUnits,
      availableUnits: inv.totalUnits - inv.reservedUnits,
    })),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col antialiased">
      {/* Premium Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Database className="h-5 w-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-200">
                Allo Reservation System
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                High-Concurrency Row-Level Locking Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-full px-4 py-1.5 self-start md:self-auto shadow-inner">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-xs font-semibold text-slate-300">Supabase Connected</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-10">
        
        {/* Concurrency System Architecture Panel */}
        <section className="bg-gradient-to-r from-indigo-950/40 via-slate-950/60 to-cyan-950/30 border border-indigo-500/15 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 h-40 w-40 bg-cyan-500/5 rounded-full blur-3xl -ml-10 -mb-10"></div>
          
          <div className="flex flex-col lg:flex-row gap-8 items-center relative z-10">
            <div className="flex-1 space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> System Architecture
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
                Concurrency-Safe Database Locking
              </h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                This reservation dashboard implements **row-level locking** utilizing PostgreSQL&apos;s 
                <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 text-xs font-mono font-bold">SELECT ... FOR UPDATE</code>.
                When a user attempts to lock quantity, other write operations on that specific warehouse row are blocked, preventing race-conditions or double-bookings under high concurrent load.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex gap-3 items-start">
                  <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Prisma 7 Edge</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Optimized lightweight runtime driver</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Supabase DB</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">PostgreSQL instances in AP-South-1</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">Double Book Shield</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Atomic transaction checks & rollbacks</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Visualizer mock */}
            <div className="w-full lg:w-96 bg-slate-950/80 border border-slate-800/80 rounded-xl p-4.5 font-mono text-[11px] text-slate-400 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2.5 mb-3">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">🔒 LIVE TRANSACTION LOCKS</span>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
              </div>
              <div className="space-y-2">
                <p className="text-slate-500">{"// Step 1: Secure database connection"}</p>
                <p className="text-cyan-400 font-semibold">tx.$queryRaw`SELECT * FROM &quot;Inventory&quot; WHERE id = $1 FOR UPDATE`</p>
                <p className="text-emerald-400">⚡ ROW LOCKED (Other sessions waiting on row id...)</p>
                <p className="text-slate-500">{"// Step 2: Validate live units"}</p>
                <p className="text-slate-300">availableUnits = {`totalUnits (${10}) - reservedUnits (${0})`}</p>
                <p className="text-purple-400 font-semibold">{"tx.inventory.update({ reservedUnits: { increment: qty } })"}</p>
                <p className="text-slate-500">{"// Step 3: Insert expiration token & commit"}</p>
                <p className="text-yellow-400 font-semibold">{"tx.reservation.create({ status: 'PENDING' })"}</p>
                <p className="text-emerald-400">🔓 COMMIT (Row lock released successfully)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Product Cards Grid */}
        <section className="space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Box className="h-5 w-5 text-cyan-400" />
            <h3 className="text-lg font-bold tracking-tight text-slate-100">Seeded Products & Stock Live Inventory</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {productsWithAvailability.map((product) => (
              <Card 
                key={product.id} 
                className="bg-slate-900/40 border-slate-800/80 backdrop-blur-sm shadow-md hover:shadow-indigo-500/5 hover:border-slate-700/60 transition-all flex flex-col group"
              >
                <CardHeader className="pb-4 border-b border-slate-800/40 bg-slate-900/20">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-base font-black text-slate-200 tracking-tight leading-tight group-hover:text-cyan-400 transition-colors">
                      {product.name}
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 select-none">
                      {product.id}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500 font-medium">
                    Stock tracking across active distribution hubs
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="pt-6 flex-1 flex flex-col gap-6">
                  {product.inventory.map((inv) => (
                    <div 
                      key={inv.id} 
                      className="border border-slate-800 bg-slate-950/20 rounded-xl p-4 flex flex-col gap-4.5 hover:bg-slate-950/40 hover:border-indigo-500/25 transition-all shadow-inner"
                    >
                      {/* Warehouse Hub Title */}
                      <div className="flex justify-between items-center gap-2">
                        <div className="flex items-center gap-2 text-slate-300">
                          <WarehouseIcon className="h-4 w-4 text-indigo-400" />
                          <span className="text-xs font-bold">{inv.warehouseName}</span>
                        </div>
                        
                        {/* Live Available Status */}
                        {inv.availableUnits === 0 ? (
                          <Badge className="bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold">
                            Out of Stock
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                            {inv.availableUnits} Available
                          </Badge>
                        )}
                      </div>

                      {/* Stock Numbers breakdown */}
                      <div className="grid grid-cols-2 gap-3 border-y border-slate-800/50 py-3 text-[11px] text-slate-400 font-semibold select-none">
                        <div className="flex justify-between items-center px-2 border-r border-slate-800/50">
                          <span>Total Stock:</span>
                          <span className="text-slate-200 font-extrabold">{inv.totalUnits}</span>
                        </div>
                        <div className="flex justify-between items-center px-2">
                          <span>Locked/Reserved:</span>
                          <span className={`${inv.reservedUnits > 0 ? "text-yellow-400 font-bold" : "text-slate-400"}`}>
                            {inv.reservedUnits}
                          </span>
                        </div>
                      </div>

                      {/* Client Reserve Button */}
                      <ReserveButton 
                        inventoryId={inv.id} 
                        availableUnits={inv.availableUnits} 
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/50 py-6 mt-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-medium">
            &copy; {new Date().getFullYear()} Allo Reservation System. Designed for high fidelity.
          </p>
          <div className="flex items-center gap-4.5 font-bold">
            <span className="hover:text-slate-300 transition-colors">Prisma 7.8</span>
            <span className="text-slate-800">&#8226;</span>
            <span className="hover:text-slate-300 transition-colors">Next.js 16</span>
            <span className="text-slate-800">&#8226;</span>
            <span className="hover:text-slate-300 transition-colors">Supabase PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
