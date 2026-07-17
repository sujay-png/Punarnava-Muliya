/**
 * PGMaster Cloud Functions — entry point.
 *
 * Exposed functions:
 *  1. sendFeeReminders   — scheduled daily; fires only on 1st, 3rd, 5th, 7th, 10th, 15th (IST)
 *  2. onNoticeCreated    — Firestore trigger; broadcasts a notice to all active tenants on WhatsApp
 *  3. sendProductPromo   — callable; lets the owner push a product promotion to all tenants
 *  4. retryFailedReminders — scheduled hourly on reminder days; retries failed sends
 */
const { initializeApp } = require("firebase-admin/app");
initializeApp();

const { sendFeeReminders, retryFailedReminders } = require("./src/controllers/feeReminderController");
const { onNoticeCreated } = require("./src/controllers/noticeController");
const { sendProductPromo } = require("./src/controllers/promoController");

exports.sendFeeReminders = sendFeeReminders;
exports.retryFailedReminders = retryFailedReminders;
exports.onNoticeCreated = onNoticeCreated;
exports.sendProductPromo = sendProductPromo;
