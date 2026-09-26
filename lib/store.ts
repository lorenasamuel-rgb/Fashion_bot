import { cookies } from "next/headers";
import { openingAgentMessage } from "./agent";
import { supabaseAdmin } from "./supabase-admin";
import { createEmptyLot, type ChatMessage, type LotRecord, type PublishedLot } from "./types";

const SESSION_COOKIE = "fleek_session";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface Workspace {
  lot: LotRecord;
  messages: ChatMessage[];
  listings: PublishedLot[];
}

function admin() {
  const client = supabaseAdmin();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

function fieldStatus(lot: LotRecord) {
  return {
    shopName: lot.shopName.status,
    country: lot.country.status,
    title: lot.title.status,
    description: lot.description.status,
    category: lot.category.status,
    audience: lot.audience.status,
    color: lot.color.status,
    brand: lot.brand.status,
    quantity: lot.quantity.status,
    unitPrice: lot.unitPrice.status,
    sizes: lot.sizes.status,
    defects: lot.defects.status,
    grade: lot.grade.status,
    shipping: lot.shipping.status,
    duties: lot.duties.status,
  };
}

export async function ensureSession(): Promise<string> {
  const jar = await cookies();
  const current = jar.get(SESSION_COOKIE)?.value;
  const db = admin();
  if (current && UUID.test(current)) {
    const { data, error } = await db.from("sessions").select("id").eq("id", current).maybeSingle();
    if (error) throw error;
    if (data) return current;
  }

  const id = crypto.randomUUID();
  const { error } = await db.from("sessions").insert({ id, role: "supplier" });
  if (error) throw error;
  jar.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return id;
}

export async function saveLot(sessionId: string, lot: LotRecord) {
  const db = admin();
  const { data: owner, error: ownerError } = await db
    .from("lots")
    .select("session_id")
    .eq("id", lot.productId)
    .maybeSingle();
  if (ownerError) throw ownerError;
  if (owner && owner.session_id !== sessionId) {
    throw new Error("This lot belongs to another session");
  }

  const { error } = await db.from("lots").upsert({
    id: lot.productId,
    session_id: sessionId,
    shop_name: lot.shopName.value,
    country: lot.country.value,
    quantity: lot.quantity.value,
    unit_price: lot.unitPrice.value,
    currency: "GBP",
    sizes: lot.sizes.value,
    defects: lot.defects.value,
    quantity_corrected: lot.quantityCorrected,
    quantity_stated: lot.quantityConflict?.stated ?? null,
    quantity_counted: lot.quantityConflict?.counted ?? null,
    field_status: fieldStatus(lot),
    record: lot,
    published_at: lot.published?.at ?? null,
    published: lot.published,
    buyer_report: lot.buyerReport,
  });
  if (error) throw error;
}

export async function saveMessages(sessionId: string, lotId: string, messages: ChatMessage[]) {
  if (messages.length === 0) return;
  const db = admin();
  const { error } = await db.from("messages").upsert(
    messages.map((message) => ({
      id: message.id,
      session_id: sessionId,
      lot_id: lotId,
      role: message.role,
      body: message.text,
    })),
    { onConflict: "id" },
  );
  if (error) throw error;
}

export async function loadWorkspace(sessionId: string): Promise<Workspace> {
  const db = admin();
  const { data: rows, error } = await db
    .from("lots")
    .select("record, published")
    .eq("session_id", sessionId)
    .order("updated_at", { ascending: false });
  if (error) throw error;

  let lot: LotRecord;
  let listings: PublishedLot[];
  if (!rows || rows.length === 0) {
    lot = createEmptyLot();
    await saveLot(sessionId, lot);
    await saveMessages(sessionId, lot.productId, [
      { id: "open", role: "agent", text: openingAgentMessage() },
    ]);
    listings = [];
  } else {
    lot = rows[0].record as LotRecord;
    listings = rows.flatMap((row) => (row.published ? [row.published as PublishedLot] : []));
  }

  const { data: stored, error: messageError } = await db
    .from("messages")
    .select("id, role, body")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (messageError) throw messageError;

  const messages: ChatMessage[] = (stored ?? []).map((message) => ({
    id: message.id,
    role: message.role === "vendor" ? "vendor" : "agent",
    text: message.body,
  }));

  return { lot, messages, listings };
}

export async function resetWorkspace(sessionId: string): Promise<Workspace> {
  const db = admin();
  const { error } = await db.from("lots").delete().eq("session_id", sessionId);
  if (error) throw error;
  return loadWorkspace(sessionId);
}
