import { z } from "zod";

// Zod schemas for API request validation

// Schema for creating a new reservation
export const ReservationCreateSchema = z.object({
  inventoryId: z.string({
    message: "Inventory ID is required",
  }).cuid("Invalid Inventory ID format"),
  quantity: z
    .number({
      message: "Quantity is required",
    })
    .int("Quantity must be an integer")
    .positive("Quantity must be a positive integer"),
});

// Schema for updating or releasing a reservation (uses reservation ID CUID)
export const ReservationActionSchema = z.object({
  id: z.string({
    message: "Reservation ID is required",
  }).cuid("Invalid Reservation ID format"),
});

// TypeScript type inference for these schemas
export type ReservationCreateInput = z.infer<typeof ReservationCreateSchema>;
export type ReservationActionInput = z.infer<typeof ReservationActionSchema>;
