import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js App Router GET handler for /api/warehouses
export async function GET() {
  try {
    // Fetch all warehouses ordered alphabetically by name
    const warehouses = await prisma.warehouse.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(warehouses, { status: 200 });
  } catch (error) {
    console.error("❌ GET /api/warehouses failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
