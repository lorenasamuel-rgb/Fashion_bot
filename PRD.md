# FleekFlow PRD

Primary track: Merchant Tooling. The buyer screen is the outcome of that work, not a second product.

Submission line: “FleekFlow helps a Fleek supplier finish a wholesale lot in conversation, then keeps that confirmed record for the buyer’s decision and for any later mismatch.”

## Problem

A reseller chooses a wholesale lot from incomplete information. Quantity, sizes, defects, shipping, and duties are not always in the same record. When the delivery differs from the listing, the buyer repeats the story, and the reviewer does not have the version that was confirmed before the purchase.

Reseller research points to frustration with photographing and listing (33%), sourcing (30%), and returns (10%). This product does not claim to resolve those shares. The testable hypothesis is different: a more complete lot at the source makes sourcing easier, and the same record cuts repetition when the delivery differs. Piece-by-piece resale listing stays a later step.

## Users

- Supplier. Describes the lot in conversation and confirms the version that can be read.
- Buyer. Reads that version before deciding and, after delivery, reports the difference.
- Human reviewer. Receives the draft with the original listing, the report, and the photos. Decides the case.

## Product rule

What was not said stays unknown. No tool assigns a grade, proves authenticity, marks the supplier as verified, or decides a refund. A photo can show a missing detail. It does not prove identity, authenticity, or the condition of every piece. Shipping and duties leave “unknown” only when the supplier states the amount. A web search enters the draft labeled “found on the web”.

## What today’s demo already does

The Next.js app in `app/page.tsx` covers the core path, still in memory:

1. The supplier describes the lot on the Wassist channel. Example: CoCreate Hub, United Kingdom, 20 women’s blue shirts, unbranded, £8 each.
2. The agent in `lib/agent.ts` fills only what was said and asks for the next empty field.
3. “Mostly S, M and L. I counted 18, not 20.” opens the conflict: 20 stated, 18 counted.
4. “18 is correct. Two pieces have small stains.” confirms 18 and records the defect.
5. “Confirm record” publishes the version. The buyer reads the same fields.
6. After delivery, the draft in `lib/claim.ts` gathers order `FLK-DEMO-1842`, the confirmed description, the report, the photo checklist, and the guidance to make contact within five days. Partial returns depend on the supplier. The text does not decide eligibility or a refund.

Each field carries the status `declared`, `confirmed`, or `unknown` (`lib/types.ts`). Reloading the page clears the lot. That is the gap Supabase closes.

## Journey

### Supplier

Sends a message or a photo. The agent saves what it could extract, asks one question, and stops when the supplier confirms. Confirmation is an explicit act, not silence.

### Buyer

Opens the published document. Sees the confirmed quantity, sizes, declared defects, the subtotal before shipping, and what is still unknown. If the delivery differs, describes the difference and marks the checklist photos.

### Reviewer

Reads the same document and the report. The public guidance appears as a citation, with the source of the search. The decision stays with the person.

## Where each tool sits

None of them changes the rule above.

| Tool | Role | Outside the role |
| --- | --- | --- |
| Cursor | Build the app and connect the agent to the APIs | Not a user-facing surface |
| Grok Bot | Run the conversation and call the lot tools | Does not verify the supplier and does not decide a refund |
| Supabase | Auth, Postgres, and Storage | Does not publish the buyer page |
| Sanity | Document the buyer and the reviewer read | Does not extract the message |
| Commerce Layer | SKU and order only after “I confirm” | No purchasable item exists before confirmation |
| Tavily | Look up the public guidance when the draft is built | Not a source of truth for the lot |
| PostHog | Measure the funnel | Does not choose the next question on its own |
| Recharge | Out of this hack | A one-off lot is not a subscription |

Shopify stays an unbuilt alternative. It fits if the lot lives in the supplier’s own store and the order is created there. Commerce Layer fits this product: FleekFlow is the marketplace and the shop is the source. The two together would compete for the same lot. This PRD chooses Commerce Layer.

## Requirements by tool

### Grok Bot

Replaces the rules extraction in `lib/agent.ts`. A loose message fills shop, country, quantity, price, brand, colour, category, sizes, and defects only when those facts appear in the text. The bot asks one question, for the next empty field, in this order: quantity conflict, minimum lot facts, sizes, defects. It stops when the supplier confirms.

Bot tools:

- Save the lot, field by field, with status.
- Upload a photo to Storage.
- Publish the confirmed version to Sanity.
- Create the Commerce Layer SKU only at that moment.
- Build the review draft, with the Tavily search attached as a citation.

The bot replies in Portuguese when the supplier’s message is in Portuguese. The judges’ interface stays in English.

### Supabase

Auth separates three roles: supplier, buyer, and reviewer. One role does not read another role’s private draft. Internal messages, unpublished cost, and personal data stay with the role that sent them.

Postgres stores the lot, the status of each field, the conflict (`stated` 20, `counted` 18), the quantity-corrected flag, the published version, and the buyer report.

Storage stores the checklist photos: front of the piece, size label, close-up of the defect, lot or packing photo. The demo’s photo count becomes a file with a type.

### Sanity

When the supplier confirms, the record becomes a document: title, a description written only from supplied facts, sizes, declared defects, unit price, confirmed quantity, subtotal before shipping, and the list of what stayed unknown (grade, shipping, duties, unless the supplier stated them). The bot writes the draft. Sanity publishes that version. The buyer and the reviewer read the same document. Changing the lot after publication requires “Revise record” and a new confirmation.

### Commerce Layer

The purchasable item is created after “I confirm”. SKU priced in GBP. Stock equals the confirmed quantity (18, not 20). The market follows the lot’s country. The demonstration order uses `FLK-DEMO-1842` and exists only after that confirmation. Before then, the storefront shows the draft as not purchasable, or does not show it.

### Tavily

While building the draft, it searches for the public guidance: contact within five days of receipt, order number, description of the problem, photos or videos when they apply, and partial returns that depend on the supplier. The passage enters labeled “found on the web”, with the page address. If the search fails, the draft uses the guidance already stored in `lib/claim.ts` and says the search did not respond. Shipping or duty context found on the web does not fill the lot field.

### PostHog

Events, with no automatic decision:

- `message_sent`
- `field_filled`, with the field name
- `quantity_conflict_opened`
- `quantity_conflict_resolved`
- `record_confirmed`
- `buyer_opened_lot`
- `mismatch_report_sent`

Later it is possible to compare whether asking for sizes before defects reduces drop-off. The hack records the events. It does not change the question order during the demo.

### Recharge

Out of the hack. A later use is a monthly drop from the same supplier, or a size pack sold together. A one-off lot does not become a subscription.

## Implementation order

1. Grok Bot runs the conversation and calls the same rules as the current agent.
2. Supabase persists the lot, the photos, and the confirmed version.
3. Sanity shows that version to the buyer.
4. Commerce Layer creates the purchasable item only after “I confirm”.
5. Tavily searches for the five-day policy when the draft is built.
6. PostHog records the funnel.
7. Recharge stays out.

Step 1 must keep passing `lib/agent.spec.ts`: CoCreate Hub opening, the 18-versus-20 conflict, confirmation with stains, £144 subtotal, and a draft that does not decide a refund.

## Acceptance criteria

- A message with no sizes does not invent sizes.
- Two quantities in the same case stay in conflict until the supplier picks one.
- SKU stock is the confirmed quantity.
- The buyer and the reviewer see the published document, not a second text.
- Shipping and duties stay unknown if the supplier does not give the amount.
- The draft cites the five-day guidance and states that review is human.
- Reloading the page returns the same lot for the authenticated role.
- An uploaded photo does not change grade, brand, or verification status.

## Out of this hack

Publishing into Fleek for real. Filling the Fleek app through WhatsApp. A customs calculator. A verified-supplier badge. A risk score. An authenticity model. Listy, the piece-by-piece resale listing. Shopify in parallel with Commerce Layer. Recharge. Two separate apps for supplier and buyer.
