"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { db } from "@/lib/firebase/config";
import { Tenant } from "@/lib/models/schema";
import { TenantForm } from "@/components/tenants/tenant-form";
import { toast } from "sonner";
import { tenantsApi } from "@/features/tenants/api/tenants.api";

export default function EditTenantPage() {
  const { id } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [depositInfo, setDepositInfo] = useState<{amount: number, mode: string} | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const fetchedTenant = await tenantsApi.getTenant(id as string);
        
        if (fetchedTenant) {
          setTenant(fetchedTenant);

          // Fetch active deposit
          const depsQ = query(collection(db, "deposits"), where("tenantId", "==", id as string), where("status", "==", "Held"));
          const depsSnap = await getDocs(depsQ);
          if (!depsSnap.empty) {
             setDepositInfo({
               amount: depsSnap.docs[0].data().amount,
               mode: depsSnap.docs[0].data().mode || "upi"
             });
          } else {
             // For legacy tenants, no deposit exists yet
             setDepositInfo({ amount: 5000, mode: "upi" });
          }
        } else {
          toast.error("Tenant not found");
          router.push("/dashboard/tenants");
        }
      } catch (error) {
        toast.error("Error fetching tenant");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTenant();
  }, [id, router]);

  if (loading) {
    return (
      <div className="space-y-6 w-full animate-in fade-in duration-300">
        <div>
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="max-w-5xl mx-auto space-y-6">
          <div>
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          
          <div className="space-y-8">
            <div className="rounded-xl border border-border bg-card shadow-sm p-6">
              <Skeleton className="h-7 w-40 mb-2" />
              <Skeleton className="h-4 w-64 mb-6" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48 w-full rounded-xl col-span-full md:col-span-1 lg:col-span-1 row-span-2" />
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
              </div>
            </div>
            
            <div className="rounded-xl border border-border bg-card shadow-sm p-6">
              <Skeleton className="h-7 w-48 mb-6" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <Button variant="ghost" onClick={() => router.push(`/dashboard/tenants/${id}`)} className="-ml-3 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
        </Button>
      </div>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Tenant</h1>
          <p className="text-muted-foreground mt-1">Update details for {tenant?.name}.</p>
        </div>
        {tenant && depositInfo && <TenantForm initialData={tenant} initialDeposit={depositInfo} />}
      </div>
    </div>
  );
}
