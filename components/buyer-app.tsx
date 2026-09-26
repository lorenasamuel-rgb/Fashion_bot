"use client";

import { useEffect, useState } from "react";
import { IconShirt } from "@/components/icons";
import { ensureOrder } from "@/lib/agent";
import { createEmptyLot, type Field, type LotRecord } from "@/lib/types";

type WindowChoice = "unstated" | "inside" | "outside";

const PHOTO_OPTIONS = [
  { id: "front", label: "Front of a piece", phrase: "front of a piece" },
  { id: "label", label: "Size label", phrase: "size label" },
  { id: "stain", label: "Close-up of the stain or other defect", phrase: "close-up of the stain" },
] as const;

function money(amount: number): string {
  return `£${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

function stated(field: Field<string> | undefined): string {
  if (!field?.value) return "Unknown";
  return field.value;
}

export function BuyerApp() {
  const [lot, setLot] = useState<LotRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sending, setSending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [stored, setStored] = useState(true);
  const [issues, setIssues] = useState("");
  const [windowChoice, setWindowChoice] = useState<WindowChoice>("unstated");
  const [photos, setPhotos] = useState<string[]>([]);
  const [reply, setReply] = useState("");

  useEffect(() => {
    let cancel = false;
    fetch("/api/lot")
      .then(async (response) => {
        const data = (await response.json()) as { lot?: LotRecord; purchasable?: LotRecord | null; error?: string };
        if (!response.ok || !data.lot) throw new Error(data.error || "Could not load the lot");
        return data.purchasable?.published ? data.purchasable : data.lot;
      })
      .then((next) => {
        if (cancel) return;
        setLot(ensureOrder(next));
        if (next.buyerReport?.issues) setIssues(next.buyerReport.issues);
      })
      .catch((error: unknown) => {
        if (!cancel) setLoadError(error instanceof Error ? error.message : "Could not load the lot");
      })
      .finally(() => {
        if (!cancel) setLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, []);

  async function place() {
    if (!lot || sending) return;
    setSending(true);
    setActionError("");
    try {
      const response = await fetch("/api/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot }),
      });
      const data = (await response.json()) as { lot?: LotRecord; error?: string; stored?: boolean };
      if (!response.ok || !data.lot?.order?.placed) {
        setActionError(data.error || "The order was not placed. Confirm the lot on the supplier desk, then try again.");
        return;
      }
      setLot(data.lot);
      setStored(data.stored !== false);
    } catch {
      setActionError("The order was not placed. Check the connection and try again.");
    } finally {
      setSending(false);
    }
  }

  async function sendSupport(text: string, source?: LotRecord): Promise<LotRecord | null> {
    const current = source ?? lot ?? createEmptyLot();
    if (!text.trim()) return null;
    setSending(true);
    setActionError("");
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lot: current, text }),
        signal: AbortSignal.timeout(15000),
      });
      const data = (await response.json()) as { lot?: LotRecord; reply?: string; error?: string; stored?: boolean };
      if (!response.ok || !data.lot || !data.reply) {
        setActionError(data.error || "The report was not saved. Send it again.");
        return null;
      }
      setLot(data.lot);
      setReply(data.reply);
      setStored(data.stored !== false);
      return data.lot;
    } catch {
      setActionError("The report was not saved. Send it again.");
      return null;
    } finally {
      setSending(false);
    }
  }

  async function reportDifference() {
    if (!lot?.order || !issues.trim() || sending) return;
    const lines = [`Order ${lot.order.number}. ${issues.trim()}`];
    if (windowChoice === "inside") lines.push("I received it today, inside five days.");
    if (windowChoice === "outside") lines.push("Contact is outside five days.");
    const saved = await sendSupport(lines.join(" "));
    const named = PHOTO_OPTIONS.filter((item) => photos.includes(item.id)).map((item) => item.phrase);
    if (!saved || named.length === 0) return;
    await sendSupport(`Photos: ${named.join(", ")}.`, saved);
  }

  const published = lot?.published ?? null;
  const order = lot?.order ?? null;
  const subtotal = published ? published.quantity * published.unitPrice : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col px-4 py-8 sm:py-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-[17px] font-semibold tracking-[-0.02em]">FleekFlow</p>
        <a href="/" className="text-[17px] font-medium text-ink">
          Supplier desk
        </a>
      </div>

      <section className="rounded-[28px] border border-line bg-card p-5 shadow-[0_22px_50px_rgba(29,29,31,0.12)]">
        {loading ? <p className="text-[17px] leading-6 text-secondary">Loading the confirmed record.</p> : null}
        {!loading && loadError ? (
          <p className="text-[17px] leading-6 text-ink">{loadError} Refresh the page.</p>
        ) : null}
        {!loading && !loadError && !published ? (
          <div className="space-y-3">
            <h1 className="text-[28px] leading-8 font-bold tracking-[-0.03em]">Not purchasable</h1>
            <p className="max-w-[42ch] text-[17px] leading-6 text-secondary">
              This lot stays a draft until the supplier confirms it. Stock is not created from an unconfirmed quantity.
            </p>
          </div>
        ) : null}
        {!loading && published && order ? (
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="grid h-20 w-16 shrink-0 place-items-center rounded-2xl bg-fill">
                <div className="h-16 w-11">
                  <IconShirt />
                </div>
              </div>
              <div className="min-w-0">
                <h1 className="text-[28px] leading-8 font-bold tracking-[-0.03em]">{published.title}</h1>
                <p className="mt-1 text-[17px] text-secondary">
                  {published.shopName}, {published.country}
                </p>
              </div>
            </div>

            <dl className="divide-y divide-line rounded-xl border border-line">
              {(
                [
                  ["Stock", String(order.stock)],
                  ["Unit price", money(order.unitPrice)],
                  ["Subtotal", subtotal == null ? "Unknown" : `${money(subtotal)} before shipping`],
                  ["Sizes", published.sizes || "Unknown"],
                  ["Brand", published.brand || "Unknown"],
                  ["Defects", published.defects || "Unknown"],
                  ["Grade", stated(lot?.grade)],
                  ["Shipping", stated(lot?.shipping)],
                  ["Duties", stated(lot?.duties)],
                ] as Array<[string, string]>
              ).map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-3 px-3 py-2.5">
                  <dt className="text-[13px] font-semibold text-secondary">{label}</dt>
                  <dd className="text-right text-[17px]">{value}</dd>
                </div>
              ))}
            </dl>

            {!order.placed ? (
              <button
                type="button"
                onClick={() => void place()}
                disabled={sending}
                className="h-12 w-full rounded-xl bg-fleek text-[17px] font-semibold tracking-[-0.02em] text-ink hover:bg-fleek-press disabled:bg-disabled disabled:text-[#3A3A3E]"
              >
                {sending ? "Placing order" : `Place order ${order.number}`}
              </button>
            ) : (
              <div className="space-y-4">
                <p className="text-[17px] leading-6">
                  Order {order.number} is placed. Stock on this lot is {order.stock}. The same record is what a reviewer reads if the delivery differs.
                </p>
                {!lot?.buyerReport?.reviewRequested ? (
                  <form
                    className="space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      reportDifference();
                    }}
                  >
                    <label className="block text-[13px] font-semibold" htmlFor="difference">
                      What arrived differently
                      <textarea
                        id="difference"
                        value={issues}
                        onChange={(event) => setIssues(event.target.value)}
                        rows={4}
                        required
                        className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-[17px] font-normal"
                      />
                    </label>
                    <fieldset className="space-y-2">
                      <legend className="text-[13px] font-semibold">Contact window</legend>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ["unstated", "Not stated"],
                            ["inside", "Inside five days"],
                            ["outside", "Outside five days"],
                          ] as Array<[WindowChoice, string]>
                        ).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            aria-pressed={windowChoice === value}
                            onClick={() => setWindowChoice(value)}
                            className={`h-8 rounded-full px-3 text-[13px] font-semibold ${
                              windowChoice === value ? "bg-ink text-card" : "bg-fill text-ink"
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset className="space-y-2">
                      <legend className="text-[13px] font-semibold">Photos you can mark</legend>
                      {PHOTO_OPTIONS.map((item) => (
                        <label key={item.id} className="flex items-center gap-2 text-[17px]">
                          <input
                            type="checkbox"
                            checked={photos.includes(item.id)}
                            onChange={(event) =>
                              setPhotos((current) =>
                                event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id),
                              )
                            }
                          />
                          {item.label}
                        </label>
                      ))}
                    </fieldset>
                    <button
                      type="submit"
                      disabled={sending || !issues.trim()}
                      className={
                        lot?.buyerReport?.issues
                          ? "h-11 w-full text-[17px] font-medium text-ink disabled:text-[#3A3A3E]"
                          : "h-12 w-full rounded-xl bg-fleek text-[17px] font-semibold tracking-[-0.02em] text-ink hover:bg-fleek-press disabled:bg-disabled disabled:text-[#3A3A3E]"
                      }
                    >
                      {sending ? "Sending report" : lot?.buyerReport?.issues ? "Update the difference" : "Send the difference"}
                    </button>
                  </form>
                ) : null}
                {reply ? <p className="rounded-[18px] bg-fill px-3.5 py-3 text-[17px] leading-6">{reply}</p> : null}
                {lot?.buyerReport?.issues && !lot.buyerReport.reviewRequested ? (
                  <button
                    type="button"
                    onClick={() => void sendSupport("Please prepare the refund review.")}
                    disabled={sending}
                    className="h-12 w-full rounded-xl bg-fleek text-[17px] font-semibold tracking-[-0.02em] text-ink hover:bg-fleek-press disabled:bg-disabled disabled:text-[#3A3A3E]"
                  >
                    {sending ? "Preparing the draft" : "Prepare the refund review"}
                  </button>
                ) : null}
                {lot?.buyerReport?.reviewRequested ? (
                  <p className="text-[17px] leading-6 text-secondary">
                    The draft is ready for a person. FleekFlow does not approve or refuse the refund.{" "}
                    <a href="/" className="font-medium text-ink">
                      Open the review on the desk.
                    </a>
                  </p>
                ) : null}
              </div>
            )}
            {actionError ? <p className="text-[17px] leading-6 text-ink">{actionError}</p> : null}
            {!stored ? (
              <p className="text-[13px] leading-5 text-secondary">The reply is on screen. Supabase did not keep this turn.</p>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
