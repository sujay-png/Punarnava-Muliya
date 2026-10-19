"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, AlertTriangle, Clock, CalendarIcon } from "lucide-react";
import { toast } from "sonner";

import { tenantsApi } from "@/features/tenants";
import { paymentsApi, Payment, calculatePaymentStatus, calculateFine } from "@/features/payments";
import { Stay } from "@/features/stays";
import { Tenant } from "@/lib/models/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BillingRow = {
  tenantId: string;
  tenantName: string;
  roomNo: string;
  baseRent: number;
  dueDay: number;
  fine: number;
  autoCalculatedFine: number;
  totalAmount: number;
  status: "Paid" | "Pending" | "Overdue" | "Partial" | "Upcoming" | "N/A";
  payment?: Payment;
  stay: Stay;
};

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [rows, setRows] = useState<BillingRow[] | null>(null);
  
  // Mark Paid dialog state
  const [selectedRow, setSelectedRow] = useState<BillingRow | null>(null);
  const [fineInput, setFineInput] = useState<string>("0");
  const [paidDate, setPaidDate] = useState<string>("");
  const [paymentMode, setPaymentMode] = useState<"upi" | "cash" | "bank">("upi");
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

  // Adjust Fine dialog state
  const [adjustingRow, setAdjustingRow] = useState<BillingRow | null>(null);
  const [customFineAmount, setCustomFineAmount] = useState<string>("0");
  const [isSavingFine, setIsSavingFine] = useState(false);

  // Month Key: "YYYY-MM"
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  useEffect(() => {
    // 1. Listen to active tenants
    const unsubscribeTenants = tenantsApi.watchTenants((tenants) => {
      const activeTenants = tenants.filter((t) => t.status !== "vacated");

      // 2. Listen to payments for this month
      const unsubscribePayments = paymentsApi.watchAllPaymentsForMonth(currentMonthKey, (payments) => {
        
        const generatedRows: BillingRow[] = activeTenants.map((t) => {
          const tenantDueDay = t.dueDay || 10;
          // Synthesize a legacy stay for status calculation
          const activeStay: Stay = {
            id: `legacy_stay_${t.id}`,
            tenantId: t.id!,
            roomNumber: t.roomNo || "",
            joinDate: t.joinDate,
            monthlyRent: t.monthlyRent,
            status: t.status === "active" ? "Active" : "OnNotice",
            dueDay: tenantDueDay,
          };

          const status = calculatePaymentStatus(activeStay, currentMonthKey, payments, now, tenantDueDay);
          const payment = payments.find((p) => p.tenantId === t.id);
          const autoFine = calculateFine(currentMonthKey, now, null, tenantDueDay);
          
          if (payment) {
            const isPaid = payment.status === "Paid";
            let fine = 0;
            if (payment.fine !== undefined) {
              fine = payment.fine;
            } else if (isPaid) {
              // Paid payment without explicit fine field: check actual payment date against tenant's due date
              const paidDate = payment.paidOn || payment.paidAt;
              fine = paidDate ? calculateFine(currentMonthKey, paidDate, null, tenantDueDay) : 0;
            } else {
              fine = autoFine;
            }

            const totalAmount = isPaid
              ? (payment.amountPaid || payment.amount || (t.monthlyRent + fine))
              : (t.monthlyRent + fine);

            return {
              tenantId: t.id!,
              tenantName: t.name,
              roomNo: t.roomNo || "",
              baseRent: t.monthlyRent,
              dueDay: tenantDueDay,
              fine,
              autoCalculatedFine: autoFine,
              totalAmount,
              status,
              payment,
              stay: activeStay
            };
          }

          // Not paid yet, calculate dynamic fine and status
          const fine = autoFine;
          const totalAmount = t.monthlyRent + fine;

          return {
            tenantId: t.id!,
            tenantName: t.name,
            roomNo: t.roomNo || "",
            baseRent: t.monthlyRent,
            dueDay: tenantDueDay,
            fine,
            autoCalculatedFine: autoFine,
            totalAmount,
            status,
            stay: activeStay
          };
        });

        // Filter out N/A rows (tenants who joined after this month)
        const validRows = generatedRows.filter(r => r.status !== "N/A");
        setRows(validRows);
      });

      return () => unsubscribePayments();
    });

    return () => unsubscribeTenants();
  }, [currentMonthKey]);

  const handleOpenMarkPaid = (row: BillingRow) => {
    setSelectedRow(row);
    setFineInput(row.fine.toString());
    setPaidDate(format(new Date(), "yyyy-MM-dd"));
    setPaymentMode("upi");
  };

  const handleOpenAdjustFine = (row: BillingRow) => {
    setAdjustingRow(row);
    setCustomFineAmount(row.fine.toString());
  };

  const handleSaveAdjustFine = async () => {
    if (!adjustingRow) return;
    setIsSavingFine(true);
    try {
      const numFine = customFineAmount === "" ? 0 : Math.max(0, parseInt(customFineAmount, 10) || 0);
      await paymentsApi.updateFine({
        tenantId: adjustingRow.tenantId,
        monthKey: currentMonthKey,
        fine: numFine,
        fineWaived: numFine === 0,
        tenantName: adjustingRow.tenantName,
        roomNo: adjustingRow.roomNo,
        rent: adjustingRow.baseRent,
        reason: numFine === 0 ? "Waived by admin" : `Adjusted to ₹${numFine}`,
      });
      toast.success(`Fine set to ₹${numFine.toLocaleString("en-IN")} for ${adjustingRow.tenantName}`);
      setAdjustingRow(null);
    } catch {
      toast.error("Failed to update fine");
    } finally {
      setIsSavingFine(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!selectedRow) return;
    setIsMarkingPaid(true);
    try {
      const numFine = fineInput === "" ? 0 : Math.max(0, parseInt(fineInput, 10) || 0);
      const totalAmount = selectedRow.baseRent + numFine;

      let paidDateTime = new Date();
      if (paidDate) {
        const [year, month, day] = paidDate.split("-").map(Number);
        paidDateTime = new Date(year, month - 1, day, 12, 0, 0);
      }

      const paymentData: Partial<Payment> = {
        tenantId: selectedRow.tenantId,
        tenantName: selectedRow.tenantName,
        roomNo: selectedRow.roomNo,
        monthKey: currentMonthKey,
        month: currentMonthKey,
        rent: selectedRow.baseRent,
        fine: numFine,
        fineWaived: numFine === 0 && selectedRow.autoCalculatedFine > 0,
        amountPaid: totalAmount,
        amount: totalAmount,
        mode: paymentMode,
        paidOn: paidDateTime,
        paidAt: paidDateTime,
        status: "Paid",
      };
      await paymentsApi.markPaid(paymentData);
      toast.success(`Marked ₹${totalAmount.toLocaleString("en-IN")} paid for ${selectedRow.tenantName}`);
      setSelectedRow(null);
    } catch (error) {
      toast.error("Failed to mark as paid");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  // Dynamic calculations for Adjust Fine dialog
  const adjustDefaultFine = adjustingRow?.autoCalculatedFine || 0;
  const adjustFineNum = customFineAmount === "" ? 0 : Math.max(0, parseInt(customFineAmount, 10) || 0);
  const adjustWaived = Math.max(0, adjustDefaultFine - adjustFineNum);
  const adjustTotal = (adjustingRow?.baseRent || 0) + adjustFineNum;

  // Dynamic calculations for Mark Paid dialog
  const markPaidDefaultFine = selectedRow?.autoCalculatedFine || 0;
  const markPaidFineNum = fineInput === "" ? 0 : Math.max(0, parseInt(fineInput, 10) || 0);
  const markPaidWaived = Math.max(0, markPaidDefaultFine - markPaidFineNum);
  const markPaidTotal = (selectedRow?.baseRent || 0) + markPaidFineNum;

  const filteredRows = rows?.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "paid") return r.status === "Paid";
    if (activeTab === "pending") return r.status === "Pending" || r.status === "Overdue" || r.status === "Partial";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fees Collection</h1>
          <p className="text-muted-foreground mt-1">Manage payments for {format(now, "MMMM yyyy")}.</p>
        </div>
        <div className="flex items-center gap-2 text-primary font-medium">
          <CalendarIcon className="h-5 w-5" />
          {format(now, "MMM yyyy")}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {rows === null ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold text-emerald-400">
                ₹{rows.filter(r => r.status === "Paid").reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString("en-IN")}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total successfully collected this month</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {rows === null ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold text-amber-400">
                ₹{rows.filter(r => r.status !== "Paid" && r.status !== "Upcoming").reduce((acc, curr) => acc + curr.totalAmount, 0).toLocaleString("en-IN")}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Pending payments including fines</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="bg-card">
        <div className="overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-semibold text-foreground">Tenant</TableHead>
                <TableHead className="font-semibold text-foreground">Room</TableHead>
                <TableHead className="font-semibold text-foreground">Base Rent</TableHead>
                <TableHead className="font-semibold text-foreground">Fine</TableHead>
                <TableHead className="font-semibold text-foreground">Total</TableHead>
                <TableHead className="font-semibold text-foreground">Status</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows === null ? (
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRows?.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No matching billing records found for this month.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows?.map((row) => (
                  <TableRow key={row.tenantId} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div>
                        {row.tenantName}
                        {row.dueDay !== 10 && (
                          <span className="text-[11px] text-muted-foreground ml-1.5 font-normal">
                            (Due {row.dueDay}th)
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{row.roomNo || "-"}</TableCell>
                    <TableCell>₹{row.baseRent.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-8">
                        {row.fine > 0 ? (
                          <span className="text-amber-400 font-medium">+₹{row.fine.toLocaleString("en-IN")}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                        {row.status !== "Paid" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground border-border/60"
                            onClick={() => handleOpenAdjustFine(row)}
                          >
                            Adjust Fine
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">₹{row.totalAmount.toLocaleString("en-IN")}</TableCell>
                    <TableCell>
                      <FeeStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {row.status !== "Paid" ? (
                        <Button
                          variant="default"
                          size="sm"
                          className="h-8"
                          onClick={() => handleOpenMarkPaid(row)}
                        >
                          Mark Paid
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          Paid on {row.payment?.paidOn ? format(row.payment.paidOn, "dd MMM") : row.payment?.paidAt ? format(row.payment.paidAt, "dd MMM") : "Recorded"}
                          {row.payment?.mode && ` via ${row.payment.mode.toUpperCase()}`}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Dialog to Adjust Fine */}
      <Dialog open={!!adjustingRow} onOpenChange={(open) => !open && setAdjustingRow(null)}>
        <DialogContent className="bg-card border-border sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Adjust Late Fine</DialogTitle>
            <DialogDescription>
              Set or adjust fine for <span className="font-medium text-foreground">{adjustingRow?.tenantName}</span> (Fee due on {adjustingRow?.dueDay || 10}th of each month)
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            <div className="flex justify-between items-center text-sm py-2 px-3 rounded-lg bg-muted/30 border border-border">
              <span className="text-muted-foreground">Monthly Base Rent:</span>
              <span className="font-semibold text-foreground">₹{adjustingRow?.baseRent.toLocaleString("en-IN")}</span>
            </div>

            <div className="space-y-3 p-3.5 rounded-lg bg-muted/20 border border-border">
              <div className="space-y-1.5">
                <Label htmlFor="custom-fine-input" className="text-sm font-medium">
                  Fine Amount to Charge (₹)
                </Label>
                <Input
                  id="custom-fine-input"
                  type="number"
                  min={0}
                  value={customFineAmount}
                  onChange={(e) => setCustomFineAmount(e.target.value)}
                  className="font-semibold"
                  placeholder="0"
                />
              </div>

              {/* Grey one below the other: default and waive */}
              <div className="space-y-1.5 pt-2 text-xs text-muted-foreground border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span>default :</span>
                  <button
                    type="button"
                    onClick={() => setCustomFineAmount(adjustDefaultFine.toString())}
                    className="font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Click to apply default fine"
                  >
                    ₹{adjustDefaultFine.toLocaleString("en-IN")}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>waive :</span>
                  <button
                    type="button"
                    onClick={() => setCustomFineAmount("0")}
                    className="font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Click to waive fine to ₹0"
                  >
                    ₹{adjustWaived.toLocaleString("en-IN")}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/40 p-3 border border-border space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Base Rent + Fine:</span>
                <span>₹{adjustingRow?.baseRent.toLocaleString("en-IN")} + ₹{adjustFineNum.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-sm">Updated Total:</span>
                <span className="font-bold text-xl text-primary">
                  ₹{adjustTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAdjustingRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdjustFine} disabled={isSavingFine}>
              {isSavingFine ? "Saving..." : "Save Fine"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog to Mark Paid */}
      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="bg-card border-border sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Mark Payment as Paid</DialogTitle>
            <DialogDescription>
              Record fee collection for <span className="font-medium text-foreground">{selectedRow?.tenantName}</span> (Room {selectedRow?.roomNo || "-"})
            </DialogDescription>
          </DialogHeader>

          <div className="py-2 space-y-4">
            {/* Base Rent */}
            <div className="flex justify-between items-center text-sm py-2 px-3 rounded-lg bg-muted/30 border border-border">
              <span className="text-muted-foreground">Monthly Base Rent:</span>
              <span className="font-semibold text-foreground">₹{selectedRow?.baseRent.toLocaleString("en-IN")}</span>
            </div>

            {/* Editable Fine Section */}
            <div className="space-y-3 p-3.5 rounded-lg bg-muted/20 border border-border">
              <div className="space-y-1.5">
                <Label htmlFor="fine-input" className="text-sm font-medium">
                  Late Fine (₹)
                </Label>
                <Input
                  id="fine-input"
                  type="number"
                  min={0}
                  value={fineInput}
                  onChange={(e) => setFineInput(e.target.value)}
                  className="font-semibold"
                  placeholder="0"
                />
              </div>

              {/* Grey one below the other: default and waive */}
              <div className="space-y-1.5 pt-2 text-xs text-muted-foreground border-t border-border/50">
                <div className="flex items-center justify-between">
                  <span>default :</span>
                  <button
                    type="button"
                    onClick={() => setFineInput(markPaidDefaultFine.toString())}
                    className="font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Click to apply default fine"
                  >
                    ₹{markPaidDefaultFine.toLocaleString("en-IN")}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>waive :</span>
                  <button
                    type="button"
                    onClick={() => setFineInput("0")}
                    className="font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Click to waive fine to ₹0"
                  >
                    ₹{markPaidWaived.toLocaleString("en-IN")}
                  </button>
                </div>
              </div>
            </div>

            {/* Paid Date */}
            <div className="space-y-1.5">
              <Label htmlFor="paid-date" className="text-sm font-medium">
                Payment Date
              </Label>
              <Input
                id="paid-date"
                type="date"
                value={paidDate}
                max={format(now, "yyyy-MM-dd")}
                onChange={(e) => {
                  const newDate = e.target.value;
                  setPaidDate(newDate);
                  if (newDate) {
                    const day = Number(newDate.split("-")[2]);
                    if (day <= (selectedRow?.dueDay || 10) && markPaidFineNum > 0) {
                      setFineInput("0");
                    }
                  }
                }}
              />
              <p className="text-[11px] text-muted-foreground">
                Set actual payment date if updating software retroactively.
              </p>
            </div>

            {/* Payment Mode */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Payment Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["upi", "cash", "bank"] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    variant={paymentMode === mode ? "default" : "outline"}
                    size="sm"
                    className="capitalize text-xs h-8"
                    onClick={() => setPaymentMode(mode)}
                  >
                    {mode === "upi" ? "UPI" : mode === "cash" ? "Cash" : "Bank Transfer"}
                  </Button>
                ))}
              </div>
            </div>

            {/* Total Summary */}
            <div className="rounded-lg bg-muted/40 p-3 border border-border space-y-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Base Rent + Fine:</span>
                <span>₹{selectedRow?.baseRent.toLocaleString("en-IN")} + ₹{markPaidFineNum.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="font-semibold text-sm">Total Collected:</span>
                <span className="font-bold text-xl text-primary">
                  ₹{markPaidTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSelectedRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={isMarkingPaid}>
              {isMarkingPaid ? "Saving..." : "Confirm Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeeStatusBadge({ status }: { status: BillingRow["status"] }) {
  if (status === "Paid") {
    return <span className="text-emerald-400 font-medium">Paid</span>;
  }
  if (status === "Pending") {
    return <span className="text-amber-400 font-medium">Pending</span>;
  }
  if (status === "Partial") {
    return <span className="text-blue-400 font-medium">Partial</span>;
  }
  if (status === "Upcoming") {
    return <span className="text-muted-foreground font-medium">Upcoming</span>;
  }
  return <span className="text-rose-400 font-medium">Overdue</span>;
}
