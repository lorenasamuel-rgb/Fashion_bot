import { after } from "next/server";
import { handleWassistMessage, verifyWassistSignature, type WassistInbound } from "@/lib/wassist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const raw = await request.text();
  const secret = process.env.WASSIST_WEBHOOK_SECRET;
  const header = request.headers.get("x-wassist-signature") ?? "";
  if (!secret || !verifyWassistSignature(raw, header, secret)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: WassistInbound;
  try {
    event = JSON.parse(raw) as WassistInbound;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event === "subscription.message.received") {
    after(() =>
      handleWassistMessage(event).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Wassist handler failed";
        console.error(message);
      }),
    );
  }

  return Response.json({ ok: true });
}
