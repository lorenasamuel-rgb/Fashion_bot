import { DEMO_ORDER_NUMBER, type BuyerReport, type PublishedLot } from "./types";

export const PHOTO_CHECKLIST = [
  "Front of a piece",
  "Size label",
  "Close-up of the stain or other defect",
  "Lot or packing photo",
];

function money(amount: number): string {
  return `£${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

function windowLabel(report: BuyerReport): string {
  if (report.windowStated === false) return "Not stated";
  return report.receivedWithinFiveDays ? "Yes" : "No";
}

export function policyNote(receivedWithinFiveDays: boolean): string {
  const base =
    "Fleek's public guidance asks the buyer to contact Fleek within five days of receipt, with the order number, a description of the problem, and photos or videos when they apply. Partial returns depend on the supplier's agreement.";
  const window = receivedWithinFiveDays
    ? "This report says contact is inside that five-day window."
    : "This report says contact is outside that five-day window. A reviewer needs to check what that means here. FleekFlow does not decide that the buyer lost a right.";
  return `${base} ${window} This draft explains that guidance. It does not decide whether a refund is due.`;
}

export function buildClaim(published: PublishedLot, report: BuyerReport): string {
  const subtotal = published.quantity * published.unitPrice;
  return [
    "Request for review — demonstration scenario",
    "",
    `Order: ${report.orderNumber || DEMO_ORDER_NUMBER}`,
    `Received within five days of delivery: ${windowLabel(report)}`,
    "",
    "Original listing (confirmed record)",
    `Shop: ${published.shopName}, ${published.country}`,
    `Lot: ${published.title}`,
    `Quantity: ${published.quantity}`,
    `Unit price: ${money(published.unitPrice)}`,
    `Subtotal before shipping: ${money(subtotal)}`,
    `Sizes: ${published.sizes}`,
    `Brand: ${published.brand}`,
    `Known defects declared before purchase: ${published.defects}`,
    "Shipping: not stated",
    "Duties and tariffs: not stated",
    "",
    "Buyer report",
    report.issues.trim() || "No written difference yet.",
    `Photos marked in this demo: ${report.photoCount}`,
    "",
    "Photo checklist",
    ...PHOTO_CHECKLIST.map((item) => `- ${item}`),
    "",
    "Comparison",
    `The confirmed record said: ${published.defects}. Sizes on the record: ${published.sizes}. Quantity: ${published.quantity}.`,
    `The buyer reports: ${report.issues.trim() || "no difference described yet."}`,
    "",
    "Policy note",
    report.windowStated === false
      ? "The buyer has not said whether contact is inside five days of receipt. A reviewer needs to check that. This draft does not decide whether a refund is due."
      : policyNote(report.receivedWithinFiveDays),
    "Prepared for a person to review.",
  ].join("\n");
}
