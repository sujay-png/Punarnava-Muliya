"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, AlertCircle, XCircle, ArrowLeft, Phone, Calendar, Clock, CreditCard, Bell, LogOut, Edit, User, Users, Briefcase, FileText } from "lucide-react";

import { tenantsApi } from "../api/tenants.api";
import { staysApi, Stay, calculateStayDuration } from "@/features/stays";
import { paymentsApi, Payment, PaymentCalendar } from "@/features/payments";
import { depositsApi, Deposit, DepositTab } from "@/features/deposits";
import { VacateDialog, NoticeDialog } from "@/features/vacate";
import { StatusTimeline } from "@/features/statusHistory";
import { ReadmitDialog } from "./ReadmitDialog";
import { Tenant } from "@/lib/models/schema";
import { toast } from "sonner";

export function TenantDetail({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [stays, setStays] = useState<Stay[] | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [vacateDialogOpen, setVacateDialogOpen] = useState(false);
  const [readmitDialogOpen, setReadmitDialogOpen] = useState(false);
  const [noticeDialogOpen, setNoticeDialogOpen] = useState(false);

  useEffect(() => {
    let unsubscribeTenant: () => void;
    let unsubscribeStays: () => void;
    let unsubscribePayments: () => void;
    let unsubscribeDeposits: () => void;

    const init = async () => {
      unsubscribeTenant = tenantsApi.watchTenant(tenantId, (data) => {
        setTenant(data);
      });
      unsubscribeStays = staysApi.watchTenantStays(tenantId, (staysData) => {
        setStays(staysData);
        setLoading(false);
      });
      unsubscribeDeposits = depositsApi.watchTenantDeposits(tenantId, (deps) => {
        setDeposits(deps);
      });
      unsubscribePayments = paymentsApi.watchTenantPayments(tenantId, (data) => {
        setPayments(data);
      });
    };
    init();

    return () => {
      if (unsubscribeTenant) unsubscribeTenant();
      if (unsubscribeStays) unsubscribeStays();
      if (unsubscribePayments) unsubscribePayments();
      if (unsubscribeDeposits) unsubscribeDeposits();
    };
  }, [tenantId]);

  if (loading) {
    return <TenantDetailSkeleton />;
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-semibold">Tenant Not Found</h2>
        <Button onClick={() => router.push("/dashboard/tenants")} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
        </Button>
      </div>
    );
  }

  // Fallback for pre-migration data: if no stays exist, synthesize a stay
  let activeStay = stays?.[0];
  let activeDeposit = deposits?.[0];
  
  if (!activeStay && tenant) {
    activeStay = {
      id: `legacy_stay_${tenant.id}`,
      tenantId: tenant.id!,
      roomNumber: tenant.roomNo,
      joinDate: tenant.joinDate,
      monthlyRent: tenant.monthlyRent,
      status: tenant.status === "active" ? "Active" : tenant.status === "notice" ? "OnNotice" : "Vacated",
      vacateDate: tenant.status === "vacated" ? new Date() : undefined,
    };
    
    // Also synthesize a fake deposit so the UI renders
    if (!activeDeposit) {
      activeDeposit = {
        id: `legacy_dep_${tenant.id}`,
        tenantId: tenant.id!,
        stayId: activeStay.id || "",
        amount: 5000,
        paidOn: tenant.joinDate,
        mode: "upi",
        status: tenant.status === "vacated" ? "Refunded" : "Held",
        deductions: [],
        refundAmount: tenant.status === "vacated" ? 5000 : undefined,
      };
    }
  }

  const stayDuration = activeStay ? calculateStayDuration(activeStay.joinDate, activeStay.vacateDate) : "N/A";

  return (
    <div className="space-y-6">
      {/* Top Nav */}
      <div>
        <Button variant="ghost" onClick={() => router.push("/dashboard/tenants")} className="mb-2 -ml-3">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tenants
        </Button>
      </div>

      {/* Header Profile Card */}
      <div className="bg-card rounded-xl border border-border p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div className="flex items-center gap-6">
          <Avatar className="h-24 w-24 border-4 border-background shadow-sm">
            <AvatarImage src={tenant.photoUrl || undefined} alt={tenant.name} />
            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
              {tenant.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{tenant.name}</h1>
              {activeStay && <StatusBadge status={activeStay.status} expectedVacateDate={activeStay.expectedVacateDate} />}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center">
                <span className="font-semibold text-foreground mr-1.5">Room {activeStay?.roomNumber || tenant.roomNo}</span>
              </span>
              <span className="flex items-center">
                <Phone className="mr-1.5 h-3.5 w-3.5" /> {tenant.phone}
              </span>
              {activeStay && (
                <span className="flex items-center">
                  <Calendar className="mr-1.5 h-3.5 w-3.5" /> Joined {format(activeStay.joinDate, "dd MMM yyyy")}
                </span>
              )}
              {activeStay && (
                <span className="flex items-center">
                  <Clock className="mr-1.5 h-3.5 w-3.5" /> {stayDuration}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {tenant.status === "vacated" ? (
            <Button variant="default" className="flex-1 md:flex-none" onClick={() => setReadmitDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> Re-admit Tenant
            </Button>
          ) : (
            <>
              <Button variant="default" className="flex-1 md:flex-none" onClick={() => setActiveTab("payments")}>
                <CreditCard className="mr-2 h-4 w-4" /> Mark Paid
              </Button>
              <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setNoticeDialogOpen(true)}>
                <Bell className="mr-2 h-4 w-4" /> Notice
              </Button>
              <Button variant="outline" className="flex-1 md:flex-none" onClick={() => setVacateDialogOpen(true)}>
                <LogOut className="mr-2 h-4 w-4" /> Vacate
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/tenants/${tenantId}/edit`)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="profile">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Details */}
              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                  <User className="h-5 w-5 text-primary" /> Personal Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Phone Number</span>
                    <span className="font-medium">{tenant.phone}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Email Address</span>
                    <span className="font-medium">{tenant.email || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Date of Birth</span>
                    <span className="font-medium">{tenant.dob ? format(tenant.dob, "dd MMM yyyy") : "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Blood Group</span>
                    <span className="font-medium">{tenant.bloodGroup || "N/A"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block mb-1">Permanent Address</span>
                    <span className="font-medium">{tenant.permanentAddress || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Family & Emergency */}
              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                  <Users className="h-5 w-5 text-primary" /> Family & Emergency
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Father's Name</span>
                    <span className="font-medium">{tenant.fatherName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Father's Phone</span>
                    <span className="font-medium">{tenant.fatherPhone || "N/A"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block mb-1">Emergency Contact</span>
                    <span className="font-medium">{tenant.emergencyContact || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Occupation */}
              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                  <Briefcase className="h-5 w-5 text-primary" /> Occupation Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">Status</span>
                    <span className="font-medium">{tenant.occupationStatus || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Company/College</span>
                    <span className="font-medium">{tenant.companyName || "N/A"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-muted-foreground block mb-1">Company Address</span>
                    <span className="font-medium">{tenant.companyAddress || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Identity & Vehicle */}
              <div className="p-6 bg-card rounded-xl border border-border space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                  <FileText className="h-5 w-5 text-primary" /> Identity & Vehicle
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block mb-1">ID Type</span>
                    <span className="font-medium">{tenant.idProofType || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">ID Number</span>
                    <span className="font-medium">{tenant.idNumber || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Vehicle Model</span>
                    <span className="font-medium">{tenant.vehicleModel || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block mb-1">Vehicle Number</span>
                    <span className="font-medium">{tenant.vehicleNumber || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="payments">
            <div className="p-6 bg-card rounded-xl border border-border">
              {activeStay ? (
                <PaymentCalendar stay={activeStay} payments={payments} />
              ) : (
                <p className="text-muted-foreground text-sm">No active stay found for this tenant.</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="deposit">
            {(() => {
              let allDeposits = deposits || [];
              if (allDeposits.length === 0 && activeDeposit) {
                allDeposits = [activeDeposit];
              }

              const currentDeposit = allDeposits.find((d) => d.status === "Held");
              const pastDeposits = allDeposits.filter((d) => d.status !== "Held");

              if (pastDeposits.length > 0) {
                return (
                  <Tabs key={currentDeposit ? "current" : "past"} defaultValue={currentDeposit ? "current" : "past"}>
                    <TabsList className="mb-4 bg-muted/50">
                      {currentDeposit && <TabsTrigger value="current">Current Deposit</TabsTrigger>}
                      <TabsTrigger value="past">Past Deposits</TabsTrigger>
                    </TabsList>
                    
                    {currentDeposit && (
                      <TabsContent value="current">
                        <DepositTab deposit={currentDeposit} />
                      </TabsContent>
                    )}
                    
                    <TabsContent value="past" className="space-y-6">
                      {pastDeposits.map((dep, index) => (
                        <div key={dep.id || index} className="relative">
                          {pastDeposits.length > 1 && (
                            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground" /> Past Deposit ({format(dep.paidOn, "MMM yyyy")})
                            </h4>
                          )}
                          <DepositTab deposit={dep} />
                        </div>
                      ))}
                    </TabsContent>
                  </Tabs>
                );
              }

              return currentDeposit ? <DepositTab deposit={currentDeposit} /> : <p className="text-muted-foreground text-sm">No deposit records found.</p>;
            })()}
          </TabsContent>
          <TabsContent value="documents">
            <div className="p-6 bg-card rounded-xl border border-border space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-border pb-3">
                <FileText className="h-5 w-5 text-primary" /> Provided Documents
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg bg-muted/30">
                  <span className="text-muted-foreground block text-sm mb-1">ID Proof ({tenant.idProofType})</span>
                  <span className="font-medium font-mono tracking-wide">{tenant.idNumber}</span>
                </div>
                {tenant.appointmentLetterRef && (
                  <div className="p-4 border border-border rounded-lg bg-muted/30">
                    <span className="text-muted-foreground block text-sm mb-1">Appointment Letter / ID</span>
                    <span className="font-medium truncate">{tenant.appointmentLetterRef}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          <TabsContent value="timeline">
            {activeStay ? (
              <StatusTimeline stayId={activeStay.id!} />
            ) : (
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="font-semibold text-lg mb-4">History Timeline</h3>
                <p className="text-muted-foreground text-sm">No history available.</p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>

      {activeStay && (
        <>
          <VacateDialog 
            open={vacateDialogOpen} 
            onOpenChange={setVacateDialogOpen} 
            tenant={tenant} 
            stay={activeStay} 
            deposit={activeDeposit} 
            payments={payments} 
          />
          <NoticeDialog 
            open={noticeDialogOpen}
            onOpenChange={setNoticeDialogOpen}
            tenant={tenant}
            stay={activeStay}
          />
        </>
      )}

      <ReadmitDialog 
        open={readmitDialogOpen}
        onOpenChange={setReadmitDialogOpen}
        tenant={tenant}
      />
    </div>
  );
}

function StatusBadge({ status, expectedVacateDate }: { status: string, expectedVacateDate?: Date | null }) {
  switch (status.toLowerCase()) {
    case "active":
      return (
        <Badge className="bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20 border-emerald-400/20">
          <CheckCircle className="mr-1 h-3 w-3" /> Active
        </Badge>
      );
    case "onnotice":
    case "notice":
      const daysRemaining = expectedVacateDate ? Math.max(0, Math.ceil((expectedVacateDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : null;
      return (
        <Badge className="bg-amber-400/10 text-amber-400 hover:bg-amber-400/20 border-amber-400/20">
          <AlertCircle className="mr-1 h-3 w-3" /> On Notice
          {daysRemaining !== null && (
            <span className="ml-1 opacity-80 font-normal">
              ({daysRemaining}d left)
            </span>
          )}
        </Badge>
      );
    case "vacated":
      return (
        <Badge className="bg-muted text-muted-foreground hover:bg-muted border-muted-foreground/20">
          <XCircle className="mr-1 h-3 w-3" /> Vacated
        </Badge>
      );
    default:
      return null;
  }
}

function TenantDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32 mb-4" />
      <div className="bg-card rounded-xl border border-border p-6 flex flex-col md:flex-row gap-6">
        <Skeleton className="h-24 w-24 rounded-full shrink-0" />
        <div className="space-y-4 w-full">
          <Skeleton className="h-8 w-1/3" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
