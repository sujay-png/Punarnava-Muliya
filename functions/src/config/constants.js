/** Central configuration. Change business rules here — not inside controllers. */
module.exports = {
  // Days of the month on which reminders go out. 15 is the final due date.
  REMINDER_DAYS: [1, 3, 5, 7, 10, 15],

  // Pay strictly before this day of month to use the early-bird coupon.
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
  PAYMENT_STATUS: { PAID: "paid", PENDING: "pending", OVERDUE: "overdue" },
  MESSAGE_STATUS: { SENT: "sent", FAILED: "failed" },
};
