const test = require("node:test");
const assert = require("node:assert/strict");

process.env.UPI_ID = "gcmulia@kbl";
process.env.UPI_PAYEE_NAME = "GANESH CHETHAN M";

const {
  remainingRent,
  shouldIncludeProductOffer,
  earnsProductOffer,
  buildUpiLink,
  buildComponents,
} = require("./feeUtils");

test("UPI amount is full remaining rent, never 10% off", () => {
  const tenant = { name: "Bhuvanesh", monthlyRent: 3000, roomNo: "A1" };
  const ctx = { date: new Date("2026-09-01T04:30:00Z"), productOffer: true };
  const link = buildUpiLink(tenant, ctx, null);
  const params = new URLSearchParams(link.replace("upi://pay?", ""));
  assert.equal(params.get("am"), "3000");
  assert.equal(params.get("pa"), "gcmulia@kbl");
});

test("UPI amount uses remaining balance after a partial payment", () => {
  const tenant = { monthlyRent: 3000, roomNo: "A1" };
  const ctx = { date: new Date("2026-09-03T04:30:00Z"), productOffer: true };
  const link = buildUpiLink(tenant, ctx, { paidAmount: 1000, status: "partial" });
  const params = new URLSearchParams(link.replace("upi://pay?", ""));
  assert.equal(params.get("am"), "2000");
});

test("legacy paid docs without paidAmount count as fully paid", () => {
  const tenant = { monthlyRent: 3000 };
  assert.equal(remainingRent(tenant, { status: "paid", amount: 3000 }), 0);
});

test("product offer is only on the 1st, 3rd and 5th", () => {
  assert.equal(shouldIncludeProductOffer(1), true);
  assert.equal(shouldIncludeProductOffer(3), true);
  assert.equal(shouldIncludeProductOffer(5), true);
  assert.equal(shouldIncludeProductOffer(7), false);
  assert.equal(shouldIncludeProductOffer(10), false);
  assert.equal(shouldIncludeProductOffer(15), false);
});

test("EARLY10 is earned only when rent is cleared on or before the 5th", () => {
  assert.equal(earnsProductOffer(4), true);
  assert.equal(earnsProductOffer(5), true);
  assert.equal(earnsProductOffer(6), false);
});

test("early template vars keep rent full and describe shop discount", () => {
  const tenant = { name: "Sujay", monthlyRent: 3000, roomNo: "B2" };
  const ctx = { date: new Date("2026-09-01T04:30:00Z"), productOffer: true };
  const components = buildComponents(tenant, ctx, null);
  assert.equal(components.body_3.value, "₹3000");
  assert.match(components.body_4.value, /am=3000/);
  assert.equal(components.body_5.value, "EARLY10");
  assert.match(components.body_6.value, /shop products/);
  assert.doesNotMatch(components.body_6.value, /off rent/i);
});
