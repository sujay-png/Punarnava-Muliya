"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { Search, Download, MoreVertical, Trash } from "lucide-react";
import { toast } from "sonner";
import { Tenant } from "@/lib/models/schema";
import { firestoreService } from "@/lib/api/firestore";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PastMembersList({ tenants }: { tenants: Tenant[] | null }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");

  const filteredTenants = tenants?.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) || 
                          t.phone.includes(search) || 
                          t.roomNo.toLowerCase().includes(search.toLowerCase());
    
    // We don't have vacateDate directly on tenant schema, it's on Stay. 
    // We can filter by joined year as a fallback or if we had vacateDate.
    // Let's use join year for now if yearFilter != all
    const matchesYear = yearFilter === "all" || t.joinDate.getFullYear().toString() === yearFilter;
    
    return matchesSearch && matchesYear;
  });

  const handleExportCSV = () => {
    if (!filteredTenants || filteredTenants.length === 0) {
      toast.error("No data to export");
      return;
    }
    
    const headers = ["Name", "Phone", "Room", "Join Date", "Status"];
    const rows = filteredTenants.map(t => [
      `"${(t.name || "").replace(/"/g, '""')}"`,
      `="${t.phone}"`,
      `"${(t.roomNo || "").replace(/"/g, '""')}"`,
      `"${format(t.joinDate, "dd MMM yyyy")}"`,
      `"${t.status}"`
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `past_members_${format(new Date(), "yyyy_MM_dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Exported to CSV successfully");
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to completely delete ${name}? This action cannot be undone.`)) {
      try {
        await firestoreService.deleteTenant(id);
        toast.success("Tenant deleted successfully");
      } catch (error) {
        toast.error("Failed to delete tenant");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-1 w-full gap-2 items-center bg-card p-2 rounded-xl border border-border">
          <Search className="ml-2 h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            placeholder="Search by name, phone or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 bg-transparent flex-1"
          />
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={yearFilter} onValueChange={(v: any) => setYearFilter(v)}>
            <SelectTrigger className="w-[120px] bg-card border-border">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Resident</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Join Date</TableHead>
              <TableHead>Vacate Date</TableHead>
              <TableHead>Refund</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants === null ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Skeleton className="h-8 w-24 rounded-md" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : filteredTenants?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No past members found.
                </TableCell>
              </TableRow>
            ) : (
              filteredTenants?.map((tenant) => (
                <PastMemberRow key={tenant.id} tenant={tenant} router={router} handleDelete={handleDelete} />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function PastMemberRow({ tenant, router, handleDelete }: { tenant: Tenant, router: any, handleDelete: any }) {
  const [vacateDate, setVacateDate] = useState<Date | null>(null);
  const [refundAmount, setRefundAmount] = useState<number | null>(null);

  useEffect(() => {
    const fetchExtraData = async () => {
      try {
        const staysQ = query(collection(db, "stays"), where("tenantId", "==", tenant.id));
        const staysSnap = await getDocs(staysQ);
        if (!staysSnap.empty) {
          const pastStays = staysSnap.docs.map(d => d.data()).filter(s => s.status === "Vacated" || s.vacateDate);
          pastStays.sort((a, b) => (b.vacateDate?.toMillis() || 0) - (a.vacateDate?.toMillis() || 0));
          if (pastStays.length > 0 && pastStays[0].vacateDate) {
            setVacateDate(pastStays[0].vacateDate.toDate());
          }
        }
        
        const depsQ = query(collection(db, "deposits"), where("tenantId", "==", tenant.id));
        const depsSnap = await getDocs(depsQ);
        if (!depsSnap.empty) {
          const pastDeps = depsSnap.docs.map(d => d.data()).filter(d => d.status === "Refunded" || d.status === "Forfeited");
          pastDeps.sort((a, b) => (b.refundedOn?.toMillis() || 0) - (a.refundedOn?.toMillis() || 0));
          if (pastDeps.length > 0 && pastDeps[0].refundAmount !== undefined) {
            setRefundAmount(pastDeps[0].refundAmount);
          }
        }
      } catch (error) {
        console.error("Error fetching past member details", error);
      }
    };
    fetchExtraData();
  }, [tenant.id]);

  return (
    <TableRow 
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={tenant.photoUrl || undefined} alt={tenant.name} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {tenant.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-medium">{tenant.name}</span>
            <span className="text-xs text-muted-foreground">{tenant.phone}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="font-medium">{tenant.roomNo}</TableCell>
      <TableCell className="text-muted-foreground">
        {format(tenant.joinDate, "dd MMM yyyy")}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {vacateDate ? format(vacateDate, "dd MMM yyyy") : "N/A"}
      </TableCell>
      <TableCell>
        {refundAmount !== null ? `₹${refundAmount.toLocaleString("en-IN")}` : "N/A"}
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => router.push(`/dashboard/tenants/${tenant.id}`)}
            className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border-0"
          >
            View Details
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
              <MoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                onClick={() => handleDelete(tenant.id!, tenant.name)}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete Completely
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableRow>
  );
}
