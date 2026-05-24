import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js App Router GET handler to retrieve a reservation by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await params for Next.js 16 compliance
    const { id } = await context.params;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        inventory: {
          include: {
            product: true,
            warehouse: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json({ error: "Reservation not found" }, { status: 404 });
    }

    // Format the response structure for the checkout page
    const formattedResponse = {
      id: reservation.id,
      inventoryId: reservation.inventoryId,
      quantity: reservation.quantity,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
      createdAt: reservation.createdAt,
      productName: reservation.inventory.product.name,
      warehouseName: reservation.inventory.warehouse.name,
    };

    return NextResponse.json(formattedResponse, { status: 200 });
  } catch (error) {
    console.error("❌ GET /api/reservations/[id] failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
