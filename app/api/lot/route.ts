import { moveSupportMessages } from "@/lib/complaints";
import {
  ensureSession,
  loadWorkspace,
  openWhatsappSession,
  resetWorkspace,
  saveLot,
  saveMessages,
  syncListingFromSupplierMessages,
} from "@/lib/store";
import type { ChatMessage, LotRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const channel = new URL(request.url).searchParams.get("channel");
    const sessionId = channel === "whatsapp" ? await openWhatsappSession() : await ensureSession();
    if (channel === "whatsapp") {
      await moveSupportMessages(sessionId);
      await syncListingFromSupplierMessages(sessionId);
    }
    const workspace = await loadWorkspace(sessionId);
    return Response.json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load the lot";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: { lot?: LotRecord; messages?: ChatMessage[] };
  try {
    body = (await request.json()) as { lot?: LotRecord; messages?: ChatMessage[] };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.lot?.productId) {
    return Response.json({ error: "Missing lot" }, { status: 400 });
  }

  try {
    const sessionId = await ensureSession();
    await saveLot(sessionId, body.lot);
    if (body.messages?.length) await saveMessages(sessionId, body.lot.productId, body.messages);
    const workspace = await loadWorkspace(sessionId);
    return Response.json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save the lot";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const sessionId = await ensureSession();
    const workspace = await resetWorkspace(sessionId);
    return Response.json(workspace);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reset the lot";
    return Response.json({ error: message }, { status: 500 });
  }
}
