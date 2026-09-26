import { addPhoto, applyVendorMessage } from "./agent";
import { receiveComplaintEmail } from "./complaints";
import { replyWithGrokBot } from "./grok";
import { isClientComplaint } from "./support";
import { hasMessage, loadWorkspace, saveLot, saveMessages, sessionForPhone } from "./store";
import type { LotRecord } from "./types";
import { verifyWassistSignature } from "./wassist-signature";

export { verifyWassistSignature };

const REPLY_URL = "https://backend.wassist.app/api/v1/conversations";

export interface WassistInbound {
  event?: string;
  conversationId?: string;
  contact?: { phoneNumber?: string; name?: string };
  message?: {
    id?: string;
    body?: string | null;
    media?: Array<{ url?: string }>;
  };
}

async function answerSupplier(lot: LotRecord, text: string) {
  try {
    const voiced = await replyWithGrokBot(lot, text);
    if (voiced) return voiced;
  } catch {
    // The record still updates from the supplier message.
  }
  return applyVendorMessage(lot, text);
}

export async function handleWassistMessage(event: WassistInbound): Promise<void> {
  const messageId = event.message?.id;
  const phone = event.contact?.phoneNumber;
  const conversationId = event.conversationId;
  if (!messageId || !phone || !conversationId) return;
  if (await hasMessage(messageId)) return;

  const text = event.message?.body?.trim() ?? "";
  const hasMedia = (event.message?.media?.length ?? 0) > 0;
  if (!text && !hasMedia) return;

  if (text && isClientComplaint(text)) {
    const thread = await receiveComplaintEmail({
      email: phone.startsWith("+") ? phone : `+${phone.replace(/\D/g, "")}`,
      subject: "Client complaint",
      text,
      messageId,
    });
    const reply = thread.messages[thread.messages.length - 1]?.text ?? "";
    if (reply) await sendWassistReply(conversationId, reply);
    return;
  }

  const sessionId = await sessionForPhone(phone);
  let { lot } = await loadWorkspace(sessionId);
  let supplierText = text;
  if (hasMedia) {
    const photo = addPhoto(lot);
    lot = photo.lot;
    supplierText = text || "Photo of the shirts attached.";
  }

  const result = await answerSupplier(lot, supplierText);
  await saveLot(sessionId, result.lot);
  await saveMessages(sessionId, result.lot.productId, [
    { id: messageId, role: "vendor", text: supplierText },
    { id: crypto.randomUUID(), role: "agent", text: result.reply },
  ]);
  await sendWassistReply(conversationId, result.reply);
}

async function sendWassistReply(conversationId: string, reply: string) {
  const key = process.env.WASSIST_API_KEY;
  if (!key) throw new Error("Wassist API key is not set");
  const response = await fetch(`${REPLY_URL}/${conversationId}/messages/`, {
    method: "POST",
    headers: {
      "X-API-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "text", text: { body: reply.slice(0, 4000) } }),
  });
  if (!response.ok) {
    throw new Error(`Wassist reply failed with ${response.status}`);
  }
}
