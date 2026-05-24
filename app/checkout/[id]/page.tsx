"use client";

import React, { use, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          window.location.href = "/";
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
  }, [id]);

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
        window.location.href = "/";
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 antialiased">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-gray-500 animate-pulse">
          Loading reservation transaction details...
        </p>
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col antialiased">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <ShoppingBag className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-none">
                Allo Reservation System
              </h1>
              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                Secure Checkout
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-5 border border-emerald-200 rounded-full px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 pulse-dot" />
            <span className="text-[11px] font-bold text-emerald-700">Protected</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 flex flex-col items-center justify-center">
        
        {/* Back button */}
        <div className="w-full max-w-md mb-6 animate-fade-in self-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              window.location.href = "/";
            }}
            disabled={actionLoading}
            className="text-gray-500 hover:text-indigo-600 hover:bg-gray-100/60"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
          </Button>
        </div>

        {/* Main Checkout Card */}
        <Card className="w-full max-w-md bg-white border border-border rounded-2xl overflow-hidden card-glow shadow-md">
          <CardHeader className="pb-4 border-b border-gray-100 bg-gray-50/60">
            <div className="flex justify-between items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest font-mono select-none">
                Transaction Specs
              </span>
              {purchaseStatus === "PENDING" && (
                <span className="badge-amber">PENDING LOCK</span>
              )}
              {purchaseStatus === "CONFIRMED" && (
                <span className="badge-green">CONFIRMED</span>
              )}
              {purchaseStatus === "RELEASED" && (
                <span className="badge-red">RELEASED</span>
              )}
              {purchaseStatus === "EXPIRED" && (
                <span className="badge-red">EXPIRED</span>
              )}
            </div>
            <CardTitle className="text-lg font-extrabold text-gray-900 leading-tight">
              {purchaseStatus === "CONFIRMED" ? "Order Secured!" : "Complete Your Purchase"}
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-1">
              Verify stock allocation details below and finalize payment.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6 pb-6 space-y-6">
            
            {/* Active Countdown Timer Panel */}
            {purchaseStatus === "PENDING" && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5 text-indigo-600">
                  <Timer className="h-5 w-5 animate-pulse" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-800">Time Remaining</h4>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5 select-none">Quantity is reserved for you</p>
                  </div>
                </div>
                <span className="text-lg font-black text-indigo-600 font-mono tracking-wider animate-pulse select-none">
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            {/* Expired State Warning */}
            {purchaseStatus === "EXPIRED" && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 animate-shake">
                <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-red-800">Reservation Expired</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                    This temporary hold expired. Please return home to start over.
                  </p>
                </div>
              </div>
            )}

            {/* Released State Warning */}
            {purchaseStatus === "RELEASED" && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                <XCircle className="h-6 w-6 text-gray-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-gray-600">Stock Released</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">
                    You released this temporary stock hold back into active warehouse inventory.
                  </p>
                </div>
              </div>
            )}

            {/* Confirmed State Celebration */}
            {purchaseStatus === "CONFIRMED" && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                <CheckCircle className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-emerald-800">Purchase Confirmed!</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                    Your stock units were successfully deducted. Order is secured and complete!
                  </p>
                </div>
              </div>
            )}

            {/* Transaction Specs details list */}
            <div className="border border-gray-100 bg-gray-50/40 rounded-xl p-4 space-y-3 font-mono text-[11px] text-gray-500 shadow-inner">
              <div className="flex justify-between items-center">
                <span>Hold Token:</span>
                <span className="text-gray-800 font-bold select-text">{reservation.id.slice(0, 16)}...</span>
              </div>
              <div className="border-t border-gray-100 my-1"></div>
              <div className="flex justify-between items-center font-sans text-xs">
                <span>Product Name:</span>
                <span className="text-gray-900 font-bold flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5 text-indigo-500" />
                  {reservation.productName}
                </span>
              </div>
              <div className="flex justify-between items-center font-sans text-xs">
                <span>Warehouse:</span>
                <span className="text-gray-900 font-bold">{reservation.warehouseName}</span>
              </div>
              <div className="flex justify-between items-center font-sans text-xs">
                <span>Quantity Booked:</span>
                <span className="badge-indigo">
                  {reservation.quantity} Units
                </span>
              </div>
            </div>

          </CardContent>

          <CardFooter className="flex flex-col gap-3.5 border-t border-gray-100 pt-6">
            {purchaseStatus === "PENDING" ? (
              <div className="flex gap-3 w-full">
                {/* Cancel Button */}
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl font-bold py-3.5 text-xs active:scale-95 transition-all"
                >
                  Cancel Hold
                </Button>
                
                {/* Confirm Button */}
                <Button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold py-3.5 text-xs shadow-md shadow-indigo-150 active:scale-95 transition-all"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-white" />
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
                onClick={() => {
                  window.location.href = "/";
                }}
                disabled={actionLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold py-3.5 text-xs active:scale-95 transition-all"
              >
                Return to Products Portal
              </Button>
            )}

            {/* Secure indicator */}
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold select-none mt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>End-to-End Concurrency Encryption</span>
            </div>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
