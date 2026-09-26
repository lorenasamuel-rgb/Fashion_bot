"use client";

import { useEffect, useRef, useState } from "react";
import { IconAudience, IconBack, IconChevron, IconClose, IconHome, IconShirt, IconStar } from "@/components/icons";
import { PHOTO_CHECKLIST, policyNote } from "@/lib/claim";
import { DEMO_ORDER_NUMBER, type BuyerReport, type LotRecord, type PublishedLot } from "@/lib/types";

type Step = 0 | 1 | 2 | 3;

const GRADES = ["Grade A", "Grade A/B", "Grade B", "Grade B/C", "Grade C", "Grade A/B/C"] as const;
const AUDIENCES = [
  { id: "men", label: "Men" },
  { id: "women", label: "Women" },
  { id: "unisex", label: "Unisex" },
  { id: "kids", label: "Kids" },
] as const;

const REGIONS = [
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "EU", name: "European Union" },
  { code: "INT", name: "International" },
] as const;

function money(amount: number): string {
  return `£${amount % 1 === 0 ? amount.toFixed(2) : amount.toFixed(2)}`;
}

function productTitle(lot: LotRecord): string {
  if (lot.color.value && lot.category.value) {
    return `${lot.color.value} ${lot.category.value.toLowerCase()}`;
  }
  return lot.title.value ?? "";
}

function selectedAudience(lot: LotRecord): string | null {
  const value = lot.audience.value?.toLowerCase() ?? "";
  if (value.includes("women")) return "women";
  if (value.includes("men")) return "men";
  if (value.includes("kid") || value.includes("child")) return "kids";
  if (value.includes("unisex")) return "unisex";
  return null;
}

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "XXL"];

function sizeBounds(sizes: string | null): { min: string; max: string } | null {
  if (!sizes) return null;
  const found = SIZE_ORDER.filter((size) => new RegExp(`\\b${size}\\b`).test(sizes));
  if (found.length === 0) return null;
  return { min: found[0], max: found[found.length - 1] };
}

function FieldLabel({ children, required = false }: { children: string; required?: boolean }) {
  return (
    <p className="mb-2 text-[13px] font-semibold tracking-[-0.01em] text-ink">
      {children}
      {required ? <span className="text-secondary"> *</span> : null}
    </p>
  );
}

function TextField({ label, value, placeholder, required = false }: { label: string; value: string; placeholder: string; required?: boolean }) {
  return (
    <label className="block">
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        readOnly
        value={value}
        placeholder={placeholder}
        aria-label={label}
        className="h-12 w-full rounded-xl border border-line bg-card px-3.5 text-[17px] tracking-[-0.01em] text-ink placeholder:text-secondary"
      />
    </label>
  );
}

function SelectField({ label, value, placeholder, required = false }: { label: string; value: string | null; placeholder: string; required?: boolean }) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="flex min-h-12 items-center justify-between rounded-xl border border-line bg-card px-3 py-2">
        {value ? (
          <span className="inline-flex items-center rounded-full bg-ink px-3 py-1 text-[15px] font-medium text-card">{value}</span>
        ) : (
          <span className="text-[17px] text-secondary">{placeholder}</span>
        )}
        <span className="text-secondary">
          <IconChevron />
        </span>
      </div>
    </div>
  );
}

function Progress({ step }: { step: Step }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of 4`}>
      {[0, 1, 2, 3].map((index) => (
        <span key={index} className="flex items-center gap-1.5">
          <span className={`block h-2.5 w-2.5 rounded-full ${index <= step ? "bg-fleek" : "border border-line bg-card"}`} />
          {index < 3 ? <span className={`block h-0.5 w-3 ${index < step ? "bg-fleek" : "bg-line"}`} /> : null}
        </span>
      ))}
    </div>
  );
}

export function RegistrationPhone({
  lot,
  listings,
  total,
  ready,
  mode,
  claim,
  copied,
  onConfirm,
  onAddProduct,
  onRevise,
  onUseMismatch,
  onUpdateReport,
  onCopy,
  onMode,
  onGrade,
  frame = "device",
}: {
  lot: LotRecord;
  listings: PublishedLot[];
  total: number | null;
  ready: boolean;
  mode: "upload" | "buyer" | "review";
  claim: string;
  copied: boolean;
  onConfirm: () => void;
  onAddProduct: () => void;
  onRevise: () => void;
  onUseMismatch: () => void;
  onUpdateReport: (patch: Partial<BuyerReport>) => void;
  onCopy: () => void;
  onMode: (mode: "upload" | "buyer" | "review") => void;
  onGrade: (grade: string) => void;
  frame?: "device" | "screen";
}) {
  const screen = frame === "screen";
  const [step, setStep] = useState<Step>(0);
  const jumped = useRef(false);
  const title = productTitle(lot);
  const audience = selectedAudience(lot);
  const sizes = sizeBounds(lot.sizes.value);
  const published = lot.published != null;
  const showStore = published && mode === "upload";

  useEffect(() => {
    if (!lot.shopName.value) jumped.current = false;
    if (ready && !published && !jumped.current) {
      jumped.current = true;
      setStep(3);
    }
  }, [ready, published, lot.shopName.value]);

  function next() {
    if (step < 3) {
      setStep((current) => (current + 1) as Step);
      return;
    }
    if (ready) onConfirm();
  }

  return (
    <div className={screen ? "flex h-full min-h-0 w-full flex-col" : "mx-auto w-full max-w-[402px]"}>
      <div
        className={
          screen
            ? "flex min-h-0 flex-1 flex-col overflow-hidden bg-card"
            : "overflow-hidden rounded-[36px] border border-black/10 bg-card shadow-[0_22px_50px_rgba(29,29,31,0.16)] sm:rounded-[44px] sm:border-[10px] sm:border-[#1c1c1e]"
        }
      >
        {screen ? null : (
          <div className="hidden h-[34px] items-end justify-between px-5 pb-1 text-[12px] font-semibold tracking-[-0.01em] sm:flex">
            <span>9:41</span>
            <span className="h-[22px] w-[92px] rounded-full bg-ink" />
            <span className="w-10 text-right">5G</span>
          </div>
        )}

        <div className={screen ? "flex min-h-0 flex-1 flex-col" : "flex h-[62dvh] flex-col sm:h-[min(760px,calc(100dvh-8.5rem))]"}>
          {mode === "upload" && !showStore ? (
            <header className="flex items-center justify-between border-b border-line/80 px-4 py-3">
              <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-ink" aria-label="Close upload" onClick={() => setStep(0)}>
                <IconClose />
              </button>
              <p className="text-[17px] font-semibold tracking-[-0.02em]">Upload products</p>
              <Progress step={step} />
            </header>
          ) : (
            <header className="flex items-center justify-between border-b border-line/80 px-4 py-3">
              <button type="button" className="grid h-9 w-9 place-items-center rounded-full text-ink" aria-label="Back to upload" onClick={() => onMode("upload")}>
                <IconBack />
              </button>
              <p className="text-[17px] font-semibold tracking-[-0.02em]">
                {mode === "buyer" ? "Buyer record" : mode === "review" ? "Review draft" : lot.shopName.value ?? "Store"}
              </p>
              <span className="w-9" />
            </header>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {mode === "buyer" ? <BuyerSheet lot={lot} listings={listings} total={total} /> : null}
            {mode === "review" ? (
              <ReviewSheet lot={lot} claim={claim} copied={copied} onUseMismatch={onUseMismatch} onUpdate={onUpdateReport} onCopy={onCopy} />
            ) : null}
            {mode === "upload" && showStore ? (
              <StoreSheet lot={lot} listings={listings} onAddProduct={onAddProduct} onBuyer={() => onMode("buyer")} onRevise={onRevise} />
            ) : null}
            {mode === "upload" && !showStore ? (
              <div key={step} className="sheet-in">
                {step === 0 ? <DetailsStep lot={lot} listings={listings} title={title} audience={audience} /> : null}
                {step === 1 ? (
                  <FitStep
                    lot={lot}
                    sizes={sizes}
                    onGrade={(grade) => {
                      onGrade(grade);
                      setStep(ready ? 3 : 2);
                    }}
                  />
                ) : null}
                {step === 2 ? <InventoryStep lot={lot} total={total} /> : null}
                {step === 3 ? <ShippingStep lot={lot} /> : null}
              </div>
            ) : null}
          </div>

          {mode === "upload" && !showStore ? (
            <footer className="flex items-center gap-3 border-t border-line/80 px-4 py-3">
              <button
                type="button"
                aria-label="Previous page"
                disabled={step === 0}
                onClick={() => setStep((current) => Math.max(0, current - 1) as Step)}
                className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-ink bg-card disabled:border-line disabled:text-secondary"
              >
                <IconBack />
              </button>
              <button
                type="button"
                onClick={next}
                disabled={step === 3 && !ready}
                className="h-12 flex-1 rounded-xl bg-fleek text-[17px] font-semibold tracking-[-0.02em] text-ink transition-colors hover:bg-fleek-press disabled:bg-disabled disabled:text-[#3a3a3e]"
              >
                {step === 3 ? "Upload Listing →" : "Next page →"}
              </button>
            </footer>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DetailsStep({
  lot,
  listings,
  title,
  audience,
}: {
  lot: LotRecord;
  listings: PublishedLot[];
  title: string;
  audience: string | null;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-[28px] leading-8 font-bold tracking-[-0.03em]">Add product details</h2>
      {lot.shopName.value ? (
        <p className="rounded-2xl bg-fill px-3.5 py-3 text-[15px] leading-6">
          <span className="font-semibold">{lot.shopName.value}</span> is the store. This product is one listing inside it
          {listings.length > 0 ? `, with ${listings.length} already confirmed` : ""}.
        </p>
      ) : (
        <p className="text-[15px] leading-6 text-secondary">The supplier names the store first. Every product they confirm stays in that store.</p>
      )}
      <TextField label="Title" required value={title} placeholder="Product title" />
      <div>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Audience">
          {AUDIENCES.map((item) => {
            const selected = audience === item.id;
            return (
              <div
                key={item.id}
                role="radio"
                aria-checked={selected}
                className={`flex h-[84px] flex-col items-center justify-center gap-1 rounded-xl border text-[13px] font-medium ${
                  selected ? "border-2 border-fleek-green bg-fleek-green-tint text-ink" : "border-line text-ink"
                }`}
              >
                <IconAudience kind={item.id} />
                {item.label}
              </div>
            );
          })}
        </div>
      </div>
      <SelectField label="Select category" required value={lot.category.value} placeholder="Select category" />
      <SelectField label="Select sub-category" required value={null} placeholder="Select sub-category" />
      <SelectField label="Select brands" required value={lot.brand.value} placeholder="Select brands" />
      <label className="block">
        <span className="sr-only">Description</span>
        <textarea
          readOnly
          value={lot.description.value ?? ""}
          placeholder="Enter a description for your products. Give as much detail as you can. *"
          rows={4}
          className="w-full resize-none rounded-xl border border-line px-3.5 py-3 text-[17px] leading-6 tracking-[-0.01em] placeholder:text-secondary"
        />
      </label>
      {lot.photos > 0 ? (
        <p className="text-[13px] leading-5 text-secondary">
          {lot.photos} photo{lot.photos === 1 ? "" : "s"} attached. A photo can show a missing detail. It does not set the brand, the grade, or a verified supplier.
        </p>
      ) : null}
    </div>
  );
}

function FitStep({
  lot,
  sizes,
  onGrade,
}: {
  lot: LotRecord;
  sizes: { min: string; max: string } | null;
  onGrade: (grade: string) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-[28px] leading-8 font-bold tracking-[-0.03em]">Add product details</h2>
      <section>
        <h3 className="mb-3 text-[20px] font-bold tracking-[-0.02em]">Grading</h3>
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Grading">
          {GRADES.map((grade) => {
            const selected = lot.grade.value === grade;
            return (
              <button
                key={grade}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onGrade(grade)}
                className={`flex h-12 items-center gap-2 rounded-xl border px-3 text-left text-[15px] ${
                  selected ? "border-2 border-fleek-green bg-fleek-green-tint font-semibold text-ink" : "border-line text-ink"
                }`}
              >
                <IconStar />
                {grade}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[13px] leading-5 text-secondary">
          {lot.grade.value
            ? `${lot.grade.value} is the supplier’s choice. Continue to inventory and shipping.`
            : "Pick the grade the supplier declares. That choice continues the upload."}
        </p>
      </section>
      <section>
        <h3 className="mb-3 text-[20px] font-bold tracking-[-0.02em]">Size range</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-fill px-3 py-1.5 text-[13px] font-medium text-secondary">{lot.category.value ?? "Pieces"}</span>
          <span className="grid h-11 min-w-16 place-items-center rounded-xl border border-line px-3 text-[15px]">
            {sizes?.min ?? "Min"}
          </span>
          <span className="text-secondary">–</span>
          <span className="grid h-11 min-w-16 place-items-center rounded-xl border border-line px-3 text-[15px]">
            {sizes?.max ?? "Max"}
          </span>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-secondary">{lot.sizes.value ? `Stated sizes: ${lot.sizes.value}.` : "Sizes stay blank until the supplier names them."}</p>
      </section>
      <TextField label="Known defects" value={lot.defects.value ?? ""} placeholder="Not stated" />
    </div>
  );
}

function InventoryStep({ lot, total }: { lot: LotRecord; total: number | null }) {
  const conflict = lot.quantityConflict;
  return (
    <div className="space-y-6">
      <h2 className="text-[28px] leading-8 font-bold tracking-[-0.03em]">Add inventory</h2>
      <div className="flex gap-2">
        <input
          readOnly
          aria-label="Quantity"
          value={lot.quantity.value ?? ""}
          placeholder="0"
          className="h-12 min-w-0 flex-1 rounded-xl border border-line px-3.5 text-[17px]"
        />
        <div className="flex h-12 w-24 items-center justify-between rounded-xl border border-line px-3 text-[17px]">
          pcs
          <IconChevron />
        </div>
      </div>
      {conflict ? (
        <p className="rounded-2xl bg-fill px-3.5 py-3 text-[15px] leading-6">
          Quantity is unresolved: {conflict.stated} stated and {conflict.counted} counted. The record keeps both until the supplier picks one.
        </p>
      ) : null}
      <section>
        <div className="mb-3 flex items-end justify-between">
          <h3 className="text-[22px] font-bold tracking-[-0.03em]">Add pricing</h3>
          <span className="flex h-9 items-center gap-1 rounded-lg border border-line px-2 text-[15px]">
            £ <IconChevron />
          </span>
        </div>
        <div className="flex gap-2">
          <div className="flex h-12 min-w-0 flex-1 items-center rounded-xl border border-line px-3.5 text-[17px]">
            <span className="mr-2 text-secondary">£</span>
            <span>{lot.unitPrice.value == null ? "" : lot.unitPrice.value}</span>
          </div>
          <div className="grid h-12 w-28 place-items-center rounded-xl border border-line text-[15px] text-secondary">per piece</div>
        </div>
        <p className="mt-3 text-[15px] leading-6 text-secondary">
          {total == null ? "Subtotal appears when quantity and price are both stated." : `${money(total)} before shipping.`}
        </p>
      </section>
    </div>
  );
}

function ShippingStep({ lot }: { lot: LotRecord }) {
  const base = lot.unitPrice.value;
  return (
    <div className="space-y-5">
      <h2 className="text-[28px] leading-[1.15] font-bold tracking-[-0.03em]">Configure shipping</h2>
      <SelectField label="Select sub-category" value={null} placeholder="Select sub-category" />
      <p className="rounded-2xl bg-fill px-3.5 py-3 text-[13px] leading-5 text-secondary">
        Shipping and duties stay unknown unless the supplier states the amount. A web lookup does not fill these fields.
      </p>
      <section>
        <h3 className="mb-3 text-[22px] leading-7 font-bold tracking-[-0.03em]">Shipping prices per piece</h3>
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="grid grid-cols-4 bg-fill px-3 py-2 text-[11px] font-semibold tracking-[-0.01em] text-secondary">
            <span>Region</span>
            <span>Base price</span>
            <span>Shipping</span>
            <span>Total</span>
          </div>
          {REGIONS.map((region) => (
            <div key={region.code} className="grid grid-cols-4 items-center border-t border-line px-3 py-3 text-[13px]">
              <span className="font-semibold">{region.code}</span>
              <span>{base == null ? "—" : money(base)}</span>
              <span className="text-secondary">{lot.shipping.value ?? "—"}</span>
              <span className="text-secondary">{lot.duties.value ? "Duties stated" : "—"}</span>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[13px] leading-5 text-secondary">
          Duties and tariffs: {lot.duties.value ?? "not in the supplier’s message"}.
        </p>
      </section>
    </div>
  );
}

function listingTitle(item: PublishedLot): string {
  if (item.color && item.category) return `${item.color} ${item.category.toLowerCase()}`;
  return item.title || "Listing";
}

function StoreSheet({
  lot,
  listings,
  onAddProduct,
  onBuyer,
  onRevise,
}: {
  lot: LotRecord;
  listings: PublishedLot[];
  onAddProduct: () => void;
  onBuyer: () => void;
  onRevise: () => void;
}) {
  const shop = lot.shopName.value ?? listings[0]?.shopName ?? "Store";
  const country = lot.country.value ?? listings[0]?.country ?? "Location not stated";
  const countLabel = listings.length === 1 ? "1 product in this store" : `${listings.length} products in this store`;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-fill text-secondary">
          <IconHome />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[22px] font-bold tracking-[-0.03em]">{shop}</h2>
          <p className="text-[15px] text-secondary">{country}</p>
        </div>
      </div>
      <p className="text-[15px] leading-6 text-secondary">
        The supplier owns this store. Each confirmed product stays here as its own listing.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onAddProduct}
          className="flex min-h-52 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line bg-fill px-3 text-[15px] font-medium text-secondary"
        >
          <span className="text-[32px] leading-none font-light text-ink">+</span>
          Upload listing
        </button>
        {listings.map((item) => (
          <article key={item.productId} className="overflow-hidden rounded-2xl border border-line">
            <div className="grid h-28 place-items-center bg-fill">
              <div className="h-24 w-16">
                <IconShirt />
              </div>
            </div>
            <div className="px-3 py-3">
              <p className="text-[15px] font-semibold tracking-[-0.02em]">{listingTitle(item)}</p>
              <p className="text-[17px] font-bold tracking-[-0.03em]">{money(item.quantity * item.unitPrice)}</p>
              <p className="text-[12px] text-secondary">Before shipping</p>
            </div>
          </article>
        ))}
      </div>
      <p className="text-[13px] leading-5 text-secondary">{countLabel}. Shipping stays off the price until the supplier states it.</p>
      <button type="button" onClick={onBuyer} className="h-12 w-full rounded-xl bg-fleek text-[17px] font-semibold tracking-[-0.02em] text-ink">
        Publish your store on Fleek
      </button>
      <p className="text-[13px] leading-5 text-secondary">
        The buyer reads this store on the buyer page. This demonstration does not send it to the live Fleek app.{" "}
        <a href="/buy" className="font-semibold text-ink">
          Open the buyer page
        </a>
      </p>
      <button type="button" onClick={onRevise} className="h-11 w-full text-[15px] font-medium text-secondary">
        Revise this product
      </button>
    </div>
  );
}

function BuyerSheet({ lot, listings, total }: { lot: LotRecord; listings: PublishedLot[]; total: number | null }) {
  const shop = lot.shopName.value ?? listings[0]?.shopName;
  return (
    <div className="space-y-4">
      <h2 className="text-[28px] leading-8 font-bold tracking-[-0.03em]">{shop ?? "Store"}</h2>
      <p className="text-[15px] leading-6 text-secondary">
        {listings.length > 0
          ? `The buyer is looking at ${shop ?? "this store"} and the products kept inside it.`
          : "The supplier has not confirmed a product in this store yet."}
      </p>
      {listings.length > 0 ? (
        <ul className="space-y-2">
          {listings.map((item) => (
            <li key={item.productId} className="flex items-baseline justify-between gap-3 rounded-2xl border border-line px-3 py-2.5">
              <span className="text-[15px] font-medium">{listingTitle(item)}</span>
              <span className="text-[15px]">{money(item.quantity * item.unitPrice)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <h3 className="text-[20px] font-bold tracking-[-0.02em]">{productTitle(lot) || "Current product"}</h3>
      <dl className="divide-y divide-line rounded-2xl border border-line">
        {(
          [
            ["Shop", lot.shopName.value],
            ["Country", lot.country.value],
            ["Quantity", lot.quantity.value],
            ["Unit price", lot.unitPrice.value == null ? null : money(lot.unitPrice.value)],
            ["Subtotal", total == null ? null : `${money(total)} before shipping`],
            ["Sizes", lot.sizes.value],
            ["Brand", lot.brand.value],
            ["Defects", lot.defects.value],
            ["Grade", lot.grade.value],
            ["Shipping", lot.shipping.value],
            ["Duties", lot.duties.value],
          ] as Array<[string, string | number | null | undefined]>
        ).map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 px-3 py-2.5">
            <dt className="text-[13px] text-secondary">{label}</dt>
            <dd className="text-right text-[15px] font-medium">{value == null || value === "" ? "Unknown" : String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function ReviewSheet({
  lot,
  claim,
  copied,
  onUseMismatch,
  onUpdate,
  onCopy,
}: {
  lot: LotRecord;
  claim: string;
  copied: boolean;
  onUseMismatch: () => void;
  onUpdate: (patch: Partial<BuyerReport>) => void;
  onCopy: () => void;
}) {
  if (!lot.published) {
    return <p className="text-[15px] leading-6 text-secondary">Confirm the lot first. The review draft compares the buyer’s report with the confirmed description.</p>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-[28px] leading-8 font-bold tracking-[-0.03em]">Review draft</h2>
      <p className="text-[15px] leading-6 text-secondary">
        Order {DEMO_ORDER_NUMBER}. The original listing stays attached. A person decides the case.
      </p>
      {!lot.buyerReport ? (
        <button type="button" onClick={onUseMismatch} className="h-12 w-full rounded-xl bg-fleek text-[17px] font-semibold">
          Use the demonstration mismatch
        </button>
      ) : (
        <form className="space-y-3" onSubmit={(event) => event.preventDefault()}>
          <label className="flex items-center gap-2 text-[15px]">
            <input
              type="checkbox"
              checked={lot.buyerReport.windowStated === false ? false : lot.buyerReport.receivedWithinFiveDays}
              onChange={(event) => onUpdate({ receivedWithinFiveDays: event.target.checked, windowStated: true })}
            />
            Reported within five days
          </label>
          <label className="block text-[13px] font-semibold" htmlFor="issues">
            What arrived differently
            <textarea
              id="issues"
              value={lot.buyerReport.issues}
              onChange={(event) => onUpdate({ issues: event.target.value })}
              rows={4}
              className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-[15px] font-normal"
            />
          </label>
        </form>
      )}
      <div>
        <p className="text-[13px] font-semibold">Photo checklist</p>
        <ul className="mt-2 space-y-1 text-[15px] leading-6">
          {PHOTO_CHECKLIST.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <p className="text-[13px] leading-5 text-secondary">
        {lot.buyerReport?.windowStated === false
          ? "The buyer has not said whether contact is inside five days. A reviewer checks that. This draft does not decide a refund."
          : policyNote(lot.buyerReport?.receivedWithinFiveDays ?? true)}
      </p>
      {claim ? (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-semibold">Draft for human review</p>
            <button type="button" onClick={onCopy} className="text-[15px] font-medium text-fleek-green">
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-2xl bg-fill p-3 text-[12px] leading-5 whitespace-pre-wrap">{claim}</pre>
        </div>
      ) : null}
    </div>
  );
}
