import { collection, query, where, onSnapshot, Timestamp, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Payment } from "../model/payment.schema";

const PAYMENTS_COLLECTION = "payments";

const convertTimestamps = <T>(data: any): T => {
  const result: any = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
  }
  return result as T;
};

export const paymentsApi = {
  watchTenantPayments: (tenantId: string, onUpdate: (payments: Payment[]) => void) => {
    const q = query(collection(db, PAYMENTS_COLLECTION), where("tenantId", "==", tenantId));
    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as Payment[];
      onUpdate(payments);
    });
  },

  watchAllPaymentsForMonth: (monthKey: string, onUpdate: (payments: Payment[]) => void) => {
    // Note: payments might be stored with "month" or "monthKey"
    const q = query(collection(db, PAYMENTS_COLLECTION), where("monthKey", "==", monthKey));
    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as Payment[];
      onUpdate(payments);
    });
  },

  markPaid: async (payment: Partial<Payment>) => {
    // Generate a new ID if it's a new payment, or use the tenant+monthkey format
    const docId = payment.id || `${payment.tenantId}_${payment.monthKey || payment.month}`;
    const data = {
      ...payment,
      paidAt: serverTimestamp(),
      paidOn: serverTimestamp(),
    };
    await setDoc(doc(db, PAYMENTS_COLLECTION, docId), data, { merge: true });
  },

  markUnpaid: async (paymentId: string) => {
    await setDoc(doc(db, PAYMENTS_COLLECTION, paymentId), {
      status: "Pending",
      amountPaid: 0,
      paidAt: null,
      paidOn: null,
      mode: null,
      receiptNo: null,
    }, { merge: true });
  },
};
