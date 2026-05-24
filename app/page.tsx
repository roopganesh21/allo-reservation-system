import React from "react";
import { prisma } from "@/lib/prisma";
import ReserveButton from "@/components/ReserveButton";
import { Warehouse as WarehouseIcon, Package, ShoppingBag } from "lucide-react";

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

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-none">
                Allo Reservation System
              </h1>
              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                Inventory Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-5 border border-emerald-200 rounded-full px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-[11px] font-bold text-emerald-700">Live</span>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10">

        {/* Page title */}
        <div className="fade-up mb-8">
          <h2 className="text-2xl font-extrabold text-gray-900">
            Products
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse available stock and reserve items for checkout.
          </p>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {productsWithAvailability.map((product, pi) => (
            <div
              key={product.id}
              className={`fade-up fade-up-${Math.min(pi + 1, 5)} group bg-white border border-border rounded-2xl overflow-hidden card-glow flex flex-col shadow-sm`}
            >
              {/* Product header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/60">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                    <Package className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors leading-tight">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                      {product.inventory.length} warehouse
                      {product.inventory.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Inventory per warehouse */}
              <div className="flex flex-col gap-3 p-4 flex-1">
                {product.inventory.map((inv) => (
                  <div
                    key={inv.id}
                    className="rounded-xl border border-gray-100 bg-gray-50/40 p-4 flex flex-col gap-3 hover:border-indigo-200 hover:bg-indigo-50/20 transition-all"
                  >
                    {/* Warehouse + availability */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <WarehouseIcon className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                        <span className="text-xs font-semibold text-gray-700">
                          {inv.warehouseName}
                        </span>
                      </div>
                      {inv.availableUnits === 0 ? (
                        <span className="badge-red">Out of Stock</span>
                      ) : (
                        <span className="badge-green">
                          {inv.availableUnits} available
                        </span>
                      )}
                    </div>

                    {/* Stock numbers */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <div className="bg-white rounded-lg px-3 py-2 flex justify-between items-center border border-gray-100 shadow-sm">
                        <span className="text-gray-400">Total</span>
                        <span className="text-gray-800 font-bold">{inv.totalUnits}</span>
                      </div>
                      <div className="bg-white rounded-lg px-3 py-2 flex justify-between items-center border border-gray-100 shadow-sm">
                        <span className="text-gray-400">Reserved</span>
                        <span className={`font-bold ${inv.reservedUnits > 0 ? "text-amber-600" : "text-gray-300"}`}>
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-5 mt-10 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-[11px] font-mono text-gray-300 text-center">
          Allo Reservation System — {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
