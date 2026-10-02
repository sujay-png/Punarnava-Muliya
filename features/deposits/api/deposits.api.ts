import { collection, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Deposit } from "../model/deposit.schema";

const DEPOSITS_COLLECTION = "deposits";

const convertTimestamps = <T>(data: any): T => {
  const result: any = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
  }
  return result as T;
};

export const depositsApi = {
  watchStayDeposits: (stayId: string, onUpdate: (deposits: Deposit[]) => void) => {
    const q = query(collection(db, DEPOSITS_COLLECTION), where("stayId", "==", stayId));
    return onSnapshot(q, (snapshot) => {
      const deps = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as Deposit[];
      
      // Sort by paidOn desc
      deps.sort((a, b) => b.paidOn.getTime() - a.paidOn.getTime());
      
      onUpdate(deps);
    });
  },

  watchTenantDeposits: (tenantId: string, onUpdate: (deposits: Deposit[]) => void) => {
    const q = query(collection(db, DEPOSITS_COLLECTION), where("tenantId", "==", tenantId));
    return onSnapshot(q, (snapshot) => {
      const deps = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as Deposit[];
      
      // Sort by paidOn desc
      deps.sort((a, b) => b.paidOn.getTime() - a.paidOn.getTime());
      
      onUpdate(deps);
    });
  },
};
