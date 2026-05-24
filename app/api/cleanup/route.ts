import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js App Router POST handler for expired reservation cleanup
export async function POST() {
  try {
    const now = new Date();

    const cleanedCount = await prisma.$transaction(async (tx) => {
      // 1. Find all PENDING reservations that have expired
      const expiredReservations = await tx.reservation.findMany({
        where: {
          status: "PENDING",
          expiresAt: {
            lt: now,
          },
        },
      });

      if (expiredReservations.length === 0) {
        return 0;
      }

      // 2. Loop through each expired reservation and release its locked inventory units
      for (const res of expiredReservations) {
        await tx.inventory.update({
          where: { id: res.inventoryId },
          data: {
            reservedUnits: { decrement: res.quantity },
          },
        });
      }

      // 3. Mark all of these expired reservations as RELEASED in one batch update
      const updateResult = await tx.reservation.updateMany({
        where: {
          id: {
            in: expiredReservations.map((res) => res.id),
          },
        },
        data: {
          status: "RELEASED",
        },
      });

      return updateResult.count;
    });

    return NextResponse.json(
      {
        message: "Expired reservations cleanup complete",
        cleanedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ POST /api/cleanup failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
