/**
 * Product promotions — the owner sells products to PG members.
 * Callable from the Flutter app (owner-only): pushes a promo template featuring
 * one product to all active tenants.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const msg91 = require("../services/msg91Service");
const repo = require("../services/tenantRepository");

exports.sendProductPromo = onCall(
  { region: "asia-south1", memory: "256MiB", secrets: ["MSG91_AUTH_KEY"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }

    const { productName, price, offerText, orderLink } = request.data || {};
    if (!productName || !price) {
      throw new HttpsError("invalid-argument", "productName and price are required.");
    }

    const tenants = await repo.getBillableTenants();
    const recipients = tenants
      .filter((t) => t.phone)
      .map((t) => ({
        to: `91${String(t.phone).replace(/\D/g, "").slice(-10)}`,
        components: {
          body_1: { type: "text", value: t.name },
          body_2: { type: "text", value: productName },
          body_3: { type: "text", value: `₹${price}` },
          body_4: { type: "text", value: offerText || "Available now at the PG office" },
          body_5: { type: "text", value: orderLink || "" },
        },
      }));

    try {
      await msg91.sendBulkTemplate(process.env.TEMPLATE_PRODUCT_PROMO, recipients);
      logger.info(`Promo "${productName}" sent to ${recipients.length} tenants`);
      return { success: true, sentTo: recipients.length };
    } catch (err) {
      logger.error("Promo send failed", err);
      throw new HttpsError("internal", "Failed to send promo: " + err.message);
    }
  }
);
