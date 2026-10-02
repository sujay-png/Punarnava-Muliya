"use client";

import { useEffect, useState } from "react";
import { Users, CreditCard, Wrench, AlertTriangle, ArrowRight, Bell, Calendar, Clock, AlertOctagon, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { db } from "@/lib/firebase/config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { tenantsApi } from "@/features/tenants";
import { paymentsApi, calculatePaymentStatus, calculateFine, Payment } from "@/features/payments";
import { Stay } from "@/features/stays";
import { firestoreService } from "@/lib/api/firestore";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const [activeTenants, setActiveTenants] = useState<number | null>(null);
  const [collectedFees, setCollectedFees] = useState<number | null>(null);
  const [openMaintenance, setOpenMaintenance] = useState<number | null>(null);
  const [pendingFees, setPendingFees] = useState<number | null>(null);
  const [recentPayments, setRecentPayments] = useState<(Payment & { tenantName: string })[] | null>(null);

  useEffect(() => {
    // Watch active tenants
    const unsubscribeTenants = tenantsApi.watchTenants((tenants) => {
      const active = tenants.filter((t) => t.status !== "vacated");
      setActiveTenants(active.length);

      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      
      const unsubscribePayments = paymentsApi.watchAllPaymentsForMonth(monthKey, (payments) => {
        let collected = 0;
        let pending = 0;
        
        active.forEach((tenant) => {
          // Synthesize a legacy stay
          const activeStay: Stay = {
            id: `legacy_stay_${tenant.id}`,
            tenantId: tenant.id!,
            roomNumber: tenant.roomNo,
            joinDate: tenant.joinDate,
            monthlyRent: tenant.monthlyRent,
            status: tenant.status === "active" ? "Active" : "OnNotice",
          };
          
          const status = calculatePaymentStatus(activeStay, monthKey, payments);
          const p = payments.find((p) => p.tenantId === tenant.id);

          if (status === "Paid") {
            collected += p?.amountPaid || p?.amount || 0;
          } else if (status === "Pending" || status === "Overdue" || status === "Partial") {
            const fine = p?.fine !== undefined ? p.fine : calculateFine(monthKey, now);
            const total = (p?.amount || 0) || (tenant.monthlyRent + fine);
            pending += total;
          }
        });
        
        setCollectedFees(collected);
        setPendingFees(pending);

        // Process recent payments
        const sorted = [...payments]
          .filter(p => (p.status === "Paid" || p.status === "paid" as any) && (p.paidAt || p.paidOn))
          .sort((a, b) => {
            const timeA = a.paidAt?.getTime() || a.paidOn?.getTime() || 0;
            const timeB = b.paidAt?.getTime() || b.paidOn?.getTime() || 0;
            return timeB - timeA;
          })
          .slice(0, 5);
          
        setRecentPayments(sorted.map(p => ({
          ...p,
          paidAt: p.paidAt || p.paidOn, // normalize to paidAt for display
          tenantName: active.find(t => t.id === p.tenantId)?.name || "Unknown Resident"
        })));
      });

      return () => unsubscribePayments();
    });

    const unsubscribeMaintenance = firestoreService.watchMaintenance((requests) => {
      const open = requests.filter((r) => r.status === "open" || r.status === "in_progress");
      setOpenMaintenance(open.length);
    });

    return () => {
      unsubscribeTenants();
      unsubscribeMaintenance();
    };
  }, []);

  return (
    <div className="space-y-8 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-base">Overview of your PG status and financial activities.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Active Tenants" 
          value={activeTenants} 
          icon={<Users className="h-5 w-5 text-emerald-400" />} 
          description="Currently residing"
          iconBg="bg-emerald-400/10"
        />
        <StatCard 
          title="Collected Fees" 
          value={collectedFees !== null ? `₹${collectedFees.toLocaleString("en-IN")}` : null} 
          icon={<CheckCircle2 className="h-5 w-5 text-primary" />} 
          description="Received this month"
          iconBg="bg-primary/10"
        />
        <StatCard 
          title="Pending Fees" 
          value={pendingFees !== null ? `₹${pendingFees.toLocaleString("en-IN")}` : null} 
          icon={<AlertTriangle className="h-5 w-5 text-amber-400" />} 
          description="Unpaid rent & fines"
          iconBg="bg-amber-400/10"
        />
        <StatCard 
          title="Open Maintenance" 
          value={openMaintenance} 
          icon={<Wrench className="h-5 w-5 text-rose-400" />} 
          description="Requires attention"
          iconBg="bg-rose-400/10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-border shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <CardDescription>Latest rent payments received this month</CardDescription>
            </div>
            <Link href="/dashboard/fees" className="text-sm font-medium text-primary hover:underline flex items-center">
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent className="flex-1">
            {recentPayments === null ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : recentPayments.length === 0 ? (
              <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
                <CreditCard className="h-8 w-8 mb-3 opacity-20" />
                <p>No payments received yet this month.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="font-medium text-primary text-sm">
                          {payment.tenantName.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-none">{payment.tenantName}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {payment.paidAt ? formatDistanceToNow(payment.paidAt, { addSuffix: true }) : 'Recently'}
                          {payment.mode ? ` • via ${payment.mode.toUpperCase()}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="font-medium text-emerald-400">
                      +₹{(payment.amountPaid || payment.amount || 0).toLocaleString("en-IN")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-border shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">Automated Schedule</CardTitle>
            <CardDescription>Monthly billing lifecycle</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-6 mt-2">
              
              <div className="flex items-start gap-4">
                <div className="bg-emerald-400/10 p-2 rounded-md">
                  <Calendar className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">1st of Month</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Fee generated & 1st reminder sent</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-primary/10 p-2 rounded-md">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">3rd, 5th, 7th</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Automated follow-up reminders</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-amber-400/10 p-2 rounded-md">
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">10th of Month</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Last day without ₹100/day fine</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-rose-400/10 p-2 rounded-md">
                  <AlertOctagon className="h-4 w-4 text-rose-400" />
                </div>
                <div>
                  <h4 className="text-sm font-medium">15th of Month</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Overdue final warning sent</p>
                </div>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  description,
  iconBg
}: { 
  title: string, 
  value: string | number | null, 
  icon: React.ReactNode, 
  description?: string,
  iconBg?: string
}) {
  return (
    <Card className="border-border shadow-sm transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center", iconBg)}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {value === null ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <div className="text-3xl font-bold tracking-tight">{value}</div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-2 font-medium">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
