import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Stay } from "../model/stay.schema";

const STAYS_COLLECTION = "stays";

const convertTimestamps = <T>(data: any): T => {
  const result: any = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
  }
  return result as T;
};

export const staysApi = {
  watchTenantStays: (tenantId: string, onUpdate: (stays: Stay[]) => void) => {
    const q = query(collection(db, STAYS_COLLECTION), where("tenantId", "==", tenantId));
    return onSnapshot(q, (snapshot) => {
      const stays = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as Stay[];
      
      // Sort by joinDate desc in memory to avoid composite index requirement
      stays.sort((a, b) => b.joinDate.getTime() - a.joinDate.getTime());
      
      onUpdate(stays);
    });
  },

  getStay: async (stayId: string): Promise<Stay | null> => {
    const snapshot = await getDocs(query(collection(db, STAYS_COLLECTION), where("__name__", "==", stayId)));
    if (snapshot.empty) return null;
    return { id: snapshot.docs[0].id, ...convertTimestamps<any>(snapshot.docs[0].data()) } as Stay;
  },
};
