"use client";

import { useState } from "react";
import { RegistrationPhone } from "@/components/registration-phone";
import { SupportChat } from "@/components/support-chat";
import { reviseRecord } from "@/lib/agent";
import { useWorkspace } from "@/lib/use-workspace";

type Channel = "listing" | "support";

export function DemoApp() {
  const {
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
  } = useWorkspace();
  const [channel, setChannel] = useState<Channel>("listing");

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
            <p className="text-[17px] font-semibold tracking-[-0.02em]">FleekFlow.AI</p>
            <div className="flex items-center gap-3 text-[13px] font-medium">
              <button type="button" onClick={() => setMode("buyer")} className={mode === "buyer" ? "text-ink" : "text-secondary"}>
                Buyer
              </button>
              <button type="button" onClick={() => setMode("review")} className={mode === "review" ? "text-ink" : "text-secondary"}>
                Review
              </button>
              <a href="/buy" className="text-secondary">
                Buyer page
              </a>
              <button type="button" onClick={reset} className="text-secondary">
                Reset
              </button>
            </div>
          </div>
          <p className="text-[13px] text-secondary">
            {channel === "support"
              ? stored
                ? voice === "grok"
                  ? "Grok saved the case and replied"
                  : "Client emails. The bot answers each complaint."
                : "The reply is on screen. Supabase did not keep this turn."
              : stored
                ? voice === "grok"
                  ? "Grok saved the message and replied"
                  : "Supplier messages update the listing."
                : "The reply is on screen. Supabase did not keep this turn."}
          </p>
          <div className="mt-2 flex gap-2" role="tablist" aria-label="Grok sessions">
            <button
              type="button"
              role="tab"
              aria-selected={channel === "listing"}
              onClick={() => setChannel("listing")}
              className={`h-7 rounded-full px-3 text-[13px] font-semibold ${channel === "listing" ? "bg-ink text-card" : "text-secondary"}`}
            >
              Listing
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={channel === "support"}
              onClick={() => setChannel("support")}
              className={`h-7 rounded-full px-3 text-[13px] font-semibold ${channel === "support" ? "bg-ink text-card" : "text-secondary"}`}
            >
              Support
            </button>
          </div>
        </header>
        {channel === "support" ? (
          <SupportChat
            density="desk"
            messages={supportMessages}
            sending={sending}
            suggestion={supportSuggestion}
            draft={supportDraft}
            onDraft={setSupportDraft}
            onSend={sendSupport}
            onPhoto={attachSupport}
            busy={sending || !hydrated}
            reviewReady={Boolean(lot.buyerReport?.reviewRequested && lot.published)}
            onOpenReview={() => setMode("review")}
          />
        ) : null}
        <div className={channel === "listing" ? "flex flex-1 flex-col gap-2 overflow-y-auto bg-fill px-3 py-4" : "hidden"}>
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
        {channel === "listing" && suggestion ? (
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
          className={channel === "listing" ? "flex items-center gap-2 border-t border-line/80 bg-card p-3" : "hidden"}
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
