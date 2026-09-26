import { placeOrder } from "@/lib/agent";
import { ensureSession, saveLot } from "@/lib/store";
import type { LotRecord } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { lot?: LotRecord };
  try {
    body = (await request.json()) as { lot?: LotRecord };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.lot?.productId) {
    return Response.json({ error: "Missing lot" }, { status: 400 });
  }

  const placed = placeOrder(body.lot);
  if (placed.error || !placed.lot.order?.placed) {
    return Response.json(
      { error: placed.error ?? "This lot is not purchasable until the supplier confirms it.", lot: placed.lot },
      { status: 409 },
    );
  }

  try {
    const sessionId = await ensureSession();
    await saveLot(sessionId, placed.lot);
  } catch {
    return Response.json({ lot: placed.lot, stored: false });
  }

  return Response.json({ lot: placed.lot, stored: true });
}
