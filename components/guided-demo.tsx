"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RegistrationPhone } from "@/components/registration-phone";
import { isReady, subtotal } from "@/lib/agent";
import { buildClaim } from "@/lib/claim";
import { BEATS, buildStates, CHAPTERS, type DemoMessage, type DemoState } from "@/lib/demo-script";

type Phase = "typing" | "thinking" | "done";

const TYPE_MS = 26;
const THINK_MS = 900;
const SPEEDS = [1, 1.5, 2] as const;

function holdFor(index: number): number {
  const beat = BEATS[index];
  return Math.max(4200, (beat.title.length + beat.body.length) * 38);
}

function firstBeatOf(chapter: number): number {
  return BEATS.findIndex((beat) => beat.chapter === chapter);
}

export function GuidedDemo({ autoplay = false }: { autoplay?: boolean }) {
  const states = useMemo(() => buildStates(), []);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("done");
  const [typed, setTyped] = useState(0);
  const [playing, setPlaying] = useState(autoplay);
  const [started, setStarted] = useState(autoplay);
  const [ended, setEnded] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const phoneRef = useRef<HTMLDivElement>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  const beat = BEATS[index];
  const say = beat.say;
  const settled = phase === "done";
  const previous: DemoState = index > 0 ? states[index - 1] : states[0];
  const shown: DemoState = settled || !say ? states[index] : previous;
  const thread = beat.view.channel === "support" ? shown.support : shown.listing;
  const pending: DemoMessage | null =
    say && phase === "thinking" ? { id: "pending", role: say.who, text: say.text } : null;

  const claim = shown.lot.published && shown.lot.buyerReport ? buildClaim(shown.lot.published, shown.lot.buyerReport) : "";

  const go = useCallback(
    (next: number, animate: boolean) => {
      const target = Math.max(0, Math.min(BEATS.length - 1, next));
      setEnded(false);
      setIndex(target);
      setTyped(0);
      setPhase(animate && BEATS[target].say ? "typing" : "done");
    },
    [],
  );

  const restart = useCallback(() => {
    setStarted(true);
    setPlaying(true);
    go(0, true);
  }, [go]);

  // Typing, then the reply.
  useEffect(() => {
    if (!say) return;
    if (phase === "typing") {
      if (typed >= say.text.length) {
        const handle = window.setTimeout(() => setPhase("thinking"), 380 / speed);
        return () => window.clearTimeout(handle);
      }
      const handle = window.setTimeout(() => setTyped((count) => count + 2), TYPE_MS / speed);
      return () => window.clearTimeout(handle);
    }
    if (phase === "thinking") {
      const handle = window.setTimeout(() => setPhase("done"), THINK_MS / speed);
      return () => window.clearTimeout(handle);
    }
  }, [phase, typed, say, speed]);

  // Autoplay advances once the beat has settled.
  useEffect(() => {
    if (!playing || !started || !settled || ended) return;
    const handle = window.setTimeout(() => {
      if (index >= BEATS.length - 1) {
        setPlaying(false);
        setEnded(true);
        return;
      }
      go(index + 1, true);
    }, holdFor(index) / speed);
    return () => window.clearTimeout(handle);
  }, [playing, started, settled, ended, index, speed, go]);

  // Keep the newest message in view.
  useEffect(() => {
    const scroller = threadRef.current;
    scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
  }, [thread.length, phase, beat.view.channel]);

  // Move the sheet to the part the caption talks about.
  useEffect(() => {
    const scroller = phoneRef.current?.querySelector<HTMLElement>(".overflow-y-auto");
    if (!scroller || !settled) return;
    const top = beat.view.scroll === "end" ? scroller.scrollHeight : 0;
    const handle = window.setTimeout(() => scroller.scrollTo({ top, behavior: "smooth" }), 250);
    return () => window.clearTimeout(handle);
  }, [index, settled, beat.view.scroll, beat.view.mode]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === " " || event.key === "k") {
        event.preventDefault();
        if (!started || ended) {
          restart();
          return;
        }
        setPlaying((value) => !value);
      } else if (event.key === "ArrowRight") {
        setStarted(true);
        go(index + 1, true);
      } else if (event.key === "ArrowLeft") {
        setStarted(true);
        go(index - 1, false);
      } else if (event.key === "r") {
        restart();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [started, ended, index, go, restart]);

  const progress = ended ? 1 : (index + (settled ? 1 : 0.5)) / BEATS.length;
  const composer = say && phase === "typing" ? say.text.slice(0, typed) : "";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="FleekFlow supplier desk">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-fleek text-[15px] font-bold text-ink">F</span>
            <span className="text-[17px] font-semibold tracking-[-0.02em]">FleekFlow</span>
            <span className="hidden text-[13px] font-medium text-secondary sm:inline">Guided demo</span>
          </Link>

          <nav aria-label="Chapters" className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
            {CHAPTERS.map((label, chapter) => {
              const current = beat.chapter === chapter && !ended;
              const done = ended || beat.chapter > chapter;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setStarted(true);
                    go(firstBeatOf(chapter), true);
                  }}
                  aria-current={current ? "step" : undefined}
                  className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors ${
                    current ? "bg-ink text-card" : done ? "text-ink hover:bg-black/5" : "text-secondary hover:bg-black/5"
                  }`}
                >
                  <span
                    className={`grid h-4 w-4 place-items-center rounded-full text-[10px] ${
                      current ? "bg-fleek text-ink" : done ? "bg-fleek-green text-card" : "border border-line"
                    }`}
                  >
                    {done && !current ? "✓" : chapter + 1}
                  </span>
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:ml-0">
            <ControlButton label="Previous beat (←)" onClick={() => { setStarted(true); go(index - 1, false); }} disabled={index === 0}>
              <path d="M11 4L6 9l5 5" />
            </ControlButton>
            <button
              type="button"
              onClick={() => {
                if (!started || ended) restart();
                else setPlaying((value) => !value);
              }}
              aria-label={playing ? "Pause (space)" : "Play (space)"}
              className="grid h-9 w-9 place-items-center rounded-full bg-ink text-card"
            >
              {playing && !ended ? (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 2h2.5v10H3.5zM8 2h2.5v10H8z" fill="currentColor" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2l8 5-8 5z" fill="currentColor" /></svg>
              )}
            </button>
            <ControlButton label="Next beat (→)" onClick={() => { setStarted(true); go(index + 1, true); }} disabled={index === BEATS.length - 1}>
              <path d="M7 4l5 5-5 5" />
            </ControlButton>
            <button
              type="button"
              onClick={() => setSpeed((value) => SPEEDS[(SPEEDS.indexOf(value) + 1) % SPEEDS.length])}
              className="h-9 min-w-11 rounded-full border border-line bg-card px-2 text-[13px] font-semibold tabular-nums"
              aria-label="Playback speed"
            >
              {speed}×
            </button>
          </div>
        </div>
        <div className="h-[3px] bg-line/60">
          <div className="h-full bg-fleek transition-[width] duration-500 ease-out" style={{ width: `${progress * 100}%` }} />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[402px] flex-1 gap-4 px-3 py-4 sm:px-0 sm:py-5 lg:max-w-none lg:grid-cols-[402px_400px] lg:grid-rows-[auto_minmax(0,1fr)] lg:justify-center">
        <div className="w-full lg:col-start-1 lg:row-span-2 lg:row-start-1" ref={phoneRef}>
          <RegistrationPhone
            key={states[0].lot.productId}
            lot={shown.lot}
            listings={shown.listings}
            total={subtotal(shown.lot)}
            ready={isReady(shown.lot)}
            mode={beat.view.mode}
            step={beat.view.step}
            claim={claim}
            copied={false}
            onConfirm={() => undefined}
            onAddProduct={() => undefined}
            onRevise={() => undefined}
            onUseMismatch={() => undefined}
            onUpdateReport={() => undefined}
            onCopy={() => undefined}
            onMode={() => undefined}
            onGrade={() => undefined}
          />
        </div>

        <section
          key={index}
          aria-live="polite"
          className="sheet-in row-start-1 rounded-[24px] border border-black/8 bg-card px-5 py-4 shadow-[0_22px_50px_rgba(29,29,31,0.10)] lg:col-start-2"
        >
          <div className="flex items-center justify-between text-[12px] font-semibold tracking-[0.06em] text-secondary uppercase">
            <span>
              Chapter {beat.chapter + 1} · {CHAPTERS[beat.chapter]}
            </span>
            <span className="tabular-nums">
              {index + 1} / {BEATS.length}
            </span>
          </div>
          <h1 className="mt-2 text-[22px] leading-7 font-bold tracking-[-0.03em]">{beat.title}</h1>
          <p className="mt-1.5 text-[15px] leading-[22px] text-secondary">{beat.body}</p>
          {beat.notice ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-fleek-green-tint px-3 py-1 text-[13px] font-semibold text-ink">
              <span className="h-2 w-2 rounded-full bg-fleek-green" />
              {beat.notice}
            </p>
          ) : null}
        </section>

        <section className="flex h-[30rem] flex-col overflow-hidden rounded-[28px] border border-black/8 bg-card shadow-[0_22px_50px_rgba(29,29,31,0.12)] lg:col-start-2 lg:row-start-2 lg:h-0 lg:min-h-full">
          <header className="border-b border-line/80 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[17px] font-semibold tracking-[-0.02em]">FleekFlow.AI</p>
              <span className="text-[12px] font-medium text-secondary">via Wassist</span>
            </div>
            <p className="text-[13px] text-secondary">
              {beat.view.channel === "support" ? "Client messages. The bot prepares the review." : "Supplier messages update the listing."}
            </p>
            <div className="mt-2 flex gap-2" aria-hidden="true">
              {(["listing", "support"] as const).map((name) => (
                <span
                  key={name}
                  className={`inline-flex h-7 items-center rounded-full px-3 text-[13px] font-semibold capitalize transition-colors ${
                    beat.view.channel === name ? "bg-ink text-card" : "text-secondary"
                  }`}
                >
                  {name}
                </span>
              ))}
            </div>
          </header>

          <div ref={threadRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-fill px-3 py-4">
            {thread.map((message) => (
              <Bubble key={message.id} message={message} />
            ))}
            {pending ? <Bubble message={pending} /> : null}
            {pending ? (
              <p className="max-w-[88%] rounded-[18px] bg-card px-3.5 py-2 text-[15px] leading-5 text-secondary shadow-[0_1px_2px_rgba(29,29,31,0.06)]">
                <span className="inline-flex gap-1" aria-label="Writing the reply">
                  <Dot delay="0ms" />
                  <Dot delay="160ms" />
                  <Dot delay="320ms" />
                </span>
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-2 border-t border-line/80 bg-card p-3">
            <div
              className={`flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-full border bg-fill px-4 text-[15px] whitespace-nowrap ${
                composer ? "border-ink/40" : "border-line"
              }`}
            >
              {composer ? (
                <span className="truncate [direction:rtl]">
                  <span className="[direction:ltr] [unicode-bidi:plaintext]">{composer}</span>
                </span>
              ) : (
                <span className="text-secondary">{beat.view.channel === "support" ? "Describe what arrived" : "Describe the lot"}</span>
              )}
              {composer ? <span className="ml-0.5 h-5 w-[2px] shrink-0 animate-pulse bg-ink" /> : null}
            </div>
            <span
              className={`inline-flex h-11 items-center rounded-full bg-fleek px-4 text-[15px] font-semibold text-ink transition-transform ${
                say && phase === "typing" && typed >= say.text.length ? "scale-95 bg-fleek-press" : ""
              }`}
            >
              Send
            </span>
          </div>
        </section>
      </main>

      {!started ? <Intro onStart={restart} /> : null}
      {ended ? <Outro onReplay={restart} /> : null}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-9 w-9 place-items-center rounded-full border border-line bg-card text-ink disabled:text-line"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function Bubble({ message }: { message: DemoMessage }) {
  if (message.role === "event") {
    return (
      <p className="sheet-in mx-auto my-1 inline-flex items-center gap-2 rounded-full bg-fleek-green-tint px-3 py-1.5 text-[13px] font-semibold text-ink">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-fleek-green text-[10px] text-card">✓</span>
        {message.text}
      </p>
    );
  }
  const mine = message.role !== "agent";
  return (
    <p
      className={`sheet-in max-w-[88%] rounded-[18px] px-3.5 py-2 text-[15px] leading-5 tracking-[-0.01em] ${
        mine ? "ml-auto bg-fleek text-ink" : "bg-card text-ink shadow-[0_1px_2px_rgba(29,29,31,0.06)]"
      }`}
    >
      {message.text}
    </p>
  );
}

function Dot({ delay }: { delay: string }) {
  return <span className="h-2 w-2 animate-bounce rounded-full bg-secondary/70" style={{ animationDelay: delay }} />;
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-canvas/80 px-4 backdrop-blur-md">
      <div className="sheet-in w-full max-w-[560px] rounded-[28px] border border-black/8 bg-card p-7 shadow-[0_30px_80px_rgba(29,29,31,0.18)] sm:p-9">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-secondary uppercase">Merchant Tooling · Guided demo</p>
        <h1 className="mt-3 text-[34px] leading-[38px] font-bold tracking-[-0.035em] sm:text-[40px] sm:leading-[44px]">
          One confirmed record, from listing to dispute.
        </h1>
        <p className="mt-4 text-[17px] leading-6 text-secondary">
          Watch a Fleek supplier list a wholesale lot by talking, a buyer order it, and a mismatch reach a reviewer with the
          original listing already attached.
        </p>
        <ul className="mt-5 grid gap-2 text-[15px] leading-5 sm:grid-cols-3">
          {[
            ["Supplier", "Describes the lot. Confirms it."],
            ["Buyer", "Reads that same record."],
            ["Reviewer", "Gets the case in one draft."],
          ].map(([who, what]) => (
            <li key={who} className="rounded-2xl bg-fill px-3.5 py-3">
              <p className="font-semibold">{who}</p>
              <p className="text-secondary">{what}</p>
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onStart}
            autoFocus
            className="h-12 rounded-xl bg-fleek px-6 text-[17px] font-semibold tracking-[-0.02em] text-ink transition-colors hover:bg-fleek-press"
          >
            Start the demo ▶
          </button>
          <p className="text-[13px] leading-5 text-secondary">
            Under two minutes · Space pauses · ← → step
          </p>
        </div>
      </div>
    </div>
  );
}

function Outro({ onReplay }: { onReplay: () => void }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-canvas/80 px-4 backdrop-blur-md">
      <div className="sheet-in w-full max-w-[620px] rounded-[28px] border border-black/8 bg-card p-7 shadow-[0_30px_80px_rgba(29,29,31,0.18)] sm:p-9">
        <p className="text-[12px] font-semibold tracking-[0.08em] text-secondary uppercase">What you just saw</p>
        <h2 className="mt-3 text-[32px] leading-9 font-bold tracking-[-0.035em]">The record the buyer read is the record the reviewer got.</h2>
        <ul className="mt-5 space-y-2.5 text-[15px] leading-[22px]">
          {[
            "Only stated facts entered the record. Grade, shipping and duties stayed unknown.",
            "A conflicting count became a question. The supplier settled it before anyone could buy.",
            "The purchasable item existed only after “I confirm”, with stock equal to the confirmed 18.",
            "The complaint was compared with that version, and a person decides the refund.",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span className="mt-1 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-fleek-green text-[10px] text-card">✓</span>
              {line}
            </li>
          ))}
        </ul>
        <div className="mt-7 flex flex-wrap gap-2.5">
          <button type="button" onClick={onReplay} className="h-12 rounded-xl bg-ink px-5 text-[17px] font-semibold text-card">
            Replay
          </button>
          <Link href="/" className="inline-flex h-12 items-center rounded-xl bg-fleek px-5 text-[17px] font-semibold text-ink hover:bg-fleek-press">
            Try the supplier desk
          </Link>
          <Link href="/phone" className="inline-flex h-12 items-center rounded-xl border border-line px-4 text-[15px] font-medium">
            On a phone
          </Link>
          <Link href="/buy" className="inline-flex h-12 items-center rounded-xl border border-line px-4 text-[15px] font-medium">
            Buyer page
          </Link>
        </div>
      </div>
    </div>
  );
}
