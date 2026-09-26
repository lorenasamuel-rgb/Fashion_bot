import { applyVendorMessage } from "@/lib/agent";
import { replyWithGrokBot } from "@/lib/grok";
import { ensureSession, saveLot, saveMessages } from "@/lib/store";
import type { LotRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  let body: { lot?: LotRecord; text?: string };
  try {
    body = (await request.json()) as { lot?: LotRecord; text?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.lot || typeof body.text !== "string" || !body.text.trim()) {
    return Response.json({ error: "Missing lot or text" }, { status: 400 });
  }

  let result: { lot: LotRecord; reply: string };
  let source: "grok" | "rules" = "rules";
  try {
    const voiced = await replyWithGrokBot(body.lot, body.text);
    if (voiced) {
      result = voiced;
      source = "grok";
    } else {
      result = applyVendorMessage(body.lot, body.text);
    }
  } catch {
    result = applyVendorMessage(body.lot, body.text);
  }

  const vendorMessage = { id: crypto.randomUUID(), role: "vendor" as const, text: body.text.trim() };
  const agentMessage = { id: crypto.randomUUID(), role: "agent" as const, text: result.reply };
  try {
    const sessionId = await ensureSession();
    await saveLot(sessionId, result.lot);
    await saveMessages(sessionId, result.lot.productId, [vendorMessage, agentMessage]);
  } catch {
    return Response.json({ lot: result.lot, reply: result.reply, source, stored: false });
  }

  return Response.json({
    lot: result.lot,
    reply: result.reply,
    source,
    stored: true,
    messages: [vendorMessage, agentMessage],
  });
}
