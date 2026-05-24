# Allo Reservation System — Concurrency-Safe Inventory Portal

A high-fidelity, production-grade warehouse inventory reservation system built to handle concurrent purchase requests safely. This project implements strict database transaction controls and **row-level locking** in PostgreSQL to eliminate the possibility of double-booking or inventory race conditions under heavy traffic.

## 🚀 Key Architectural Features
*   **Row-Level Locking:** Uses raw PostgreSQL `SELECT ... FOR UPDATE` row locks inside atomic Prisma transactions to block concurrent sessions trying to reserve the same inventory slot until the first transaction commits or rolls back.
*   **Double-Shield Lazy Cleanup:** Implements silent, automatic expired reservation cleanups during products retrieval and page loads. If a 10-minute hold expires, the database atomic transaction automatically releases the `reservedUnits` and restores stock to the active pool.
*   **Prisma 7 Edge Optimized:** Built with the lightweight, modern Prisma 7 driver adapter framework using `@prisma/adapter-pg` for high-throughput node connections.
*   **Modern Next.js 16 Structure:** Renders using App Router server-side fetching, paired with custom client widgets, Tailwind CSS design layouts, and Radix UI elements.

## 🛠️ Technology Stack
*   **Core:** Next.js 16 (App Router), React 19, TypeScript
*   **Database ORM:** Prisma 7.8
*   **Hosting DB:** Supabase (PostgreSQL) with PgBouncer connection pooling
*   **Styling & UI:** Tailwind CSS, Lucide React Icons
*   **Validation:** Zod (v4) schemas
*   **Components:** Custom Radix UI shadcn badges, cards, and buttons
*   **Toaster System:** Sonner notifications

---

## 💾 Database Schema

The database models are designed to model a clean products-to-warehouse mapping:
```mermaid
erDiagram
    Product ||--o{ Inventory : stocks
    Warehouse ||--o{ Inventory : houses
    Inventory ||--o{ Reservation : locks
    
    Product {
        string id PK "CUID"
        string name
    }
    Warehouse {
        string id PK "CUID"
        string name
    }
    Inventory {
        string id PK "CUID"
        string productId FK
        string warehouseId FK
        int totalUnits
        int reservedUnits
    }
    Reservation {
        string id PK "CUID"
        string inventoryId FK
        int quantity
        enum status "PENDING, CONFIRMED, RELEASED"
        datetime expiresAt
        datetime createdAt
    }
```

*   **`Product`**: Represents the product catalogue.
*   **`Warehouse`**: Distribution centers (Mumbai, Delhi hubs).
*   **`Inventory`**: Joins products and warehouses. Features a composite `@@unique([productId, warehouseId])` constraint to prevent redundant mapping rows.
*   **`Reservation`**: Holds active bookings. Defaults to `PENDING` with a strict `expiresAt` timestamp set to `createdAt + 10 minutes`.

---

## ⚡ Concurrency Lock Visualizer

When a user triggers a reservation, the system performs an atomic database operation:

1.  **Open Transaction:** Start `prisma.$transaction`.
2.  **Acquire Row Lock:** Run raw SQL:
    ```sql
    SELECT * FROM "Inventory" WHERE id = $1 FOR UPDATE
    ```
    This row-lock blocks other concurrent sessions from mutating or locking this specific product/warehouse row.
3.  **Availability Verification:** Calculate `availableUnits = totalUnits - reservedUnits`. If `availableUnits < requestedQuantity`, throw a `409 Conflict` and roll back.
4.  **Deduct & Hold:** Increment the inventory `reservedUnits` and insert the `PENDING` reservation token.
5.  **Commit:** Close transaction, releasing the row lock safely.

---

## 📦 Local Setup Instructions

### 1. Configure Environment variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Client & Apply Schema Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Seed Database
Runs the idempotent seed script to populate Warehouses, Products, and stock levels:
```bash
npx prisma db seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to interact with the dashboard.
