import {
  CONFIRM_COUNT_AND_DEFECTS_LINE,
  OPENING_LINE,
  SIZES_AND_COUNT_LINE,
  type Field,
  type LotRecord,
  type Provenance,
} from "./types";

export type Lang = "en" | "pt";

export function detectLang(text: string): Lang {
  return /\b(minha|loja|tenho|camisas|tamanhos|contei|manchas|peças|pecas|sem marca|correto|não|nao)\b/i.test(
    text,
  )
    ? "pt"
    : "en";
}

function fill<T>(field: Field<T>, value: T, status: Provenance = "declared"): Field<T> {
  if (field.status === "confirmed" && status !== "confirmed") return field;
  return { value, status };
}

function money(amount: number): string {
  return `£${amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)}`;
}

export function subtotal(lot: LotRecord): number | null {
  if (lot.quantity.value == null || lot.unitPrice.value == null) return null;
  return lot.quantity.value * lot.unitPrice.value;
}

export function isReady(lot: LotRecord): boolean {
  return (
    lot.published == null &&
    lot.quantityConflict == null &&
    lot.shopName.value != null &&
    lot.country.value != null &&
    lot.quantity.value != null &&
    lot.unitPrice.value != null &&
    lot.sizes.value != null &&
    lot.defects.value != null
  );
}

function refreshDerived(lot: LotRecord): LotRecord {
  const qty = lot.quantity.value;
  const color = lot.color.value ? lot.color.value.toLowerCase() : null;
  const audience = lot.audience.value ? lot.audience.value.toLowerCase() : null;
  const category = lot.category.value ? lot.category.value.toLowerCase() : "pieces";
  const title =
    qty != null
      ? `Lot of ${qty}${color ? ` ${color}` : ""}${audience ? ` ${audience}` : ""} ${category}`
      : lot.title.value;

  const parts: string[] = [];
  if (lot.shopName.value && lot.country.value) {
    parts.push(`${lot.shopName.value} (${lot.country.value})`);
  }
  if (qty != null && lot.category.value) {
    parts.push(
      `offers ${qty} ${lot.audience.value ? `${lot.audience.value.toLowerCase()} ` : ""}${lot.color.value ? `${lot.color.value.toLowerCase()} ` : ""}${lot.category.value.toLowerCase()}.`,
    );
  }
  if (lot.brand.value) parts.push(`Brand: ${lot.brand.value}.`);
  if (lot.sizes.value) parts.push(`Sizes: ${lot.sizes.value}.`);
  if (lot.defects.value) parts.push(`Known defects: ${lot.defects.value}.`);
  if (lot.unitPrice.value != null) {
    parts.push(`Unit price ${money(lot.unitPrice.value)}.`);
  }
  parts.push("Shipping and duties were not stated.");

  return {
    ...lot,
    title: title ? { value: title.replace(/\s+/g, " ").trim(), status: lot.title.status === "confirmed" ? "confirmed" : "declared" } : lot.title,
    description: {
      value: parts.join(" "),
      status: lot.description.status === "confirmed" ? "confirmed" : parts.length > 1 ? "declared" : "unknown",
    },
  };
}

function extractSizes(text: string): string | null {
  const matches = text.match(/\b(?:XXL|XL|XS|S|M|L)\b/g);
  if (!matches) return null;
  const unique = [...new Set(matches)];
  if (unique.length === 0) return null;
  if (unique.length === 1) return unique[0];
  return `${unique.slice(0, -1).join(", ")} and ${unique[unique.length - 1]}`;
}

function applyExtractions(lot: LotRecord, text: string): LotRecord {
  let next = { ...lot };

  const shop =
    text.match(/(?:my shop is|our shop is|the shop is|shop is|loja é(?: a)?|loja e(?: a)?)\s+([^,.\n]+)/i) ??
    text.match(/^([A-Za-z][\w'’&.-]*(?:\s+[A-Za-z][\w'’&.-]*){0,4}),\s*(?:the\s+)?(?:uk|u\.k\.|united kingdom|reino unido)\b/i);
  if (shop) next.shopName = fill(next.shopName, shop[1].trim());

  if (/\b(?:uk|u\.k\.|united kingdom|reino unido)\b/i.test(text)) {
    next.country = fill(next.country, "United Kingdom");
  }

  const shirtCount =
    text.match(/(\d+)\s+women(?:'s|s)?\s+(?:blue\s+)?(?:t-)?shirts?/i) ??
    text.match(/(\d+)\s+camisas\s+femininas(?:\s+azuis)?/i) ??
    text.match(/(\d+)\s+(?:blue\s+)?(?:t-)?shirts?/i) ??
    text.match(/\b(?:tenho|i have)\s+(\d+)\b/i);
  if (shirtCount && next.quantityConflict == null) {
    next.quantity = fill(next.quantity, Number(shirtCount[1]));
  }

  const price = text.match(/£\s*(\d+(?:\.\d{1,2})?)/) ?? text.match(/(\d+(?:\.\d{1,2})?)\s*(?:pounds?|gbp)\b/i);
  if (price) next.unitPrice = fill(next.unitPrice, Number(price[1]));

  if (/\b(?:unbranded|sem marca|no brand|without a brand)\b/i.test(text)) {
    next.brand = fill(next.brand, "Unbranded");
  }

  if (/\b(?:blue|azuis|azul)\b/i.test(text)) next.color = fill(next.color, "Blue");
  if (/\b(?:women(?:'s)?|femininas?|feminino)\b/i.test(text)) {
    next.audience = fill(next.audience, "Women's");
  }
  if (/\b(?:t-shirts?|shirts?|camisas)\b/i.test(text)) next.category = fill(next.category, "Shirts");

  const sizes = extractSizes(text);
  if (sizes) next.sizes = fill(next.sizes, sizes);

  const counted = text.match(/counted\s+(\d+)[^.]*\bnot\s+(\d+)/i) ?? text.match(/contei\s+(\d+)[^.]*\bn[aã]o\s+(\d+)/i);
  if (counted) {
    next.quantityConflict = { counted: Number(counted[1]), stated: Number(counted[2]) };
  }

  const correct = text.match(/\b(\d+)\s+is correct\b/i) ?? text.match(/\b(\d+)\s+(?:é|e)\s+(?:o\s+)?correto\b/i);
  if (correct) {
    const nextQty = Number(correct[1]);
    if (next.quantityConflict || (next.quantity.value != null && next.quantity.value !== nextQty)) {
      next.quantityCorrected = true;
    }
    next.quantity = { value: nextQty, status: "confirmed" };
    next.quantityConflict = null;
  }

  if (/\b(?:two|2)\s+pieces have small stains\b|\bduas peças (?:têm|tem) manchas\b|\bsmall stains\b|\bmanchas pequenas\b/i.test(text)) {
    next.defects = fill(next.defects, "Two pieces have small stains");
  } else if (/\b(?:no defects|sem defeitos|nenhum defeito|no stains)\b/i.test(text)) {
    next.defects = fill(next.defects, "None declared");
  }

  const shipping = text.match(/shipping(?:\s+is)?\s+£\s*(\d+(?:\.\d{1,2})?)/i);
  if (shipping) next.shipping = fill(next.shipping, money(Number(shipping[1])), "declared");

  return refreshDerived(next);
}

function question(lot: LotRecord, lang: Lang): string | null {
  if (lot.quantityConflict) {
    const { stated, counted } = lot.quantityConflict;
    return lang === "pt"
      ? `A primeira mensagem diz ${stated} peças e esta conta ${counted}. Qual quantidade fica no registro?`
      : `The first message says ${stated} pieces, and this one counts ${counted}. Which quantity should the record keep?`;
  }
  if (!lot.shopName.value || !lot.quantity.value || !lot.unitPrice.value) {
    return lang === "pt"
      ? "Conta o que você está vendendo: nome da loja, peças, quantidade e preço. Eu pergunto só o que ainda faltar."
      : "Tell me the shop, the pieces, the quantity, and the price. I will ask only about what is still missing.";
  }
  if (!lot.sizes.value) {
    return lang === "pt"
      ? "Quais tamanhos entram nessas peças?"
      : "Which sizes are included in these pieces?";
  }
  if (!lot.defects.value) {
    return lang === "pt"
      ? "Há manchas, furos ou outras marcas de uso? Se não houver, diga que não há defeitos."
      : "Are there stains, holes, or other signs of wear? If none, say there are no defects.";
  }
  return null;
}

function summary(lot: LotRecord, lang: Lang): string {
  const shop = lot.shopName.value ?? "This shop";
  const country = lot.country.value ?? "country not stated";
  const qty = lot.quantity.value;
  const price = lot.unitPrice.value;
  const total = subtotal(lot);
  const brand = lot.brand.value ?? (lang === "pt" ? "marca não informada" : "brand not stated");
  const bits = [
    lang === "pt"
      ? `Rascunho de ${shop} (${country}).`
      : `Draft for ${shop} (${country}).`,
  ];
  if (qty != null && price != null && total != null) {
    bits.push(
      lang === "pt"
        ? `${qty} peças, ${brand}, ${money(price)} cada (${money(total)} antes do frete).`
        : `${qty} pieces, ${brand}, ${money(price)} each (${money(total)} before shipping).`,
    );
  }
  if (lot.sizes.value) {
    bits.push(lang === "pt" ? `Tamanhos anotados: ${lot.sizes.value}.` : `Sizes noted: ${lot.sizes.value}.`);
  }
  if (lot.defects.value) {
    bits.push(
      lang === "pt"
        ? `Defeitos informados: ${lot.defects.value}.`
        : `Defects stated: ${lot.defects.value}.`,
    );
  }
  return bits.join(" ");
}

export function applyVendorMessage(lot: LotRecord, raw: string): { lot: LotRecord; reply: string } {
  const text = raw.trim();
  const lang = detectLang(text);
  if (lot.published) {
    return {
      lot,
      reply:
        lang === "pt"
          ? "Esse registro já foi confirmado. A prévia do comprador lê essa versão. Revise o registro se o fornecedor precisar mudar um campo."
          : "This record is already confirmed. The buyer preview reads that version. Revise the record if the supplier needs to change a field.",
    };
  }

  if (/^(confirm|confirmed|publish|confirmo|pode publicar)\b/i.test(text) && isReady(lot)) {
    return { lot: confirmRecord(lot), reply: confirmedReply("en") };
  }

  const next = applyExtractions(lot, text);
  const ask = question(next, lang);
  if (!ask) {
    return {
      lot: next,
      reply:
        lang === "pt"
          ? `${summary(next, lang)} Frete e impostos continuam desconhecidos. Confirme o registro quando a revisão estiver certa. Eu não atribuo grade e não decido reembolso.`
          : `${summary(next, lang)} Shipping and duties are still unknown. Confirm the record when the supplier review looks right. I will not assign a grade, and I will not decide a refund.`,
    };
  }
  const lead = next.shopName.value ? summary(next, lang) : "";
  return { lot: next, reply: lead ? `${lead} ${ask}` : ask };
}

export function addPhoto(lot: LotRecord): { lot: LotRecord; reply: string } {
  const next = { ...lot, photos: lot.photos + 1 };
  return {
    lot: next,
    reply:
      "Photo received. I can use it to notice a missing detail. It does not prove who the supplier is, whether the goods are authentic, or the condition of every piece in the lot.",
  };
}

function confirmedReply(lang: Lang): string {
  return lang === "pt"
    ? "Versão confirmada salva. O comprador vê este mesmo registro. O que não foi dito continua como desconhecido."
    : "Confirmed version saved. The buyer sees this same record. Anything the supplier did not state stays unknown.";
}

export function confirmRecord(lot: LotRecord): LotRecord {
  if (!isReady(lot)) return lot;
  const promote = <T,>(field: Field<T>): Field<T> =>
    field.value == null ? field : { value: field.value, status: "confirmed" };

  const promoted: LotRecord = refreshDerived({
    ...lot,
    shopName: promote(lot.shopName),
    country: promote(lot.country),
    category: promote(lot.category),
    audience: promote(lot.audience),
    color: promote(lot.color),
    brand: promote(lot.brand),
    quantity: promote(lot.quantity),
    unitPrice: promote(lot.unitPrice),
    sizes: promote(lot.sizes),
    defects: promote(lot.defects),
    grade: promote(lot.grade),
    title: promote(lot.title),
    description: promote(lot.description),
  });

  return {
    ...promoted,
    published: {
      productId: promoted.productId,
      at: new Date().toISOString(),
      shopName: promoted.shopName.value ?? "",
      country: promoted.country.value ?? "",
      title: promoted.title.value ?? "",
      description: promoted.description.value ?? "",
      category: promoted.category.value ?? "",
      audience: promoted.audience.value ?? "",
      color: promoted.color.value ?? "",
      brand: promoted.brand.value ?? "Not stated",
      quantity: promoted.quantity.value ?? 0,
      unitPrice: promoted.unitPrice.value ?? 0,
      currency: "GBP",
      sizes: promoted.sizes.value ?? "",
      defects: promoted.defects.value ?? "",
      photos: promoted.photos,
    },
  };
}

export function reviseRecord(lot: LotRecord): LotRecord {
  const demote = <T,>(field: Field<T>): Field<T> =>
    field.value == null ? { value: null, status: "unknown" } : { value: field.value, status: "declared" };

  return {
    ...lot,
    published: null,
    shopName: demote(lot.shopName),
    country: demote(lot.country),
    title: demote(lot.title),
    description: demote(lot.description),
    category: demote(lot.category),
    audience: demote(lot.audience),
    color: demote(lot.color),
    brand: demote(lot.brand),
    quantity: demote(lot.quantity),
    unitPrice: demote(lot.unitPrice),
    sizes: demote(lot.sizes),
    defects: demote(lot.defects),
    grade: demote(lot.grade),
  };
}

export function suggestedLine(lot: LotRecord): string | null {
  if (lot.published) return null;
  if (!lot.shopName.value || !lot.country.value) return "My shop is CoCreate Hub, in the UK.";
  if (!lot.quantity.value || !lot.unitPrice.value || !lot.category.value) {
    return "I have 20 women's blue shirts, unbranded, at £8 each.";
  }
  if (!lot.sizes.value) return "The sizes are S, M and L.";
  if (lot.quantityConflict) return "18 is correct.";
  if (!lot.defects.value) return "Two pieces have small stains.";
  if (isReady(lot)) return "Confirm record";
  return null;
}

export function openingAgentMessage(): string {
  return "Send a note about the lot, or a photo. I will fill the record and ask only about what is missing. I will not mark the supplier as verified, and I will not decide a refund.";
}
