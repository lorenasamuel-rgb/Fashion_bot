"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";

export function SupportChat({
  messages,
  sending,
  suggestion,
  draft,
  onDraft,
  onSend,
  onPhoto,
  busy,
  reviewReady,
  onOpenReview,
  density,
}: {
  messages: ChatMessage[];
  sending: boolean;
  suggestion: string | null;
  draft: string;
  onDraft: (value: string) => void;
  onSend: (text: string) => void;
  onPhoto: () => void;
  busy: boolean;
  reviewReady: boolean;
  onOpenReview: () => void;
  density: "phone" | "desk";
}) {
  const threadEnd = useRef<HTMLDivElement>(null);
  const phone = density === "phone";

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: "end" });
  }, [messages, sending, suggestion]);

  return (
    <>
      <div className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-fill px-3 py-4 ${phone ? "" : "flex-1"}`}>
        {messages.map((message) => (
          <p
            key={message.id}
            className={`max-w-[88%] rounded-[18px] px-3.5 py-2 leading-5 tracking-[-0.01em] ${
              phone ? "text-[16px]" : "text-[15px]"
            } ${
              message.role === "agent"
                ? "bg-card text-ink shadow-[0_1px_2px_rgba(29,29,31,0.06)]"
                : "ml-auto bg-fleek text-ink"
            }`}
          >
            {message.text}
          </p>
        ))}
        {sending ? (
          <p
            className={`max-w-[88%] rounded-[18px] bg-card px-3.5 py-2 leading-5 text-secondary shadow-[0_1px_2px_rgba(29,29,31,0.06)] ${
              phone ? "text-[16px]" : "text-[15px]"
            }`}
          >
            Writing the reply…
          </p>
        ) : null}
        <div ref={threadEnd} />
      </div>

      {suggestion ? (
        <div className={`border-t border-line/80 bg-card ${phone ? "px-4 py-3" : "px-3 py-3"}`}>
          <p className="text-[12px] font-medium text-secondary">Suggested reply</p>
          <p className={`mt-1 leading-5 ${phone ? "line-clamp-3 text-[16px]" : "text-[15px]"}`}>{suggestion}</p>
          <button
            type="button"
            onClick={() => onSend(suggestion)}
            disabled={busy}
            className={`mt-2 rounded-full bg-ink font-semibold text-card disabled:opacity-60 ${
              phone ? "h-11 px-4 text-[15px]" : "h-9 px-3 text-[13px]"
            }`}
          >
            Send this line
          </button>
        </div>
      ) : null}

      {reviewReady ? (
        <div className={`border-t border-line/80 bg-card ${phone ? "px-4 py-3" : "px-3 py-3"}`}>
          <p className={`leading-5 ${phone ? "text-[16px]" : "text-[15px]"}`}>
            The review draft is ready. A person decides the refund.
          </p>
          <button
            type="button"
            onClick={onOpenReview}
            className={`mt-2 rounded-full bg-fleek font-semibold text-ink ${phone ? "h-11 px-4 text-[15px]" : "h-9 px-3 text-[13px]"}`}
          >
            Open review draft
          </button>
        </div>
      ) : null}

      <form
        className={`flex items-center gap-2 border-t border-line/80 bg-card ${phone ? "px-3 py-2" : "p-3"}`}
        onSubmit={(event) => {
          event.preventDefault();
          onSend(draft);
        }}
      >
        <label className="sr-only" htmlFor={phone ? "support-message" : "desk-support-message"}>
          Message support
        </label>
        <input
          id={phone ? "support-message" : "desk-support-message"}
          value={draft}
          onChange={(event) => onDraft(event.target.value)}
          placeholder="Describe the problem"
          enterKeyHint="send"
          autoComplete="off"
          disabled={busy}
          className={`min-w-0 flex-1 rounded-full border border-line bg-fill px-4 outline-none placeholder:text-secondary disabled:opacity-60 ${
            phone ? "h-12 text-[16px]" : "h-11 text-[15px]"
          }`}
        />
        <button
          type="button"
          onClick={onPhoto}
          disabled={busy}
          className={`rounded-full border border-line text-[13px] font-medium disabled:opacity-60 ${phone ? "h-12 px-3" : "h-11 px-3"}`}
        >
          Photo
        </button>
        <button
          type="submit"
          disabled={busy}
          className={`rounded-full bg-fleek font-semibold text-ink disabled:opacity-60 ${
            phone ? "h-12 px-4 text-[16px]" : "h-11 px-4 text-[15px]"
          }`}
        >
          Send
        </button>
      </form>
    </>
  );
}
