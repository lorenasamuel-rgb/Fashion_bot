import assert from "node:assert/strict";
import { confirmRecord, applyVendorMessage } from "./agent";
import { buildClaim } from "./claim";
import {
  SUPPORT_ISSUE_LINE,
  SUPPORT_PHOTOS_LINE,
  SUPPORT_REVIEW_LINE,
  addSupportPhoto,
  applySupportMessage,
  suggestedSupportLine,
} from "./support";
import {
  CONFIRM_COUNT_AND_DEFECTS_LINE,
  OPENING_LINE,
  SIZES_AND_COUNT_LINE,
  createEmptyLot,
} from "./types";

function confirmedLot() {
  const opened = applyVendorMessage(createEmptyLot(), OPENING_LINE);
  const counted = applyVendorMessage(opened.lot, SIZES_AND_COUNT_LINE);
  const resolved = applyVendorMessage(counted.lot, CONFIRM_COUNT_AND_DEFECTS_LINE);
  return confirmRecord(resolved.lot);
}

const lot = confirmedLot();
assert.equal(suggestedSupportLine(lot), SUPPORT_ISSUE_LINE);

const reported = applySupportMessage(lot, SUPPORT_ISSUE_LINE);
assert.equal(reported.lot.buyerReport?.orderNumber, "FLK-DEMO-1842");
assert.match(reported.lot.buyerReport?.issues ?? "", /larger stains/);
assert.equal(reported.lot.buyerReport?.photoCount, 0);
assert.match(reported.reply, /small stains/);
assert.match(reported.reply, /I do not decide the refund/);
assert.doesNotMatch(reported.reply, /approved|owed|refused/i);

const photographed = applySupportMessage(reported.lot, SUPPORT_PHOTOS_LINE);
assert.equal(photographed.lot.buyerReport?.photoCount, 3);
assert.equal(photographed.lot.buyerReport?.windowStated, true);
assert.equal(photographed.lot.buyerReport?.receivedWithinFiveDays, true);
assert.equal(suggestedSupportLine(photographed.lot), SUPPORT_REVIEW_LINE);

const reviewed = applySupportMessage(photographed.lot, SUPPORT_REVIEW_LINE);
assert.equal(reviewed.lot.buyerReport?.reviewRequested, true);
assert.match(reviewed.reply, /prepared the review/i);
assert.match(reviewed.reply, /A person decides the refund/);
assert.equal(suggestedSupportLine(reviewed.lot), null);

const claim = buildClaim(reviewed.lot.published!, reviewed.lot.buyerReport!);
assert.match(claim, /does not decide whether a refund is due/);
assert.match(claim, /FLK-DEMO-1842/);

const complaint = applySupportMessage(createEmptyLot(), "Tenho uma reclamação");
assert.match(complaint.reply, /suporte/i);
assert.doesNotMatch(complaint.reply, /tamanhos/i);
assert.equal(complaint.lot.shopName.value, null);

const early = applySupportMessage(createEmptyLot(), "I want a refund for the blue shirts.");
assert.equal(early.lot.published, null);
assert.match(early.reply, /I do not decide the refund/);
assert.equal(early.lot.buyerReport?.reviewRequested, false);

const portuguese = applySupportMessage(lot, "Pedido FLK-DEMO-1842. As camisas chegaram com manchas maiores.");
assert.match(portuguese.reply, /não decido o reembolso/i);

const withPhoto = addSupportPhoto(reported.lot);
assert.equal(withPhoto.lot.buyerReport?.photoCount, 1);
assert.match(withPhoto.reply, /does not decide a refund/);

console.log("support checks passed");
