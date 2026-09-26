import assert from "node:assert/strict";
import { applyVendorMessage, confirmRecord, isReady, subtotal } from "./agent";
import { buildClaim } from "./claim";
import {
  CONFIRM_COUNT_AND_DEFECTS_LINE,
  createEmptyLot,
  DEMO_MISMATCH,
  DEMO_ORDER_NUMBER,
  OPENING_LINE,
  SIZES_AND_COUNT_LINE,
} from "./types";

const opened = applyVendorMessage(createEmptyLot(), OPENING_LINE);
assert.equal(opened.lot.shopName.value, "CoCreate Hub");
assert.equal(opened.lot.shopName.status, "declared");
assert.equal(opened.lot.country.value, "United Kingdom");
assert.equal(opened.lot.quantity.value, 20);
assert.equal(opened.lot.unitPrice.value, 8);
assert.equal(opened.lot.brand.value, "Unbranded");
assert.equal(opened.lot.color.value, "Blue");
assert.equal(opened.lot.sizes.status, "unknown");
assert.match(opened.reply, /Which sizes/);
assert.equal(subtotal(opened.lot), 160);

const counted = applyVendorMessage(opened.lot, SIZES_AND_COUNT_LINE);
assert.equal(counted.lot.sizes.value, "S, M and L");
assert.deepEqual(counted.lot.quantityConflict, { counted: 18, stated: 20 });
assert.equal(counted.lot.quantity.value, 20);
assert.match(counted.reply, /Which quantity/);

const resolved = applyVendorMessage(counted.lot, CONFIRM_COUNT_AND_DEFECTS_LINE);
assert.equal(resolved.lot.quantity.value, 18);
assert.equal(resolved.lot.quantity.status, "confirmed");
assert.equal(resolved.lot.quantityConflict, null);
assert.equal(resolved.lot.defects.value, "Two pieces have small stains");
assert.equal(resolved.lot.grade.status, "unknown");
assert.equal(resolved.lot.shipping.status, "unknown");
assert.equal(resolved.lot.duties.status, "unknown");
assert.equal(isReady(resolved.lot), true);
assert.equal(subtotal(resolved.lot), 144);

const confirmed = confirmRecord(resolved.lot);
assert.ok(confirmed.published);
assert.equal(confirmed.published?.quantity, 18);
assert.equal(confirmed.shopName.status, "confirmed");
assert.equal(confirmed.shipping.status, "unknown");

const claim = buildClaim(confirmed.published!, {
  orderNumber: DEMO_ORDER_NUMBER,
  receivedWithinFiveDays: true,
  issues: DEMO_MISMATCH,
  photoCount: 3,
});
assert.match(claim, /FLK-DEMO-1842/);
assert.match(claim, /five days/);
assert.match(claim, /does not decide whether a refund is due/);
assert.match(claim, /Two pieces have small stains/);
assert.match(claim, /larger stains/);

const portuguese = applyVendorMessage(
  createEmptyLot(),
  "Minha loja é a CoCreate Hub, no Reino Unido. Tenho 20 camisas femininas azuis, sem marca, por £8 cada.",
);
assert.equal(portuguese.lot.shopName.value, "CoCreate Hub");
assert.equal(portuguese.lot.quantity.value, 20);
assert.match(portuguese.reply, /tamanhos/i);

console.log("agent checks passed");
