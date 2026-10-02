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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { httpsCallable } from "firebase/functions";
import { db, storage, functions } from "../firebase/config";
import { Tenant, Payment, Maintenance, Notice, Product } from "../models/schema";

const COLLECTIONS = {
  TENANTS: "tenants",
  PAYMENTS: "payments",
  MAINTENANCE: "maintenance",
  NOTICES: "notices",
  PRODUCTS: "products",
};

// --- Helper to convert Firestore Timestamps to JS Dates ---
const convertTimestamps = <T>(data: any): T => {
  const result: any = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
  }
  return result as T;
};

// --- Helper to prepare object for Firestore (strip undefined, convert dates) ---
const prepareForFirestore = (data: any) => {
  const result: any = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && key !== "id") {
      result[key] = value;
    }
  }
  return result;
};

export const firestoreService = {
  // ---------- Tenants ----------
  watchTenants: (onUpdate: (tenants: Tenant[]) => void) => {
    const q = query(collection(db, COLLECTIONS.TENANTS), orderBy("roomNo"));
    return onSnapshot(q, (snapshot) => {
      const tenants = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as Tenant[];
      onUpdate(tenants);
    });
  },

  addTenant: async (tenant: Tenant, photoFile?: File) => {
    let photoUrl = tenant.photoUrl;
    if (photoFile) {
      const tempId = Date.now().toString();
      photoUrl = await firestoreService.uploadTenantPhoto(photoFile, tempId);
    }
    
    const data = prepareForFirestore({
      ...tenant,
      photoUrl,
      createdAt: serverTimestamp(),
    });
    
    const docRef = await addDoc(collection(db, COLLECTIONS.TENANTS), data);
    return docRef.id;
  },

  updateTenant: async (id: string, tenant: Partial<Tenant>, photoFile?: File) => {
    let photoUrl = tenant.photoUrl;
    if (photoFile) {
      photoUrl = await firestoreService.uploadTenantPhoto(photoFile, id);
    }

    const data = prepareForFirestore({
      ...tenant,
      ...(photoUrl ? { photoUrl } : {}),
    });

    await updateDoc(doc(db, COLLECTIONS.TENANTS, id), data);
  },

  deleteTenant: async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.TENANTS, id));
  },

  updateTenantStatus: async (id: string, status: string) => {
    await updateDoc(doc(db, COLLECTIONS.TENANTS, id), { status });
  },

  uploadTenantPhoto: async (file: File, id: string): Promise<string> => {
    const storageRef = ref(storage, `tenant_photos/${id}.jpg`);
    await uploadBytes(storageRef, file, { contentType: file.type });
    return getDownloadURL(storageRef);
  },


  // ---------- Maintenance ----------
  watchMaintenance: (onUpdate: (requests: Maintenance[]) => void) => {
    const q = query(collection(db, COLLECTIONS.MAINTENANCE), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as Maintenance[];
      onUpdate(requests);
    });
  },

  addMaintenance: async (request: Maintenance) => {
    const data = prepareForFirestore({
      ...request,
      createdAt: serverTimestamp(),
    });
    const docRef = await addDoc(collection(db, COLLECTIONS.MAINTENANCE), data);
    return docRef.id;
  },

  updateMaintenanceStatus: async (id: string, status: string) => {
    await updateDoc(doc(db, COLLECTIONS.MAINTENANCE, id), { status });
  },

  // ---------- Notices ----------
  watchNotices: (onUpdate: (notices: Notice[]) => void) => {
    const q = query(collection(db, COLLECTIONS.NOTICES), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snapshot) => {
      const notices = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as Notice[];
      onUpdate(notices);
    });
  },

  sendNotice: async (notice: Notice) => {
    const data = prepareForFirestore({
      ...notice,
      broadcastStatus: "queued",
      recipientCount: 0,
      createdAt: serverTimestamp(),
    });
    const docRef = await addDoc(collection(db, COLLECTIONS.NOTICES), data);
    return docRef.id;
  },

  // ---------- Cloud Functions ----------
  sendProductPromo: async (params: { productName: string; price: number; offerText?: string; orderLink?: string }) => {
    const sendPromoFn = httpsCallable<any, { success: boolean; sentTo: number }>(functions, "sendProductPromo");
    const result = await sendPromoFn(params);
    return result.data;
  },
};
