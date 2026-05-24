"use client";

import React, { use, useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Timer, CheckCircle, XCircle, ArrowLeft, Package, Warehouse, Tag, Hash } from "lucide-react";

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
  const { id } = use(params);

  const [reservation, setReservation] = useState<ReservationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [purchaseStatus, setPurchaseStatus] = useState<"PENDING" | "CONFIRMED" | "RELEASED" | "EXPIRED">("PENDING");

  useEffect(() => {
    async function fetchReservation() {
      try {
        const response = await fetch(`/api/reservations/${id}`);
        if (!response.ok) {
          toast.error("Failed to load reservation.");
          window.location.href = "/";
          return;
        }
        const data = await response.json();
        setReservation(data);
        setPurchaseStatus(data.status);
        const diff = new Date(data.expiresAt).getTime() - Date.now();
        setTimeLeft(diff > 0 ? diff : 0);
        if (data.status === "PENDING" && diff <= 0) setPurchaseStatus("EXPIRED");
      } catch {
        toast.error("Error loading checkout.");
      } finally {
        setLoading(false);
      }
    }
    fetchReservation();
  }, [id]);

  useEffect(() => {
    if (purchaseStatus !== "PENDING" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          clearInterval(timer);
          setPurchaseStatus("EXPIRED");
          toast.warning("Your reservation has expired.");
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [purchaseStatus, timeLeft]);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  };

  const isUrgent = timeLeft < 60000;

  const handleConfirm = async () => {
    if (purchaseStatus !== "PENDING" || actionLoading) return;
    setActionLoading(true);
    const toastId = toast.loading("Confirming purchase...");
    try {
      const res = await fetch(`/api/reservations/${id}/confirm`, { method: "POST" });
      if (res.status === 410) {
        setPurchaseStatus("EXPIRED");
        toast.error("Reservation expired — please start over.", { id: toastId });
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to confirm.", { id: toastId });
        return;
      }
      setPurchaseStatus("CONFIRMED");
      toast.success("Purchase confirmed!", { id: toastId });
    } catch {
      toast.error("Network error. Try again.", { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    const toastId = toast.loading("Releasing reservation...");
    try {
      const res = await fetch(`/api/reservations/${id}/release`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to release.", { id: toastId });
        return;
      }
      setPurchaseStatus("RELEASED");
      toast.success("Reservation cancelled.", { id: toastId });
      setTimeout(() => { window.location.href = "/"; }, 1500);
    } catch {
      toast.error("Network error.", { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--teal)" }} />
        <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
          Loading reservation…
        </p>
      </div>
    );
  }

  if (!reservation) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* ── Header ───────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--teal)" }}
            >
              <Tag className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight">
              Allo Reservation
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              background: "var(--teal-lt)",
              color: "var(--teal-dk)",
              border: "1px solid color-mix(in srgb, var(--teal) 25%, transparent)",
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full pulse-dot"
              style={{ background: "var(--teal)" }}
            />
            Secure checkout
          </div>
        </div>
      </header>

      {/* ── Main ─────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-4 py-10">

        {/* Back link */}
        <div className="w-full max-w-md mb-5">
          <button
            onClick={() => { window.location.href = "/"; }}
            disabled={actionLoading}
            className="flex items-center gap-1.5 text-xs font-semibold transition-colors disabled:opacity-50"
            style={{ color: "var(--muted-foreground)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--teal-dk)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--muted-foreground)")}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Products
          </button>
        </div>

        {/* ── Card ─────────────────────────────── */}
        <div
          className="w-full max-w-md bg-white rounded-2xl border border-gray-200 overflow-hidden fade-up"
          style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.07)" }}
        >

          {/* Card header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Checkout
              </span>
              {purchaseStatus === "PENDING"   && <span className="badge-amber">Pending</span>}
              {purchaseStatus === "CONFIRMED" && <span className="badge-teal">Confirmed</span>}
              {purchaseStatus === "RELEASED"  && <span className="badge-red">Released</span>}
              {purchaseStatus === "EXPIRED"   && <span className="badge-red">Expired</span>}
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">
              {purchaseStatus === "CONFIRMED" ? "Order Confirmed!" : "Complete Your Purchase"}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Review your reservation details below.
            </p>
          </div>

          <div className="px-6 py-6 space-y-5">

            {/* ── Timer ── */}
            {purchaseStatus === "PENDING" && (
              <div
                className="rounded-xl px-4 py-3.5 flex items-center justify-between"
                style={{
                  background: isUrgent ? "var(--red-lt)" : "var(--teal-lt)",
                  border: `1px solid color-mix(in srgb, ${isUrgent ? "var(--red)" : "var(--teal)"} 22%, transparent)`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Timer
                    className="h-4 w-4"
                    style={{ color: isUrgent ? "var(--red)" : "var(--teal-dk)" }}
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-800">Time remaining</p>
                    <p className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                      Stock is held for you
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xl font-black font-mono tracking-widest ${isUrgent ? "timer-urgent" : ""}`}
                  style={{ color: isUrgent ? "var(--red)" : "var(--teal-dk)" }}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}

            {/* ── Expired ── */}
            {purchaseStatus === "EXPIRED" && (
              <div
                className="rounded-xl px-4 py-3.5 flex items-center gap-3"
                style={{
                  background: "var(--red-lt)",
                  border: "1px solid color-mix(in srgb, var(--red) 22%, transparent)",
                }}
              >
                <XCircle className="h-5 w-5 flex-shrink-0" style={{ color: "var(--red)" }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--red)" }}>
                    Reservation expired
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    This hold has lapsed. Return home to reserve again.
                  </p>
                </div>
              </div>
            )}

            {/* ── Released ── */}
            {purchaseStatus === "RELEASED" && (
              <div
                className="rounded-xl px-4 py-3.5 flex items-center gap-3"
                style={{
                  background: "var(--muted)",
                  border: "1px solid var(--border)",
                }}
              >
                <XCircle className="h-5 w-5 flex-shrink-0 text-gray-400" />
                <div>
                  <p className="text-xs font-bold text-gray-600">Reservation cancelled</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    Stock returned to warehouse inventory.
                  </p>
                </div>
              </div>
            )}

            {/* ── Confirmed ── */}
            {purchaseStatus === "CONFIRMED" && (
              <div
                className="rounded-xl px-4 py-3.5 flex items-center gap-3"
                style={{
                  background: "var(--teal-lt)",
                  border: "1px solid color-mix(in srgb, var(--teal) 22%, transparent)",
                }}
              >
                <CheckCircle className="h-5 w-5 flex-shrink-0" style={{ color: "var(--teal-dk)" }} />
                <div>
                  <p className="text-xs font-bold" style={{ color: "var(--teal-dk)" }}>
                    Purchase confirmed
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                    {reservation.quantity} unit{reservation.quantity > 1 ? "s" : ""} permanently deducted from stock.
                  </p>
                </div>
              </div>
            )}

            {/* ── Details ── */}
            <div
              className="rounded-xl border p-4 space-y-3 text-xs"
              style={{ borderColor: "var(--border)", background: "#fafafa" }}
            >
              {[
                {
                  icon: Hash,
                  label: "Reservation ID",
                  value: reservation.id.slice(0, 16) + "…",
                  mono: true,
                },
                {
                  icon: Package,
                  label: "Product",
                  value: reservation.productName,
                  mono: false,
                },
                {
                  icon: Warehouse,
                  label: "Warehouse",
                  value: reservation.warehouseName,
                  mono: false,
                },
                {
                  icon: Tag,
                  label: "Quantity",
                  value: `${reservation.quantity} unit${reservation.quantity > 1 ? "s" : ""}`,
                  mono: false,
                  highlight: true,
                },
              ].map((row, i, arr) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
                      <row.icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{row.label}</span>
                    </div>
                    {row.highlight ? (
                      <span className="badge-teal">{row.value}</span>
                    ) : (
                      <span
                        className={`font-semibold text-gray-800 ${row.mono ? "font-mono text-[11px]" : ""}`}
                      >
                        {row.value}
                      </span>
                    )}
                  </div>
                  {i < arr.length - 1 && (
                    <div className="border-t border-gray-100 mt-3" />
                  )}
                </div>
              ))}
            </div>

            {/* ── Actions ── */}
            {purchaseStatus === "PENDING" ? (
              <div className="flex gap-3 pt-1">
                {/* Cancel */}
                <button
                  onClick={handleCancel}
                  disabled={actionLoading}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold border transition-all active:scale-95 disabled:opacity-50"
                  style={{
                    background: "white",
                    borderColor: "var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  Cancel
                </button>

                {/* Confirm */}
                <button
                  onClick={handleConfirm}
                  disabled={actionLoading}
                  className="btn-plum flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm disabled:opacity-50 active:scale-95"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Confirming…
                    </>
                  ) : (
                    "Confirm Purchase"
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { window.location.href = "/"; }}
                className="btn-teal w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm"
              >
                Back to Products
              </button>
            )}
          </div>
        </div>
      </main>

      {/* ── Footer ───────────────────────────────── */}
      <footer className="border-t border-gray-100 py-5 bg-white">
        <p className="text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
          Allo Reservation System — {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
