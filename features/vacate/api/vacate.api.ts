import { writeBatch, doc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { DepositDeduction } from "@/features/deposits";

const TENANTS_COLLECTION = "tenants";
const STAYS_COLLECTION = "stays";
const DEPOSITS_COLLECTION = "deposits";
const STATUS_HISTORY_COLLECTION = "statusHistory";

export interface VacateParams {
  tenantId: string;
  stayId: string;
  depositId: string;
  vacateDate: Date;
  deductions: DepositDeduction[];
  refundAmount: number;
  refundMode: "cash" | "upi" | "bank";
  refundRef?: string;
  note?: string;
  tenantName: string;
}

export interface GiveNoticeParams {
  tenantId: string;
  stayId: string;
  noticeDate: Date;
  expectedVacateDate: Date;
  note?: string;
}

export const vacateApi = {
  giveNotice: async (params: GiveNoticeParams) => {
    const batch = writeBatch(db);

    const tenantRef = doc(db, TENANTS_COLLECTION, params.tenantId);
    batch.update(tenantRef, { 
      status: "notice",
      expectedVacateDate: params.expectedVacateDate 
    });

    const stayRef = doc(db, STAYS_COLLECTION, params.stayId);
    batch.set(stayRef, {
      tenantId: params.tenantId,
      status: "OnNotice",
      noticeDate: params.noticeDate,
      expectedVacateDate: params.expectedVacateDate,
    }, { merge: true });

    const historyRef = doc(collection(db, STATUS_HISTORY_COLLECTION));
    batch.set(historyRef, {
      stayId: params.stayId,
      from: "active",
      to: "notice",
      changedAt: new Date(),
      changedBy: "Admin",
      note: params.note || `Notice given on ${params.noticeDate.toLocaleDateString()}`,
    });

    await batch.commit();
  },

  vacateTenant: async (params: VacateParams) => {
    const batch = writeBatch(db);

    // 1. Update Tenant Status
    const tenantRef = doc(db, TENANTS_COLLECTION, params.tenantId);
    batch.update(tenantRef, {
      status: "vacated",
    });

    // 2. Update Stay
    const stayRef = doc(db, STAYS_COLLECTION, params.stayId);
    batch.set(stayRef, {
      tenantId: params.tenantId,
      status: "Vacated",
      vacateDate: params.vacateDate,
    }, { merge: true });

    // 3. Update Deposit
    const depositRef = doc(db, DEPOSITS_COLLECTION, params.depositId);
    batch.set(depositRef, {
      tenantId: params.tenantId,
      stayId: params.stayId,
      status: params.refundAmount > 0 ? "Refunded" : "Forfeited",
      deductions: params.deductions,
      refundAmount: params.refundAmount,
      refundedOn: new Date(),
      refundMode: params.refundMode,
      refundRef: params.refundRef || null,
    }, { merge: true });

    // 4. Create StatusHistory Record
    const historyRef = doc(collection(db, STATUS_HISTORY_COLLECTION));
    batch.set(historyRef, {
      stayId: params.stayId,
      from: "active",
      to: "vacated",
      changedAt: new Date(),
      changedBy: "Admin", // Would normally be the logged-in user
      note: params.note || `Tenant vacated on ${params.vacateDate.toLocaleDateString()}`,
    });

    await batch.commit();
  },
};
