import { createHmac, timingSafeEqual } from "crypto";

export function verifyWassistSignature(raw: string, header: string, secret: string, now = Date.now()): boolean {
  const parts = new Map<string, string>();
  for (const piece of header.split(",")) {
    const index = piece.indexOf("=");
    if (index === -1) continue;
    parts.set(piece.slice(0, index).trim(), piece.slice(index + 1).trim());
  }
  const timestamp = parts.get("t");
  const received = parts.get("v1");
  if (!timestamp || !received) return false;
  const age = Math.abs(now / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.`).update(raw).digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
