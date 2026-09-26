import PptxGenJS from "/tmp/fleek-pptx/node_modules/pptxgenjs/dist/pptxgen.es.js";
import { writeFileSync } from "node:fs";

const pptx = new PptxGenJS();
pptx.defineLayout({ name: "WIDE", width: 13.333, height: 7.5 });
pptx.layout = "WIDE";
pptx.author = "FleekFlow";
pptx.title = "FleekFlow — Finish the lot";
pptx.subject = "Merchant tooling pitch";

const C = {
  yellow: "F8C040",
  green: "178A56",
  greenTint: "E7F6EE",
  ink: "1D1D1F",
  secondary: "6E6E73",
  onInk: "C7C7CC",
  canvas: "F2F2F7",
  card: "FFFFFF",
  line: "D2D2D7",
  fill: "F4F5F7",
  disabled: "E8E8ED",
  disabledLabel: "3A3A3E",
  dot: "C7C7CC",
};

const FONT = "Helvetica Neue";
const shadow = {
  type: "outer",
  color: "000000",
  blur: 28,
  opacity: 0.14,
  offset: 10,
  angle: 90,
};

function slideBase() {
  const slide = pptx.addSlide();
  slide.background = { color: C.canvas };
  return slide;
}

function footer(slide, n) {
  slide.addText("FleekFlow", {
    x: 0.7,
    y: 7.08,
    w: 2.2,
    h: 0.28,
    fontFace: FONT,
    fontSize: 12,
    bold: true,
    color: C.secondary,
    margin: 0,
  });
  slide.addText(String(n), {
    x: 11.6,
    y: 7.08,
    w: 1.05,
    h: 0.28,
    fontFace: FONT,
    fontSize: 12,
    bold: true,
    color: C.secondary,
    align: "right",
    margin: 0,
  });
}

function sheet(slide, x, y, w, h) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: C.card },
    line: { color: C.line, width: 1 },
    rectRadius: 0.06,
    shadow,
  });
}

function title(slide, text, y = 0.42, h = 1.45) {
  slide.addText(text, {
    x: 0.7,
    y,
    w: 11.9,
    h,
    fontFace: FONT,
    fontSize: 36,
    bold: true,
    color: C.ink,
    margin: 0,
    charSpacing: -0.8,
    valign: "top",
  });
}

function pill(slide, x, y, w, h, label, fill, color) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: fill },
    line: fill === C.card ? { color: C.line, width: 1 } : { color: fill, width: 0 },
    rectRadius: h / 2,
  });
  slide.addText(label, {
    x,
    y,
    w,
    h,
    fontFace: FONT,
    fontSize: 12,
    bold: true,
    color,
    align: "center",
    valign: "middle",
    margin: 0,
  });
}

function dots(slide, x, y, active) {
  for (let i = 0; i < 4; i += 1) {
    const on = active === "done" || i === active;
    slide.addShape(pptx.ShapeType.ellipse, {
      x: x + i * 0.26,
      y,
      w: 0.14,
      h: 0.14,
      fill: { color: on ? C.yellow : C.dot },
      line: { color: on ? C.yellow : C.dot, width: 0 },
    });
  }
}

function field(slide, x, y, w, label, value, unknown = false) {
  slide.addText(label, {
    x,
    y,
    w,
    h: 0.24,
    fontFace: FONT,
    fontSize: 12,
    bold: true,
    color: C.secondary,
    margin: 0,
  });
  slide.addText(value, {
    x,
    y: y + 0.24,
    w,
    h: 0.32,
    fontFace: FONT,
    fontSize: 16,
    color: unknown ? C.secondary : C.ink,
    margin: 0,
  });
}

// 1 — Open
{
  const s = slideBase();
  s.addText("Finish the lot\nbefore anyone\nbuys it.", {
    x: 0.72,
    y: 1.35,
    w: 6.15,
    h: 2.85,
    fontFace: FONT,
    fontSize: 46,
    bold: true,
    color: C.ink,
    margin: 0,
    charSpacing: -1.1,
    valign: "top",
  });
  s.addText("FleekFlow writes the wholesale record in conversation. The supplier confirms it. That record stays for the buyer and for any later mismatch.", {
    x: 0.72,
    y: 4.45,
    w: 5.7,
    h: 1.35,
    fontFace: FONT,
    fontSize: 18,
    color: C.secondary,
    margin: 0,
  });
  sheet(s, 7.25, 0.48, 5.4, 6.5);
  s.addText("Upload products", {
    x: 7.58,
    y: 0.78,
    w: 4.7,
    h: 0.42,
    fontFace: FONT,
    fontSize: 22,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  dots(s, 7.58, 1.32, 0);
  const rows = [
    ["Shop", "Not stated"],
    ["Quantity", "Not stated"],
    ["Sizes", "Not stated"],
    ["Defects", "Not stated"],
  ];
  rows.forEach((row, i) => {
    const y = 1.78 + i * 0.88;
    if (i > 0) {
      s.addShape(pptx.ShapeType.rect, {
        x: 7.58,
        y,
        w: 4.74,
        h: 0.012,
        fill: { color: C.line },
        line: { color: C.line, width: 0 },
      });
    }
    field(s, 7.58, y + 0.14, 4.6, row[0], row[1], true);
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 7.58,
    y: 5.58,
    w: 4.74,
    h: 0.56,
    fill: { color: C.disabled },
    line: { color: C.disabled, width: 0 },
    rectRadius: 0.08,
  });
  s.addText("Confirm record", {
    x: 7.58,
    y: 5.58,
    w: 4.74,
    h: 0.56,
    fontFace: FONT,
    fontSize: 16,
    bold: true,
    color: C.disabledLabel,
    align: "center",
    valign: "middle",
    margin: 0,
  });
  footer(s, 1);
  s.addNotes("Finish the lot before anyone buys it. FleekFlow writes the wholesale record in conversation, the supplier confirms it, and that same record stays for the buyer and for any later mismatch. The sheet on the right is still empty. Confirm stays off until the supplier says the facts.");
}

// 2 — Incomplete record
{
  const s = slideBase();
  title(s, "A reseller chooses a lot\nfrom an incomplete record.");
  sheet(s, 0.7, 2.2, 11.93, 4.55);
  const rows = [
    ["Quantity", "20 on the listing. The count can be 18.", "Open"],
    ["Sizes", "The mix is missing until someone asks.", "Unknown"],
    ["Defects", "Stains show up in the box, after the purchase.", "Unknown"],
    ["Shipping and duties", "The cost is assumed when it was never stated.", "Unknown"],
  ];
  rows.forEach((row, i) => {
    const y = 2.2 + i * 1.14;
    if (i > 0) {
      s.addShape(pptx.ShapeType.rect, {
        x: 1.05,
        y,
        w: 11.23,
        h: 0.01,
        fill: { color: C.line },
        line: { color: C.line, width: 0 },
      });
    }
    s.addText(row[0], {
      x: 1.05,
      y: y + 0.28,
      w: 3.3,
      h: 0.55,
      fontFace: FONT,
      fontSize: 18,
      bold: true,
      color: C.ink,
      margin: 0,
      valign: "middle",
    });
    s.addText(row[1], {
      x: 4.4,
      y: y + 0.28,
      w: 5.5,
      h: 0.55,
      fontFace: FONT,
      fontSize: 16,
      color: C.secondary,
      margin: 0,
      valign: "middle",
    });
    const unknown = row[2] === "Unknown";
    pill(s, 10.15, y + 0.38, 1.95, 0.36, row[2], unknown ? C.fill : C.ink, unknown ? C.secondary : C.card);
  });
  footer(s, 2);
  s.addNotes("Name the four gaps. Quantity can disagree with itself: 20 stated, 18 counted. Sizes, defects, shipping, and duties are often missing. Do not claim this product fixes photographing, sourcing, or returns as market shares.");
}

// 3 — After delivery
{
  const s = slideBase();
  title(s, "The mismatch starts\nthe story again.", 0.42, 1.35);
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.7,
    y: 2.15,
    w: 7.35,
    h: 4.55,
    fill: { color: C.ink },
    line: { color: C.ink, width: 0 },
    rectRadius: 0.06,
  });
  s.addText("The confirmed\nversion is missing.", {
    x: 1.05,
    y: 2.55,
    w: 6.6,
    h: 1.8,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: C.card,
    margin: 0,
    charSpacing: -0.6,
  });
  s.addText("The buyer repeats what arrived. The reviewer does not have the listing the supplier stood behind before the purchase.", {
    x: 1.05,
    y: 4.55,
    w: 6.4,
    h: 1.5,
    fontFace: FONT,
    fontSize: 18,
    color: C.onInk,
    margin: 0,
  });
  sheet(s, 8.25, 2.15, 4.38, 2.15);
  s.addText("The buyer\nretells the lot.", {
    x: 8.52,
    y: 2.38,
    w: 3.85,
    h: 0.9,
    fontFace: FONT,
    fontSize: 20,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  s.addText("Order, difference, and photos are gathered again.", {
    x: 8.52,
    y: 3.38,
    w: 3.85,
    h: 0.65,
    fontFace: FONT,
    fontSize: 15,
    color: C.secondary,
    margin: 0,
  });
  sheet(s, 8.25, 4.5, 4.38, 2.2);
  s.addText("The reviewer\ndecides without it.", {
    x: 8.52,
    y: 4.72,
    w: 3.85,
    h: 0.9,
    fontFace: FONT,
    fontSize: 20,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  s.addText("Nothing on the page shows what was known, and what stayed unknown.", {
    x: 8.52,
    y: 5.7,
    w: 3.85,
    h: 0.75,
    fontFace: FONT,
    fontSize: 15,
    color: C.secondary,
    margin: 0,
  });
  footer(s, 3);
  s.addNotes("This is the second half of the problem. The pain is repetition, and a case with no confirmed baseline.");
}

// 4 — The line
{
  const s = slideBase();
  s.addText("FleekFlow helps a supplier", {
    x: 0.85,
    y: 1.45,
    w: 11.4,
    h: 0.7,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.78,
    y: 2.28,
    w: 9.55,
    h: 0.78,
    fill: { color: C.yellow },
    line: { color: C.yellow, width: 0 },
    rectRadius: 0.08,
  });
  s.addText("finish a wholesale lot in conversation,", {
    x: 0.98,
    y: 2.28,
    w: 9.2,
    h: 0.78,
    fontFace: FONT,
    fontSize: 28,
    bold: true,
    color: C.ink,
    margin: 0,
    valign: "middle",
  });
  s.addText("then keeps that confirmed record for the buyer’s decision and for any later mismatch.", {
    x: 0.85,
    y: 3.25,
    w: 11.2,
    h: 1.7,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  footer(s, 4);
  s.addNotes("Read this line slowly. It is the whole product: one record, two moments. Before the purchase, and after a mismatch.");
}

// 5 — One document
{
  const s = slideBase();
  title(s, "Three people read\nthe same record.", 0.38, 1.3);
  sheet(s, 0.7, 2.0, 7.55, 4.7);
  const facts = [
    ["Shop", "CoCreate Hub, United Kingdom", false],
    ["Quantity", "18 confirmed", false],
    ["Sizes", "Mostly S, M and L", false],
    ["Defects", "Two pieces, small stains", false],
    ["Subtotal", "£144 before shipping", false],
    ["Shipping and duties", "Unknown", true],
  ];
  facts.forEach((row, i) => {
    const y = 2.22 + i * 0.72;
    s.addText(row[0], {
      x: 1.05,
      y,
      w: 2.5,
      h: 0.58,
      fontFace: FONT,
      fontSize: 15,
      bold: true,
      color: C.ink,
      margin: 0,
      valign: "middle",
    });
    s.addText(row[1], {
      x: 3.6,
      y,
      w: 4.3,
      h: 0.58,
      fontFace: FONT,
      fontSize: 15,
      color: row[2] ? C.secondary : C.ink,
      margin: 0,
      valign: "middle",
    });
  });
  sheet(s, 8.45, 2.0, 4.18, 2.2);
  s.addText("The supplier\nsays it and confirms it.", {
    x: 8.72,
    y: 2.28,
    w: 3.7,
    h: 0.95,
    fontFace: FONT,
    fontSize: 20,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  s.addText("Confirmation is an explicit act.", {
    x: 8.72,
    y: 3.4,
    w: 3.7,
    h: 0.45,
    fontFace: FONT,
    fontSize: 15,
    color: C.secondary,
    margin: 0,
  });
  sheet(s, 8.45, 4.4, 4.18, 2.3);
  s.addText("The buyer and the\nreviewer read this page.", {
    x: 8.72,
    y: 4.64,
    w: 3.7,
    h: 0.95,
    fontFace: FONT,
    fontSize: 20,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  s.addText("If the box differs, a person reviews the report and the photos.", {
    x: 8.72,
    y: 5.7,
    w: 3.65,
    h: 0.7,
    fontFace: FONT,
    fontSize: 15,
    color: C.secondary,
    margin: 0,
  });
  footer(s, 5);
  s.addNotes("Walk the sheet first. The buyer page is the outcome of the supplier’s work, not a second product. The reviewer sees that same document plus the report. A person decides.");
}

// 6 — Demo
{
  const s = slideBase();
  s.addText("CoCreate Hub, one lot.", {
    x: 0.7,
    y: 0.36,
    w: 8,
    h: 0.55,
    fontFace: FONT,
    fontSize: 32,
    bold: true,
    color: C.ink,
    margin: 0,
    charSpacing: -0.6,
  });
  sheet(s, 0.7, 1.15, 6.15, 5.55);
  s.addText("Wassist", {
    x: 0.98,
    y: 1.32,
    w: 3,
    h: 0.36,
    fontFace: FONT,
    fontSize: 18,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  const bubbles = [
    "CoCreate Hub, United Kingdom. 20 women’s blue shirts, unbranded, £8 each.",
    "Mostly S, M and L. I counted 18, not 20.",
    "18 is correct. Two pieces have small stains.",
  ];
  bubbles.forEach((text, i) => {
    const y = 1.82 + i * 1.48;
    s.addShape(pptx.ShapeType.roundRect, {
      x: 0.98,
      y,
      w: 5.55,
      h: 1.15,
      fill: { color: C.fill },
      line: { color: C.fill, width: 0 },
      rectRadius: 0.12,
    });
    s.addText(text, {
      x: 1.16,
      y,
      w: 5.2,
      h: 1.15,
      fontFace: FONT,
      fontSize: 15,
      color: C.ink,
      margin: 0,
      valign: "middle",
    });
  });
  sheet(s, 7.05, 1.15, 5.58, 5.55);
  s.addText("Upload products", {
    x: 7.35,
    y: 1.35,
    w: 4.2,
    h: 0.34,
    fontFace: FONT,
    fontSize: 18,
    bold: true,
    color: C.ink,
    margin: 0,
  });
  dots(s, 7.35, 1.78, "done");
  const confirmed = [
    ["Quantity", "18 confirmed  ·  20 was stated"],
    ["Sizes", "Mostly S, M and L"],
    ["Defects", "Two small stains, declared"],
    ["Subtotal", "£144 before shipping"],
    ["Shipping", "Unknown"],
  ];
  confirmed.forEach((row, i) => {
    field(s, 7.35, 2.15 + i * 0.7, 5.0, row[0], row[1], row[1] === "Unknown");
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 7.35,
    y: 5.72,
    w: 5.0,
    h: 0.52,
    fill: { color: C.yellow },
    line: { color: C.yellow, width: 0 },
    rectRadius: 0.08,
  });
  s.addText("Confirm record", {
    x: 7.35,
    y: 5.72,
    w: 5.0,
    h: 0.52,
    fontFace: FONT,
    fontSize: 16,
    bold: true,
    color: C.ink,
    align: "center",
    valign: "middle",
    margin: 0,
  });
  footer(s, 6);
  s.addNotes("Use this slide as the map, then switch to the live app. The conflict stays open until the supplier picks one number. Stock is 18, not 20. Order FLK-DEMO-1842 becomes a review draft. The draft compares the record with the report. It does not decide a refund.");
}

// 7 — The rule
{
  const s = slideBase();
  title(s, "Only what was said\nenters the record.", 0.38, 1.3);
  sheet(s, 0.7, 2.0, 11.93, 4.7);
  pill(s, 1.05, 2.28, 1.45, 0.36, "Declared", C.fill, C.ink);
  pill(s, 2.62, 2.28, 1.6, 0.36, "Confirmed", C.greenTint, C.ink);
  pill(s, 4.34, 2.28, 1.45, 0.36, "Unknown", C.disabled, C.disabledLabel);
  const rules = [
    ["Silence stays unknown.", "A field with no statement does not become a fact."],
    ["Grade stays open.", "FleekFlow does not assign a grade or mark the supplier as verified."],
    ["A photo shows a detail.", "It does not prove identity, authenticity, or every piece."],
    ["The SKU waits for “I confirm”.", "Stock equals the confirmed quantity. Shipping stays unknown until stated."],
  ];
  rules.forEach((row, i) => {
    const y = 2.9 + i * 0.88;
    s.addText(row[0], {
      x: 1.05,
      y,
      w: 4.3,
      h: 0.7,
      fontFace: FONT,
      fontSize: 18,
      bold: true,
      color: C.ink,
      margin: 0,
      valign: "middle",
    });
    s.addText(row[1], {
      x: 5.5,
      y,
      w: 6.7,
      h: 0.7,
      fontFace: FONT,
      fontSize: 16,
      color: C.secondary,
      margin: 0,
      valign: "middle",
    });
  });
  footer(s, 7);
  s.addNotes("This is the trust slide. A web search is labeled “found on the web” and never fills the lot. The purchasable item is created only after the supplier confirms.");
}

// 8 — Close
{
  const s = slideBase();
  s.addText("A clearer lot at the source.\nThe same record when\nthe box differs.", {
    x: 0.72,
    y: 1.25,
    w: 11.5,
    h: 2.7,
    fontFace: FONT,
    fontSize: 42,
    bold: true,
    color: C.ink,
    margin: 0,
    charSpacing: -1,
  });
  s.addText("I’ll show the supplier finish the lot, the buyer read it, and the reviewer receive that document.", {
    x: 0.72,
    y: 4.15,
    w: 9.2,
    h: 0.7,
    fontFace: FONT,
    fontSize: 18,
    color: C.secondary,
    margin: 0,
  });
  s.addShape(pptx.ShapeType.roundRect, {
    x: 0.72,
    y: 5.15,
    w: 2.35,
    h: 0.56,
    fill: { color: C.yellow },
    line: { color: C.yellow, width: 0 },
    rectRadius: 0.08,
  });
  s.addText("Live demo", {
    x: 0.72,
    y: 5.15,
    w: 2.35,
    h: 0.56,
    fontFace: FONT,
    fontSize: 16,
    bold: true,
    color: C.ink,
    align: "center",
    valign: "middle",
    margin: 0,
  });
  s.addText("Conversation   →   Confirmed record   →   Buyer decision   →   Human review", {
    x: 3.3,
    y: 5.15,
    w: 9.2,
    h: 0.56,
    fontFace: FONT,
    fontSize: 15,
    color: C.secondary,
    margin: 0,
    valign: "middle",
  });
  footer(s, 8);
  s.addNotes("End on the demo handoff. If there is time for one question, answer inside the rule: we record what was said, and a person decides the case.");
}

const out = new URL("./FleekFlow-pitch.pptx", import.meta.url);
const buffer = await pptx.write({ outputType: "nodebuffer" });
writeFileSync(out, buffer);
console.log(out.pathname);
