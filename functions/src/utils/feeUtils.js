/**
 * Rent vs shop-offer helpers shared by reminder jobs.
 *
 * Rent in UPI links is always the remaining rent due — never discounted.
 * EARLY10 is 10% off the owner's shop products. It is included on every
 * reminder through the 15th. Tenants can only avail it if rent is paid
 * in full on or before the 5th. Never applied to rent.
 */
const {
  EARLY_BIRD_LAST_DAY,
  EARLY_BIRD_COUPON,
  EARLY_BIRD_DISCOUNT_PERCENT,
  PRODUCT_OFFER_DAYS,
} = require("../config/constants");
const { monthLabel } = require("./dateUtils");

function asRupees(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

/** Full monthly rent from the tenant record (source of truth). */
function monthlyRent(tenant) {
  return asRupees(tenant && tenant.monthlyRent);
}

/** Amount already collected this month. */
function paidAmount(payment) {
  if (!payment) return 0;
  if (payment.paidAmount != null) return asRupees(payment.paidAmount);
  // Legacy fully-paid docs stored only `amount` + status=paid.
  if (payment.status === "paid") return asRupees(payment.amount);
  return 0;
}

function remainingRent(tenant, payment) {
  return Math.max(0, monthlyRent(tenant) - paidAmount(payment));
}

/** Shop 10% offer is included on every reminder day through the 15th. */
function shouldIncludeProductOffer(day) {
  return PRODUCT_OFFER_DAYS.includes(Number(day));
}

/**
 * Eligible for EARLY10 on shop products if rent is fully settled on/before the 5th.
 */
function earnsProductOffer(paidAtDay) {
  return Number(paidAtDay) <= EARLY_BIRD_LAST_DAY;
}

function buildUpiLink(tenant, ctx, payment) {
  const amount = remainingRent(tenant, payment);
  const params = new URLSearchParams({
    pa: process.env.UPI_ID,
    pn: process.env.UPI_PAYEE_NAME || "PG Rent",
    am: String(amount),
    cu: "INR",
    tn: `Rent ${monthLabel(ctx.date)} ${tenant.roomNo || ""}`.trim(),
  });
  return `upi://pay?${params.toString()}`;
}

/** Template variables {{1}}..{{n}}. UPI amount is remaining rent, never 10% off. */
function buildComponents(tenant, ctx, payment) {
  const due = remainingRent(tenant, payment);
  const rent = monthlyRent(tenant);
  const paid = paidAmount(payment);
  const amountLabel = paid > 0 && due < rent
    ? `₹${due} due (₹${paid} of ₹${rent} paid)`
    : `₹${rent}`;

  const base = {
    body_1: { type: "text", value: tenant.name },
    body_2: { type: "text", value: monthLabel(ctx.date) },
    body_3: { type: "text", value: amountLabel },
    body_4: { type: "text", value: buildUpiLink(tenant, ctx, payment) },
  };
  if (ctx.productOffer) {
    base.body_5 = { type: "text", value: EARLY_BIRD_COUPON };
    base.body_6 = {
      type: "text",
      value: `${EARLY_BIRD_DISCOUNT_PERCENT}% off shop products (not rent) — last date to avail is the 5th`,
    };
  }
  return base;
}

module.exports = {
  asRupees,
  monthlyRent,
  paidAmount,
  remainingRent,
  shouldIncludeProductOffer,
  earnsProductOffer,
  buildUpiLink,
  buildComponents,
};
