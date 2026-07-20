/**
 * Thin wrapper around the MSG91 WhatsApp Outbound (bulk template) API.
 * Docs: https://docs.msg91.com/whatsapp  (open your template -> "code" to get the exact cURL)
 *
 * IMPORTANT: the "components" keys below (body_1, body_2, ...) must match the
 * variables {{1}}, {{2}} ... in your approved template. If you used named
 * variables on the MSG91 dashboard, adjust the keys accordingly.
 */
const axios = require("axios");

const MSG91_BULK_URL =
  "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/";

class Msg91Service {
  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY;
    this.integratedNumber = process.env.MSG91_INTEGRATED_NUMBER;
  }

  ensureConfigured() {
    if (!this.authKey) throw new Error("MSG91_AUTH_KEY is not set");
    if (!this.integratedNumber) throw new Error("MSG91_INTEGRATED_NUMBER is not set");
  }

  /**
   * Send one approved template to many recipients in a single API call.
   * @param {string} templateName  approved template name on MSG91
   * @param {Array<{to: string, components: Object}>} recipients
   *        components example: { body_1: { type: "text", value: "Arjun" } }
   * @param {string} languageCode  template language, default "en"
   */
  async sendBulkTemplate(templateName, recipients, languageCode = "en") {
    this.ensureConfigured();
    const payload = {
      integrated_number: this.integratedNumber,
      content_type: "template",
      payload: {
        messaging_product: "whatsapp",
        type: "template",
        template: {
          name: templateName,
          language: { code: languageCode, policy: "deterministic" },
          to_and_components: recipients.map((r) => ({
            to: [r.to],
            components: r.components,
          })),
        },
      },
    };

    const res = await axios.post(MSG91_BULK_URL, payload, {
      headers: { authkey: this.authKey, "Content-Type": "application/json" },
      timeout: 30000,
    });
    return res.data;
  }

  /** Convenience: send a template to a single number. */
  async sendTemplate(templateName, to, components, languageCode = "en") {
    return this.sendBulkTemplate(templateName, [{ to, components }], languageCode);
  }
}

module.exports = new Msg91Service();
