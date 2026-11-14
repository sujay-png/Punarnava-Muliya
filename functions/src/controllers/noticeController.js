/**
 * Notice board broadcast.
 * Writes to `notices/` trigger this function to fan the message out to every active tenant on WhatsApp.
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");
const whatsapp = require("../services/whatsappService");
const repo = require("../services/tenantRepository");
const { COLLECTIONS } = require("../config/constants");

exports.onNoticeCreated = onDocumentCreated(
  {
    document: `${COLLECTIONS.NOTICES}/{noticeId}`,
    region: "asia-south1",
    memory: "256MiB",
  },
  async (event) => {
    const notice = event.data.data();
    const noticeId = event.params.noticeId;
    if (notice.broadcastStatus === "sent") return; // idempotency

    const tenants = await repo.getBillableTenants();
    const recipients = tenants
      .filter((t) => t.phone)
      .map((t) => ({
        to: `91${String(t.phone).replace(/\D/g, "").slice(-10)}`,
        components: {
          body_1: { type: "text", value: t.name },          // {{1}} tenant name
          body_2: { type: "text", value: notice.title },    // {{2}} notice title
          body_3: { type: "text", value: notice.message },  // {{3}} notice body
        },
      }));

    let status = "sent", error = null;
    try {
      await whatsapp.sendBulkTemplate(process.env.TEMPLATE_NOTICE, recipients);
      logger.info(`Notice ${noticeId} broadcast to ${recipients.length} tenants`);
    } catch (err) {
      status = "failed"; error = err.message;
      logger.error(`Notice ${noticeId} broadcast failed`, err);
    }

    await getFirestore().collection(COLLECTIONS.NOTICES).doc(noticeId).update({
      broadcastStatus: status,
      broadcastError: error,
      recipientCount: recipients.length,
      broadcastAt: FieldValue.serverTimestamp(),
    });
  }
);
