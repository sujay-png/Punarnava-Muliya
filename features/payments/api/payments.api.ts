import { collection, query, where, onSnapshot, Timestamp, setDoc, doc, serverTimestamp, updateDoc, deleteField } from "firebase/firestore";
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
    const paidDate = payment.paidOn || payment.paidAt;
    const paidTimestamp = paidDate
      ? (paidDate instanceof Date ? Timestamp.fromDate(paidDate) : paidDate)
      : serverTimestamp();

    const data: Record<string, any> = {
      ...payment,
      paidAt: paidTimestamp,
      paidOn: paidTimestamp,
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, PAYMENTS_COLLECTION, docId), data, { merge: true });
  },

  waiveFine: async (params: {
    tenantId: string;
    monthKey: string;
    tenantName?: string;
    roomNo?: string;
    rent?: number;
    reason?: string;
  }) => {
    const docId = `${params.tenantId}_${params.monthKey}`;
    const data: Record<string, any> = {
      tenantId: params.tenantId,
      monthKey: params.monthKey,
      month: params.monthKey,
      fine: 0,
      fineWaived: true,
      waiveReason: params.reason || "Admin waiver",
      updatedAt: serverTimestamp(),
    };
    if (params.tenantName) data.tenantName = params.tenantName;
    if (params.roomNo !== undefined) data.roomNo = params.roomNo;
    if (params.rent !== undefined) data.rent = params.rent;

    await setDoc(doc(db, PAYMENTS_COLLECTION, docId), data, { merge: true });
  },

  updateFine: async (params: {
    tenantId: string;
    monthKey: string;
    fine: number;
    fineWaived?: boolean;
    tenantName?: string;
    roomNo?: string;
    rent?: number;
    reason?: string;
  }) => {
    const docId = `${params.tenantId}_${params.monthKey}`;
    const data: Record<string, any> = {
      tenantId: params.tenantId,
      monthKey: params.monthKey,
      month: params.monthKey,
      fine: Math.max(0, params.fine),
      fineWaived: params.fineWaived ?? (params.fine === 0),
      updatedAt: serverTimestamp(),
    };
    if (params.reason) data.waiveReason = params.reason;
    if (params.tenantName) data.tenantName = params.tenantName;
    if (params.roomNo !== undefined) data.roomNo = params.roomNo;
    if (params.rent !== undefined) data.rent = params.rent;

    await setDoc(doc(db, PAYMENTS_COLLECTION, docId), data, { merge: true });
  },

  restoreFine: async (tenantId: string, monthKey: string) => {
    const docId = `${tenantId}_${monthKey}`;
    try {
      await updateDoc(doc(db, PAYMENTS_COLLECTION, docId), {
        fine: deleteField(),
        fineWaived: deleteField(),
        waiveReason: deleteField(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Document might not exist or had no fields
    }
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
