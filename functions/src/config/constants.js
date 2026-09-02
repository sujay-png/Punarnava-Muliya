/** Central configuration. Change business rules here — not inside controllers. */
module.exports = {
  // Days of the month on which reminders go out. 15 is the final due date.
  REMINDER_DAYS: [1, 3, 5, 7, 10, 15],

  // Shop 10% offer is included on every reminder through the 15th.
  // The 5th is the last day tenants can actually avail EARLY10 (full rent paid).
  // The discount never applies to rent / UPI amount.
  PRODUCT_OFFER_DAYS: [1, 3, 5, 7, 10, 15],
  EARLY_BIRD_LAST_DAY: 5,
  EARLY_BIRD_COUPON: "EARLY10",
  EARLY_BIRD_DISCOUNT_PERCENT: 10,

  // All scheduling is done in the PG's timezone.
  TIMEZONE: "Asia/Kolkata",

  // Firestore collection names — single source of truth.
  COLLECTIONS: {
    TENANTS: "tenants",
    PAYMENTS: "payments",
    NOTICES: "notices",
    MAINTENANCE: "maintenance",
    PRODUCTS: "products",
    MESSAGE_LOGS: "message_logs",
  },

  TENANT_STATUS: { ACTIVE: "active", NOTICE: "notice", VACATED: "vacated" },
  PAYMENT_STATUS: {
    PAID: "paid",
    PARTIAL: "partial",
    PENDING: "pending",
    OVERDUE: "overdue",
  },
  MESSAGE_STATUS: { SENT: "sent", FAILED: "failed" },
};
