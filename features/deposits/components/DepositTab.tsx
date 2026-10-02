"use client";

import { format } from "date-fns";
import { Receipt, AlertTriangle, CheckCircle, ShieldCheck, ArrowRight, ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Deposit } from "../model/deposit.schema";
import { calculateNetRefund } from "../model/deposit.logic";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";

interface DepositTabProps {
  deposit?: Deposit;
}

export function DepositTab({ deposit }: DepositTabProps) {
  if (!deposit) {
    return (
      <div className="p-8 bg-card rounded-xl border border-border text-center space-y-3">
        <ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
        <h3 className="font-semibold text-lg">No Deposit Record Found</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          No security deposit was logged for this stay. If this is an error, please update the tenant's record.
        </p>
      </div>
    );
  }

  const netRefund = calculateNetRefund(deposit.amount, deposit.deductions);
  const isSettled = deposit.status === "Refunded" || deposit.status === "Forfeited" || deposit.status === "PartiallyRefunded";

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in">
      {/* Header */}
      <div className="p-6 bg-muted/20 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center border",
            isSettled ? "bg-muted border-border text-muted-foreground" : "bg-primary/10 border-primary/20 text-primary"
          )}>
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Security Deposit</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={cn(
            deposit.status === "Held" && "bg-amber-400/10 text-amber-500 border-amber-400/20",
            deposit.status === "Refunded" && "bg-emerald-400/10 text-emerald-500 border-emerald-400/20",
            deposit.status === "Forfeited" && "bg-rose-400/10 text-rose-500 border-rose-400/20"
          )}>
            {deposit.status}
          </Badge>
          <span className="text-sm text-muted-foreground bg-background border border-border px-2 py-0.5 rounded-md font-medium shadow-sm">
            {format(deposit.paidOn, "dd MMM yyyy")}
          </span>
        </div>
      </div>

      {/* Ledger Body */}
      <div className="p-6 space-y-8">
        
        {/* Collection details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <span className="text-muted-foreground block mb-1">Base Amount</span>
            <span className="font-medium text-base">₹{deposit.amount.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-muted-foreground block mb-1">Payment Mode</span>
            <span className="font-medium text-base capitalize">{deposit.mode}</span>
          </div>
          {isSettled && deposit.refundedOn && (
            <div>
              <span className="text-muted-foreground block mb-1">Settled On</span>
              <span className="font-medium text-base">{format(deposit.refundedOn, "dd MMM yyyy")}</span>
            </div>
          )}
          {isSettled && deposit.refundMode && (
            <div>
              <span className="text-muted-foreground block mb-1">Refund Mode</span>
              <span className="font-medium text-base capitalize">{deposit.refundMode}</span>
            </div>
          )}
        </div>

        {isSettled && (
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Settlement Ledger</h4>
            <div className="rounded-xl border border-border overflow-hidden bg-background shadow-sm">
              
              <div className="flex justify-between items-center p-5 border-b border-border">
                <span className="font-medium text-muted-foreground">Original Deposit</span>
                <span className="font-semibold text-lg text-foreground">₹{deposit.amount.toLocaleString()}</span>
              </div>
              
              <div className="bg-muted/20">
                {deposit.deductions.map((d, i) => (
                  <div key={i} className="flex justify-between items-center px-5 py-4 border-b border-border/50 text-sm">
                    <span className="flex items-center gap-3 text-muted-foreground">
                      <div className="h-6 w-6 rounded bg-rose-500/10 flex items-center justify-center">
                        <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
                      </div>
                      {d.label}
                    </span>
                    <span className="font-medium text-rose-500 font-mono">-₹{d.amount.toLocaleString()}</span>
                  </div>
                ))}
                
                {deposit.deductions.length === 0 && (
                  <div className="flex items-center gap-3 text-sm text-muted-foreground px-5 py-4 border-b border-border/50">
                    <div className="h-6 w-6 rounded bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    No deductions were applied during settlement.
                  </div>
                )}
              </div>

              <div className={cn(
                "flex justify-between items-center p-5",
                netRefund > 0 ? "bg-emerald-500/5" : "bg-muted/30"
              )}>
                <div>
                  <span className="font-semibold block text-base text-foreground">Final Net Refund</span>
                  {netRefund > 0 && deposit.refundRef && (
                    <span className="text-xs text-muted-foreground mt-1 font-mono flex items-center gap-1.5 pt-1">
                      <Receipt className="h-3 w-3" /> Ref: {deposit.refundRef}
                    </span>
                  )}
                </div>
                <span className={cn(
                  "font-bold text-3xl",
                  netRefund > 0 ? "text-emerald-500" : "text-foreground"
                )}>
                  ₹{netRefund.toLocaleString()}
                </span>
              </div>
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
