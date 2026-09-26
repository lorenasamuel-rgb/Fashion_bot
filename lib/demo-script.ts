import { addPhoto, applyVendorMessage, confirmRecord, openingAgentMessage, placeOrder } from "./agent";
import { applySupportMessage, openingSupportMessage, SUPPORT_ISSUE_LINE, SUPPORT_PHOTOS_LINE, SUPPORT_REVIEW_LINE } from "./support";
import {
  CONFIRM_COUNT_AND_DEFECTS_LINE,
  createEmptyLot,
  OPENING_LINE,
  SIZES_AND_COUNT_LINE,
  type LotRecord,
  type PublishedLot,
} from "./types";

export type DemoRole = "vendor" | "agent" | "client" | "event";

export interface DemoMessage {
  id: string;
  role: DemoRole;
  text: string;
}

export interface DemoState {
  lot: LotRecord;
  listings: PublishedLot[];
  listing: DemoMessage[];
  support: DemoMessage[];
}

export interface DemoView {
  mode: "upload" | "buyer" | "review";
  step?: 0 | 1 | 2 | 3;
  channel: "listing" | "support";
  /** Scroll the phone sheet to its end, where the review draft sits. */
  scroll?: "top" | "end";
}

export interface DemoBeat {
  chapter: number;
  title: string;
  body: string;
  /** What the viewer should see hold on screen. */
  notice?: string;
  view: DemoView;
  /** A line that is typed into the composer, then sent. */
  say?: { who: "vendor" | "client"; text: string };
  run?: (state: DemoState) => DemoState;
}

export const CHAPTERS = ["Describe", "Resolve", "Confirm", "Buy", "Complain", "Review"] as const;

const DEMO_LOT_ID = "d3m0f1ee-0000-4000-8000-000000001842";

export function initialDemoState(): DemoState {
  return {
    lot: createEmptyLot(DEMO_LOT_ID),
    listings: [],
    listing: [{ id: "open", role: "agent", text: openingAgentMessage() }],
    support: [{ id: "support-open", role: "agent", text: openingSupportMessage() }],
  };
}

function vendorSays(state: DemoState, text: string, index: number): DemoState {
  const result = applyVendorMessage(state.lot, text);
  return {
    ...state,
    lot: result.lot,
    listing: [
      ...state.listing,
      { id: `v-${index}`, role: "vendor", text },
      { id: `a-${index}`, role: "agent", text: result.reply },
    ],
  };
}

function clientSays(state: DemoState, text: string, index: number): DemoState {
  const result = applySupportMessage(state.lot, text);
  return {
    ...state,
    lot: result.lot,
    support: [
      ...state.support,
      { id: `c-${index}`, role: "client", text },
      { id: `s-${index}`, role: "agent", text: result.reply },
    ],
  };
}

export const BEATS: DemoBeat[] = [
  {
    chapter: 0,
    title: "A lot starts as a conversation",
    body: "The supplier talks on Wassist beside Fleek’s registration sheet. The sheet is empty, and it only fills with what the supplier says.",
    notice: "Every field starts unknown",
    view: { mode: "upload", step: 0, channel: "listing" },
  },
  {
    chapter: 0,
    title: "One message fills eight fields",
    body: "Shop, country, audience, colour, category, brand, quantity and price all come from one sentence. Each one is marked declared, not confirmed.",
    notice: "Women · Blue · Shirts · Unbranded",
    view: { mode: "upload", step: 0, channel: "listing" },
    say: { who: "vendor", text: OPENING_LINE },
  },
  {
    chapter: 0,
    title: "Price comes from what was said",
    body: "20 pieces at £8 is £160 before shipping. Nothing is added that the supplier did not state.",
    notice: "£160 before shipping",
    view: { mode: "upload", step: 2, channel: "listing" },
  },
  {
    chapter: 1,
    title: "The count changes mid-conversation",
    body: "The supplier gives the sizes and recounts: 18, not 20. The size run fills in. Grade stays unselected, because FleekFlow never assigns one.",
    notice: "Grade stays empty",
    view: { mode: "upload", step: 1, channel: "listing" },
    say: { who: "vendor", text: SIZES_AND_COUNT_LINE },
  },
  {
    chapter: 1,
    title: "A conflict is a question, not a guess",
    body: "Two quantities were stated. The bot does not pick one. It keeps 20 on the draft and asks which number the record should hold.",
    notice: "20 stated · 18 counted",
    view: { mode: "upload", step: 2, channel: "listing" },
  },
  {
    chapter: 1,
    title: "The supplier settles it, and declares a defect",
    body: "18 is correct, and two pieces have small stains. The subtotal moves to £144. The defect is on the record before anyone buys.",
    notice: "18 × £8 = £144",
    view: { mode: "upload", step: 2, channel: "listing" },
    say: { who: "vendor", text: CONFIRM_COUNT_AND_DEFECTS_LINE },
  },
  {
    chapter: 1,
    title: "A photo helps, within limits",
    body: "A photo can show a missing detail. It does not prove who the supplier is, that the goods are authentic, or the condition of every piece.",
    view: { mode: "upload", step: 2, channel: "listing" },
    run: (state) => {
      const result = addPhoto(state.lot);
      return {
        ...state,
        lot: result.lot,
        listing: [
          ...state.listing,
          { id: "v-photo", role: "vendor", text: "Photo of the shirts attached." },
          { id: "a-photo", role: "agent", text: result.reply },
        ],
      };
    },
  },
  {
    chapter: 1,
    title: "Shipping and duties stay unknown",
    body: "No shipping rate is invented and no customs figure is estimated. The table shows the unit price as base and leaves the rest blank until stated.",
    notice: "Upload Listing is now enabled",
    view: { mode: "upload", step: 3, channel: "listing" },
  },
  {
    chapter: 2,
    title: "“I confirm” creates the record",
    body: "Confirmation is an explicit act. Only now does a purchasable item exist, and its stock is the confirmed quantity: 18.",
    notice: "Stock = 18 · Order FLK-DEMO-1842",
    view: { mode: "upload", channel: "listing" },
    run: (state) => {
      const lot = confirmRecord(state.lot);
      const published = lot.published;
      if (!published) return state;
      return {
        ...state,
        lot,
        listings: [published],
        listing: [
          ...state.listing,
          {
            id: "a-confirm",
            role: "agent",
            text: `${published.shopName} now holds this product. The same store keeps every listing the supplier confirms. Anything not stated stays unknown.`,
          },
        ],
      };
    },
  },
  {
    chapter: 3,
    title: "The buyer reads the same record",
    body: "No second listing, no rewrite. What the supplier confirmed is what the buyer sees, and “Unknown” is shown as unknown.",
    notice: "Grade, shipping, duties: Unknown",
    view: { mode: "buyer", channel: "listing" },
  },
  {
    chapter: 3,
    title: "An order against confirmed stock",
    body: "The buyer places order FLK-DEMO-1842 for the lot. It is tied to the confirmed version, not to whatever the chat says later.",
    view: { mode: "buyer", channel: "listing" },
    run: (state) => {
      const result = placeOrder(state.lot);
      const order = result.lot.order;
      return {
        ...state,
        lot: result.lot,
        listing: [
          ...state.listing,
          {
            id: "e-order",
            role: "event",
            text: order
              ? `Order ${order.number} placed · ${order.stock} pieces · £${order.stock * order.unitPrice} before shipping`
              : "Order placed",
          },
        ],
      };
    },
  },
  {
    chapter: 4,
    title: "Delivery does not match",
    body: "The client writes to support. The bot answers against the confirmed record: two small stains and S–L were promised, larger stains and a wrong label arrived.",
    notice: "Compared with the confirmed record",
    view: { mode: "buyer", channel: "support" },
    say: { who: "client", text: SUPPORT_ISSUE_LINE },
  },
  {
    chapter: 4,
    title: "The five-day window and the photos",
    body: "The client states when the lot arrived and which checklist photos they have. The bot records what was said. It does not judge it.",
    view: { mode: "buyer", channel: "support" },
    say: { who: "client", text: SUPPORT_PHOTOS_LINE },
  },
  {
    chapter: 4,
    title: "The client asks for a review",
    body: "The bot prepares the case for a person. It does not approve, refuse, or promise a refund.",
    view: { mode: "review", channel: "support" },
    say: { who: "client", text: SUPPORT_REVIEW_LINE },
  },
  {
    chapter: 5,
    title: "One document for the person who decides",
    body: "The confirmed listing, the report, the photo checklist and Fleek’s policy note arrive together. The reviewer does not have to rebuild the story.",
    notice: "A person decides the case",
    view: { mode: "review", channel: "support", scroll: "end" },
  },
];

/** Replays the script up to each beat. The rule engine is pure, so every beat is reproducible. */
export function buildStates(): DemoState[] {
  const states: DemoState[] = [];
  let state = initialDemoState();
  BEATS.forEach((beat, index) => {
    if (beat.say) {
      state = beat.say.who === "vendor" ? vendorSays(state, beat.say.text, index) : clientSays(state, beat.say.text, index);
    }
    if (beat.run) state = beat.run(state);
    states.push(state);
  });
  return states;
}
