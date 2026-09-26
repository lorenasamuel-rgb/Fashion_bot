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

The buyer reaches the report in two places. On the desk, the Support tab talks against the current lot. On the phone, a client email opens a complaint thread. Both use the same support rules. A person still decides any refund.

## Product rule

What was not said stays unknown. No tool assigns a grade, proves authenticity, marks the supplier as verified, or decides a refund. A photo can show a missing detail. It does not prove identity, authenticity, the condition of every piece, or that a refund is due. Shipping and duties leave “unknown” only when the supplier states the amount.

The support bot prepares a review. It does not approve, refuse, or owe a refund. It records whether the buyer said contact is inside five days, outside five days, or has not said. Outside the window, the draft tells the reviewer to check what that means. It does not say the buyer lost a right. A review against the confirmed listing opens only after the supplier has confirmed that listing.

The policy text in the draft is the guidance stored in `lib/claim.ts`. A live web search is not wired yet. When it is, a found passage enters labeled “found on the web” and does not fill a lot field.

## What today’s demo already does

The Next.js app has two surfaces. The desk is `/`. The phone is `/phone`.

The lot, the supplier thread, and the published version live in Supabase when the server key is set. Reloading the desk returns that lot for the session cookie. Reloading the phone returns the latest session that has a supplier phone. If Supabase is missing, the reply stays on screen and that turn is not kept.

### Supplier listing

1. The supplier describes the lot in the desk chat, in the phone Messages panel, or on WhatsApp through Wassist. Example: CoCreate Hub, United Kingdom, 20 women’s blue shirts, unbranded, £8 each.
2. Grok (`lib/grok.ts`) speaks the reply when `XAI_API_KEY` is set. The only writer of lot facts is `lib/agent.ts`. If the key is missing, the call fails, or the support call exceeds twelve seconds, the same rules answer.
3. The agent fills only what was said and asks for the next empty field.
4. “Mostly S, M and L. I counted 18, not 20.” opens the conflict: 20 stated, 18 counted.
5. “18 is correct. Two pieces have small stains.” confirms 18 and records the defect.
6. “Confirm record” publishes the version onto the lot. Buyer mode reads those fields. Stock in that version is 18. Subtotal before shipping is £144. Shipping and duties stay unknown.
7. “Revise record” unpublishes that version and returns the fields to declared. A later change needs a new confirmation.
8. A photo, including media on a Wassist message, increments the photo count. It does not change grade, brand, or verification.

Wassist posts to `/api/wassist`. The route checks the signature, ignores a message it has already stored, maps the phone number to one supplier session, saves the turn, and sends the reply back. The phone screen polls that session.

### Buyer report

On the desk, the Support tab runs against the open lot:

1. “Order FLK-DEMO-1842.” plus the mismatch records the difference and quotes the confirmed defects, sizes, and quantity.
2. The photo line marks the checklist items named in the message and records that contact is inside five days.
3. “Please prepare the refund review.” sets the review and opens Review mode when the listing is already confirmed.
4. The draft in `lib/claim.ts` shows the order, the confirmed description, the report, the photo checklist, and whether the five-day window was stated. It does not decide eligibility or a refund.

If the listing is not confirmed, the bot records the order and says the case opens after confirmation. It still does not decide a refund.

The desk support transcript itself is kept for the visit. The report on the lot is what Supabase stores.

### Complaints

The phone Support tab lists client emails from Supabase (`complaints` and `complaint_messages`). A test form on that screen sends an email and a message. The same support bot answers and stores the reply. A later email from the same address continues the thread when the subject matches.

An email thread starts from its own saved report. It does not attach itself to the supplier’s published lot. The comparison to the confirmed listing is the desk Support path.

## Journey

### Supplier

Sends a message or a photo on the desk, on the phone, or on WhatsApp. The agent saves what it could extract, asks one question, and stops when the supplier confirms. Confirmation is an explicit act, not silence. After confirmation, a new supplier message does not edit the record. The supplier uses “Revise record” first.

### Buyer

Opens the published document in Buyer mode. Sees the confirmed quantity, sizes, declared defects, the subtotal before shipping, and what is still unknown. If the delivery differs, describes the difference in the Support tab, marks the checklist photos, and says whether contact is inside five days.

### Reviewer

Reads the same published document and the report in Review mode. The stored five-day guidance appears in the draft. The decision stays with the person.

## Where each tool sits

None of them changes the rule above. “In this build” is what the demo runs. “Still planned” is a requirement that is not wired.

| Tool | Role | In this build | Outside the role |
| --- | --- | --- | --- |
| Cursor | Build the app and connect the agent to the APIs | Yes | Not a user-facing surface |
| Grok Bot | Speak the supplier reply and the support reply | Yes. Facts still come from the rule tools | Does not verify the supplier and does not decide a refund |
| Wassist | Carry the supplier conversation on WhatsApp | Yes. Signed inbound message and text reply | Does not publish into the live Fleek app |
| Supabase | Sessions, lots, messages, and complaint threads | Yes. Server key only | Does not publish a separate buyer site |
| Sanity | Document the buyer and the reviewer read | No. The published version is the lot row | Does not extract the message |
| Commerce Layer | SKU and order only after “I confirm” | No | No purchasable item exists before confirmation |
| Tavily | Look up the public guidance when the draft is built | No. The draft uses `lib/claim.ts` | Not a source of truth for the lot |
| PostHog | Measure the funnel | No | Does not choose the next question on its own |
| Recharge | Out of this hack | No | A one-off lot is not a subscription |

Shopify stays an unbuilt alternative. It fits if the lot lives in the supplier’s own store and the order is created there. Commerce Layer fits this product: FleekFlow is the marketplace and the shop is the source. The two together would compete for the same lot. This PRD chooses Commerce Layer.

## Requirements by tool

### Grok Bot

Runs beside the rules in `lib/agent.ts` and `lib/support.ts`. A loose supplier message fills shop, country, quantity, price, brand, colour, category, sizes, and defects only when those facts appear in the text. The bot asks one question, for the next empty field, in this order: quantity conflict, minimum lot facts, sizes, defects. It stops when the supplier confirms.

Supplier tool: save the message into the lot, field by field, with status. Grok may rephrase the draft reply. It may not add a fact the tool did not return.

Support tool: save the order, the difference, the five-day window, and named checklist photos. Grok may rephrase that draft. It may not decide a refund.

The bot replies in Portuguese when the message is in Portuguese. The judges’ interface stays in English.

Still to attach to the same bot, and not in this build: upload a photo file to Storage, publish the confirmed version to Sanity, create the Commerce Layer SKU at confirmation, and attach a Tavily citation to the draft.

### Wassist

`POST /api/wassist` accepts `subscription.message.received`. The signature header must match `WASSIST_WEBHOOK_SECRET`. The handler stores the supplier message once, updates the lot for that phone, and replies with `WASSIST_API_KEY`. A media attachment counts as one photo when the message has no body, the stored line is “Photo of the shirts attached.”

### Supabase

The server uses `SUPABASE_SECRET_KEY`. The browser does not hold that key.

A desk visit gets an HttpOnly session cookie, role `supplier`, kept for 30 days. A WhatsApp number gets one session and is reused. The phone screen opens the latest session that has a phone.

Postgres stores the lot, the status of each field, the conflict (`stated` 20, `counted` 18), the quantity-corrected flag, the published version, the buyer report, the supplier messages, and the complaint threads.

One session does not write another session’s lot. Complaint rows are separate from the supplier lot. There is not yet a login that separates buyer and reviewer accounts.

Photo files are not in Storage yet. The demo stores a count, and the support message can name checklist items: front of the piece, size label, close-up of the defect, lot or packing photo.

### Sanity

When this is connected, the confirmed record becomes a document: title, a description written only from supplied facts, sizes, declared defects, unit price, confirmed quantity, subtotal before shipping, and the list of what stayed unknown (grade, shipping, duties, unless the supplier stated them). The buyer and the reviewer read that document. Until then, they read `published` on the lot. Changing the lot after publication requires “Revise record” and a new confirmation.

### Commerce Layer

The purchasable item is created after “I confirm”. SKU priced in GBP. Stock equals the confirmed quantity (18, not 20). The market follows the lot’s country. The demonstration order uses `FLK-DEMO-1842` and exists only after that confirmation. Before then, the storefront shows the draft as not purchasable, or does not show it. This step is not built. The order number in the demo is the report’s reference, not a Commerce Layer order.

### Tavily

While building the draft, it searches for the public guidance: contact within five days of receipt, order number, description of the problem, photos or videos when they apply, and partial returns that depend on the supplier. The passage enters labeled “found on the web”, with the page address. If the search fails, the draft uses the guidance already stored in `lib/claim.ts` and says the search did not respond. Shipping or duty context found on the web does not fill the lot field. This step is not built. The current draft always uses the stored guidance.

### PostHog

Events, with no automatic decision:

- `message_sent`
- `field_filled`, with the field name
- `quantity_conflict_opened`
- `quantity_conflict_resolved`
- `record_confirmed`
- `buyer_opened_lot`
- `mismatch_report_sent`

Later it is possible to compare whether asking for sizes before defects reduces drop-off. The hack records the events. It does not change the question order during the demo. These events are not sent yet.

### Recharge

Out of the hack. A later use is a monthly drop from the same supplier, or a size pack sold together. A one-off lot does not become a subscription.

## Implementation order

Done:

1. The rule agent runs the supplier conversation and passes `lib/agent.spec.ts`.
2. Grok speaks that reply and the support reply, and falls back to the rules.
3. Supabase persists the session, the lot, the supplier messages, and the complaint threads.
4. Wassist receives the supplier’s WhatsApp message and replies.
5. The desk Support tab and `lib/support.spec.ts` prepare the review from the confirmed record.
6. The phone lists complaint emails and the bot answers them.

Still in this order:

1. Sanity shows the confirmed version as its own document.
2. Commerce Layer creates the purchasable item only after “I confirm”.
3. Storage keeps the checklist photos as files with a type.
4. Tavily searches for the five-day policy when the draft is built.
5. PostHog records the funnel.
6. Recharge stays out.

The supplier checks in `lib/agent.spec.ts` stay required: CoCreate Hub opening, the 18-versus-20 conflict, confirmation with stains, £144 subtotal, and a draft that does not decide a refund.

The support checks in `lib/support.spec.ts` stay required: the order and the mismatch, three named checklist photos, contact inside five days, a prepared review that a person decides, Portuguese that refuses to decide the refund, and no review request before the listing is confirmed.

## Acceptance criteria

- A message with no sizes does not invent sizes.
- Two quantities in the same case stay in conflict until the supplier picks one.
- The published quantity is the confirmed quantity.
- The buyer and the reviewer see that published version, not a second text.
- Shipping and duties stay unknown if the supplier does not give the amount.
- The draft cites the five-day guidance and states that review is human.
- Reloading the page returns the same lot when Supabase is configured.
- An uploaded photo does not change grade, brand, or verification status.
- The support reply compares the report to the confirmed defects, sizes, and quantity, and does not approve or refuse a refund.
- A complaint before confirmation does not open a review.
- A repeated Wassist message is stored once.
- A client email and the bot’s answer remain in the complaints list after reload.

## Out of this hack

Publishing into Fleek for real. A customs calculator. A verified-supplier badge. A risk score. An authenticity model. Listy, the piece-by-piece resale listing. Shopify in parallel with Commerce Layer. Recharge. Two separate apps for supplier and buyer. Buyer and reviewer logins. A photo file in Storage. Sanity, Commerce Layer, Tavily, and PostHog until the steps above are connected.
