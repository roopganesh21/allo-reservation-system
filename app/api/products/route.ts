import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js App Router GET handler for /api/products
export async function GET() {
  try {
    const now = new Date();

    // 1. Run atomic Lazy Cleanup: Identify and release any expired reservations in a single transaction
    await prisma.$transaction(async (tx) => {
      const expired = await tx.reservation.findMany({
        where: {
          status: "PENDING",
          expiresAt: { lt: now },
        },
      });

      if (expired.length > 0) {
        // Restore locked stock for each expired reservation
        for (const res of expired) {
          await tx.inventory.update({
            where: { id: res.inventoryId },
            data: {
              reservedUnits: { decrement: res.quantity },
            },
          });
        }

        // Transition reservation statuses in one batch
        await tx.reservation.updateMany({
          where: {
            id: { in: expired.map((res) => res.id) },
          },
          data: { status: "RELEASED" },
        });
      }
    });

    // 2. Fetch all products, including their inventory and the associated warehouse names
    const products = await prisma.product.findMany({
      include: {
        inventory: {
          include: {
            warehouse: true,
          },
        },
      },
    });

    // Add the computed field: availableUnits = totalUnits - reservedUnits
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

    return NextResponse.json(productsWithAvailability, { status: 200 });
  } catch (error) {
    console.error("❌ GET /api/products failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
