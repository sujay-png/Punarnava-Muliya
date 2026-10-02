"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle, Clock, Receipt, Banknote, XCircle } from "lucide-react";
import { cn } from "cn";

import { Stay } from "@/features/stays";
import { Payment, calculatePaymentStatus, calculateFine, paymentsApi } from "@/features/payments";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PaymentCalendar({ stay, payments }: { stay: Stay; payments: Payment[] }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const months = Array.from({ length: 12 }, (_, i) => {
    const monthNum = i + 1;
    const formattedMonth = monthNum.toString().padStart(2, '0');
    const monthKey = `${year}-${formattedMonth}`;
    const status = calculatePaymentStatus(stay, monthKey, payments);
    const payment = payments.find(p => (p.month === monthKey || p.monthKey === monthKey) && (p.stayId === stay.id || p.tenantId === stay.tenantId));
    
    return {
      name: format(new Date(year, i, 1), 'MMM'),
      monthKey,
      status,
      payment,
      hasFine: payment ? payment.fine > 0 : calculateFine(monthKey, new Date(), stay.vacateDate) > 0,
    };
  });

  const selectedMonthData = months.find(m => m.monthKey === selectedMonth);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Payment History</h3>
        <div className="flex items-center gap-4 bg-muted/50 rounded-full px-4 py-1.5 border border-border">
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setYear(y => y - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm tabular-nums min-w-[3rem] text-center">{year}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setYear(y => y + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {months.map((m) => {
          const isNA = m.status === "N/A";
          
          return (
            <button
              key={m.monthKey}
              disabled={isNA || m.status === "Upcoming"}
              onClick={() => setSelectedMonth(m.monthKey)}
              className={cn(
                "relative flex flex-col p-4 rounded-xl border text-left transition-all duration-200 bg-card",
                (!isNA && m.status !== "Upcoming") && "hover:shadow-md cursor-pointer hover:border-primary/50",
                (isNA || m.status === "Upcoming") && "cursor-not-allowed",
                isNA && "opacity-40 bg-muted/30 border-transparent",
                m.status === "Upcoming" && "opacity-70 border-border border-dashed hover:shadow-none hover:border-border"
              )}
            >
              <div className="flex justify-between items-start">
                <span className="font-semibold text-lg">{m.name}</span>
                {m.status === "Paid" && m.hasFine && (
                  <div className="h-2 w-2 rounded-full bg-amber-500" title="Included Fine" />
                )}
              </div>
              
              <div className="mt-4 flex flex-col items-start gap-1">
                <span className={cn(
                  "text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider",
                  m.status === "Paid" && "text-emerald-600 bg-emerald-500/10 dark:text-emerald-400",
                  m.status === "Pending" && "text-amber-600 bg-amber-500/10 dark:text-amber-400",
                  m.status === "Overdue" && "text-rose-600 bg-rose-500/10 dark:text-rose-400",
                  m.status === "Partial" && "text-amber-600 bg-amber-500/10 dark:text-amber-400",
                  m.status === "Upcoming" && "text-muted-foreground bg-muted/50",
                  isNA && "text-muted-foreground bg-muted/50"
                )}>
                  {m.status}
                </span>

                {m.status === "Paid" && m.payment && (
                  <span className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> {format(m.payment.paidOn || m.payment.paidAt || new Date(), "dd MMM yyyy")}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <PaymentDetailsDrawer 
        open={!!selectedMonth}
        onOpenChange={(v) => !v && setSelectedMonth(null)}
        monthData={selectedMonthData}
        stay={stay}
      />
    </div>
  );
}

function PaymentDetailsDrawer({ open, onOpenChange, monthData, stay }: { open: boolean, onOpenChange: (v: boolean) => void, monthData?: any, stay: Stay }) {
  const [loading, setLoading] = useState(false);
  const [markPaidMode, setMarkPaidMode] = useState(false);
  
  // Mark Paid form state
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentMode, setPaymentMode] = useState<"cash"|"upi"|"bank">("upi");
  const [receiptNo, setReceiptNo] = useState("");
  
  if (!monthData) return null;

  const currentFine = calculateFine(monthData.monthKey, new Date(), stay.vacateDate);
  const expectedTotal = stay.monthlyRent + currentFine;
  
  const handleMarkPaid = async () => {
    setLoading(true);
    try {
      // In a real app, this should call paymentsApi.markPaid or a server action
      // We will use legacy firestoreService for now as a stub
      const payData: Partial<Payment> = {
        stayId: stay.id,
        tenantId: stay.tenantId,
        tenantName: "Unknown", // Would normally pass from parent
        roomNo: stay.roomNumber,
        monthKey: monthData.monthKey,
        month: monthData.monthKey,
        rent: stay.monthlyRent,
        fine: currentFine,
        amountPaid: Number(amountPaid) || expectedTotal,
        amount: Number(amountPaid) || expectedTotal,
        status: "Paid",
        mode: paymentMode,
        receiptNo,
        paidOn: new Date(),
        paidAt: new Date(),
      };
      
      await paymentsApi.markPaid(payData);
      toast.success(`Payment marked as paid for ${monthData.name}`);
      setMarkPaidMode(false);
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to mark as paid");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnpaid = async () => {
    if (!monthData.payment?.id) return;
    setLoading(true);
    try {
      await paymentsApi.markUnpaid(monthData.payment.id);
      toast.success(`Payment marked as unpaid for ${monthData.name}`);
      onOpenChange(false);
    } catch (e) {
      toast.error("Failed to mark as unpaid");
    } finally {
      setLoading(false);
    }
  };

  const p = monthData.payment;

  return (
    <Dialog open={open} onOpenChange={(v) => {
      onOpenChange(v);
      if (!v) setMarkPaidMode(false);
    }}>
      <DialogContent className="sm:max-w-md w-full bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl">{monthData.name} {monthData.monthKey.split("-")[0]}</DialogTitle>
          <DialogDescription>
            Payment details and status for this month.
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className={cn(
              monthData.status === "Paid" && "border-emerald-500/30 text-emerald-500 bg-emerald-500/10",
              monthData.status === "Pending" && "border-amber-500/30 text-amber-500 bg-amber-500/10",
              monthData.status === "Overdue" && "border-rose-500/30 text-rose-500 bg-rose-500/10",
              monthData.status === "Upcoming" && "border-border text-muted-foreground bg-muted",
            )}>
              {monthData.status}
            </Badge>
            {p?.receiptNo && <Badge variant="secondary">Receipt: {p.receiptNo}</Badge>}
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-6">
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="font-medium">₹{p?.rent || stay.monthlyRent}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Late Fine
              </span>
              <span className="font-medium text-amber-500">₹{(p ? p.fine : currentFine) || 0}</span>
            </div>

            <div className="border-t border-border pt-4 flex justify-between font-semibold text-lg">
              <span>Total {p?.status === "Paid" ? "Paid" : "Due"}</span>
              <span>₹{(p ? p.amountPaid : expectedTotal) || 0}</span>
            </div>
          </div>

          {p?.status === "Paid" && (
            <div className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" /> Paid on {format(p.paidOn || p.paidAt || new Date(), "dd MMM yyyy")}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Banknote className="h-4 w-4" /> Mode: {p.mode || "Unknown"}
              </div>
              
              <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20 mt-4" onClick={handleMarkUnpaid} disabled={loading}>
                <XCircle className="mr-2 h-4 w-4" /> Mark as Unpaid
              </Button>
            </div>
          )}

          {!markPaidMode && monthData.status !== "Paid" && (
            <Button className="w-full" size="lg" onClick={() => {
              setAmountPaid(expectedTotal.toString());
              setMarkPaidMode(true);
            }}>
              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
            </Button>
          )}

          {markPaidMode && (
            <div className="space-y-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-4">
              <div className="space-y-2">
                <Label>Amount Paid (₹)</Label>
                <Input type="number" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={(v: any) => setPaymentMode(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Receipt Number (Optional)</Label>
                <Input value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setMarkPaidMode(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleMarkPaid} disabled={loading}>
                  Confirm Payment
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
