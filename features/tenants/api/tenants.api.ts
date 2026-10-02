import { collection, query, where, orderBy, onSnapshot, getDocs, doc, getDoc, Timestamp, writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { firestoreService } from "@/lib/api/firestore";
import { Tenant } from "@/lib/models/schema";

const TENANTS_COLLECTION = "tenants";

const convertTimestamps = <T>(data: any): T => {
  const result: any = { ...data };
  for (const [key, value] of Object.entries(result)) {
    if (value instanceof Timestamp) {
      result[key] = value.toDate();
    }
  }
  return result as T;
};

export const tenantsApi = {
  getTenant: async (tenantId: string): Promise<Tenant | null> => {
    const docRef = doc(db, TENANTS_COLLECTION, tenantId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...convertTimestamps<any>(docSnap.data()) } as Tenant;
  },

  watchTenants: (onUpdate: (tenants: Tenant[]) => void) => {
    const q = query(collection(db, TENANTS_COLLECTION), orderBy("roomNo"));
    return onSnapshot(q, (snapshot) => {
      const tenants = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...convertTimestamps<any>(doc.data()),
      })) as Tenant[];
      onUpdate(tenants);
    });
  },
  
  
  watchTenant: (tenantId: string, onUpdate: (tenant: Tenant | null) => void) => {
    return onSnapshot(doc(db, TENANTS_COLLECTION, tenantId), (docSnap) => {
      if (!docSnap.exists()) {
        onUpdate(null);
      } else {
        onUpdate({ id: docSnap.id, ...convertTimestamps<any>(docSnap.data()) } as Tenant);
      }
    });
  },

  registerTenantWithStay: async (tenant: Tenant, depositAmount: number, depositMode: string, photoFile?: File) => {
    // 1. Upload photo if present
    let photoUrl = tenant.photoUrl;
    if (photoFile) {
      const tempId = Date.now().toString();
      photoUrl = await firestoreService.uploadTenantPhoto(photoFile, tempId);
    }

    const batch = writeBatch(db);

    // 2. Prepare Tenant Doc
    const tenantRef = doc(collection(db, TENANTS_COLLECTION));
    const tenantData: any = {
      ...tenant,
      photoUrl,
      createdAt: serverTimestamp(),
    };
    Object.keys(tenantData).forEach(key => tenantData[key] === undefined && delete tenantData[key]);
    batch.set(tenantRef, tenantData);

    // 3. Prepare Stay Doc
    const stayRef = doc(collection(db, "stays"));
    const stayData: any = {
      tenantId: tenantRef.id,
      roomNumber: tenant.roomNo,
      joinDate: tenant.joinDate,
      monthlyRent: tenant.monthlyRent,
      status: tenant.status === "active" ? "Active" : tenant.status === "notice" ? "OnNotice" : "Vacated",
      expectedVacateDate: tenant.expectedVacateDate || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    Object.keys(stayData).forEach(key => stayData[key] === undefined && delete stayData[key]);
    batch.set(stayRef, stayData);

    // 4. Prepare Deposit Doc
    if (depositAmount > 0) {
      const depositRef = doc(collection(db, "deposits"));
      const depositData: any = {
        tenantId: tenantRef.id,
        stayId: stayRef.id,
        amount: depositAmount,
        paidOn: tenant.joinDate,
        mode: depositMode,
        status: "Held",
        deductions: [],
        createdAt: serverTimestamp(),
      };
      batch.set(depositRef, depositData);
    }

    await batch.commit();
    return tenantRef.id;
  },

  updateTenantWithDeposit: async (tenantId: string, tenantData: Partial<Tenant>, depositAmount: number, depositMode: string, photoFile?: File) => {
    let photoUrl = tenantData.photoUrl;
    if (photoFile) {
      photoUrl = await firestoreService.uploadTenantPhoto(photoFile, tenantId);
    }

    const batch = writeBatch(db);

    // 1. Update Tenant
    const tenantRef = doc(db, TENANTS_COLLECTION, tenantId);
    const cleanedTenantData: any = { ...tenantData };
    if (photoUrl) cleanedTenantData.photoUrl = photoUrl;
    Object.keys(cleanedTenantData).forEach(key => cleanedTenantData[key] === undefined && delete cleanedTenantData[key]);
    batch.update(tenantRef, cleanedTenantData);

    // 2. Fetch/Upsert Stay
    const staysQ = query(collection(db, "stays"), where("tenantId", "==", tenantId), where("status", "in", ["Active", "OnNotice"]));
    const staysSnap = await getDocs(staysQ);
    let stayId;
    if (staysSnap.empty) {
      const stayRef = doc(collection(db, "stays"));
      stayId = stayRef.id;
      batch.set(stayRef, {
        tenantId,
        roomNumber: tenantData.roomNo,
        joinDate: tenantData.joinDate,
        monthlyRent: tenantData.monthlyRent,
        status: tenantData.status === "active" ? "Active" : tenantData.status === "notice" ? "OnNotice" : "Vacated",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      stayId = staysSnap.docs[0].id;
      batch.update(staysSnap.docs[0].ref, {
        roomNumber: tenantData.roomNo,
        monthlyRent: tenantData.monthlyRent,
        joinDate: tenantData.joinDate,
        updatedAt: serverTimestamp(),
      });
    }

    // 3. Fetch/Upsert Deposit
    const depsQ = query(collection(db, "deposits"), where("stayId", "==", stayId), where("status", "==", "Held"));
    const depsSnap = await getDocs(depsQ);
    if (depsSnap.empty) {
      const depRef = doc(collection(db, "deposits"));
      batch.set(depRef, {
        tenantId,
        stayId,
        amount: depositAmount,
        paidOn: tenantData.joinDate,
        mode: depositMode,
        status: "Held",
        deductions: [],
        createdAt: serverTimestamp(),
      });
    } else {
      batch.update(depsSnap.docs[0].ref, {
        amount: depositAmount,
        mode: depositMode,
      });
    }

    await batch.commit();
  }
};
