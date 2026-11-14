/**
 * WhatsApp Cloud API Service (Meta Graph API).
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
const axios = require("axios");
const { logger } = require("firebase-functions");

const GRAPH_API_VERSION = "v21.0";

class WhatsAppService {
  constructor() {
    this.phoneNumberId = process.env.META_WA_PHONE_NUMBER_ID;
    this.accessToken = process.env.META_WA_ACCESS_TOKEN;
  }

  ensureConfigured() {
    this.phoneNumberId = this.phoneNumberId || process.env.META_WA_PHONE_NUMBER_ID;
    this.accessToken = this.accessToken || process.env.META_WA_ACCESS_TOKEN;

    if (!this.phoneNumberId) throw new Error("META_WA_PHONE_NUMBER_ID is not set in environment");
    if (!this.accessToken) throw new Error("META_WA_ACCESS_TOKEN is not set in environment");
  }

  /**
   * Normalize parameters/components into Meta's body parameters format.
   * Handles:
   * 1. Key-value objects: { body_1: { type: "text", value: "..." }, body_2: ... }
   * 2. Array of strings: ["Val 1", "Val 2"]
   * 3. Meta standard parameters array: [{ type: "text", text: "..." }]
   * 4. Full Meta components array: [{ type: "body", parameters: [...] }]
   */
  formatComponents(components) {
    if (!components) return [];

    // Already in Meta's full components structure
    if (Array.isArray(components) && components[0]?.type === "body") {
      return components;
    }

    let parameters = [];

    if (Array.isArray(components)) {
      parameters = components.map((param) => {
        if (typeof param === "object" && param !== null) {
          return {
            type: param.type || "text",
            text: String(param.text ?? param.value ?? ""),
          };
        }
        return { type: "text", text: String(param) };
      });
    } else if (typeof components === "object") {
      // Sort keys numerically if formatted like body_1, body_2, etc.
      const sortedKeys = Object.keys(components).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
        return numA - numB;
      });

      parameters = sortedKeys.map((key) => {
        const item = components[key];
        const textVal =
          typeof item === "object" && item !== null ? (item.value ?? item.text ?? "") : item;
        return {
          type: "text",
          text: String(textVal),
        };
      });
    }

    return [
      {
        type: "body",
        parameters,
      },
    ];
  }

  /**
   * Send a WhatsApp template message to a single recipient.
   * @param {string} templateName Approved template name on Meta WhatsApp Manager
   * @param {string} to Recipient phone number with country code (e.g. '918105593259')
   * @param {Object|Array} components Template variables / components
   * @param {string} languageCode Language code (default 'en')
   */
  async sendTemplate(templateName, to, components, languageCode = "en") {
    this.ensureConfigured();

    const cleanTo = String(to).replace(/\D/g, "");
    const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${this.phoneNumberId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanTo,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: this.formatComponents(components),
      },
    };

    const res = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    return res.data;
  }

  /**
   * Send a template message to multiple recipients.
   * @param {string} templateName
   * @param {Array<{to: string, components: Object|Array}>} recipients
   * @param {string} languageCode
   */
  async sendBulkTemplate(templateName, recipients, languageCode = "en") {
    this.ensureConfigured();

    const results = [];
    // Process in batches of 5 concurrent calls
    const chunkSize = 5;
    for (let i = 0; i < recipients.length; i += chunkSize) {
      const chunk = recipients.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map(async (recipient) => {
          try {
            const data = await this.sendTemplate(
              templateName,
              recipient.to,
              recipient.components,
              languageCode
            );
            return { to: recipient.to, status: "sent", data };
          } catch (err) {
            const errorMsg = err.response?.data?.error?.message || err.message;
            logger.error(`Failed to send WhatsApp template to ${recipient.to}:`, errorMsg);
            return { to: recipient.to, status: "failed", error: errorMsg };
          }
        })
      );
      results.push(...chunkResults);
    }

    const failedCount = results.filter((r) => r.status === "failed").length;
    if (failedCount > 0 && failedCount === recipients.length) {
      const firstError = results.find((r) => r.error)?.error || "All message deliveries failed";
      throw new Error(firstError);
    }

    return results;
  }
}

module.exports = new WhatsAppService();

