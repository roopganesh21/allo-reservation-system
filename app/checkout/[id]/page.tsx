"use client";

import React, { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Timer, CheckCircle, XCircle, ArrowLeft, ShoppingBag, ShieldCheck } from "lucide-react";

interface ReservationDetails {
  id: string;
  inventoryId: string;
  quantity: number;
  status: string;
  expiresAt: string;
  createdAt: string;
  productName: string;
  warehouseName: string;
}

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  
  // Unpack dynamic route parameter async in React 19 / Next.js 16
  const { id } = use(params);

  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0); // Time remaining in milliseconds
  const [purchaseStatus, setPurchaseStatus] = useState<"PENDING" | "CONFIRMED" | "RELEASED" | "EXPIRED">("PENDING");

  // 1. Fetch Reservation Details
  useEffect(() => {
    async function fetchReservation() {
      try {
        const response = await fetch(`/api/reservations/${id}`);
        if (!response.ok) {
          toast.error("Failed to load reservation details.");
          router.push("/");
          return;
        }
        const data = await response.json();
        setReservation(data);
        setPurchaseStatus(data.status);
        
        // Calculate initial time difference
        const expiry = new Date(data.expiresAt).getTime();
        const diff = expiry - Date.now();
        setTimeLeft(diff > 0 ? diff : 0);
        
        if (data.status === "PENDING" && diff <= 0) {
          setPurchaseStatus("EXPIRED");
        }
      } catch (err) {
        console.error(err);
        toast.error("An error occurred while loading checkout.");
      } finally {
        setLoading(false);
      }
    }
    fetchReservation();
  }, [id, router]);

  // 2. Live Countdown Timer Interval
  useEffect(() => {
    if (purchaseStatus !== "PENDING" || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(timer);
          setPurchaseStatus("EXPIRED");
          toast.warning("Your stock reservation has expired.");
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [purchaseStatus, timeLeft]);

  // Format milliseconds to MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // 3. Confirm Purchase handler
  const handleConfirm = async () => {
    if (purchaseStatus !== "PENDING" || actionLoading) return;
    setActionLoading(true);

    const toastId = toast.loading("Finalizing purchase...", {
      description: "Deducting stock from database and closing reservation lock...",
    });

    try {
      const response = await fetch(`/api/reservations/${id}/confirm`, {
        method: "POST",
      });

      if (response.status === 410) {
        setPurchaseStatus("EXPIRED");
        toast.error("Purchase Failed", {
          id: toastId,
          description: "Your reservation expired. Please start over.",
        });
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        toast.error("Failed to confirm purchase", {
          id: toastId,
          description: data.error || "An error occurred.",
        });
        return;
      }

      setPurchaseStatus("CONFIRMED");
      toast.success("Purchase Confirmed!", {
        id: toastId,
        description: `Successfully booked ${reservation?.quantity} units. Stock is permanently updated.`,
      });
    } catch (err) {
      console.error(err);
      toast.error("Network error. Please try again.", { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Cancel/Release Reservation handler
  const handleCancel = async () => {
    if (actionLoading) return;
    setActionLoading(true);

    const toastId = toast.loading("Releasing reserved stock...", {
      description: "Returning units back to active inventory...",
    });

    try {
      const response = await fetch(`/api/reservations/${id}/release`, {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error("Failed to release stock", {
          id: toastId,
          description: data.error || "An error occurred.",
        });
        return;
      }

      setPurchaseStatus("RELEASED");
      toast.success("Reservation Released", {
        id: toastId,
        description: "Stock has been returned to the warehouse. Redirecting home...",
      });
      
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error("Network error.", { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col items-center justify-center gap-4 antialiased">
        <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
        <p className="text-sm font-semibold text-slate-400 animate-pulse">
          Loading reservation transaction details...
        </p>
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 antialiased">
      
      {/* Back button */}
      <div className="w-full max-w-md mb-6 self-center animate-fade-in">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/")}
          disabled={actionLoading}
          className="text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
        </Button>
      </div>

      {/* Main Checkout Card */}
      <Card className={`w-full max-w-md backdrop-blur-md transition-all duration-500 shadow-2xl relative overflow-hidden ${
        purchaseStatus === "CONFIRMED" 
          ? "border-emerald-500/30 bg-emerald-950/10 shadow-emerald-950/20" 
          : purchaseStatus === "RELEASED" || purchaseStatus === "EXPIRED"
            ? "border-red-500/20 bg-red-950/5 shadow-red-950/10"
            : "border-slate-800 bg-slate-900/40"
      }`}>
        
        {/* Glow Effects */}
        {purchaseStatus === "PENDING" && (
          <div className="absolute top-0 right-0 h-32 w-32 bg-cyan-500/5 rounded-full blur-3xl -mr-10 -mt-10 animate-pulse"></div>
        )}
        {purchaseStatus === "CONFIRMED" && (
          <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
        )}

        <CardHeader className="pb-4 border-b border-slate-800/40">
          <div className="flex justify-between items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono select-none">
              Secure Checkout
            </span>
            {purchaseStatus === "PENDING" && (
              <Badge className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-bold text-[10px]">
                PENDING LOCK
              </Badge>
            )}
            {purchaseStatus === "CONFIRMED" && (
              <Badge className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-bold text-[10px]">
                CONFIRMED
              </Badge>
            )}
            {purchaseStatus === "RELEASED" && (
              <Badge className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[10px]">
                RELEASED
              </Badge>
            )}
            {purchaseStatus === "EXPIRED" && (
              <Badge className="bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[10px]">
                EXPIRED
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl font-extrabold tracking-tight text-slate-200">
            {purchaseStatus === "CONFIRMED" ? "Booking Complete!" : "Secure Your Reservation"}
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 font-medium select-none">
            Review stock transaction details and finalize payment
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6 pb-6 space-y-6">
          
          {/* Active Countdown Timer Panel */}
          {purchaseStatus === "PENDING" && (
            <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 flex items-center justify-between shadow-inner">
              <div className="flex items-center gap-2.5 text-cyan-400">
                <Timer className="h-5 w-5 animate-pulse" />
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Time Remaining</h4>
                  <p className="text-[10px] text-slate-400 font-medium select-none">Secured in temporary transaction lock</p>
                </div>
              </div>
              <span className="text-xl font-black text-cyan-400 font-mono tracking-wider drop-shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse select-none">
                {formatTime(timeLeft)}
              </span>
            </div>
          )}

          {/* Expired State Warning */}
          {purchaseStatus === "EXPIRED" && (
            <div className="bg-red-500/5 border border-red-500/25 rounded-xl p-4 flex items-center gap-3 animate-shake">
              <XCircle className="h-6 w-6 text-red-400 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-red-400">Reservation Expired</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                  Your reservation expired. Please start over.
                </p>
              </div>
            </div>
          )}

          {/* Released State Warning */}
          {purchaseStatus === "RELEASED" && (
            <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex items-center gap-3">
              <XCircle className="h-6 w-6 text-slate-500 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-slate-400">Stock Released</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-relaxed">
                  You canceled this reservation. The stock has been safely returned to the warehouse.
                </p>
              </div>
            </div>
          )}

          {/* Confirmed State Celebration */}
          {purchaseStatus === "CONFIRMED" && (
            <div className="bg-emerald-500/5 border border-emerald-500/25 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
              <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-xs font-extrabold text-emerald-400 font-black">Purchase Confirmed!</h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-relaxed">
                  Stock was successfully deducted. Your order is secured and completed.
                </p>
              </div>
            </div>
          )}

          {/* Transaction Specs */}
          <div className="border border-slate-800/80 bg-slate-950/30 rounded-xl p-4 space-y-3.5 select-none font-semibold text-xs text-slate-400 shadow-inner">
            <div className="flex justify-between items-center">
              <span>Reservation Token:</span>
              <span className="font-mono text-[10px] text-slate-300 font-bold select-text">{reservation.id}</span>
            </div>
            <div className="border-t border-slate-800/45 my-1.5"></div>
            <div className="flex justify-between items-center">
              <span>Product:</span>
              <span className="text-slate-200 font-extrabold flex items-center gap-1.5">
                <ShoppingBag className="h-3.5 w-3.5 text-indigo-400" />
                {reservation.productName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Warehouse Source:</span>
              <span className="text-slate-200 font-extrabold">{reservation.warehouseName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Allocated Quantity:</span>
              <Badge className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-extrabold text-[11px] px-2.5 py-0.5">
                {reservation.quantity} Units
              </Badge>
            </div>
          </div>

        </CardContent>

        <CardFooter className="flex flex-col gap-3.5 border-t border-slate-800/40 pt-6">
          {purchaseStatus === "PENDING" ? (
            <div className="flex gap-3 w-full">
              {/* Cancel Button */}
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={actionLoading}
                className="flex-1 border-slate-850 hover:bg-slate-800/50 hover:text-slate-100 font-extrabold text-xs py-5 active:scale-95 transition-all cursor-pointer"
              >
                Cancel Lock
              </Button>
              
              {/* Confirm Button */}
              <Button
                onClick={handleConfirm}
                disabled={actionLoading}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs py-5 shadow-lg shadow-emerald-950/30 active:scale-95 transition-all cursor-pointer"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-emerald-200" />
                    Finalizing...
                  </>
                ) : (
                  "Confirm Purchase"
                )}
              </Button>
            </div>
          ) : (
            // Redirection / Home Button when closed
            <Button
              onClick={() => router.push("/")}
              disabled={actionLoading}
              className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:text-slate-100 text-slate-300 font-extrabold text-xs py-5 active:scale-95 transition-all cursor-pointer"
            >
              Return to Products Portal
            </Button>
          )}

          {/* Secure indicator */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold select-none mt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
            <span>End-to-End Concurrency Encryption</span>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
