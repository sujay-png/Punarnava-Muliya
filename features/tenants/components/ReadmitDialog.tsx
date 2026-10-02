"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Users, Building } from "lucide-react";
import { toast } from "sonner";
import { writeBatch, doc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

import { Tenant } from "@/lib/models/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReadmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant;
}

export function ReadmitDialog({ open, onOpenChange, tenant }: ReadmitDialogProps) {
  const [loading, setLoading] = useState(false);
  
  const [joinDate, setJoinDate] = useState<Date>(new Date());
  const [roomNo, setRoomNo] = useState(tenant.roomNo || "");
  const [monthlyRent, setMonthlyRent] = useState(tenant.monthlyRent?.toString() || "");
  
  // Deposit
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMode, setDepositMode] = useState<"cash" | "upi" | "bank">("upi");

  const handleReadmit = async () => {
    if (!monthlyRent) {
      toast.error("Monthly rent is required.");
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);

      // 1. Update Tenant Document
      const tenantRef = doc(db, "tenants", tenant.id!);
      batch.update(tenantRef, {
        status: "active",
        roomNo: roomNo,
        monthlyRent: Number(monthlyRent),
        joinDate: joinDate,
      });

      // 2. Create new Stay Document
      const newStayRef = doc(collection(db, "stays"));
      batch.set(newStayRef, {
        tenantId: tenant.id!,
        roomNumber: roomNo,
        joinDate: joinDate,
        monthlyRent: Number(monthlyRent),
        status: "Active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // 3. Create new Deposit Document (if amount provided)
      const depAmt = Number(depositAmount);
      if (depAmt > 0) {
        const depositRef = doc(collection(db, "deposits"));
        batch.set(depositRef, {
          tenantId: tenant.id!,
          stayId: newStayRef.id,
          amount: depAmt,
          paidOn: joinDate,
          mode: depositMode,
          status: "Held",
          deductions: [],
        });
      }

      // 4. Create StatusHistory Record
      const historyRef = doc(collection(db, "statusHistory"));
      batch.set(historyRef, {
        stayId: newStayRef.id,
        from: "vacated",
        to: "active",
        changedAt: new Date(),
        changedBy: "Admin",
        note: `Re-admitted to room ${roomNo}`,
      });

      await batch.commit();
      toast.success(`${tenant.name} has been successfully re-admitted!`);
      onOpenChange(false);
      
      // Optionally reset form
      setDepositAmount("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to re-admit tenant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="h-6 w-6 text-primary" /> Re-admit {tenant.name}
          </DialogTitle>
          <DialogDescription>
            Welcome them back! This will create a new active Stay record while preserving all of their historical data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Room Number</Label>
              <Input value={roomNo} onChange={e => setRoomNo(e.target.value)} placeholder="e.g. 101" />
            </div>
            <div className="space-y-2">
              <Label>New Join Date</Label>
              <DatePicker value={joinDate} onChange={(d) => d && setJoinDate(d)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Monthly Rent (₹)</Label>
            <Input type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} placeholder="e.g. 5000" />
          </div>

          <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Building className="h-4 w-4" /> New Security Deposit
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Deposit Amount (₹)</Label>
                <Input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Payment Mode</Label>
                <Select value={depositMode} onValueChange={(v: any) => setDepositMode(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="default" onClick={handleReadmit} disabled={loading || !monthlyRent}>
            {loading ? "Re-admitting..." : "Confirm Re-admit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
