import { getPriceData, type PriceData } from './admin-data';
import priceDataJson from '@/data/iphone-prices.json';

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

// Cache for dynamic data with TTL
let cachedData: PriceData | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

// Load price data with caching (for API routes)
export async function loadPriceData(): Promise<PriceData> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedData && cacheExpiry > now) {
    return cachedData;
  }

  try {
    cachedData = await getPriceData();
    cacheExpiry = now + CACHE_TTL;
    return cachedData;
  } catch (error) {
    console.error('Failed to load price data from Redis, using fallback:', error);
    // Fallback to static JSON if Redis fails
    return priceDataJson as PriceData;
  }
}

// Invalidate cache (call after admin updates)
export function invalidatePriceCache(): void {
  cachedData = null;
  cacheExpiry = 0;
}

// Async version for API routes
export async function getQuoteAsync(modelId: string, issueId: string): Promise<QuoteResult | null> {
  const priceData = await loadPriceData();

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

// Sync version using static data (for backwards compatibility - SSR pages)
export function getQuote(modelId: string, issueId: string): QuoteResult | null {
  // Use cached data if available, otherwise fall back to static JSON
  const priceData = cachedData || (priceDataJson as PriceData);

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

// Async validation functions
export async function validateModelIdAsync(modelId: string): Promise<boolean> {
  const priceData = await loadPriceData();
  return priceData.models.some((m) => m.id === modelId);
}

export async function validateIssueIdAsync(issueId: string): Promise<boolean> {
  const priceData = await loadPriceData();
  return priceData.issues.some((i) => i.id === issueId);
}

// Sync validation (uses cached or static data)
export function validateModelId(modelId: string): boolean {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.models.some((m) => m.id === modelId);
}

export function validateIssueId(issueId: string): boolean {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.issues.some((i) => i.id === issueId);
}

// Async getters
export async function getModelsAsync() {
  const priceData = await loadPriceData();
  return priceData.models;
}

export async function getIssuesAsync() {
  const priceData = await loadPriceData();
  return priceData.issues;
}

// Sync getters (uses cached or static data)
export function getModels() {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.models;
}

export function getIssues() {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.issues;
}

export function getBrand() {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.brand;
}

export function getCurrency() {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.currency;
}

export function getWhatsAppNumber() {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.whatsappNumber;
}

// Brand functions
export function getBrands() {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.brands || [];
}

export async function getBrandsAsync() {
  const priceData = await loadPriceData();
  return priceData.brands || [];
}

export function getModelsByBrand(brandId: string) {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.models.filter((m) => m.brand === brandId);
}

export async function getModelsByBrandAsync(brandId: string) {
  const priceData = await loadPriceData();
  return priceData.models.filter((m) => m.brand === brandId);
}

export function validateBrandId(brandId: string): boolean {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.brands?.some((b) => b.id === brandId) || false;
}

export async function validateBrandIdAsync(brandId: string): Promise<boolean> {
  const priceData = await loadPriceData();
  return priceData.brands?.some((b) => b.id === brandId) || false;
}

export function getBrandById(brandId: string) {
  const priceData = cachedData || (priceDataJson as PriceData);
  return priceData.brands?.find((b) => b.id === brandId);
}

export async function getBrandByIdAsync(brandId: string) {
  const priceData = await loadPriceData();
  return priceData.brands?.find((b) => b.id === brandId);
}
