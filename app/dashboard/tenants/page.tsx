"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search, MoreVertical, Trash, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { PastMembersList } from "@/features/tenants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";

import { firestoreService } from "@/lib/api/firestore";
import { Tenant } from "@/lib/models/schema";

import { cn } from "cn";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function TenantsPage() {
  const router = useRouter();
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = firestoreService.watchTenants((data) => {
      setTenants(data);
    });
    return () => unsubscribe();
  }, []);

  const [tenantToDelete, setTenantToDelete] = useState<{id: string, name: string} | null>(null);

  const confirmDelete = (id: string, name: string) => {
    setTenantToDelete({ id, name });
  };

  const handleDeleteConfirm = async () => {
    if (!tenantToDelete) return;
    try {
      await firestoreService.deleteTenant(tenantToDelete.id);
      toast.success("Tenant deleted successfully");
    } catch (error) {
      toast.error("Failed to delete tenant");
    } finally {
      setTenantToDelete(null);
    }
  };

  const handleStatusChange = async (id: string, status: "active" | "notice" | "vacated") => {
    try {
      await firestoreService.updateTenantStatus(id, status);
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const currentTenants = tenants?.filter((t) => t.status === "active" || t.status === "notice") || null;
  const pastTenants = tenants?.filter((t) => t.status === "vacated") || null;

  const filteredTenants = currentTenants?.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      (t.roomNo || "").toLowerCase().includes(search.toLowerCase())
  );

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
    link.setAttribute("download", `current_tenants_${format(new Date(), "yyyy_MM_dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Exported to CSV successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-1">Manage all your PG residents.</p>
        </div>
        <Link href="/dashboard/tenants/new" className={cn(buttonVariants({ variant: "default" }))}>
          <Plus className="mr-2 h-4 w-4" />
          Add Tenant
        </Link>
      </div>

      <Tabs defaultValue="current" className="w-full">
        <TabsList className="mb-6 w-full max-w-[400px] grid grid-cols-2">
          <TabsTrigger value="current">Current Members</TabsTrigger>
          <TabsTrigger value="past">Past Members</TabsTrigger>
        </TabsList>
        
        <TabsContent value="current" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex flex-1 w-full gap-2 items-center bg-card p-2 rounded-xl border border-border">
              <Search className="ml-2 h-4 w-4 text-muted-foreground shrink-0" />
              <Input
                placeholder="Search by name or room..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 bg-transparent flex-1"
              />
            </div>
            
            <Button variant="outline" onClick={handleExportCSV} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Resident</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants === null ? (
                  // Loading state
                  Array.from({ length: 5 }).map((_, i) => (
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
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-20 rounded-md" /></TableCell>
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
                    <TableCell colSpan={6} className="h-24 text-center">
                      No current tenants found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTenants?.map((tenant) => (
                    <TableRow 
                      key={tenant.id} 
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
                      <TableCell>₹{tenant.monthlyRent.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <StatusBadge status={tenant.status as any} expectedVacateDate={tenant.expectedVacateDate} />
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
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem render={<Link href={`/dashboard/tenants/${tenant.id}/edit`} />}>
                                Edit Details
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuGroup>
                              <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleStatusChange(tenant.id!, "active")}>
                                <CheckCircle className="mr-2 h-4 w-4 text-emerald-400" /> Active
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStatusChange(tenant.id!, "notice")}>
                                <AlertCircle className="mr-2 h-4 w-4 text-amber-400" /> On Notice
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={() => confirmDelete(tenant.id!, tenant.name)}
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="past">
          <PastMembersList tenants={pastTenants} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!tenantToDelete} onOpenChange={(open) => !open && setTenantToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tenant</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{tenantToDelete?.name}</strong>? This action cannot be undone and will permanently remove their data from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTenantToDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status, expectedVacateDate }: { status: "active" | "notice" | "vacated", expectedVacateDate?: Date | null }) {
  switch (status) {
    case "active":
      return (
        <div className="flex items-center text-emerald-400 font-medium text-sm">
          <CheckCircle className="mr-1.5 h-4 w-4" /> Active
        </div>
      );
    case "notice":
      const daysRemaining = expectedVacateDate ? Math.max(0, Math.ceil((expectedVacateDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24))) : null;
      return (
        <div className="flex items-center text-amber-400 font-medium text-sm">
          <AlertCircle className="mr-1.5 h-4 w-4" /> On Notice
          {daysRemaining !== null && (
            <span className="ml-1.5 opacity-80 font-normal">({daysRemaining}d left)</span>
          )}
        </div>
      );
    case "vacated":
      return (
        <div className="flex items-center text-muted-foreground font-medium text-sm">
          <XCircle className="mr-1.5 h-4 w-4" /> Vacated
        </div>
      );
    default:
      return null;
  }
}
