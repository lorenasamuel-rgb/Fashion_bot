"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { RegistrationPhone } from "@/components/registration-phone";
import { reviseRecord } from "@/lib/agent";
import { GROK_CASE_BOT_URL } from "@/lib/support";
import type { ChatMessage } from "@/lib/types";
import { useWorkspace } from "@/lib/use-workspace";

type ComplaintThread = {
  id: string;
  email: string;
  subject: string;
  messages: ChatMessage[];
  updatedAt: string;
};

type Panel = "sheet" | "messages" | "support";

export function PhoneApp() {
  const {
    lot,
    setLot,
    messages,
    draft,
    setDraft,
    mode,
    setMode,
    copied,
    listings,
    sending,
    hydrated,
    stored,
    voice,
    suggestion,
    ready,
    total,
    claim,
    send,
    attach,
    confirm,
    addProduct,
    useMismatch,
    updateReport,
    copyClaim,
    reset,
    supportHandoff,
  } = useWorkspace("whatsapp");
  const [panel, setPanel] = useState<Panel>("messages");
  const [complaints, setComplaints] = useState<ComplaintThread[]>([]);
  const [openComplaintId, setOpenComplaintId] = useState<string | null>(null);
  const [complaintEmail, setComplaintEmail] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [complaintSending, setComplaintSending] = useState(false);
  const threadEnd = useRef<HTMLDivElement>(null);
  const openComplaint = complaints.find((item) => item.id === openComplaintId) ?? null;
  const busy = sending || !hydrated;
  const waitingOnSheet = ready && !lot.published;

  useEffect(() => {
    if (!supportHandoff) return;
    setComplaints((current) => [
      { ...supportHandoff, updatedAt: new Date().toISOString() },
      ...current.filter((item) => item.id !== supportHandoff.id),
    ]);
    setOpenComplaintId(supportHandoff.id);
    setPanel("support");
  }, [supportHandoff]);

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: "end" });
  }, [messages, sending, suggestion, panel, openComplaint?.messages.length]);

  useEffect(() => {
    let cancel = false;
    async function loadComplaints() {
      try {
        const response = await fetch("/api/complaints");
        if (!response.ok) return;
        const data = (await response.json()) as { complaints?: ComplaintThread[] };
        if (!cancel) setComplaints(data.complaints ?? []);
      } catch {
        // The inbox stays as it was.
      }
    }
    void loadComplaints();
    const handle = window.setInterval(() => void loadComplaints(), 4000);
    return () => {
      cancel = true;
      window.clearInterval(handle);
    };
  }, []);

  async function sendTestEmail(event: FormEvent) {
    event.preventDefault();
    const email = complaintEmail.trim();
    const text = complaintText.trim();
    if (!email.includes("@") || !text || complaintSending) return;
    const order = text.match(/FLK-[A-Z0-9-]+/i);
    setComplaintSending(true);
    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          subject: order ? `Order ${order[0].toUpperCase()}` : "Client complaint",
          text,
        }),
      });
      const data = (await response.json()) as { complaint?: ComplaintThread };
      if (!response.ok || !data.complaint) return;
      setComplaints((current) => [data.complaint as ComplaintThread, ...current.filter((item) => item.id !== data.complaint?.id)]);
      setOpenComplaintId(data.complaint.id);
      setComplaintText("");
    } finally {
      setComplaintSending(false);
    }
  }

  function confirmListing() {
    confirm();
    setPanel("sheet");
  }

  function startNextProduct() {
    addProduct();
    setPanel("messages");
  }

  function openReview() {
    useMismatch();
    setPanel("sheet");
  }

  return (
    <main className="mx-auto flex h-dvh max-w-lg flex-col bg-canvas pt-[env(safe-area-inset-top)]">
      <div className={panel === "sheet" ? "flex min-h-0 flex-1 flex-col" : "hidden"}>
        <RegistrationPhone
          key={lot.productId}
          frame="screen"
          lot={lot}
          listings={listings}
          total={total}
          ready={ready}
          mode={mode}
          claim={claim}
          copied={copied}
          onConfirm={confirmListing}
          onAddProduct={startNextProduct}
          onRevise={() => setLot(reviseRecord(lot))}
          onUseMismatch={openReview}
          onUpdateReport={updateReport}
          onCopy={copyClaim}
          onMode={setMode}
          onGrade={(grade) =>
            setLot((current) => ({
              ...current,
              grade: current.grade.status === "confirmed" ? current.grade : { value: grade, status: "declared" },
            }))
          }
        />
      </div>

      <section className={panel === "messages" ? "flex min-h-0 flex-1 flex-col bg-card" : "hidden"}>
        <header className="border-b border-line/80 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[17px] font-semibold tracking-[-0.02em]">FleekFlow.AI</p>
            <div className="flex items-center gap-3 text-[13px] font-medium">
              <button type="button" onClick={() => { setMode("buyer"); setPanel("sheet"); }} className="text-secondary">
                Buyer
              </button>
              <button type="button" onClick={() => { setMode("review"); setPanel("sheet"); }} className="text-secondary">
                Review
              </button>
              <button type="button" onClick={() => { reset(); setPanel("messages"); }} className="text-secondary">
                Reset
              </button>
            </div>
          </div>
          <p className="text-[13px] text-secondary">
            {stored
              ? voice === "grok"
                ? "Grok saved the message and replied"
                : "Supplier messages update the listing."
              : "The reply is on screen. Supabase did not keep this turn."}
          </p>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-fill px-3 py-4">
          {messages.map((message) => (
            <p
              key={message.id}
              className={`max-w-[88%] rounded-[18px] px-3.5 py-2 text-[16px] leading-5 tracking-[-0.01em] ${
                message.role === "vendor" ? "ml-auto bg-fleek text-ink" : "bg-card text-ink shadow-[0_1px_2px_rgba(29,29,31,0.06)]"
              }`}
            >
              {message.text}
            </p>
          ))}
          {sending ? (
            <p className="max-w-[88%] rounded-[18px] bg-card px-3.5 py-2 text-[16px] leading-5 text-secondary shadow-[0_1px_2px_rgba(29,29,31,0.06)]">
              Writing the reply…
            </p>
          ) : null}
          <div ref={threadEnd} />
        </div>

        {suggestion ? (
          <div className="border-t border-line/80 bg-card px-4 py-3">
            <p className="text-[12px] font-medium text-secondary">Suggested reply</p>
            <p className="mt-1 line-clamp-3 text-[16px] leading-5">{suggestion}</p>
            <button
              type="button"
              onClick={() => send(suggestion)}
              disabled={busy}
              className="mt-2 h-11 rounded-full bg-ink px-4 text-[15px] font-semibold text-card disabled:opacity-60"
            >
              Send this line
            </button>
          </div>
        ) : null}

        <form
          className="flex items-center gap-2 border-t border-line/80 bg-card px-3 py-2"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <label className="sr-only" htmlFor="phone-message">
            Message the agent
          </label>
          <input
            id="phone-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Describe the lot"
            enterKeyHint="send"
            autoComplete="off"
            disabled={busy}
            className="h-12 min-w-0 flex-1 rounded-full border border-line bg-fill px-4 text-[16px] outline-none placeholder:text-secondary disabled:opacity-60"
          />
          <button type="button" onClick={attach} disabled={busy} className="h-12 rounded-full border border-line px-3 text-[13px] font-medium disabled:opacity-60">
            Photo
          </button>
          <button type="submit" disabled={busy} className="h-12 rounded-full bg-fleek px-4 text-[16px] font-semibold text-ink disabled:opacity-60">
            Send
          </button>
        </form>
      </section>

      <section className={panel === "support" ? "flex min-h-0 flex-1 flex-col bg-card" : "hidden"}>
        <header className="border-b border-line/80 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[17px] font-semibold tracking-[-0.02em]">
              {openComplaint ? openComplaint.email : "Complaints"}
            </p>
            {openComplaint ? (
              <button type="button" onClick={() => setOpenComplaintId(null)} className="text-[13px] font-medium text-secondary">
                All
              </button>
            ) : null}
          </div>
          <p className="text-[13px] text-secondary">
            {openComplaint ? openComplaint.subject : "Client emails. The bot answers each complaint."}
          </p>
          {!openComplaint ? (
            <a
              href={GROK_CASE_BOT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[13px] font-semibold text-ink underline decoration-line underline-offset-[3px]"
            >
              Case bot on Grok
            </a>
          ) : null}
        </header>
        {openComplaint ? (
          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-fill px-3 py-4">
            {openComplaint.messages.map((message) => (
              <p
                key={message.id}
                className={`max-w-[88%] rounded-[18px] px-3.5 py-2 text-[16px] leading-5 tracking-[-0.01em] ${
                  message.role === "client" ? "ml-auto bg-fleek text-ink" : "bg-card text-ink shadow-[0_1px_2px_rgba(29,29,31,0.06)]"
                }`}
              >
                {message.text}
              </p>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="flex flex-1 flex-col justify-center px-6 text-center">
            <p className="text-[17px] font-semibold tracking-[-0.02em]">No complaints yet</p>
            <p className="mt-2 text-[15px] leading-6 text-secondary">
              A client email opens a bot chat here. The bot records what arrived differently. A person decides any refund.
            </p>
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto bg-card">
            {complaints.map((complaint) => {
              const last = complaint.messages[complaint.messages.length - 1];
              return (
                <button
                  key={complaint.id}
                  type="button"
                  onClick={() => setOpenComplaintId(complaint.id)}
                  className="block w-full border-b border-line/80 px-4 py-3 text-left"
                >
                  <p className="text-[15px] font-semibold tracking-[-0.02em]">{complaint.email}</p>
                  <p className="text-[13px] text-secondary">{complaint.subject}</p>
                  {last ? <p className="mt-1 line-clamp-2 text-[15px] leading-5">{last.text}</p> : null}
                </button>
              );
            })}
            <div className="px-4 py-4">
              <button
                type="button"
                onClick={() => {
                  const latest = complaints[0];
                  if (latest) setOpenComplaintId(latest.id);
                }}
                disabled={complaints.length === 0}
                className="h-12 w-full rounded-full bg-ink text-[16px] font-semibold text-card disabled:opacity-60"
              >
                Grok Bot Assist
              </button>
            </div>
          </div>
        )}
        {openComplaint ? null : (
          <form
            className="border-t border-line/80 bg-card px-3 py-3"
            onSubmit={sendTestEmail}
          >
            <p className="px-1 text-[12px] font-medium text-secondary">Test a client email</p>
            <input
              value={complaintEmail}
              onChange={(event) => setComplaintEmail(event.target.value)}
              placeholder="Client email"
              type="email"
              autoComplete="off"
              disabled={complaintSending}
              className="mt-2 h-11 w-full rounded-full border border-line bg-fill px-4 text-[16px] outline-none placeholder:text-secondary disabled:opacity-60"
            />
            <div className="mt-2 flex items-center gap-2">
              <input
                value={complaintText}
                onChange={(event) => setComplaintText(event.target.value)}
                placeholder="What arrived differently"
                disabled={complaintSending}
                className="h-12 min-w-0 flex-1 rounded-full border border-line bg-fill px-4 text-[16px] outline-none placeholder:text-secondary disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={complaintSending || !complaintEmail.includes("@") || !complaintText.trim()}
                className="h-12 rounded-full bg-fleek px-4 text-[16px] font-semibold text-ink disabled:opacity-60"
              >
                {complaintSending ? "Sending" : "Send"}
              </button>
            </div>
          </form>
        )}
      </section>

      <nav className="grid grid-cols-3 border-t border-line/80 bg-card pb-[env(safe-area-inset-bottom)]" aria-label="Phone sections">
        <button
          type="button"
          onClick={() => setPanel("messages")}
          aria-current={panel === "messages" ? "page" : undefined}
          className={`h-14 text-[13px] font-semibold tracking-[-0.01em] ${panel === "messages" ? "text-ink" : "text-secondary"}`}
        >
          Start Here
        </button>
        <button
          type="button"
          onClick={() => setPanel("sheet")}
          aria-current={panel === "sheet" ? "page" : undefined}
          className={`relative h-14 text-[13px] font-semibold tracking-[-0.01em] ${panel === "sheet" ? "text-ink" : "text-secondary"}`}
        >
          Listing
          {waitingOnSheet ? <span className="absolute top-3 ml-1 inline-block h-2 w-2 rounded-full bg-fleek" aria-label="Ready to upload" /> : null}
        </button>
        <button
          type="button"
          onClick={() => setPanel("support")}
          aria-current={panel === "support" ? "page" : undefined}
          className={`h-14 text-[13px] font-semibold tracking-[-0.01em] ${panel === "support" ? "text-ink" : "text-secondary"}`}
        >
          Support
        </button>
      </nav>
    </main>
  );
}
