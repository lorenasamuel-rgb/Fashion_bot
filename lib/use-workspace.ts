"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addPhoto,
  applyVendorMessage,
  confirmRecord,
  isReady,
  openingAgentMessage,
  subtotal,
  suggestedLine,
} from "@/lib/agent";
import { buildClaim } from "@/lib/claim";
import { addSupportPhoto, applySupportMessage, isClientComplaint, openingSupportMessage, suggestedSupportLine } from "@/lib/support";
import {
  createEmptyLot,
  DEMO_MISMATCH,
  DEMO_ORDER_NUMBER,
  type BuyerReport,
  type ChatMessage,
  type LotRecord,
  type PublishedLot,
} from "@/lib/types";

export type WorkspaceMode = "upload" | "buyer" | "review";

type SupportHandoff = {
  id: string;
  email: string;
  subject: string;
  messages: ChatMessage[];
};

export function useWorkspace(channel: "browser" | "whatsapp" = "browser") {
  const lotPath = channel === "whatsapp" ? "/api/lot?channel=whatsapp" : "/api/lot";
  const [lot, setLot] = useState<LotRecord>(() => createEmptyLot("00000000-0000-4000-8000-000000000000"));
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "open", role: "agent", text: openingAgentMessage() },
  ]);
  const [supportMessages, setSupportMessages] = useState<ChatMessage[]>([
    { id: "support-open", role: "agent", text: openingSupportMessage() },
  ]);
  const [draft, setDraft] = useState("");
  const [supportDraft, setSupportDraft] = useState("");
  const [mode, setMode] = useState<WorkspaceMode>("upload");
  const [copied, setCopied] = useState(false);
  const [listings, setListings] = useState<PublishedLot[]>([]);
  const [sending, setSending] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [stored, setStored] = useState(true);
  const [voice, setVoice] = useState<"grok" | "rules" | null>(null);
  const [supportHandoff, setSupportHandoff] = useState<SupportHandoff | null>(null);
  const serverLot = useRef("");
  const sendingRef = useRef(false);

  function applyServer(data: { lot?: LotRecord; messages?: ChatMessage[]; listings?: PublishedLot[] }) {
    if (data.messages && data.messages.length > 0) setMessages(data.messages);
    if (data.listings) setListings(data.listings);
    if (!data.lot) return;
    setLot((current) => {
      const incoming = JSON.stringify(data.lot);
      const fromMessages = channel === "whatsapp";
      const untouched = fromMessages || serverLot.current === "" || JSON.stringify(current) === serverLot.current;
      if (!untouched) return current;
      serverLot.current = incoming;
      return data.lot as LotRecord;
    });
  }

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  useEffect(() => {
    let cancel = false;
    fetch(lotPath)
      .then((response) => response.json())
      .then((data: { lot?: LotRecord; messages?: ChatMessage[]; listings?: PublishedLot[] }) => {
        if (cancel) return;
        applyServer(data);
        setHydrated(true);
      })
      .catch(() => {
        if (!cancel) setHydrated(true);
      });
    return () => {
      cancel = true;
    };
  }, [lotPath]);

  useEffect(() => {
    if (channel !== "whatsapp" || !hydrated) return;
    const handle = window.setInterval(() => {
      if (sendingRef.current) return;
      void fetch(lotPath)
        .then((response) => response.json())
        .then((data: { lot?: LotRecord; messages?: ChatMessage[]; listings?: PublishedLot[] }) => applyServer(data))
        .catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(handle);
  }, [channel, hydrated, lotPath]);

  useEffect(() => {
    if (!hydrated || channel === "whatsapp") return;
    const handle = window.setTimeout(() => {
      void fetch("/api/lot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot }),
      }).then((response) => setStored(response.ok));
    }, 400);
    return () => window.clearTimeout(handle);
  }, [channel, hydrated, lot]);

  const suggestion = suggestedLine(lot);
  const supportSuggestion = suggestedSupportLine(lot);
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
    if (isClientComplaint(trimmed)) {
      setDraft("");
      setSending(true);
      try {
        const response = await fetch("/api/vendor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lot, text: trimmed }),
        });
        const data = (await response.json()) as { complaint?: SupportHandoff };
        if (response.ok && data.complaint) setSupportHandoff(data.complaint);
      } finally {
        setSending(false);
      }
      return;
    }
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
      serverLot.current = JSON.stringify(data.lot);
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

  async function sendSupport(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSupportMessages((current) => [...current, { id: crypto.randomUUID(), role: "client", text: trimmed }]);
    setSupportDraft("");
    setSending(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot, text: trimmed }),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error("support route failed");
      const data = (await response.json()) as {
        lot: LotRecord;
        reply: string;
        source?: "grok" | "rules";
        stored?: boolean;
      };
      setLot(data.lot);
      setSupportMessages((current) => [...current, { id: crypto.randomUUID(), role: "agent", text: data.reply }]);
      setStored(data.stored !== false);
      setVoice(data.source === "grok" ? "grok" : "rules");
      if (data.lot.buyerReport?.reviewRequested && data.lot.published) setMode("review");
    } catch {
      const result = applySupportMessage(lot, trimmed);
      setLot(result.lot);
      setSupportMessages((current) => [...current, { id: crypto.randomUUID(), role: "agent", text: result.reply }]);
      setVoice("rules");
      if (result.lot.buyerReport?.reviewRequested && result.lot.published) setMode("review");
    } finally {
      setSending(false);
    }
  }

  function attachSupport() {
    const result = addSupportPhoto(lot);
    setLot(result.lot);
    setSupportMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "client", text: "Photo attached." },
      { id: crypto.randomUUID(), role: "agent", text: result.reply },
    ]);
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
    setSupportDraft("");
    setSupportMessages([{ id: "support-open", role: "agent", text: openingSupportMessage() }]);
    setMode("upload");
    setCopied(false);
    setVoice(null);
    const response = await fetch("/api/lot", { method: "DELETE" });
    if (!response.ok) return;
    const data = (await response.json()) as { lot: LotRecord; messages: ChatMessage[]; listings?: PublishedLot[] };
    setLot(data.lot);
    serverLot.current = JSON.stringify(data.lot);
    setMessages(data.messages);
    setListings(data.listings ?? []);
  }

  return {
    lot,
    setLot,
    messages,
    supportMessages,
    draft,
    setDraft,
    supportDraft,
    setSupportDraft,
    mode,
    setMode,
    copied,
    listings,
    sending,
    hydrated,
    stored,
    voice,
    suggestion,
    supportSuggestion,
    ready,
    total,
    claim,
    send,
    sendSupport,
    attach,
    attachSupport,
    confirm,
    addProduct,
    useMismatch,
    updateReport,
    copyClaim,
    reset,
    supportHandoff,
  };
}
