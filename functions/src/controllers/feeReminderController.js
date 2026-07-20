/**
 * Fee reminder automation.
 *
 * sendFeeReminders — runs every day at 10:00 IST. It exits immediately unless
 * today is one of REMINDER_DAYS (1, 3, 5, 7, 10, 15). On reminder days it:
 *   1. loads all billable tenants,
 *   2. removes those who already paid this month,
 *   3. sends the WhatsApp template (early-bird variant before the 5th),
 *   4. logs every send so re-runs are idempotent and failures can be retried.
 */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const msg91 = require("../services/msg91Service");
const repo = require("../services/tenantRepository");
const { todayInIST, monthLabel } = require("../utils/dateUtils");
const {
  REMINDER_DAYS, EARLY_BIRD_LAST_DAY, EARLY_BIRD_COUPON,
  EARLY_BIRD_DISCOUNT_PERCENT, TIMEZONE,
} = require("../config/constants");



/** Per-tenant UPI deep link, amount pre-filled. Opens GPay/PhonePe/Paytm on tap. */
function buildUpiLink(tenant, ctx) {
  // Pre-apply the 10% early-bird discount in the link before the 5th:
  const amount = ctx.earlyBird
    ? Math.round(tenant.monthlyRent * (1 - EARLY_BIRD_DISCOUNT_PERCENT / 100))
    : tenant.monthlyRent;

  const params = new URLSearchParams({
    pa: process.env.UPI_ID,                       // gcmulia@kbl
    pn: process.env.UPI_PAYEE_NAME || "PG Rent",
    am: String(amount),
    cu: "INR",
    tn: `Rent ${monthLabel(ctx.date)} ${tenant.roomNo || ""}`.trim(),
  });
  return `upi://pay?${params.toString()}`;
}


/** Build the template variables for one tenant. Order must match {{1}}..{{n}}. */
function buildComponents(tenant, ctx) {
  const base = {
    body_1: { type: "text", value: tenant.name },                    // {{1}} name
    body_2: { type: "text", value: monthLabel(ctx.date) },           // {{2}} month
    body_3: { type: "text", value: `₹${tenant.monthlyRent}` },       // {{3}} amount
body_4: { type: "text", value: buildUpiLink(tenant, ctx) },      // {{4}} UPI link
  };
  if (ctx.earlyBird) {
    base.body_5 = { type: "text", value: EARLY_BIRD_COUPON };                 // {{5}}
    base.body_6 = { type: "text", value: `${EARLY_BIRD_DISCOUNT_PERCENT}%` }; // {{6}}
  }
  return base;
}

async function runReminderCycle(day, monthKey, date) {
  const earlyBird = day < EARLY_BIRD_LAST_DAY; // 1st & 3rd → EARLY10 offer
  const templateName = earlyBird
    ? process.env.TEMPLATE_FEE_REMINDER_EARLY
    : process.env.TEMPLATE_FEE_REMINDER;

  const [tenants, paidIds] = await Promise.all([
    repo.getBillableTenants(),
    repo.getPaidTenantIds(monthKey),
  ]);

  const unpaid = tenants.filter((t) => !paidIds.has(t.id) && t.phone);
  logger.info(`Reminder day ${day}: ${unpaid.length}/${tenants.length} unpaid tenants`);

  let sent = 0, failed = 0, skipped = 0;
  for (const tenant of unpaid) {
    if (await repo.wasReminderSent(tenant.id, monthKey, day)) { skipped++; continue; }
    try {
      await msg91.sendTemplate(
        templateName,
        `91${String(tenant.phone).replace(/\D/g, "").slice(-10)}`,
        buildComponents(tenant, { date, earlyBird })
      );
      await repo.logMessage({ tenantId: tenant.id, monthKey, day, type: "reminder", status: "sent" });
      sent++;
    } catch (err) {
      logger.error(`Reminder failed for ${tenant.id}`, err);
      await repo.logMessage({ tenantId: tenant.id, monthKey, day, type: "reminder", status: "failed", error: err.message });
      failed++;
    }
  }
  logger.info(`Reminder cycle done — sent: ${sent}, failed: ${failed}, skipped(already sent): ${skipped}`);
  return { sent, failed, skipped };
}

exports.sendFeeReminders = onSchedule(
  {
    schedule: "0 10 * * *",          // every day 10:00
    timeZone: TIMEZONE,              // ...in IST
    region: "asia-south1",           // Mumbai
    retryCount: 3,
    memory: "256MiB",
    timeoutSeconds: 300,
    secrets: ["MSG91_AUTH_KEY"],
  },
  async () => {
    const { day, monthKey, date } = todayInIST();
    if (!REMINDER_DAYS.includes(day)) {
      logger.info(`Day ${day} is not a reminder day. Skipping.`);
      return;
    }
    await runReminderCycle(day, monthKey, date);
  }
);

/** Hourly retry (11:00–20:00 IST) — only touches tenants whose send FAILED today. */
exports.retryFailedReminders = onSchedule(
  {
    schedule: "0 11-20 * * *",
    timeZone: TIMEZONE,
    region: "asia-south1",
    memory: "256MiB",
    secrets: ["MSG91_AUTH_KEY"],
  },
  async () => {
    const { day, monthKey, date } = todayInIST();
    if (!REMINDER_DAYS.includes(day)) return;

    const failures = await repo.getFailedReminders(monthKey, day);
    if (!failures.length) return;
    logger.info(`Retrying ${failures.length} failed reminders`);

    const earlyBird = day < EARLY_BIRD_LAST_DAY;
    const templateName = earlyBird
      ? process.env.TEMPLATE_FEE_REMINDER_EARLY
      : process.env.TEMPLATE_FEE_REMINDER;

    for (const f of failures) {
      const tenant = await repo.getTenantById(f.tenantId);
      if (!tenant || !tenant.phone) continue;
      try {
        await msg91.sendTemplate(
          templateName,
          `91${String(tenant.phone).replace(/\D/g, "").slice(-10)}`,
          buildComponents(tenant, { date, earlyBird })
        );
        await repo.logMessage({ tenantId: tenant.id, monthKey, day, type: "reminder", status: "sent" });
      } catch (err) {
        await repo.logMessage({ tenantId: tenant.id, monthKey, day, type: "reminder", status: "failed", error: err.message });
      }
    }
  }
);
