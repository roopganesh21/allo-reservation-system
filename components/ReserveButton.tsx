"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Minus, ShoppingCart } from "lucide-react";

interface ReserveButtonProps {
  inventoryId: string;
  availableUnits: number;
}

export default function ReserveButton({ inventoryId, availableUnits }: ReserveButtonProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleIncrement = () => {
    if (quantity < availableUnits) {
      setQuantity((prev) => prev + 1);
      setError(null);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
      setError(null);
    }
  };

  const handleReserve = async () => {
    if (availableUnits <= 0) return;
    setLoading(true);
    setError(null);

    const toastId = toast.loading("Reserving stock...");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventoryId, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          const match = data.error?.match(/Only (\d+) units/);
          const currentAvailable = match ? match[1] : availableUnits;
          const msg = `Only ${currentAvailable} units available — someone may have just taken the last one.`;
          setError(msg);
          toast.error("Not enough stock", { id: toastId, description: msg });
          setTimeout(() => window.location.reload(), 2000);
        } else {
          const msg = data.error || "An unexpected error occurred.";
          setError(msg);
          toast.error("Reservation failed", { id: toastId, description: msg });
        }
        return;
      }

      toast.success(`${quantity} unit${quantity > 1 ? "s" : ""} reserved — 10 min hold`, {
        id: toastId,
      });
      router.push(`/checkout/${data.id}`);
    } catch {
      const msg = "Network error. Please try again.";
      setError(msg);
      toast.error("Connection failed", { id: toastId, description: msg });
    } finally {
      setLoading(false);
    }
  };

  // Out of stock state
  if (availableUnits <= 0) {
    return (
      <div
        className="w-full rounded-lg px-4 py-2.5 text-center text-sm font-semibold"
        style={{
          background: "var(--red-lt)",
          color: "var(--red)",
          border: "1px solid color-mix(in srgb, var(--red) 20%, transparent)",
        }}
      >
        Out of Stock
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 w-full">

      {/* Quantity selector */}
      <div
        className="flex items-center justify-between rounded-lg px-3 py-2"
        style={{
          background: "var(--muted)",
          border: "1px solid var(--border)",
        }}
      >
        <span className="text-xs font-semibold" style={{ color: "var(--muted-foreground)" }}>
          Quantity
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDecrement}
            disabled={quantity <= 1 || loading}
            className="h-7 w-7 rounded-md flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            <Minus className="h-3 w-3" />
          </button>

          <span
            className="text-sm font-bold w-5 text-center"
            style={{ color: "var(--foreground)" }}
          >
            {quantity}
          </span>

          <button
            type="button"
            onClick={handleIncrement}
            disabled={quantity >= availableUnits || loading}
            className="h-7 w-7 rounded-md flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Reserve button */}
      <button
        onClick={handleReserve}
        disabled={loading}
        className="btn-teal w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm rounded-lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Reserving...
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            Reserve
          </>
        )}
      </button>

      {/* 409 error */}
      {error && (
        <div
          className="rounded-lg px-3 py-2.5 text-xs font-semibold flex items-start gap-2"
          style={{
            background: "var(--red-lt)",
            color: "var(--red)",
            border: "1px solid color-mix(in srgb, var(--red) 20%, transparent)",
          }}
        >
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
