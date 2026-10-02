import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { StatusHistory } from "../model/statusHistory.schema";

const STATUS_HISTORY_COLLECTION = "statusHistory";

const convertTimestamps = <T>(data: any): T => {
  const result: any = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
  }
  return result as T;
};

export const statusHistoryApi = {
  watchStayStatusHistory: (stayId: string, onUpdate: (history: StatusHistory[]) => void) => {
    const q = query(collection(db, STATUS_HISTORY_COLLECTION), where("stayId", "==", stayId));
    return onSnapshot(q, (snapshot) => {
      const hist = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as StatusHistory[];
      
      // Sort by changedAt desc
      hist.sort((a, b) => b.changedAt.getTime() - a.changedAt.getTime());
      
      onUpdate(hist);
    });
  },
};
