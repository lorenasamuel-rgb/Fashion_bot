import { xai } from "@ai-sdk/xai";
import { generateText, isStepCount, tool } from "ai";
import { z } from "zod";
import { applyVendorMessage } from "./agent";
import { applySupportMessage } from "./support";
import type { LotRecord } from "./types";

const MODEL_ID = "grok-4.7";

function lotSnapshot(lot: LotRecord) {
  return {
    shop: lot.shopName.value,
    country: lot.country.value,
    quantity: lot.quantity.value,
    unitPrice: lot.unitPrice.value,
    brand: lot.brand.value,
    color: lot.color.value,
    sizes: lot.sizes.value,
    defects: lot.defects.value,
    shipping: lot.shipping.value,
    duties: lot.duties.value,
    grade: lot.grade.value,
    quantityConflict: lot.quantityConflict,
  };
}

export async function replyWithGrokBot(
  lot: LotRecord,
  supplierMessage: string,
): Promise<{ lot: LotRecord; reply: string } | null> {
  if (!process.env.XAI_API_KEY) return null;

  let next = lot;
  let recorded = false;
  let draftReply = "";

  const result = await generateText({
    model: xai(MODEL_ID),
    system: [
      "You are the Grok bot on FleekFlow's Wassist channel.",
      "Call record_supplier_message once, then answer the supplier.",
      "The tool is the only source of lot facts. Do not add a shop, country, quantity, price, brand, colour, sizes, defects, shipping cost, duties, or grade.",
      "Do not mark the supplier as verified. Do not decide a refund.",
      "If draftReply asks one question, ask that same question and no other.",
      "Write in Portuguese when the supplier wrote in Portuguese. Otherwise write in English.",
      "Two to four short sentences. No markdown.",
    ].join(" "),
    tools: {
      record_supplier_message: tool({
        description:
          "Save the supplier message into the lot. Fills only facts that appear in that message. Call this once before replying.",
        inputSchema: z.object({
          ready: z.boolean().describe("True once you have read the supplier message."),
        }),
        execute: async () => {
          const applied = applyVendorMessage(next, supplierMessage);
          next = applied.lot;
          draftReply = applied.reply;
          recorded = true;
          return { draftReply: applied.reply, lot: lotSnapshot(applied.lot) };
        },
      }),
    },
    stopWhen: isStepCount(4),
    prompt: supplierMessage,
  });

  if (!recorded) {
    const applied = applyVendorMessage(lot, supplierMessage);
    next = applied.lot;
    draftReply = applied.reply;
  }

  const reply = result.text.trim();
  if (!reply || reply.length > 1200) return { lot: next, reply: draftReply };
  return { lot: next, reply };
}

export async function replyWithSupportBot(
  lot: LotRecord,
  clientMessage: string,
): Promise<{ lot: LotRecord; reply: string } | null> {
  if (!process.env.XAI_API_KEY) return null;

  let next = lot;
  let recorded = false;
  let draftReply = "";

  const result = await generateText({
    model: xai(MODEL_ID),
    system: [
      "You are the Grok bot in FleekFlow client support.",
      "Call record_client_message once, then answer the client.",
      "The tool is the only source of the case. Do not add defects, quantities, sizes, or prices that the tool did not return.",
      "Do not decide a refund. Do not say a refund is approved, refused, or owed.",
      "Do not mark the supplier as verified. Do not treat a photo as proof of the whole lot.",
      "If draftReply asks one question, ask that same question and no other.",
      "Write in Portuguese when the client wrote in Portuguese. Otherwise write in English.",
      "Two to four short sentences. No markdown.",
    ].join(" "),
    tools: {
      record_client_message: tool({
        description:
          "Save the client support message. Records the order, the difference, the five-day window, and checklist photos only when those facts appear. Call this once before replying.",
        inputSchema: z.object({
          ready: z.boolean().describe("True once you have read the client message."),
        }),
        execute: async () => {
          const applied = applySupportMessage(next, clientMessage);
          next = applied.lot;
          draftReply = applied.reply;
          recorded = true;
          return {
            draftReply: applied.reply,
            order: applied.lot.buyerReport?.orderNumber ?? null,
            issues: applied.lot.buyerReport?.issues ?? "",
            photoCount: applied.lot.buyerReport?.photoCount ?? 0,
            reviewRequested: applied.lot.buyerReport?.reviewRequested === true,
          };
        },
      }),
    },
    stopWhen: isStepCount(4),
    prompt: clientMessage,
  });

  if (!recorded) {
    const applied = applySupportMessage(lot, clientMessage);
    next = applied.lot;
    draftReply = applied.reply;
  }

  const reply = result.text.trim();
  const decidesRefund = /refund is (approved|due|owed|refused)|reembolso (aprovado|devido|recusado)|approve the refund/i.test(
    reply,
  );
  if (!reply || reply.length > 1200 || decidesRefund) return { lot: next, reply: draftReply };
  return { lot: next, reply };
}
