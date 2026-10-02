"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { LogOut, Calculator, Plus, Trash, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "cn";

import { Stay } from "@/features/stays";
import { Tenant } from "@/lib/models/schema";
import { Deposit, calculateNetRefund, DepositDeduction } from "@/features/deposits";
import { Payment } from "@/features/payments";
import { vacateApi } from "../api/vacate.api";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

interface VacateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant;
  stay: Stay;
  deposit?: Deposit;
  payments: Payment[];
}

export function VacateDialog({ open, onOpenChange, tenant, stay, deposit, payments }: VacateDialogProps) {
  const [loading, setLoading] = useState(false);
  const [vacateDate, setVacateDate] = useState<Date>(new Date());
  
  // Custom deductions added by user (damages, painting, etc.)
  const [customDeductions, setCustomDeductions] = useState<DepositDeduction[]>([]);
  const [newDeductionLabel, setNewDeductionLabel] = useState("");
  const [newDeductionAmount, setNewDeductionAmount] = useState("");

  const [refundMode, setRefundMode] = useState<"upi" | "cash" | "bank">("upi");
  const [refundRef, setRefundRef] = useState("");
  const [note, setNote] = useState("");

  // Calculate unpaid rent & fines from pending payments
  const systemDeductions = useMemo(() => {
    const deductions: DepositDeduction[] = [];
    let totalUnpaidRent = 0;
    let totalFines = 0;

    payments.forEach(p => {
      // Check for pending/overdue
      const s = p.status?.toLowerCase();
      if (s !== "paid" && s !== "n/a") {
        totalUnpaidRent += (p.rent || 0) - (p.amountPaid || 0);
        totalFines += p.fine || 0;
      }
    });

    if (totalUnpaidRent > 0) {
      deductions.push({ label: "Unpaid Rent", amount: totalUnpaidRent });
    }
    if (totalFines > 0) {
      deductions.push({ label: "Pending Late Fines", amount: totalFines });
    }

    return deductions;
  }, [payments]);

  const allDeductions = [...systemDeductions, ...customDeductions];
  const totalDeposit = deposit?.amount || 0;
  
  const pendingNewDeduction = Number(newDeductionAmount) || 0;
  const totalDeductionAmount = allDeductions.reduce((sum, d) => sum + d.amount, 0) + pendingNewDeduction;
  const netRefund = Math.max(0, totalDeposit - totalDeductionAmount);
  const totalOwedByTenant = totalDeductionAmount > totalDeposit ? totalDeductionAmount - totalDeposit : 0;

  const handleAddDeduction = () => {
    if (!newDeductionLabel || !newDeductionAmount) return;
    const amount = Number(newDeductionAmount);
    if (amount <= 0) return;

    setCustomDeductions([...customDeductions, { label: newDeductionLabel, amount }]);
    setNewDeductionLabel("");
    setNewDeductionAmount("");
  };

  const removeCustomDeduction = (index: number) => {
    setCustomDeductions(customDeductions.filter((_, i) => i !== index));
  };

  const handleConfirmVacate = async () => {
    if (!deposit) {
      toast.error("Cannot vacate: No active deposit record found.");
      return;
    }

    setLoading(true);
    try {
      await vacateApi.vacateTenant({
        tenantId: tenant.id!,
        tenantName: tenant.name,
        stayId: stay.id || "",
        depositId: deposit.id || "",
        vacateDate,
        deductions: newDeductionLabel && newDeductionAmount 
          ? [...allDeductions, { label: newDeductionLabel, amount: Number(newDeductionAmount) }] 
          : allDeductions,
        refundAmount: netRefund,
        refundMode,
        refundRef,
        note,
      });
      toast.success(`${tenant.name} has been marked as vacated.`);
      setNewDeductionLabel("");
      setNewDeductionAmount("");
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to process vacate flow.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[600px] w-[95vw] max-h-[90vh] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-card border-border p-6 sm:p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <LogOut className="h-6 w-6 text-primary" /> Process Vacate
          </DialogTitle>
          <DialogDescription>
            Calculate final settlement and mark {tenant.name} as vacated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            <div className="space-y-2 w-full sm:flex-1">
              <Label>Vacate Date</Label>
              <div className="block w-full">
                <DatePicker value={vacateDate} onChange={(d) => d && setVacateDate(d)} />
              </div>
            </div>
            <div className="flex-1 p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col justify-center">
              <span className="text-muted-foreground text-sm font-medium mb-1">Total Deposit Held</span>
              <span className="text-2xl font-bold text-foreground">₹{totalDeposit.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" /> Deductions
            </h3>
            
            <div className="space-y-2">
              {systemDeductions.map((d, i) => (
                <div key={`sys-${i}`} className="flex justify-between items-center p-3 bg-muted/20 border border-border rounded-lg text-sm">
                  <span className="font-medium flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" /> {d.label}
                  </span>
                  <span className="font-semibold text-rose-500">-₹{d.amount.toLocaleString()}</span>
                </div>
              ))}

              {customDeductions.map((d, i) => (
                <div key={`custom-${i}`} className="flex justify-between items-center p-3 bg-muted/20 border border-border rounded-lg text-sm group">
                  <span className="font-medium text-foreground">{d.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-rose-500">-₹{d.amount.toLocaleString()}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity" onClick={() => removeCustomDeduction(i)}>
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Custom Deduction */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end p-4 rounded-lg border border-dashed border-border bg-muted/10">
              <div className="flex-1 w-full space-y-1.5">
                <Label className="text-xs text-muted-foreground">Add Custom Deduction (e.g. Damage, Painting)</Label>
                <Input value={newDeductionLabel} onChange={(e) => setNewDeductionLabel(e.target.value)} placeholder="Reason" className="bg-background w-full" />
              </div>
              <div className="w-full sm:w-32 space-y-1.5">
                <Label className="text-xs text-muted-foreground">Amount (₹)</Label>
                <Input type="number" value={newDeductionAmount} onChange={(e) => setNewDeductionAmount(e.target.value)} placeholder="0" className="bg-background w-full" />
              </div>
              <Button variant="secondary" onClick={handleAddDeduction} disabled={!newDeductionLabel || !newDeductionAmount} className="w-full sm:w-auto bg-primary/10 text-primary hover:bg-primary/20">
                <Plus className="h-4 w-4 mr-1" /> Add
              </Button>
            </div>
          </div>

          <div className={cn(
            "p-6 rounded-xl border flex justify-between items-center shadow-sm",
            totalOwedByTenant > 0 ? "border-rose-500/20 bg-rose-500/5" : "border-emerald-500/20 bg-emerald-500/5"
          )}>
            <div>
              <span className={cn(
                "text-sm font-medium block mb-1 uppercase tracking-wider",
                totalOwedByTenant > 0 ? "text-rose-500/80" : "text-emerald-500/80"
              )}>
                {totalOwedByTenant > 0 ? "Tenant Owes You" : "Final Net Refund"}
              </span>
              <span className={cn(
                "text-4xl font-bold tracking-tight",
                totalOwedByTenant > 0 ? "text-rose-500" : "text-emerald-500"
              )}>
                ₹{totalOwedByTenant > 0 ? totalOwedByTenant.toLocaleString() : netRefund.toLocaleString()}
              </span>
            </div>
          </div>

          {netRefund > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <div className="space-y-2">
                <Label>Refund Mode</Label>
                <Select value={refundMode} onValueChange={(v: any) => setRefundMode(v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Transaction / Ref Number</Label>
                <Input value={refundRef} onChange={e => setRefundRef(e.target.value)} placeholder="Optional" className="w-full" />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Internal Note (Optional)</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for vacating, etc." />
          </div>

        </div>

        <DialogFooter className="mt-6 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirmVacate} disabled={loading || !deposit}>
            {loading ? "Processing..." : "Confirm Vacate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
