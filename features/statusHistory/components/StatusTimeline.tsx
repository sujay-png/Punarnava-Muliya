import { useEffect, useState } from "react";
import { format } from "date-fns";
import { History, User, FileText, ArrowRight } from "lucide-react";
import { StatusHistory } from "../model/statusHistory.schema";
import { statusHistoryApi } from "../api/statusHistory.api";
import { Skeleton } from "@/components/ui/skeleton";

interface StatusTimelineProps {
  stayId: string;
}

export function StatusTimeline({ stayId }: StatusTimelineProps) {
  const [history, setHistory] = useState<StatusHistory[] | null>(null);

  useEffect(() => {
    // Note: since this may be a legacy stay ID, it might return empty. That's fine.
    const unsubscribe = statusHistoryApi.watchStayStatusHistory(stayId, (data) => {
      setHistory(data);
    });
    return () => unsubscribe();
  }, [stayId]);

  if (history === null) {
    return (
      <div className="p-6 bg-card rounded-xl border border-border space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-primary" /> History Timeline
        </h3>
        <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {[1, 2].map((i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-border bg-card shadow-sm">
                <Skeleton className="h-4 w-1/3 mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="p-6 bg-card rounded-xl border border-border text-center space-y-3">
        <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <History className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-medium">No History Available</h3>
        <p className="text-sm text-muted-foreground">
          There are no status changes recorded for this stay yet.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-card rounded-xl border border-border">
      <h3 className="font-semibold text-lg flex items-center gap-2 mb-6 border-b border-border pb-4">
        <History className="h-5 w-5 text-primary" /> History Timeline
      </h3>
      
      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
        {history.map((record, index) => (
          <div key={record.id || index} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
            
            {/* Timeline dot */}
            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-border bg-card shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-primary">
              <FileText className="h-4 w-4" />
            </div>
            
            {/* Content card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-border bg-card shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <time className="text-xs font-medium text-primary">
                  {format(record.changedAt, "dd MMM yyyy, h:mm a")}
                </time>
              </div>
              
              <div className="flex items-center gap-2 mb-2 font-medium">
                <span className="capitalize">{record.from}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{record.to}</span>
              </div>
              
              {record.note && (
                <p className="text-sm text-muted-foreground mt-2 bg-muted/50 p-2 rounded-md border border-border/50">
                  "{record.note}"
                </p>
              )}
              
              <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" /> Changed by {record.changedBy}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
