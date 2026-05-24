import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js App Router POST handler to confirm a reservation
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // In Next.js 16, dynamic route parameters must be awaited
    const { id } = await context.params;

    const result = await prisma.$transaction(async (tx) => {
      // Find the reservation by ID and include its associated inventory
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        return { status: 404, message: "Reservation not found" };
      }

      if (reservation.status !== "PENDING") {
        return {
          status: 400,
          message: `Reservation cannot be confirmed because it is already ${reservation.status.toLowerCase()}`,
        };
      }

      // Check if the reservation has expired
      const now = new Date();
      if (reservation.expiresAt < now) {
        // Update reservation status to RELEASED
        const updatedRes = await tx.reservation.update({
          where: { id },
          data: { status: "RELEASED" },
        });

        // Decrement inventory reservedUnits (release the reserved stock)
        await tx.inventory.update({
          where: { id: reservation.inventoryId },
          data: {
            reservedUnits: { decrement: reservation.quantity },
          },
        });

        return {
          status: 410,
          message: "Reservation has expired and its stock has been released",
          data: updatedRes,
        };
      }

      // Otherwise, confirm the reservation
      const updatedRes = await tx.reservation.update({
        where: { id },
        data: { status: "CONFIRMED" },
      });

      // Decrement both totalUnits (sold) and reservedUnits (no longer reserved)
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          totalUnits: { decrement: reservation.quantity },
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      return { status: 200, data: updatedRes };
    });

    if (result.status !== 200) {
      return NextResponse.json(
        { error: result.message, reservation: result.data },
        { status: result.status }
      );
    }

    return NextResponse.json(result.data, { status: 200 });
  } catch (error) {
    console.error("❌ POST /api/reservations/[id]/confirm failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
