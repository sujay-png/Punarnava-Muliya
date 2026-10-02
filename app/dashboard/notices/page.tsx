"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Bell, Send, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { firestoreService } from "@/lib/api/firestore";
import { Notice } from "@/lib/models/schema";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const NoticeFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(5, "Message must be at least 5 characters"),
});
type NoticeForm = z.infer<typeof NoticeFormSchema>;

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[] | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<NoticeForm>({
    resolver: zodResolver(NoticeFormSchema),
  });

  useEffect(() => {
    const unsubscribe = firestoreService.watchNotices((data) => {
      setNotices(data);
    });
    return () => unsubscribe();
  }, []);

  const onSubmit = async (data: NoticeForm) => {
    try {
      setIsSubmitting(true);
      await firestoreService.sendNotice({
        ...data,
        broadcastStatus: "queued",
        recipientCount: 0,
      });
      toast.success("Notice sent! Broadcast is queued.");
      setIsDialogOpen(false);
      reset();
    } catch (error) {
      toast.error("Failed to send notice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
          <p className="text-muted-foreground mt-1">Broadcast WhatsApp messages to all active tenants.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Send className="mr-2 h-4 w-4" /> New Broadcast
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send Notice Broadcast</DialogTitle>
              <DialogDescription>
                This will instantly send a WhatsApp message to all active tenants using the MSG91 template.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Notice Title <span className="text-destructive">*</span></Label>
                <Input id="title" {...register("title")} placeholder="e.g. Water Supply Interruption" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message Body <span className="text-destructive">*</span></Label>
                <Textarea 
                  id="message" 
                  {...register("message")} 
                  placeholder="Details of the notice..." 
                  rows={5} 
                />
                {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send to All Tenants"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {notices === null ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))
        ) : notices?.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
            <Bell className="mx-auto h-8 w-8 opacity-20 mb-3" />
            <p>No notices have been sent yet.</p>
          </div>
        ) : (
          notices?.map((notice) => (
            <Card key={notice.id} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${
                notice.broadcastStatus === 'sent' ? 'bg-green-500' : 
                notice.broadcastStatus === 'queued' ? 'bg-orange-500' : 'bg-destructive'
              }`} />
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{notice.title}</CardTitle>
                  <NoticeStatusBadge status={notice.broadcastStatus} />
                </div>
                <CardDescription>
                  {notice.createdAt ? format(notice.createdAt, "PPP 'at' p") : "Just now"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{notice.message}</p>
              </CardContent>
              <CardFooter className="bg-muted/20 border-t py-3 text-xs text-muted-foreground flex justify-between">
                <div>Delivered to: <span className="font-medium text-foreground">{notice.recipientCount} tenants</span></div>
                {notice.broadcastError && (
                  <div className="text-destructive font-medium">Error: {notice.broadcastError}</div>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function NoticeStatusBadge({ status }: { status: "queued" | "sent" | "failed" }) {
  if (status === "sent") {
    return (
      <div className="flex items-center text-emerald-400 font-medium text-sm">
        <CheckCircle2 className="mr-1.5 h-4 w-4"/> Sent
      </div>
    );
  }
  if (status === "queued") {
    return (
      <div className="flex items-center text-amber-400 font-medium text-sm">
        <Clock className="mr-1.5 h-4 w-4"/> Queued
      </div>
    );
  }
  return (
    <div className="flex items-center text-destructive font-medium text-sm">
      <AlertCircle className="mr-1.5 h-4 w-4"/> Failed
    </div>
  );
}
