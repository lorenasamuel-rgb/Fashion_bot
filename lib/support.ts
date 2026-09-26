import { detectLang, type Lang } from "./agent";
import { PHOTO_CHECKLIST } from "./claim";
import { DEMO_MISMATCH, DEMO_ORDER_NUMBER, type BuyerReport, type LotRecord } from "./types";

export const SUPPORT_ISSUE_LINE = `Order ${DEMO_ORDER_NUMBER}. ${DEMO_MISMATCH}`;

export const SUPPORT_PHOTOS_LINE =
  "I received it today, inside five days. Photos: front of a piece, size label, and a close-up of the stain.";

export const SUPPORT_REVIEW_LINE = "Please prepare the refund review.";

export function openingSupportMessage(): string {
  return "This is Grok support for clients and refunds. Send the order number and what arrived differently from the listing. I prepare the review. A person decides any refund.";
}

export function suggestedSupportLine(lot: LotRecord): string | null {
  const report = lot.buyerReport;
  if (!report?.issues.trim()) return SUPPORT_ISSUE_LINE;
  if (report.photoCount < 3) return SUPPORT_PHOTOS_LINE;
  if (report.windowStated === false) return "I received it today, inside five days.";
  if (!report.reviewRequested) return SUPPORT_REVIEW_LINE;
  return null;
}

function supportLang(text: string): Lang {
  if (detectLang(text) === "pt") return "pt";
  if (/\b(pedido|reembolso|recebi|etiqueta|diferente|fotos|hoje|mancha|listagem|dentro)\b/i.test(text)) return "pt";
  return "en";
}

function emptyReport(): BuyerReport {
  return {
    orderNumber: DEMO_ORDER_NUMBER,
    receivedWithinFiveDays: true,
    windowStated: false,
    issues: "",
    photoCount: 0,
    reviewRequested: false,
  };
}

function photosMentioned(text: string): number {
  if (!/\bphotos?\b|\bfotos?\b|close-up|front of a piece|checklist/i.test(text)) return 0;
  let count = 0;
  if (/front of a piece|frente da pe[cç]a/i.test(text)) count += 1;
  if (/size label|etiqueta de tamanho/i.test(text)) count += 1;
  if (/close-up|close up/i.test(text)) count += 1;
  if (/packing photo|lot or packing|foto da embalagem/i.test(text)) count += 1;
  return count || 1;
}

function asksForReview(text: string): boolean {
  return /prepare the (refund )?review|refund review|open a refund|pedir (o )?reembolso|quero (um )?reembolso|revis[aã]o do reembolso/i.test(
    text,
  );
}

function isFollowUp(text: string): boolean {
  if (asksForReview(text)) return true;
  const aboutPhotos = /\bphotos?\b|\bfotos?\b|close-up|front of a piece|frente da pe[cç]a/i.test(text) && text.length < 240;
  const aboutWindow =
    /(five days|dentro de cinco|inside five|within five|fora de cinco|outside five)/i.test(text) &&
    text.length < 160 &&
    !/listing|listagem|shirt|camisa/i.test(text);
  return aboutPhotos || aboutWindow;
}

function applyWindow(report: BuyerReport, text: string): BuyerReport {
  if (/outside five|after five|fora de cinco|depois de cinco/i.test(text)) {
    return { ...report, receivedWithinFiveDays: false, windowStated: true };
  }
  if (/within five|inside five|five days|dentro de cinco|\bhoje\b|\btoday\b/i.test(text)) {
    return { ...report, receivedWithinFiveDays: true, windowStated: true };
  }
  return report;
}

function nextPhoto(report: BuyerReport): string | null {
  return PHOTO_CHECKLIST[report.photoCount] ?? null;
}

function comparison(lot: LotRecord, lang: Lang): string {
  const published = lot.published;
  const issues = lot.buyerReport?.issues.trim() || "";
  if (!published) return "";
  const defects = published.defects || (lang === "pt" ? "defeitos não informados" : "defects not stated");
  const sizes = published.sizes || (lang === "pt" ? "tamanhos não informados" : "sizes not stated");
  if (lang === "pt") {
    return `O registro confirmado diz: ${defects}. Tamanhos: ${sizes}. Quantidade: ${published.quantity}. Você relata: ${issues}`;
  }
  return `The confirmed record said: ${defects}. Sizes: ${sizes}. Quantity: ${published.quantity}. You report: ${issues}`;
}

function replyFor(lot: LotRecord, lang: Lang): string {
  const report = lot.buyerReport ?? emptyReport();
  const published = lot.published;
  const order = report.orderNumber || DEMO_ORDER_NUMBER;

  if (!report.issues.trim()) {
    return lang === "pt"
      ? "Diga o que chegou diferente da listagem, com o número do pedido. Eu preparo a revisão. Eu não decido o reembolso."
      : "Tell me what arrived differently from the listing, with the order number. I prepare the review. I do not decide the refund.";
  }

  if (!published) {
    return lang === "pt"
      ? `Anotei o pedido ${order}. O caso abre depois que o fornecedor confirma a listagem. Eu não decido o reembolso.`
      : `I recorded order ${order}. The case opens after the supplier confirms the listing. I do not decide the refund.`;
  }

  const compared = comparison(lot, lang);
  const photo = nextPhoto(report);

  if (report.reviewRequested) {
    const windowLine =
      report.windowStated === false
        ? lang === "pt"
          ? "Você ainda não disse se o contato está dentro de cinco dias."
          : "You have not said whether contact is inside five days."
        : report.receivedWithinFiveDays
          ? lang === "pt"
            ? "O contato está dentro de cinco dias."
            : "Contact is inside five days."
          : lang === "pt"
            ? "O contato está fora de cinco dias. Uma pessoa precisa ver o que isso significa aqui."
            : "Contact is outside five days. A person needs to check what that means here.";
    const photoLine = photo
      ? lang === "pt"
        ? `Ainda falta esta foto da lista: ${photo}.`
        : `This checklist photo is still missing: ${photo}.`
      : lang === "pt"
        ? "As fotos que você marcou ficam com a revisão."
        : "The photos you marked stay with the review.";
    return lang === "pt"
      ? `Preparei a revisão do pedido ${order}. ${compared} ${windowLine} ${photoLine} Uma pessoa decide o reembolso.`
      : `I prepared the review for order ${order}. ${compared} ${windowLine} ${photoLine} A person decides the refund.`;
  }

  if (photo && report.photoCount < 3) {
    return lang === "pt"
      ? `${compared} Qual foto da lista você pode enviar agora: ${photo}? Eu não decido o reembolso.`
      : `${compared} Which checklist photo can you send now: ${photo}? I do not decide the refund.`;
  }

  if (report.windowStated === false) {
    return lang === "pt"
      ? `${compared} O contato foi dentro de cinco dias após o recebimento? Eu não decido o reembolso.`
      : `${compared} Was contact made within five days of receipt? I do not decide the refund.`;
  }

  return lang === "pt"
    ? `${compared} Posso preparar a revisão para uma pessoa. Eu não decido o reembolso.`
    : `${compared} I can prepare the review for a person. I do not decide the refund.`;
}

export function isClientComplaint(text: string): boolean {
  return /\b(reclama[cç][aã]o|reclama[cç][oõ]es|complaint|refund|reembolso)\b/i.test(text) || /\b(?:order|pedido)\s+flk-/i.test(text);
}

export function applySupportMessage(lot: LotRecord, raw: string): { lot: LotRecord; reply: string } {
  const text = raw.trim();
  const lang = supportLang(text);
  const orderMatch = text.match(/FLK-[A-Z0-9-]+/i);
  const statesDifference = /stain|mancha|different|diferente|arrived|cheg(?:ou|aram)|wrong|errado|size label|etiqueta/i.test(text);
  if (isClientComplaint(text) && !orderMatch && !statesDifference && !asksForReview(text)) {
    return {
      lot: { ...lot, buyerReport: { ...(lot.buyerReport ?? emptyReport()), reviewRequested: false } },
      reply:
        lang === "pt"
          ? "Esta conversa é de suporte. Diz o número do pedido e o que chegou diferente da listagem. Eu não decido o reembolso."
          : "This chat is support. Send the order number and what arrived differently from the listing. I do not decide the refund.",
    };
  }

  let report = applyWindow(lot.buyerReport ?? emptyReport(), text);
  if (orderMatch) report = { ...report, orderNumber: orderMatch[0].toUpperCase() };

  const mentioned = photosMentioned(text);
  if (mentioned > 0) report = { ...report, photoCount: Math.max(report.photoCount, mentioned) };

  if (!isFollowUp(text)) {
    report = { ...report, issues: report.issues.trim() ? `${report.issues.trim()} ${text}` : text };
  }

  if (asksForReview(text) && report.issues.trim()) {
    report = { ...report, reviewRequested: true };
  }

  const next = { ...lot, buyerReport: report };
  return { lot: next, reply: replyFor(next, lang) };
}

export function addSupportPhoto(lot: LotRecord): { lot: LotRecord; reply: string } {
  const report = lot.buyerReport ?? emptyReport();
  const nextReport = { ...report, photoCount: report.photoCount + 1 };
  const next = { ...lot, buyerReport: nextReport };
  const missing = nextPhoto(nextReport);
  const reply = missing
    ? `Photo received. It shows the piece you named. It does not decide a refund. The next checklist photo is ${missing}.`
    : "Photo received. The checklist photos you marked stay with the review. I do not decide a refund.";
  return { lot: next, reply };
}
