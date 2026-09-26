import { replyWithSupportBot } from "@/lib/grok";
import { applySupportMessage } from "@/lib/support";
import { ensureSession, saveLot } from "@/lib/store";
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
    const voiced = await Promise.race([
      replyWithSupportBot(body.lot, body.text),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
    ]);
    if (voiced) {
      result = voiced;
      source = "grok";
    } else {
      result = applySupportMessage(body.lot, body.text);
    }
  } catch {
    result = applySupportMessage(body.lot, body.text);
  }

  try {
    const sessionId = await ensureSession();
    await saveLot(sessionId, result.lot);
  } catch {
    return Response.json({ lot: result.lot, reply: result.reply, source, stored: false });
  }

  return Response.json({ lot: result.lot, reply: result.reply, source, stored: true });
}
