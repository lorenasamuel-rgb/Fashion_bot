"use client";

import { useEffect, useMemo, useState } from "react";
import { RegistrationPhone } from "@/components/registration-phone";
import {
  addPhoto,
  applyVendorMessage,
  confirmRecord,
  isReady,
  openingAgentMessage,
  reviseRecord,
  subtotal,
  suggestedLine,
} from "@/lib/agent";
import { buildClaim } from "@/lib/claim";
import {
  createEmptyLot,
  DEMO_MISMATCH,
  DEMO_ORDER_NUMBER,
  type BuyerReport,
  type ChatMessage,
  type LotRecord,
  type PublishedLot,
} from "@/lib/types";

type Mode = "upload" | "buyer" | "review";

export function DemoApp() {
  const [lot, setLot] = useState<LotRecord>(() => createEmptyLot("00000000-0000-4000-8000-000000000000"));
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "open", role: "agent", text: openingAgentMessage() },
  ]);
  const [draft, setDraft] = useState("");
  const [mode, setMode] = useState<Mode>("upload");
  const [copied, setCopied] = useState(false);
  const [listings, setListings] = useState<PublishedLot[]>([]);
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [stored, setStored] = useState(true);
  const [voice, setVoice] = useState<"grok" | "rules" | null>(null);

  useEffect(() => {
    let cancel = false;
    fetch("/api/lot")
      .then((response) => response.json())
      .then((data: { lot?: LotRecord; messages?: ChatMessage[]; listings?: PublishedLot[] }) => {
        if (cancel) return;
        if (data.lot) setLot(data.lot);
        if (data.messages && data.messages.length > 0) setMessages(data.messages);
        setListings(data.listings ?? []);
        setHydrated(true);
      })
      .catch(() => {
        if (!cancel) setHydrated(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const handle = window.setTimeout(() => {
      void fetch("/api/lot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot }),
      }).then((response) => setStored(response.ok));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [hydrated, lot]);

  const suggestion = suggestedLine(lot);
  const ready = isReady(lot);
  const total = subtotal(lot);

  const claim = useMemo(() => {
    if (!lot.published || !lot.buyerReport) return "";
    return buildClaim(lot.published, lot.buyerReport);
  }, [lot.published, lot.buyerReport]);

  function push(role: ChatMessage["role"], text: string) {
    const message = { id: crypto.randomUUID(), role, text };
    setMessages((current) => [...current, message]);
    return message;
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    push("vendor", trimmed);
    setDraft("");
    setSending(true);
    try {
      const response = await fetch("/api/vendor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot, text: trimmed }),
      });
      if (!response.ok) throw new Error("vendor route failed");
      const data = (await response.json()) as {
        lot: LotRecord;
        reply: string;
        source?: "grok" | "rules";
        stored?: boolean;
      };
      setLot(data.lot);
      push("agent", data.reply);
      setStored(data.stored !== false);
      setVoice(data.source === "grok" ? "grok" : "rules");
    } catch {
      const result = applyVendorMessage(lot, trimmed);
      setLot(result.lot);
      push("agent", result.reply);
      setVoice("rules");
    } finally {
      setSending(false);
    }
  }

  async function attach() {
    const vendor = push("vendor", "Photo of the shirts attached.");
    const result = addPhoto(lot);
    setLot(result.lot);
    const agent = push("agent", result.reply);
    await fetch("/api/lot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lot: result.lot, messages: [vendor, agent] }),
    });
  }

  function confirm() {
    const next = confirmRecord(lot);
    if (!next.published) return;
    const published = next.published;
    setLot(next);
    setListings((current) => {
      const index = current.findIndex((item) => item.productId === published.productId);
      if (index === -1) return [...current, published];
      const copy = current.slice();
      copy[index] = published;
      return copy;
    });
    const shop = published.shopName || "The store";
    const agent = push(
      "agent",
      `${shop} now holds this product. The same store keeps every listing the supplier confirms. Anything not stated stays unknown.`,
    );
    void fetch("/api/lot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lot: next, messages: [agent] }),
    });
  }

  function addProduct() {
    const shop = lot.shopName.value;
    const country = lot.country.value;
    const fresh = createEmptyLot();
    const next = {
      ...fresh,
      shopName: shop ? { value: shop, status: "confirmed" as const } : fresh.shopName,
      country: country ? { value: country, status: "confirmed" as const } : fresh.country,
    };
    setLot(next);
    setMode("upload");
    const agent = push(
      "agent",
      `${shop ?? "The store"} stays open. Describe the next product. Quantity, sizes, and defects start empty.`,
    );
    void fetch("/api/lot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lot: next, messages: [agent] }),
    });
  }

  function useMismatch() {
    if (!lot.published) return;
    const report: BuyerReport = {
      orderNumber: DEMO_ORDER_NUMBER,
      receivedWithinFiveDays: true,
      issues: DEMO_MISMATCH,
      photoCount: 3,
    };
    setLot({ ...lot, buyerReport: report });
    setMode("review");
  }

  function updateReport(patch: Partial<BuyerReport>) {
    const current = lot.buyerReport ?? {
      orderNumber: DEMO_ORDER_NUMBER,
      receivedWithinFiveDays: true,
      issues: "",
      photoCount: 0,
    };
    setLot({ ...lot, buyerReport: { ...current, ...patch } });
  }

  async function copyClaim() {
    if (!claim) return;
    await navigator.clipboard.writeText(claim);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function reset() {
    setDraft("");
    setMode("upload");
    setCopied(false);
    setVoice(null);
    const response = await fetch("/api/lot", { method: "DELETE" });
    if (!response.ok) return;
    const data = (await response.json()) as { lot: LotRecord; messages: ChatMessage[]; listings?: PublishedLot[] };
    setLot(data.lot);
    setMessages(data.messages);
    setListings(data.listings ?? []);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-3 py-4 sm:px-6 sm:py-6 lg:flex-row lg:items-start lg:justify-center">
      <RegistrationPhone
        key={lot.productId}
        lot={lot}
        listings={listings}
        total={total}
        ready={ready}
        mode={mode}
        claim={claim}
        copied={copied}
        onConfirm={confirm}
        onAddProduct={addProduct}
        onRevise={() => setLot(reviseRecord(lot))}
        onUseMismatch={useMismatch}
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

      <section className="flex min-h-[28rem] w-full max-w-[402px] flex-col overflow-hidden rounded-[28px] border border-black/8 bg-card shadow-[0_22px_50px_rgba(29,29,31,0.12)] lg:min-h-[760px] lg:max-w-[380px]">
        <header className="border-b border-line/80 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[17px] font-semibold tracking-[-0.02em]">Grok</p>
            <div className="flex items-center gap-3 text-[13px] font-medium">
              <button type="button" onClick={() => setMode("buyer")} className={mode === "buyer" ? "text-ink" : "text-secondary"}>
                Buyer
              </button>
              <button type="button" onClick={() => setMode("review")} className={mode === "review" ? "text-ink" : "text-secondary"}>
                Review
              </button>
              <button type="button" onClick={reset} className="text-secondary">
                Reset
              </button>
            </div>
          </div>
          <p className="text-[13px] text-secondary">
            {stored
              ? voice === "grok"
                ? "Grok saved the message and replied"
                : "Wassist channel. Grok fills the listing."
              : "The reply is on screen. Supabase did not keep this turn."}
          </p>
        </header>
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto bg-fill px-3 py-4">
          {messages.map((message) => (
            <p
              key={message.id}
              className={`max-w-[88%] rounded-[18px] px-3.5 py-2 text-[15px] leading-5 tracking-[-0.01em] ${
                message.role === "vendor" ? "ml-auto bg-fleek text-ink" : "bg-card text-ink shadow-[0_1px_2px_rgba(29,29,31,0.06)]"
              }`}
            >
              {message.text}
            </p>
          ))}
          {sending ? (
            <p className="max-w-[88%] rounded-[18px] bg-card px-3.5 py-2 text-[15px] leading-5 text-secondary shadow-[0_1px_2px_rgba(29,29,31,0.06)]">
              Writing the reply…
            </p>
          ) : null}
        </div>
        {suggestion ? (
          <div className="border-t border-line/80 bg-card px-3 py-3">
            <p className="text-[12px] font-medium text-secondary">Suggested reply</p>
            <p className="mt-1 text-[15px] leading-5">{suggestion}</p>
            <button
              type="button"
              onClick={() => send(suggestion)}
              disabled={sending || !hydrated}
              className="mt-2 h-9 rounded-full bg-ink px-3 text-[13px] font-semibold text-card disabled:opacity-60"
            >
              Send this line
            </button>
          </div>
        ) : null}
        <form
          className="flex items-center gap-2 border-t border-line/80 bg-card p-3"
          onSubmit={(event) => {
            event.preventDefault();
            send(draft);
          }}
        >
          <label className="sr-only" htmlFor="vendor-message">
            Message the agent
          </label>
          <input
            id="vendor-message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Describe the lot"
            disabled={sending || !hydrated}
            className="h-11 min-w-0 flex-1 rounded-full border border-line bg-fill px-4 text-[15px] outline-none placeholder:text-secondary disabled:opacity-60"
          />
          <button type="button" onClick={attach} disabled={sending || !hydrated} className="h-11 rounded-full border border-line px-3 text-[13px] font-medium disabled:opacity-60">
            Photo
          </button>
          <button type="submit" disabled={sending || !hydrated} className="h-11 rounded-full bg-fleek px-4 text-[15px] font-semibold text-ink disabled:opacity-60">
            Send
          </button>
        </form>
      </section>
    </main>
  );
}
