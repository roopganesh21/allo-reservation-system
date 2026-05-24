"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Plus, Minus } from "lucide-react";

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

    const toastId = toast.loading("Securing database lock...", {
      description: "Acquiring row-level transaction lock on Supabase...",
    });

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventoryId,
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("Not enough stock");
          toast.error("Reservation Failed", {
            id: toastId,
            description: "Conflict: Not enough stock. Row locking protected double booking.",
          });
        } else {
          setError(data.error || "Failed to create reservation");
          toast.error("Failed to Reserve", {
            id: toastId,
            description: data.error || "An unexpected error occurred.",
          });
        }
        return;
      }

      toast.success("Stock Reserved Successfully!", {
        id: toastId,
        description: `Locked ${quantity} units for 10 minutes.`,
      });

      // Redirect to checkout page
      router.push(`/checkout/${data.id}`);
    } catch (err) {
      console.error("Reservation request failed:", err);
      setError("Network error. Please try again.");
      toast.error("Connection Failed", {
        id: toastId,
        description: "Could not reach reservation API.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (availableUnits <= 0) {
    return (
      <Button disabled variant="outline" className="w-full border-red-500/25 bg-red-950/10 text-red-400">
        Out of Stock
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-3.5 w-full">
      <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/80 rounded-lg p-1.5 gap-4">
        <span className="text-xs text-slate-400 font-semibold ml-2.5 select-none">Quantity:</span>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDecrement}
            disabled={quantity <= 1 || loading}
            className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 active:scale-95 transition-all"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
          <span className="text-sm font-bold text-slate-200 w-6 text-center select-none">
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleIncrement}
            disabled={quantity >= availableUnits || loading}
            className="h-8 w-8 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <Button
        onClick={handleReserve}
        disabled={loading}
        className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold tracking-wide shadow-md shadow-cyan-950/30 transition-all hover:shadow-lg hover:shadow-cyan-500/10 active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-cyan-200" />
            Locking Row...
          </>
        ) : (
          "Reserve Stock"
        )}
      </Button>

      {error && (
        <p className="text-xs font-semibold text-red-400 text-center animate-pulse">
          ⚠️ {error}
        </p>
      )}
    </div>
  );
}
