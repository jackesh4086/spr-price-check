import priceData from '@/data/iphone-prices.json';

export type PriceType = 'fixed' | 'range' | 'from' | 'tbd';

export interface PriceInfo {
  type: PriceType;
  price?: number;
  min?: number;
  max?: number;
  from?: number;
  warrantyDays: number;
  eta: string;
  notes: string;
}

export interface QuoteResult {
  brand: string;
  model: { id: string; name: string };
  issue: { id: string; name: string };
  pricing: PriceInfo;
  currency: string;
  disclaimer: string;
  whatsappNumber: string;
}

export function getQuote(modelId: string, issueId: string): QuoteResult | null {
  const model = priceData.models.find((m) => m.id === modelId);
  const issue = priceData.issues.find((i) => i.id === issueId);

  if (!model || !issue) {
    return null;
  }

  const priceEntry = priceData.prices.find(
    (p) => p.modelId === modelId && p.issueId === issueId
  );

  if (!priceEntry) {
    return null;
  }

  const pricing: PriceInfo = {
    type: priceEntry.type as PriceType,
    warrantyDays: priceEntry.warrantyDays,
    eta: priceEntry.eta,
    notes: priceEntry.notes,
  };

  if (priceEntry.type === 'fixed' && 'price' in priceEntry) {
    pricing.price = priceEntry.price;
  } else if (priceEntry.type === 'range' && 'min' in priceEntry && 'max' in priceEntry) {
    pricing.min = priceEntry.min;
    pricing.max = priceEntry.max;
  } else if (priceEntry.type === 'from' && 'from' in priceEntry) {
    pricing.from = priceEntry.from;
  }

  return {
    brand: priceData.brand,
    model: { id: model.id, name: model.name },
    issue: { id: issue.id, name: issue.name },
    pricing,
    currency: priceData.currency,
    disclaimer: priceData.disclaimer,
    whatsappNumber: priceData.whatsappNumber,
  };
}

export function formatPrice(pricing: PriceInfo, currency: string): string {
  switch (pricing.type) {
    case 'fixed':
      return pricing.price === 0 ? 'FREE' : `${currency} ${pricing.price}`;
    case 'range':
      return `${currency} ${pricing.min} - ${pricing.max}`;
    case 'from':
      return `From ${currency} ${pricing.from}`;
    case 'tbd':
      return 'Price TBD';
    default:
      return 'Contact for quote';
  }
}

export function validateModelId(modelId: string): boolean {
  return priceData.models.some((m) => m.id === modelId);
}

export function validateIssueId(issueId: string): boolean {
  return priceData.issues.some((i) => i.id === issueId);
}

export function getModels() {
  return priceData.models;
}

export function getIssues() {
  return priceData.issues;
}

export function getBrand() {
  return priceData.brand;
}

export function getCurrency() {
  return priceData.currency;
}

export function getWhatsAppNumber() {
  return priceData.whatsappNumber;
}
