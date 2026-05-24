import React from "react";
import { prisma } from "@/lib/prisma";
import ReserveButton from "@/components/ReserveButton";
import { Warehouse as WarehouseIcon, Package, Tag } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductsPage() {
  const now = new Date();

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

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ─────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--teal)" }}
            >
              <Tag className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">
              Allo Reservation
            </span>
          </div>

          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: "var(--teal-lt)",
              color: "var(--teal-dk)",
              border: "1px solid color-mix(in srgb, var(--teal) 25%, transparent)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full pulse-dot"
              style={{ background: "var(--teal)" }}
            />
            Live inventory
          </div>
        </div>
      </header>

      {/* ── Main ───────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">

        {/* Page heading */}
        <div className="fade-up mb-8">
          <h2
            className="font-display text-3xl"
            style={{ color: "var(--foreground)" }}
          >
            Products
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
            Select a warehouse slot to reserve stock for checkout.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {productsWithAvailability.map((product, pi) => (
            <div
              key={product.id}
              className={`fade-up fade-up-${Math.min(pi + 1, 5)} group bg-white border border-gray-200 rounded-2xl overflow-hidden card-lift flex flex-col`}
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              {/* Product header */}
              <div
                className="px-5 py-4 flex items-center gap-3 border-b"
                style={{ borderColor: "var(--border)", background: "#fafafa" }}
              >
                <div
                  className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--plum-lt)" }}
                >
                  <Package className="h-4 w-4" style={{ color: "var(--plum)" }} />
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-sm font-bold truncate leading-tight transition-colors"
                    style={{ color: "var(--foreground)" }}
                  >
                    {product.name}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {product.inventory.length} warehouse
                    {product.inventory.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Inventory rows */}
              <div className="flex flex-col gap-3 p-4 flex-1">
                {product.inventory.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-xl border p-4 flex flex-col gap-3 transition-all"
                    style={{
                      borderColor: "var(--border)",
                      background: "var(--background)",
                    }}
                  >
                    {/* Warehouse name + stock badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <WarehouseIcon
                          className="h-3.5 w-3.5 flex-shrink-0"
                          style={{ color: "var(--plum)" }}
                        />
                        <span
                          className="text-xs font-semibold truncate"
                          style={{ color: "var(--foreground)" }}
                        >
                          {inv.warehouseName}
                        </span>
                      </div>
                      {inv.availableUnits === 0 ? (
                        <span className="badge-red">Out of Stock</span>
                      ) : (
                        <span className="badge-teal">
                          {inv.availableUnits} available
                        </span>
                      )}
                    </div>

                    {/* Stock breakdown */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div
                        className="rounded-lg px-3 py-2 flex justify-between items-center border"
                        style={{ background: "#fff", borderColor: "var(--border)" }}
                      >
                        <span style={{ color: "var(--muted-foreground)" }}>Total</span>
                        <span className="font-bold" style={{ color: "var(--foreground)" }}>
                          {inv.totalUnits}
                        </span>
                      </div>
                      <div
                        className="rounded-lg px-3 py-2 flex justify-between items-center border"
                        style={{ background: "#fff", borderColor: "var(--border)" }}
                      >
                        <span style={{ color: "var(--muted-foreground)" }}>Reserved</span>
                        <span
                          className="font-bold"
                          style={{
                            color: inv.reservedUnits > 0 ? "var(--amber)" : "var(--muted-foreground)",
                          }}
                        >
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
      </main>

      {/* ── Footer ─────────────────────────────── */}
      <footer className="border-t border-gray-100 py-5 mt-10 bg-white">
        <p className="text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
          Allo Reservation System — {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
