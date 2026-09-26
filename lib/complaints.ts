import { replyWithSupportBot } from "./grok";
import { applySupportMessage, isClientComplaint } from "./support";
import { supabaseAdmin } from "./supabase-admin";
import { createEmptyLot, type BuyerReport, type ChatMessage, type LotRecord } from "./types";

export interface ComplaintThread {
  id: string;
  email: string;
  subject: string;
  messages: ChatMessage[];
  updatedAt: string;
}

function admin() {
  const client = supabaseAdmin();
  if (!client) throw new Error("Supabase is not configured");
  return client;
}

export async function listComplaints(): Promise<ComplaintThread[]> {
  const db = admin();
  const { data: rows, error } = await db
    .from("complaints")
    .select("id, client_email, subject, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  if (!rows?.length) return [];

  const { data: messages, error: messageError } = await db
    .from("complaint_messages")
    .select("id, complaint_id, role, body, created_at")
    .in(
      "complaint_id",
      rows.map((row) => row.id),
    )
    .order("created_at", { ascending: true });
  if (messageError) throw messageError;

  return rows.map((row) => ({
    id: row.id,
    email: row.client_email,
    subject: row.subject,
    updatedAt: row.updated_at,
    messages: (messages ?? [])
      .filter((message) => message.complaint_id === row.id)
      .map((message) => ({
        id: message.id,
        role: message.role === "client" ? ("client" as const) : ("agent" as const),
        text: message.body,
      })),
  }));
}

export async function receiveComplaintEmail(input: {
  email: string;
  subject?: string;
  text: string;
  messageId?: string;
}): Promise<ComplaintThread> {
  const email = input.email.trim();
  const subject = input.subject?.trim() || "(no subject)";
  const text = input.text.trim();
  const digits = email.replace(/\D/g, "");
  if ((!email.includes("@") && digits.length < 8) || !text) throw new Error("Missing email or message");

  const db = admin();
  if (input.messageId) {
    const { data: seen, error: seenError } = await db
      .from("complaint_messages")
      .select("complaint_id")
      .eq("id", input.messageId)
      .maybeSingle();
    if (seenError) throw seenError;
    if (seen?.complaint_id) {
      const threads = await listComplaints();
      const thread = threads.find((item) => item.id === seen.complaint_id);
      if (thread) return thread;
    }
  }

  const { data: existing, error: findError } = await db
    .from("complaints")
    .select("id, subject, report")
    .ilike("client_email", email)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (findError) throw findError;

  let complaintId = existing?.id as string | undefined;
  let report = (existing?.report ?? null) as BuyerReport | null;
  const sameThread = complaintId && (existing?.subject === subject || subject === "(no subject)");
  if (!sameThread) {
    const { data: created, error } = await db
      .from("complaints")
      .insert({ client_email: email, subject })
      .select("id")
      .single();
    if (error) throw error;
    complaintId = created.id;
    report = null;
  }

  const lot: LotRecord = { ...createEmptyLot(), buyerReport: report };
  let result: { lot: LotRecord; reply: string };
  try {
    const voiced = await Promise.race([
      replyWithSupportBot(lot, text),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 12000)),
    ]);
    result = voiced ?? applySupportMessage(lot, text);
  } catch {
    result = applySupportMessage(lot, text);
  }

  const { error: insertError } = await db.from("complaint_messages").insert([
    { id: input.messageId ?? crypto.randomUUID(), complaint_id: complaintId, role: "client", body: text },
    { id: crypto.randomUUID(), complaint_id: complaintId, role: "agent", body: result.reply },
  ]);
  if (insertError) throw insertError;

  const { error: updateError } = await db
    .from("complaints")
    .update({ report: result.lot.buyerReport, subject })
    .eq("id", complaintId);
  if (updateError) throw updateError;

  const threads = await listComplaints();
  const thread = threads.find((item) => item.id === complaintId);
  if (!thread) throw new Error("Complaint was not saved");
  return thread;
}

export async function moveSupportMessages(sessionId: string): Promise<void> {
  const db = admin();
  const { data: session, error: sessionError } = await db.from("sessions").select("phone").eq("id", sessionId).maybeSingle();
  if (sessionError) throw sessionError;
  const contact = session?.phone ? `+${session.phone}` : "";
  if (!contact) return;

  const { data: rows, error } = await db
    .from("messages")
    .select("id, role, body")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  if (error) throw error;

  const list = rows ?? [];
  const drop = new Set<string>();
  for (let index = 0; index < list.length; index += 1) {
    const row = list[index];
    if (row.role !== "vendor" || !isClientComplaint(row.body ?? "")) continue;
    await receiveComplaintEmail({ email: contact, subject: "Client complaint", text: row.body });
    drop.add(row.id);
    const next = list[index + 1];
    if (next?.role === "agent") drop.add(next.id);
  }
  if (drop.size === 0) return;
  const { error: deleteError } = await db.from("messages").delete().in("id", [...drop]);
  if (deleteError) throw deleteError;
}
