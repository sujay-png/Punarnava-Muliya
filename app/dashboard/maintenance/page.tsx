"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Wrench, Plus, CheckCircle2, PlayCircle, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { firestoreService } from "@/lib/api/firestore";
import { Maintenance } from "@/lib/models/schema";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";

const RequestSchema = z.object({
  title: z.string().min(1, "Issue title is required"),
  category: z.enum(["Electrical", "Plumbing", "Furniture", "Other"]),
  priority: z.enum(["high", "medium", "low"]),
  roomNo: z.string().min(1, "Room number is required"),
  tenantName: z.string().min(1, "Tenant name is required"),
});
type RequestForm = z.infer<typeof RequestSchema>;

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState("all");
  const [requests, setRequests] = useState<Maintenance[] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<RequestForm>({
    resolver: zodResolver(RequestSchema),
    defaultValues: {
      category: "Other",
      priority: "medium",
    },
  });

  useEffect(() => {
    const unsubscribe = firestoreService.watchMaintenance((data) => {
      setRequests(data);
    });
    return () => unsubscribe();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await firestoreService.updateMaintenanceStatus(id, newStatus);
      toast.success("Status updated");
    } catch (e) {
      toast.error("Failed to update status");
    }
  };

  const onSubmit = async (data: RequestForm) => {
    try {
      setIsSubmitting(true);
      await firestoreService.addMaintenance({
        ...data,
        status: "open",
      });
      toast.success("Request created successfully");
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      toast.error("Failed to create request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredRequests = requests?.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground mt-1">Track and manage facility issues.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" /> New Request
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Maintenance Request</DialogTitle>
              <DialogDescription>Log a new issue reported by a tenant.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="title">Issue Description <span className="text-destructive">*</span></Label>
                <Input id="title" {...register("title")} placeholder="e.g. Broken fan" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomNo">Room Number <span className="text-destructive">*</span></Label>
                <Input id="roomNo" {...register("roomNo")} placeholder="A-101" />
                {errors.roomNo && <p className="text-xs text-destructive">{errors.roomNo.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tenantName">Reported By <span className="text-destructive">*</span></Label>
                <Input id="tenantName" {...register("tenantName")} placeholder="Tenant Name" />
                {errors.tenantName && <p className="text-xs text-destructive">{errors.tenantName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select onValueChange={(val: any) => setValue("category", val)} defaultValue={watch("category")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Electrical">Electrical</SelectItem>
                    <SelectItem value="Plumbing">Plumbing</SelectItem>
                    <SelectItem value="Furniture">Furniture</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select onValueChange={(val: any) => setValue("priority", val)} defaultValue={watch("priority")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Request"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {requests === null ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold text-rose-400">
                {requests.filter(r => r.status === 'open').length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Awaiting action</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {requests === null ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold text-amber-400">
                {requests.filter(r => r.status === 'in_progress').length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Currently being handled</p>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {requests === null ? (
              <Skeleton className="h-7 w-12" />
            ) : (
              <div className="text-2xl font-bold text-emerald-400">
                {requests.filter(r => r.status === 'resolved').length}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Successfully completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {requests === null ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><Skeleton className="h-5 w-3/4" /></CardHeader>
              <CardContent><Skeleton className="h-4 w-1/2" /></CardContent>
            </Card>
          ))
        ) : filteredRequests?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            <Wrench className="mx-auto h-8 w-8 opacity-20 mb-3" />
            <p>No maintenance requests found.</p>
          </div>
        ) : (
          filteredRequests?.map((req) => (
            <Card key={req.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base leading-tight">{req.title}</CardTitle>
                    <CardDescription>
                      {req.roomNo} • {req.tenantName}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={
                    req.priority === "high" ? "border-destructive text-destructive" :
                    req.priority === "medium" ? "border-amber-400/50 text-amber-400" :
                    "border-muted-foreground text-muted-foreground"
                  }>
                    {req.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1 pb-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <Badge variant="secondary" className="shadow-none">{req.category}</Badge>
                  <span>{req.createdAt ? format(req.createdAt, "dd MMM, HH:mm") : "Just now"}</span>
                </div>
              </CardContent>
              <CardFooter className="pt-0 justify-between">
                <div className="flex items-center gap-1 text-sm font-medium">
                  {req.status === "open" && <><Clock className="h-4 w-4 text-muted-foreground" /> Open</>}
                  {req.status === "in_progress" && <><PlayCircle className="h-4 w-4 text-blue-500" /> In Progress</>}
                  {req.status === "resolved" && <><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Resolved</>}
                </div>
                
                {req.status === "open" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatusChange(req.id!, "in_progress")}>
                    Start Work
                  </Button>
                )}
                {req.status === "in_progress" && (
                  <Button size="sm" onClick={() => handleStatusChange(req.id!, "resolved")}>
                    Mark Resolved
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
