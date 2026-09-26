# FleekFlow PRD

Primary track: Merchant Tooling.

Submission line: “FleekFlow helps a Fleek seller create a store, add each product, and run client service. The chats fill the sheet automatically from what was said.”

## What this version is for

The seller does three jobs, in this order.

1. Create the store. The shop name and the country are the store.
2. Add products. Each confirmed product is one listing inside that store. The next product starts empty and stays in the same store.
3. Client service. The vendor follows each complaint in the Support session. Wassist brings the message in. The Grok Bot manages the ticket. A person decides any refund.

The seller does not type each field. The chat writes the sheet. Buyer mode is the seller checking what that store shows. It is the outcome of the first two jobs.

## Problem

A seller lists a wholesale product with quantity, sizes, defects, shipping, and duties split across messages. A later complaint then arrives without the version that was confirmed. The seller repeats the story, and the person who reviews the case does not have the product and the complaint in one place.

Reseller research points to frustration with photographing and listing (33%), sourcing (30%), and returns (10%). This product does not claim to resolve those shares. The testable hypothesis is that a store built from stated facts makes the next product easier to add, and the same confirmed product cuts repetition when a client writes in.

## Users

- Seller. Names the store, adds products, confirms each one, and follows client service.
- Client. Sends the order, what arrived differently, the checklist photos, and whether contact is inside five days.
- Person who decides the case. Reads the draft. The bot does not approve, refuse, or owe a refund.

## Product rule

What was not said stays unknown. No tool assigns a grade, proves authenticity, marks the seller as verified, or decides a refund. A photo can show a missing detail. It does not prove identity, authenticity, the condition of every piece, or that a refund is due. Shipping and duties leave “unknown” until the seller states the amount.

Client service prepares a review. It records whether the client said contact is inside five days, outside five days, or has not said. Outside the window, the draft tells the person to check what that means. It does not say the client lost a right. A review against a product opens after that product is confirmed.

The policy text in the draft is the guidance stored in `lib/claim.ts`.

## The chats fill the sheet

Two chats do the writing. The registration sheet only shows the result.

The product chat, on the desk, on the phone, or on WhatsApp, fills the store and the product. One message can fill several fields at once. “My shop is CoCreate Hub, in the UK. I have 20 women’s blue shirts, unbranded, at £8 each.” writes the shop, the country, the quantity, the audience, the colour, the category, the brand, and the price. The sheet updates on that turn. The bot then asks one question, for the next empty field. A suggested line sits under the thread so the seller can send the next fact without drafting it.

The Support session is where the vendor follows complaints. A message about a complaint, a refund, or an order number does not stay in the product chat. Wassist, or the product chat itself, opens a ticket. The Grok Bot writes the order number, the difference, the checklist photos named in the message, and the five-day window onto that ticket, then answers. The draft is built from those fields.

Grok may rephrase the reply. It may not add a fact the message did not contain. A field the chat did not hear stays empty. Confirming the product stays a separate tap. Silence does not publish the product, and silence does not decide a refund.

## Technologies in this app

| Technology | Job in this version |
| --- | --- |
| Next.js | Desk at `/` and phone at `/phone` |
| Grok (`grok-4.7`) | Speaks the product reply, and manages each complaint ticket, when `XAI_API_KEY` is set. Facts come from `lib/agent.ts` and `lib/support.ts`. If the key is missing, the call fails, or the support call exceeds twelve seconds, the same rules answer |
| Wassist | Carries WhatsApp into the app. A product message updates the store. A complaint opens a Support ticket and the reply goes back on the same conversation. `POST /api/wassist` checks `WASSIST_WEBHOOK_SECRET`, stores the message once, and replies with `WASSIST_API_KEY` |
| Supabase | Sessions, the store’s products, seller messages, and client-service threads. The server uses `SUPABASE_SECRET_KEY`. The browser does not hold that key |
| Vercel | Hosts the app |

`WASSIST_PHONE_NUMBER` is set on Vercel. The app does not read it.

## Create the store

The seller names the shop and the country in the product chat. The chat writes both onto the sheet. Example: CoCreate Hub, United Kingdom.

That name is the store. The registration sheet says so on the first product step: the supplier names the store first, and every confirmed product stays in it. Until the chat has heard the name, the sheet waits.

Reloading the desk returns that store for the session cookie, kept for 30 days. Reloading the phone returns the latest session that has a supplier phone. If Supabase is missing, the reply stays on screen and that turn is not kept.

“Publish your store on Fleek” shows the store in this demo. It does not send the store to the live Fleek app.

## Add products

The product chat fills the open product. Each message writes only the facts it contains, then asks for the next empty field, in this order: quantity conflict, the minimum facts, sizes, defects. The seller sees those fields on the sheet without typing them there.

The demonstration product:

1. “I have 20 women’s blue shirts, unbranded, at £8 each.”
2. “Mostly S, M and L. I counted 18, not 20.” opens the conflict: 20 stated, 18 counted.
3. “18 is correct. Two pieces have small stains.” confirms 18 and records the defect.
4. “Confirm record” adds the product to the store. Stock is 18. Subtotal before shipping is £144. Shipping and duties stay unknown.
5. “Revise this product” unpublishes that product and returns its fields to declared. A later change needs a new confirmation.
6. “Upload listing” starts the next product. The store name and country stay. Quantity, sizes, and defects start empty.

A photo, including media on a Wassist message, increments the photo count. It does not change grade, brand, or verification. The stored line for a photo with no body is “Photo of the shirts attached.”

After confirmation, a new seller message does not edit that product. The seller revises it first. Confirmation is an explicit act.

The bot replies in Portuguese when the seller writes in Portuguese. The judges’ interface stays in English.

## Client service

The vendor follows complaints in the Support session. On the phone that session is the Support tab. On the desk it is the Support chat. The product chat stays for the store.

Wassist and the Grok Bot share the tickets.

1. A WhatsApp message that mentions a complaint, a refund, or an order such as `FLK-DEMO-1842` does not change the product. Wassist posts it to `/api/wassist`. The handler opens a ticket in `complaints` and `complaint_messages`, or continues the thread when the same address and subject already exist.
2. The Grok Bot manages that ticket. It records the order, what arrived differently, the checklist photos named in the message, and whether contact is inside five days. It replies on the same Wassist conversation. The checklist is front of a piece, size label, close-up of the stain or other defect, and lot or packing photo.
3. The same handoff happens when the vendor types that complaint in the product chat. The message leaves the listing and the Support session opens on the new ticket.
4. The vendor reads the ticket list in Support: who wrote, the subject, and the latest line. “Grok Bot Assist” opens the latest ticket. The phone refreshes the list from Supabase.
5. “Please prepare the refund review.” makes the Grok Bot prepare the draft in `lib/claim.ts`: the order, the confirmed product when that product is open, the report, the photo checklist, and the five-day window. A person decides the refund.

If the product is not confirmed, the bot records the order and says the case opens after confirmation.

A test form on the phone sends a client email into the same ticket list. A later email from the same address continues the thread when the subject matches.

A ticket that arrives by email or by Wassist is saved on its own report. It is not yet joined to the confirmed product in the store, so that reply cannot quote the product’s quantity, sizes, or defects. The desk Support chat is the path that compares the complaint with the open product. Joining the Wassist ticket to that product is the remaining step of client service in this version.

## Acceptance criteria

Store:

- One product-chat message that names the shop and the country fills both fields on the sheet.
- The shop name and country create the store.
- A second product keeps that store and starts with empty quantity, sizes, and defects.
- Reloading returns the same store and its confirmed products when Supabase is configured.

Products:

- The product chat writes quantity, price, brand, colour, category, sizes, and defects onto the sheet when those words are in the message.
- A message with no sizes does not invent sizes.
- Two quantities in the same product stay in conflict until the seller picks one.
- The quantity on the product in the store is the confirmed quantity.
- Shipping and duties stay unknown if the seller does not give the amount.
- An uploaded photo does not change grade, brand, or verification status.
- A repeated Wassist message is stored once.

Client service:

- A Wassist complaint opens a Support ticket and the Grok Bot answers on that WhatsApp conversation.
- A complaint typed in the product chat moves into the Support session.
- The vendor sees the ticket in Support after reload.
- The Grok Bot writes the order number, the difference, the named checklist photos, and the five-day window onto the ticket.
- The reply compares the report with the confirmed defects, sizes, and quantity of the open product, and does not approve or refuse a refund.
- A complaint before confirmation does not open a review.
- The draft cites the five-day guidance and states that a person decides.
- A client email and the bot’s answer remain in the complaints list after reload.

The supplier checks in `lib/agent.spec.ts` stay required: CoCreate Hub opening, the 18-versus-20 conflict, confirmation with stains, and the £144 subtotal.

The support checks in `lib/support.spec.ts` stay required: the order and the mismatch, three named checklist photos, contact inside five days, a prepared review that a person decides, Portuguese that refuses to decide the refund, and no review before the product is confirmed.

## Not in this version

Publishing the store into the live Fleek app. A photo file in Storage. A login that separates seller, client, and reviewer. Sanity, Commerce Layer, Tavily, PostHog, Shopify, and Recharge. A customs calculator. A verified-seller badge. A risk score. An authenticity model. Piece-by-piece resale listing.
