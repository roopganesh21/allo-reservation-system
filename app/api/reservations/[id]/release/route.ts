import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js App Router POST handler to release a reservation
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Await parameters for Next.js 16 compliance
    const { id } = await context.params;

    const result = await prisma.$transaction(async (tx) => {
      // Find the reservation by ID
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        return { status: 404, message: "Reservation not found" };
      }

      // Prevent double releasing or releasing a confirmed reservation
      if (reservation.status !== "PENDING") {
        return {
          status: 400,
          message: `Reservation cannot be released because it is already ${reservation.status.toLowerCase()}`,
        };
      }

      // Update reservation status to RELEASED
      const updatedRes = await tx.reservation.update({
        where: { id },
        data: { status: "RELEASED" },
      });

      // Decrement inventory reservedUnits (returns stock back to available pool)
      await tx.inventory.update({
        where: { id: reservation.inventoryId },
        data: {
          reservedUnits: { decrement: reservation.quantity },
        },
      });

      return { status: 200, message: "Reservation successfully released", data: updatedRes };
    });

    if (result.status !== 200) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }

    return NextResponse.json(
      { message: result.message, reservation: result.data },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ POST /api/reservations/[id]/release failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
