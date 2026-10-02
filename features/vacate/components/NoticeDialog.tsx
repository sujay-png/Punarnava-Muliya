"use client";

import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { Tenant } from "@/lib/models/schema";
import { Stay } from "@/features/stays";
import { vacateApi } from "../api/vacate.api";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface NoticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: Tenant;
  stay: Stay;
}

export function NoticeDialog({ open, onOpenChange, tenant, stay }: NoticeDialogProps) {
  const [loading, setLoading] = useState(false);
  const [noticeDate, setNoticeDate] = useState<Date>(new Date());
  
  // Default expected vacate date is 30 days from notice date
  const defaultVacateDate = new Date();
  defaultVacateDate.setDate(defaultVacateDate.getDate() + 30);
  const [expectedVacateDate, setExpectedVacateDate] = useState<Date>(defaultVacateDate);
  const [note, setNote] = useState("");

  const handleGiveNotice = async () => {
    if (!stay.id) {
      toast.error("Active stay not found");
      return;
    }

    setLoading(true);
    try {
      await vacateApi.giveNotice({
        tenantId: tenant.id!,
        stayId: stay.id,
        noticeDate,
        expectedVacateDate,
        note
      });
      toast.success(`${tenant.name} is now on notice.`);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast.error("Failed to give notice.");
    } finally {
      setLoading(false);
    }
  };

  const daysRemaining = expectedVacateDate ? differenceInDays(expectedVacateDate, noticeDate) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[500px] w-[95vw] bg-card border-border p-6 sm:p-8 overflow-y-auto max-h-[90vh] overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Bell className="h-6 w-6 text-primary" /> Give Notice
          </DialogTitle>
          <DialogDescription>
            Record that {tenant.name} is planning to vacate the PG.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="space-y-2 flex-1 w-full">
              <Label>Notice Given On</Label>
              <div className="block w-full">
                <DatePicker value={noticeDate} onChange={(d) => d && setNoticeDate(d)} />
              </div>
            </div>
            <div className="space-y-2 flex-1 w-full">
              <Label>Expected Vacate Date</Label>
              <div className="block w-full">
                <DatePicker value={expectedVacateDate} onChange={(d) => d && setExpectedVacateDate(d)} />
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-border bg-primary/5 text-primary flex items-center justify-between shadow-sm">
            <span className="font-medium">Notice Period</span>
            <span className="text-xl font-bold">{daysRemaining} Days</span>
          </div>

          <div className="space-y-2">
            <Label>Internal Note (Optional)</Label>
            <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for leaving, etc." />
          </div>
        </div>

        <DialogFooter className="mt-6 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            variant="default" 
            onClick={handleGiveNotice} 
            disabled={loading}
          >
            {loading ? "Processing..." : "Confirm Notice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
