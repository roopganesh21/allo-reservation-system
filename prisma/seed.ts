import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

// Disable strict SSL verification for local seed script to prevent certificate chain errors
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Use DIRECT_URL since seeding is a CLI schema command and needs to bypass PgBouncer
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding started...");

  // 1. Create/Upsert Products
  const headphones = await prisma.product.upsert({
    where: { id: "wireless-headphones" },
    update: {},
    create: {
      id: "wireless-headphones",
      name: "Wireless Headphones",
    },
  });

  const keyboard = await prisma.product.upsert({
    where: { id: "mechanical-keyboard" },
    update: {},
    create: {
      id: "mechanical-keyboard",
      name: "Mechanical Keyboard",
    },
  });

  const hub = await prisma.product.upsert({
    where: { id: "usb-c-hub" },
    update: {},
    create: {
      id: "usb-c-hub",
      name: "USB-C Hub",
    },
  });

  console.log("✅ Products seeded.");

  // 2. Create/Upsert Warehouses
  const mumbai = await prisma.warehouse.upsert({
    where: { id: "mumbai-warehouse" },
    update: {},
    create: {
      id: "mumbai-warehouse",
      name: "Mumbai Warehouse",
    },
  });

  const delhi = await prisma.warehouse.upsert({
    where: { id: "delhi-warehouse" },
    update: {},
    create: {
      id: "delhi-warehouse",
      name: "Delhi Warehouse",
    },
  });

  console.log("✅ Warehouses seeded.");

  // 3. Create/Upsert Inventory records
  // Mumbai stock: 10, 5, 8 units respectively
  await prisma.inventory.upsert({
    where: {
      productId_warehouseId: {
        productId: headphones.id,
        warehouseId: mumbai.id,
      },
    },
    update: { totalUnits: 10 },
    create: {
      productId: headphones.id,
      warehouseId: mumbai.id,
      totalUnits: 10,
      reservedUnits: 0,
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_warehouseId: {
        productId: keyboard.id,
        warehouseId: mumbai.id,
      },
    },
    update: { totalUnits: 5 },
    create: {
      productId: keyboard.id,
      warehouseId: mumbai.id,
      totalUnits: 5,
      reservedUnits: 0,
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_warehouseId: {
        productId: hub.id,
        warehouseId: mumbai.id,
      },
    },
    update: { totalUnits: 8 },
    create: {
      productId: hub.id,
      warehouseId: mumbai.id,
      totalUnits: 8,
      reservedUnits: 0,
    },
  });

  // Delhi stock: 3, 1, 6 units respectively
  await prisma.inventory.upsert({
    where: {
      productId_warehouseId: {
        productId: headphones.id,
        warehouseId: delhi.id,
      },
    },
    update: { totalUnits: 3 },
    create: {
      productId: headphones.id,
      warehouseId: delhi.id,
      totalUnits: 3,
      reservedUnits: 0,
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_warehouseId: {
        productId: keyboard.id,
        warehouseId: delhi.id,
      },
    },
    update: { totalUnits: 1 },
    create: {
      productId: keyboard.id,
      warehouseId: delhi.id,
      totalUnits: 1,
      reservedUnits: 0,
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_warehouseId: {
        productId: hub.id,
        warehouseId: delhi.id,
      },
    },
    update: { totalUnits: 6 },
    create: {
      productId: hub.id,
      warehouseId: delhi.id,
      totalUnits: 6,
      reservedUnits: 0,
    },
  });

  console.log("✅ Inventory seeded.");
  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end(); // Make sure to close the PG connection pool!
  });
