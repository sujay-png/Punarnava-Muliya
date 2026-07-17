/** All Firestore reads/writes for the functions live here (repository pattern). */
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { COLLECTIONS, TENANT_STATUS, PAYMENT_STATUS } = require("../config/constants");

const db = () => getFirestore();

/** Active + on-notice tenants (they still owe rent until they vacate). */
async function getBillableTenants() {
  const snap = await db()
    .collection(COLLECTIONS.TENANTS)
    .where("status", "in", [TENANT_STATUS.ACTIVE, TENANT_STATUS.NOTICE])
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Tenant IDs that have already PAID for the given month, e.g. "2026-07". */
async function getPaidTenantIds(monthKey) {
  const snap = await db()
    .collection(COLLECTIONS.PAYMENTS)
    .where("monthKey", "==", monthKey)
    .where("status", "==", PAYMENT_STATUS.PAID)
    .get();
  return new Set(snap.docs.map((d) => d.data().tenantId));
}

/**
 * Idempotency guard: returns true if this exact reminder (tenant+month+day)
 * was already sent, so re-runs / retries never double-message anyone.
 */
async function wasReminderSent(tenantId, monthKey, day) {
  const id = `reminder_${tenantId}_${monthKey}_${day}`;
  const doc = await db().collection(COLLECTIONS.MESSAGE_LOGS).doc(id).get();
  return doc.exists && doc.data().status === "sent";
}

async function logMessage({ tenantId, monthKey, day, type, status, error = null }) {
  const id = day != null
    ? `${type}_${tenantId}_${monthKey}_${day}`
    : `${type}_${tenantId}_${Date.now()}`;
  await db().collection(COLLECTIONS.MESSAGE_LOGS).doc(id).set(
    {
      tenantId, monthKey: monthKey ?? null, day: day ?? null, type, status,
      error: error ? String(error).slice(0, 500) : null,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

/** Failed reminder logs for a given month+day (used by the retry job). */
async function getFailedReminders(monthKey, day) {
  const snap = await db()
    .collection(COLLECTIONS.MESSAGE_LOGS)
    .where("type", "==", "reminder")
    .where("monthKey", "==", monthKey)
    .where("day", "==", day)
    .where("status", "==", "failed")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

async function getTenantById(tenantId) {
  const doc = await db().collection(COLLECTIONS.TENANTS).doc(tenantId).get();
  return doc.exists ? { id: doc.id, ...doc.data() } : null;
}

/** Featured product for the promo line inside reminders (optional). */
async function getFeaturedProduct() {
  const snap = await db()
    .collection(COLLECTIONS.PRODUCTS)
    .where("featured", "==", true)
    .limit(1)
    .get();
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

module.exports = {
  getBillableTenants, getPaidTenantIds, wasReminderSent,
  logMessage, getFailedReminders, getTenantById, getFeaturedProduct,
};
