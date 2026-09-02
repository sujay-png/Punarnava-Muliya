/**
 * Fee reminder automation.
 *
 * sendFeeReminders — runs every day at 10:00 IST. It exits immediately unless
 * today is one of REMINDER_DAYS (1, 3, 5, 7, 10, 15). On reminder days it:
 *   1. loads all billable tenants,
 *   2. removes those who already paid this month in full,
 *   3. sends the WhatsApp template (shop-product offer on every reminder through the 15th; last day to avail is the 5th),
 *   4. logs every send so re-runs are idempotent and failures can be retried.
 *
 * UPI links always carry remaining rent due. The 10% EARLY10 offer is for
 * the owner's shop products only — never subtracted from rent.
 */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const msg91 = require("../services/msg91Service");
const repo = require("../services/tenantRepository");
const { todayInIST } = require("../utils/dateUtils");
const {
  remainingRent,
  shouldIncludeProductOffer,
  buildComponents,
} = require("../utils/feeUtils");
const { REMINDER_DAYS, TIMEZONE } = require("../config/constants");

async function runReminderCycle(day, monthKey, date) {
  const productOffer = shouldIncludeProductOffer(day);
  const templateName = productOffer
    ? process.env.TEMPLATE_FEE_REMINDER_EARLY
    : process.env.TEMPLATE_FEE_REMINDER;

  const [tenants, paidIds, payments] = await Promise.all([
    repo.getBillableTenants(),
    repo.getPaidTenantIds(monthKey),
    repo.getPaymentsByMonth(monthKey),
  ]);

  const unpaid = tenants.filter((t) => !paidIds.has(t.id) && t.phone);
  logger.info(`Reminder day ${day}: ${unpaid.length}/${tenants.length} unpaid tenants`);

  let sent = 0, failed = 0, skipped = 0;
  for (const tenant of unpaid) {
    if (await repo.wasReminderSent(tenant.id, monthKey, day)) { skipped++; continue; }
    const payment = payments.get(tenant.id);
    if (remainingRent(tenant, payment) <= 0) { skipped++; continue; }
    try {
      await msg91.sendTemplate(
        templateName,
        `91${String(tenant.phone).replace(/\D/g, "").slice(-10)}`,
        buildComponents(tenant, { date, productOffer }, payment)
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

    const productOffer = shouldIncludeProductOffer(day);
    const templateName = productOffer
      ? process.env.TEMPLATE_FEE_REMINDER_EARLY
      : process.env.TEMPLATE_FEE_REMINDER;

    const payments = await repo.getPaymentsByMonth(monthKey);

    for (const f of failures) {
      const tenant = await repo.getTenantById(f.tenantId);
      if (!tenant || !tenant.phone) continue;
      const payment = payments.get(tenant.id);
      if (remainingRent(tenant, payment) <= 0) continue;
      try {
        await msg91.sendTemplate(
          templateName,
          `91${String(tenant.phone).replace(/\D/g, "").slice(-10)}`,
          buildComponents(tenant, { date, productOffer }, payment)
        );
        await repo.logMessage({ tenantId: tenant.id, monthKey, day, type: "reminder", status: "sent" });
      } catch (err) {
        await repo.logMessage({ tenantId: tenant.id, monthKey, day, type: "reminder", status: "failed", error: err.message });
      }
    }
  }
);
