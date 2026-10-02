const fs = require('fs');
const path = require('path');

// 1. Load Environment Variables manually (simulating dotenv)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8').split('\n');
  for (let line of envConfig) {
    if (line.trim() && !line.startsWith('#')) {
      const parts = line.split('=');
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '');
      if (key) process.env[key] = value;
    }
  }
}

// Ensure the required API key is there
if (!process.env.MSG91_AUTH_KEY) {
  console.error("Missing MSG91_AUTH_KEY in .env");
  process.exit(1);
}

// 2. Import dependencies from your codebase
const msg91 = require("./src/services/msg91Service");
const { monthLabel } = require("./src/utils/dateUtils");

const PHONE = "919019136354";
const TENANT = { name: "John Doe", monthlyRent: 3000, roomNo: "101" };

function buildUpiLink(tenant, ctx) {
  const diff = ctx.date.getDate() - 10;
  const fine = diff > 0 ? diff * 100 : 0;
  const amount = tenant.monthlyRent + fine;

  const params = new URLSearchParams({
    pa: process.env.UPI_ID || "gcmulia@kbl",
    pn: process.env.UPI_PAYEE_NAME || "PG Rent",
    am: String(amount),
    cu: "INR",
    tn: `Rent ${monthLabel(ctx.date)} ${tenant.roomNo || ""}`.trim(),
  });
  return `upi://pay?${params.toString()}`;
}

function buildComponents(tenant, ctx) {
  const diff = ctx.date.getDate() - 10;
  const fine = diff > 0 ? diff * 100 : 0;
  const totalAmount = tenant.monthlyRent + fine;
  
  const amountText = fine > 0 ? `₹${totalAmount} (Includes ₹${fine} late fine)` : `₹${totalAmount}`;

  const base = {
    body_1: { type: "text", value: tenant.name },
    body_2: { type: "text", value: monthLabel(ctx.date) },
    body_3: { type: "text", value: amountText },
    body_4: { type: "text", value: buildUpiLink(tenant, ctx) },
  };
  if (ctx.earlyBird) {
    base.body_5 = { type: "text", value: "EARLY10" };
    base.body_6 = { type: "text", value: "https://kshithija.in" };
  }
  return base;
}

async function runTest() {
  const earlyTemplate = process.env.TEMPLATE_FEE_REMINDER_EARLY || "fee_reminder_early_offer";
  const normalTemplate = process.env.TEMPLATE_FEE_REMINDER || "fee_reminder";

  // Mock sendTemplate so we can see what it sends without hitting the API
  msg91.sendTemplate = async (template, to, components) => {
    console.log(`\n📨 SENDING TEMPLATE: [${template}] to ${to}`);
    console.log(`Variables:`);
    for (const key in components) {
      console.log(`  ${key} -> ${components[key].value}`);
    }
  };

  console.log("==========================================");
  console.log("1. Simulating Day 3 (Before 5th) - Early Bird Offer");
  const date1 = new Date("2026-09-03T10:00:00Z");
  await msg91.sendTemplate(earlyTemplate, PHONE, buildComponents(TENANT, { date: date1, earlyBird: true }));
  
  console.log("\n==========================================");
  console.log("2. Simulating Day 7 (After 5th, Before 10th) - Normal Reminder");
  const date2 = new Date("2026-09-07T10:00:00Z");
  await msg91.sendTemplate(normalTemplate, PHONE, buildComponents(TENANT, { date: date2, earlyBird: false }));

  console.log("\n==========================================");
  console.log("3. Simulating Day 15 (On 15th) - Late Reminder with Fine");
  const date3 = new Date("2026-09-15T10:00:00Z");
  await msg91.sendTemplate(normalTemplate, PHONE, buildComponents(TENANT, { date: date3, earlyBird: false }));
  console.log("\n==========================================");
}

runTest();
