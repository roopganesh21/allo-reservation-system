# Allo Reservation System — Concurrency-Safe Inventory Portal

A production-grade, high-concurrency reservation portal designed to manage warehouse inventory locks safely under heavy traffic. The project is built using Next.js 16 (App Router), Prisma 7, and Supabase (PostgreSQL).

---

## Overview

Allo Reservation System is an inventory management dashboard that addresses the classic "double-booking" problem in e-commerce. When multiple users concurrently attempt to reserve the same inventory item from the same warehouse, the system uses pessimistic database locking to serialize operations, preventing stock over-allocation.

---

## Architecture

The application is structured as a decoupled Next.js App Router project:
*   **Database:** PostgreSQL hosted on Supabase (using PgBouncer for transaction pooling and direct connections for migrations).
*   **ORM:** Prisma 7.8 configured with a custom output path (`lib/generated/prisma`) and dynamic `@prisma/adapter-pg` driver adapters to work efficiently in serverless and Edge runtimes.
*   **API Layer:** Next.js Server Actions and Route Handlers validated using Zod (v4).
*   **Frontend UI:** Built with server-side rendered pages and client component widgets, custom CSS variables, and animated Sonner toast notifications.

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

---

## Concurrency Strategy

This is the most critical technical layer of the application. High-concurrency environments require safe state transitions, which are implemented as follows:

### 1. Why the "Read-Check-Write" Pattern Fails
In a naive implementation, a developer might:
1.  Read the current stock from the database: `SELECT * FROM "Inventory" WHERE id = X`.
2.  Check if `totalUnits - reservedUnits >= requestedQuantity` in server memory.
3.  If true, write the updated stock back: `UPDATE "Inventory" SET reservedUnits = reservedUnits + Q`.

If Request A and Request B arrive at the exact same millisecond when 1 unit is available, **both will read 1 available unit at Step 1**, **both checks will pass at Step 2**, and **both will write at Step 3**. This results in **over-allocation/double-booking (2 units reserved when only 1 exists)**.

### 2. How `SELECT ... FOR UPDATE` Row Locking Solves It
To serialize these checks, the database must act as the single source of truth. When a reservation request starts, we execute a raw SQL query within a database transaction:
```sql
SELECT * FROM "Inventory" WHERE id = $1 FOR UPDATE
```
The `FOR UPDATE` clause instructs PostgreSQL to acquire a **pessimistic row-level lock** on that specific inventory record. 

### 3. Ensuring Transactional Atomicity
Because this query is executed inside a Prisma transaction (`prisma.$transaction(async (tx) => { ... })`), the lock is maintained continuously until the transaction commits or rolls back.
*   **Step 1:** The transaction opens, and the row lock is acquired.
*   **Step 2:** The server calculates availability using the locked, up-to-date row data. If stock is insufficient, it throws a `409` conflict and rolls back the transaction.
*   **Step 3:** If stock is sufficient, the transaction updates the `reservedUnits` and inserts a `PENDING` reservation.
*   **Step 4:** The transaction commits, releasing the lock.

### 4. What Happens to Concurrent Requests?
If Request A holds the lock on the row, Request B's `SELECT ... FOR UPDATE` query will **wait in the database queue** and block execution on the server.
*   Once Request A commits successfully, Request B's query finally executes and receives the newly updated row state (showing 0 available units).
*   Request B's check immediately fails, the transaction rolls back, and it returns a **`409 Conflict`** error to the user without corrupting stock levels.

---

## Expiry Handling

Rather than utilizing background schedulers or external cron jobs (which can fail, introduce delay, or exceed free-tier server limits), this project implements a highly efficient **Lazy Cleanup** architecture:

*   **Execution Trigger:** Every time a user visits the product dashboard or hits the `/api/products` endpoint, a silent database sweep is run before fetching the data.
*   **Atomic Stock Reversion:** In a single transaction, the server queries for any `PENDING` reservations where `expiresAt < now`. For each expired reservation, it:
    1.  Decrements the inventory's `reservedUnits` by that reservation's quantity (releasing the stock back to the active pool).
    2.  Batch-updates the status of those reservations to `RELEASED`.
*   **Zero Infrastructure overhead:** Expired holdings are cleaned up naturally on-demand without any cron jobs or scheduled workers.
*   *Production Path:* In a massive enterprise system, this lazy mechanism would be backed by a dedicated queue worker (like BullMQ, Amazon SQS, or a native `pg_cron` extension) to handle cleanup asynchronously.

---

## API Reference

### 1. Products
*   **`GET /api/products`** — Silently cleans up expired reservations and returns all products, warehouses, and calculated live stock counts (`availableUnits = totalUnits - reservedUnits`).

### 2. Warehouses
*   **`GET /api/warehouses`** — Simple fetch of all warehouses ordered alphabetically.

### 3. Reservations
*   **`POST /api/reservations`** — Reserves stock using pessimistic row locking.
    *   *Body:* `{ inventoryId: string, quantity: number }`
    *   *Responses:*
        *   `201 Created` — Returns reservation token.
        *   `400 Bad Request` — Validation fail.
        *   `409 Conflict` — Insufficient stock.
*   **`GET /api/reservations/[id]`** — Fetches deep reservation details, joining it with product name and warehouse.
*   **`POST /api/reservations/[id]/confirm`** — Finalizes a booking. If active, decrements `totalUnits` (sold) and `reservedUnits` and returns `200`. If expired, releases stock, marks `RELEASED`, and returns `410`.
*   **`POST /api/reservations/[id]/release`** — Manually cancels a booking, decrementing `reservedUnits` and returning `200`.
*   **`POST /api/api/cleanup`** — Explicit manual route to clean up expired reservations.

---

## Local Setup

### 1. Configure Environment Variables
Create a `.env` file at the project root (`allo-reservation-system/.env`):
```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Generate Client & Apply Migrations
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 4. Seed Database
Populates distribution hubs with initial stock counts:
```bash
npx prisma db seed
```

### 5. Launch Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## Tradeoffs & Future Improvements

To maintain a focused scope and implement a robust core reservation mechanic, the following engineering tradeoffs were made:

1.  **Skipped Redis Distributed Locks:** 
    *   *Tradeoff:* We rely fully on PostgreSQL row-level locks. For a single Postgres database, this is extremely efficient and simple.
    *   *Future Improvement:* At a hyper-scale, distributed databases would use a caching layer like Redis (Redlock algorithm) for rapid distributed locking and rate-limiting before reaching the primary relational database.
2.  **No Background Cron Jobs:** 
    *   *Tradeoff:* Relies entirely on dynamic Lazy Cleanup on product/page fetches.
    *   *Future Improvement:* In production, a robust background worker like BullMQ, Temporal, or a scheduled serverless function would handle automated sweeps asynchronously without adding small transaction overhead to product queries.
3.  **Omitted Auth / User Model:**
    *   *Tradeoff:* Focused purely on inventory locking and API concurrency. Anyone can reserve stock anonymously.
    *   *Future Improvement:* Integrate NextAuth or Clerk to associate reservations with unique User IDs, tracking active user reservation histories.
4.  **No Optimistic UI:**
    *   *Tradeoff:* When users reserve or confirm actions, the application triggers loading spinners, awaits API responses, and then refetches state to display updates.
    *   *Future Improvement:* Implement React Server Actions or TanStack Query to immediately render local state updates Optimistically, falling back/rolling back only if the API throws a 409 or 410 error.
