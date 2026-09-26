export type Provenance = "declared" | "confirmed" | "unknown";

export interface Field<T> {
  value: T | null;
  status: Provenance;
}

export interface QuantityConflict {
  stated: number;
  counted: number;
}

export interface PublishedLot {
  productId: string;
  at: string;
  shopName: string;
  country: string;
  title: string;
  description: string;
  category: string;
  audience: string;
  color: string;
  brand: string;
  quantity: number;
  unitPrice: number;
  currency: "GBP";
  sizes: string;
  defects: string;
  photos: number;
}

export interface BuyerReport {
  orderNumber: string;
  receivedWithinFiveDays: boolean;
  /** False until the client says whether contact is inside five days. */
  windowStated?: boolean;
  issues: string;
  photoCount: number;
  reviewRequested?: boolean;
}

/** Created only when the supplier confirms the lot. Stock is the confirmed quantity. */
export interface LotOrder {
  number: string;
  sku: string;
  stock: number;
  unitPrice: number;
  currency: "GBP";
  placed: boolean;
  placedAt: string | null;
}

export interface LotRecord {
  productId: string;
  shopName: Field<string>;
  country: Field<string>;
  title: Field<string>;
  description: Field<string>;
  category: Field<string>;
  audience: Field<string>;
  color: Field<string>;
  brand: Field<string>;
  quantity: Field<number>;
  unitPrice: Field<number>;
  currency: "GBP";
  sizes: Field<string>;
  defects: Field<string>;
  grade: Field<string>;
  shipping: Field<string>;
  duties: Field<string>;
  photos: number;
  quantityCorrected: boolean;
  quantityConflict: QuantityConflict | null;
  published: PublishedLot | null;
  buyerReport: BuyerReport | null;
  order: LotOrder | null;
}

export interface ChatMessage {
  id: string;
  role: "vendor" | "agent" | "client";
  text: string;
}

export function unknown<T>(): Field<T> {
  return { value: null, status: "unknown" };
}

export function createEmptyLot(productId = crypto.randomUUID()): LotRecord {
  return {
    productId,
    shopName: unknown(),
    country: unknown(),
    title: unknown(),
    description: unknown(),
    category: unknown(),
    audience: unknown(),
    color: unknown(),
    brand: unknown(),
    quantity: unknown(),
    unitPrice: unknown(),
    currency: "GBP",
    sizes: unknown(),
    defects: unknown(),
    grade: unknown(),
    shipping: unknown(),
    duties: unknown(),
    photos: 0,
    quantityCorrected: false,
    quantityConflict: null,
    published: null,
    buyerReport: null,
    order: null,
  };
}

export const DEMO_ORDER_NUMBER = "FLK-DEMO-1842";

export const OPENING_LINE =
  "My shop is CoCreate Hub, in the UK. I have 20 women's blue shirts, unbranded, at £8 each.";

export const SIZES_AND_COUNT_LINE =
  "Mostly S, M and L. I counted 18, not 20.";

export const CONFIRM_COUNT_AND_DEFECTS_LINE =
  "18 is correct. Two pieces have small stains.";

export const DEMO_MISMATCH =
  "Two shirts have larger stains than the listing described, and one size label does not match the confirmed size run.";
