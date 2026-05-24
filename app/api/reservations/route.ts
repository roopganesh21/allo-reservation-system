import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReservationCreateSchema } from "@/lib/validations";
import { Inventory } from "@/lib/generated/prisma/client";

// Next.js App Router POST handler for /api/reservations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Parse and validate the request body
    const validation = ReservationCreateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { inventoryId, quantity } = validation.data;

    // 2. Execute a transaction to ensure concurrency safety
    const reservation = await prisma.$transaction(async (tx) => {
      // Run raw SQL FOR UPDATE to lock the selected inventory row until the transaction completes
      const inventory = await tx.$queryRaw<Inventory[]>`
        SELECT * FROM "Inventory" WHERE id = ${inventoryId} FOR UPDATE
      `;

      if (!inventory || inventory.length === 0) {
        throw { status: 404, message: "Inventory record not found" };
      }

      const record = inventory[0];
      const available = record.totalUnits - record.reservedUnits;

      // Check if stock is sufficient
      if (available < quantity) {
        throw { status: 409, message: `Insufficient stock. Only ${available} units available.` };
      }

      // Increment reservedUnits
      await tx.inventory.update({
        where: { id: inventoryId },
        data: {
          reservedUnits: { increment: quantity },
        },
      });

      // Create reservation with status PENDING, expiring in 10 minutes
      const res = await tx.reservation.create({
        data: {
          inventoryId,
          quantity,
          status: "PENDING",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // now + 10 minutes
        },
      });

      return res;
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error: any) {
    console.error("❌ POST /api/reservations failed:", error);

    // Return custom error statuses for anticipated database conflicts/issues
    if (error.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
