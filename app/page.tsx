import React from "react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import ReserveButton from "@/components/ReserveButton";
import {
  Database,
  ShieldCheck,
  Cpu,
  Warehouse as WarehouseIcon,
  Package,
  Zap,
  Lock,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductsPage() {
  const now = new Date();

  // Lazy cleanup: release expired reservations
  await prisma.$transaction(async (tx) => {
    const expired = await tx.reservation.findMany({
      where: { status: "PENDING", expiresAt: { lt: now } },
    });
    if (expired.length > 0) {
      for (const res of expired) {
        await tx.inventory.update({
          where: { id: res.inventoryId },
          data: { reservedUnits: { decrement: res.quantity } },
        });
      }
      await tx.reservation.updateMany({
        where: { id: { in: expired.map((r) => r.id) } },
        data: { status: "RELEASED" },
      });
    }
  });

  const products = await prisma.product.findMany({
    include: { inventory: { include: { warehouse: true } } },
    orderBy: { name: "asc" },
  });

  const productsWithAvailability = products.map((product) => ({
    id: product.id,
    name: product.name,
    inventory: product.inventory.map((inv) => ({
      id: inv.id,
      warehouseName: inv.warehouse.name,
      totalUnits: inv.totalUnits,
      reservedUnits: inv.reservedUnits,
      availableUnits: inv.totalUnits - inv.reservedUnits,
    })),
  }));

  const totalAvailable = productsWithAvailability.reduce(
    (sum, p) => sum + p.inventory.reduce((s, i) => s + i.availableUnits, 0),
    0
  );
  const totalReserved = productsWithAvailability.reduce(
    (sum, p) => sum + p.inventory.reduce((s, i) => s + i.reservedUnits, 0),
    0
  );

  return (
    <div className="min-h-screen mesh-bg dot-grid bg-background text-foreground flex flex-col">

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 flex-shrink-0">
              <Lock className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">
                Allo Reservation System
              </h1>
              <p className="text-[10px] text-white/40 mt-0.5 font-mono">
                Row-Level Locking Engine
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold text-white/50 font-mono">
              <span>
                <span className="text-cyan-400">{totalAvailable}</span> available
              </span>
              <span className="text-white/20">|</span>
              <span>
                <span className="text-amber-400">{totalReserved}</span> reserved
              </span>
            </div>
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 pulse-dot" />
              <span className="text-[11px] font-bold text-green-400 tracking-wide">LIVE</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-10">

        {/* ── Stats Bar ──────────────────────────────────────────── */}
        <div className="fade-up grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Products", value: products.length, icon: Package, color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
            { label: "Total Available", value: totalAvailable, icon: Zap, color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
            { label: "Reserved", value: totalReserved, icon: Lock, color: "text-amber-400", bg: "bg-amber-400/10 border-amber-400/20" },
            { label: "Warehouses", value: 2, icon: WarehouseIcon, color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={`fade-up fade-up-${i + 1} bg-card border border-white/[0.06] rounded-xl p-4 flex items-center gap-3 card-glow`}
            >
              <div className={`p-2 rounded-lg border ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[11px] text-white/40 font-mono">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Architecture Panel ─────────────────────────────────── */}
        <div className="fade-up fade-up-2 relative rounded-2xl border border-white/[0.06] bg-card overflow-hidden">
          {/* accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          <div className="absolute top-0 left-0 w-40 h-40 bg-cyan-400/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-violet-400/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <div className="relative p-6 md:p-8 flex flex-col lg:flex-row gap-8">
            {/* Left: description */}
            <div className="flex-1 space-y-5">
              <div className="flex items-center gap-2">
                <span className="badge-cyan">System Architecture</span>
              </div>
              <h2 className="text-2xl font-bold text-white leading-tight">
                Concurrency-Safe{" "}
                <span className="glow-cyan">Row Locking</span>
              </h2>
              <p className="text-sm text-white/50 leading-relaxed max-w-lg">
                Every reservation runs inside a PostgreSQL transaction with{" "}
                <code className="font-mono text-cyan-400 bg-white/5 px-1.5 py-0.5 rounded text-xs">
                  SELECT … FOR UPDATE
                </code>
                . The row is locked for the duration — no two sessions can
                oversell the same unit simultaneously.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {[
                  { icon: Cpu, label: "Prisma ORM", sub: "Type-safe DB client", color: "text-cyan-400", bg: "bg-cyan-400/10 border-cyan-400/20" },
                  { icon: Database, label: "Supabase PG", sub: "PostgreSQL ACID", color: "text-violet-400", bg: "bg-violet-400/10 border-violet-400/20" },
                  { icon: ShieldCheck, label: "Atomic Guard", sub: "Rollback on conflict", color: "text-green-400", bg: "bg-green-400/10 border-green-400/20" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg border ${item.bg} flex-shrink-0`}>
                      <item.icon className={`h-4 w-4 ${item.color}`} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white/80">{item.label}</p>
                      <p className="text-[11px] text-white/35 mt-0.5">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: terminal */}
            <div className="w-full lg:w-[380px] flex-shrink-0">
              <div className="rounded-xl border border-white/[0.07] bg-[oklch(0.07_0.015_264)] overflow-hidden scanlines">
                <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/80" />
                  <span className="ml-2 text-[10px] text-white/25 font-mono">reservation.tx</span>
                </div>
                <div className="p-4 space-y-1.5 font-mono text-[11px] leading-relaxed">
                  <p className="text-white/30">{"// 1. Acquire row lock"}</p>
                  <p className="text-cyan-400">
                    {`tx.$queryRaw\`SELECT * FROM "Inventory"`}
                  </p>
                  <p className="text-cyan-400 pl-4">{`WHERE id = \${id} FOR UPDATE\``}</p>
                  <p className="text-green-400 mt-1">⚡ ROW LOCKED — others queued</p>
                  <p className="text-white/30 mt-2">{"// 2. Check availability"}</p>
                  <p className="text-white/70">
                    available = totalUnits − reservedUnits
                  </p>
                  <p className="text-white/30 mt-2">{"// 3. Atomic write"}</p>
                  <p className="text-violet-400">
                    tx.inventory.update({"{"} reservedUnits++ {"}"})
                  </p>
                  <p className="text-amber-400">
                    {"tx.reservation.create({ status: 'PENDING' })"}
                  </p>
                  <p className="text-green-400 mt-1">🔓 COMMIT — lock released</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Product Grid ───────────────────────────────────────── */}
        <section className="space-y-5">
          <div className="fade-up fade-up-3 flex items-center gap-3 pb-3 border-b border-white/[0.06]">
            <Package className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white/70 uppercase tracking-widest font-mono">
              Live Inventory
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {productsWithAvailability.map((product, pi) => (
              <div
                key={product.id}
                className={`fade-up fade-up-${Math.min(pi + 3, 5)} group relative bg-card border border-white/[0.06] rounded-2xl overflow-hidden card-glow flex flex-col`}
              >
                {/* top accent */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Product header */}
                <div className="px-5 py-4 border-b border-white/[0.05] bg-white/[0.02]">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-white leading-tight group-hover:text-cyan-400 transition-colors">
                      {product.name}
                    </h4>
                    <Badge
                      variant="outline"
                      className="text-[9px] border-white/10 text-white/25 font-mono shrink-0"
                    >
                      {product.id.slice(-8)}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-white/30 mt-1 font-mono">
                    {product.inventory.length} warehouse
                    {product.inventory.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Inventory rows */}
                <div className="flex flex-col gap-3 p-4 flex-1">
                  {product.inventory.map((inv) => (
                    <div
                      key={inv.id}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 flex flex-col gap-3 hover:border-cyan-400/20 hover:bg-cyan-400/[0.02] transition-all"
                    >
                      {/* Warehouse row */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <WarehouseIcon className="h-3.5 w-3.5 text-violet-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-white/70">
                            {inv.warehouseName}
                          </span>
                        </div>
                        {inv.availableUnits === 0 ? (
                          <span className="badge-red">Out of Stock</span>
                        ) : (
                          <span className="badge-green">
                            {inv.availableUnits} left
                          </span>
                        )}
                      </div>

                      {/* Stock numbers */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="bg-white/[0.03] rounded-lg px-3 py-2 flex justify-between items-center border border-white/[0.04]">
                          <span className="text-white/35">Total</span>
                          <span className="text-white/80 font-bold">{inv.totalUnits}</span>
                        </div>
                        <div className="bg-white/[0.03] rounded-lg px-3 py-2 flex justify-between items-center border border-white/[0.04]">
                          <span className="text-white/35">Reserved</span>
                          <span className={`font-bold ${inv.reservedUnits > 0 ? "text-amber-400" : "text-white/30"}`}>
                            {inv.reservedUnits}
                          </span>
                        </div>
                      </div>

                      {/* Reserve button */}
                      <ReserveButton
                        inventoryId={inv.id}
                        availableUnits={inv.availableUnits}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] py-5 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] font-mono text-white/20">
          <p>© {new Date().getFullYear()} Allo Reservation System</p>
          <div className="flex items-center gap-3">
            <span>Next.js</span>
            <span className="text-white/10">·</span>
            <span>Prisma</span>
            <span className="text-white/10">·</span>
            <span>Supabase PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
