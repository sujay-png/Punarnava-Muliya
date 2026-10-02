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
  fine: number;
  totalAmount: number;
  status: "Paid" | "Pending" | "Overdue" | "Partial" | "Upcoming" | "N/A";
  payment?: Payment;
  stay: Stay;
};

export default function FeesPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [rows, setRows] = useState<BillingRow[] | null>(null);
  const [selectedRow, setSelectedRow] = useState<BillingRow | null>(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);

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
          // Synthesize a legacy stay for status calculation
          const activeStay: Stay = {
            id: `legacy_stay_${t.id}`,
            tenantId: t.id!,
            roomNumber: t.roomNo || "",
            joinDate: t.joinDate,
            monthlyRent: t.monthlyRent,
            status: t.status === "active" ? "Active" : "OnNotice",
          };

          const status = calculatePaymentStatus(activeStay, currentMonthKey, payments);
          const payment = payments.find((p) => p.tenantId === t.id);
          
          if (payment) {
            // Found existing payment (either Paid, Partial, or marked as Pending/Overdue)
            return {
              tenantId: t.id!,
              tenantName: t.name,
              roomNo: t.roomNo || "",
              baseRent: t.monthlyRent,
              fine: payment.fine !== undefined ? payment.fine : ((payment.amount || 0) - t.monthlyRent),
              totalAmount: payment.amountPaid || payment.amount || 0,
              status,
              payment,
              stay: activeStay
            };
          }

          // Not paid yet, calculate dynamic fine and status
          const fine = calculateFine(currentMonthKey, new Date());
          const totalAmount = t.monthlyRent + fine;

          return {
            tenantId: t.id!,
            tenantName: t.name,
            roomNo: t.roomNo || "",
            baseRent: t.monthlyRent,
            fine,
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

  const handleMarkPaid = async () => {
    if (!selectedRow) return;
    setIsMarkingPaid(true);
    try {
      const paymentData: Partial<Payment> = {
        tenantId: selectedRow.tenantId,
        tenantName: selectedRow.tenantName,
        roomNo: selectedRow.roomNo,
        monthKey: currentMonthKey,
        month: currentMonthKey,
        rent: selectedRow.baseRent,
        fine: selectedRow.fine,
        amountPaid: selectedRow.totalAmount, // amount + fine baked in
        status: "Paid",
      };
      await paymentsApi.markPaid(paymentData);
      toast.success(`Marked ₹${selectedRow.totalAmount.toLocaleString("en-IN")} paid for ${selectedRow.tenantName}`);
      setSelectedRow(null);
    } catch (error) {
      toast.error("Failed to mark as paid");
    } finally {
      setIsMarkingPaid(false);
    }
  };

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
                    <TableCell className="font-medium">{row.tenantName}</TableCell>
                    <TableCell>{row.roomNo}</TableCell>
                    <TableCell>₹{row.baseRent.toLocaleString("en-IN")}</TableCell>
                    <TableCell className={row.fine > 0 ? "text-amber-500 font-medium" : "text-muted-foreground"}>
                      {row.fine > 0 ? `+₹${row.fine.toLocaleString("en-IN")}` : "-"}
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
                          onClick={() => setSelectedRow(row)}
                        >
                          Mark Paid
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                          Paid on {row.payment?.paidOn ? format(row.payment.paidOn, "dd MMM") : row.payment?.paidAt ? format(row.payment.paidAt, "dd MMM") : "Unknown"}
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

      <Dialog open={!!selectedRow} onOpenChange={(open) => !open && setSelectedRow(null)}>
        <DialogContent className="bg-card border-border sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              Mark the fee as fully paid for {selectedRow?.tenantName}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Base Rent:</span>
              <span className="font-medium">₹{selectedRow?.baseRent.toLocaleString("en-IN")}</span>
            </div>
            {selectedRow && selectedRow.fine > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Late Fine:</span>
                <span className="font-medium text-amber-500">+₹{selectedRow.fine.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="font-medium">Total Amount:</span>
              <span className="font-bold text-xl text-primary">₹{selectedRow?.totalAmount.toLocaleString("en-IN")}</span>
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
    return (
      <Badge variant="outline" className="bg-transparent text-emerald-500 border-emerald-500/20 font-medium">
        <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
      </Badge>
    );
  }
  if (status === "Pending") {
    return (
      <Badge variant="outline" className="bg-transparent text-amber-500 border-amber-500/20 font-medium">
        <Clock className="w-3 h-3 mr-1" /> Pending
      </Badge>
    );
  }
  if (status === "Partial") {
    return (
      <Badge variant="outline" className="bg-transparent text-blue-500 border-blue-500/20 font-medium">
        <Clock className="w-3 h-3 mr-1" /> Partial
      </Badge>
    );
  }
  if (status === "Upcoming") {
    return (
      <Badge variant="outline" className="bg-transparent text-muted-foreground border-border font-medium">
        Upcoming
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="bg-transparent text-rose-500 border-rose-500/20 font-medium">
      <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
    </Badge>
  );
}
