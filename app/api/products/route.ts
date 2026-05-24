import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js App Router GET handler for /api/products
export async function GET() {
  try {
    // Fetch all products, including their inventory and the associated warehouse names
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
