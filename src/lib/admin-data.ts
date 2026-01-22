// Admin data management - Redis storage with JSON fallback
import { kvGet, kvSet } from './store';
import priceDataJson from '@/data/iphone-prices.json';

const PRICE_DATA_KEY = 'spr:price-data';
const PRICE_DATA_TTL = 365 * 24 * 60 * 60 * 1000; // 1 year in ms (effectively permanent)

export interface Brand {
  id: string;
  name: string;
}

export interface Model {
  id: string;
  name: string;
  brand: string;
}

export interface Issue {
  id: string;
  name: string;
}

export interface Price {
  modelId: string;
  issueId: string;
  type: 'fixed' | 'range' | 'from' | 'tbd';
  price?: number;
  min?: number;
  max?: number;
  from?: number;
  warrantyDays: number;
  eta: string;
  notes: string;
}

export interface PriceData {
  brand: string;
  currency: string;
  whatsappNumber: string;
  disclaimer: string;
  brands: Brand[];
  models: Model[];
  issues: Issue[];
  prices: Price[];
}

// Get price data from Redis, fallback to JSON for initial seed
export async function getPriceData(): Promise<PriceData> {
  const data = await kvGet<PriceData>(PRICE_DATA_KEY);
  if (data) {
    return data;
  }
  // Seed from JSON file if Redis is empty
  return priceDataJson as PriceData;
}

// Save entire price data object to Redis
export async function savePriceData(data: PriceData): Promise<void> {
  await kvSet(PRICE_DATA_KEY, data, PRICE_DATA_TTL);
}

// Seed Redis with initial data from JSON (if not already seeded)
export async function seedPriceData(): Promise<boolean> {
  const existing = await kvGet<PriceData>(PRICE_DATA_KEY);
  if (existing) {
    return false; // Already seeded
  }
  await savePriceData(priceDataJson as PriceData);
  return true;
}

// Model operations
export async function addModel(model: Model): Promise<PriceData> {
  const data = await getPriceData();
  if (data.models.some(m => m.id === model.id)) {
    throw new Error(`Model with id "${model.id}" already exists`);
  }
  data.models.push(model);
  await savePriceData(data);
  return data;
}

export async function updateModel(id: string, updates: Partial<Model>): Promise<PriceData> {
  const data = await getPriceData();
  const index = data.models.findIndex(m => m.id === id);
  if (index === -1) {
    throw new Error(`Model with id "${id}" not found`);
  }

  // If changing the id, update all related prices
  if (updates.id && updates.id !== id) {
    if (data.models.some(m => m.id === updates.id)) {
      throw new Error(`Model with id "${updates.id}" already exists`);
    }
    data.prices.forEach(p => {
      if (p.modelId === id) {
        p.modelId = updates.id!;
      }
    });
  }

  data.models[index] = { ...data.models[index], ...updates };
  await savePriceData(data);
  return data;
}

export async function deleteModel(id: string): Promise<PriceData> {
  const data = await getPriceData();
  const index = data.models.findIndex(m => m.id === id);
  if (index === -1) {
    throw new Error(`Model with id "${id}" not found`);
  }

  // Remove all prices associated with this model
  data.prices = data.prices.filter(p => p.modelId !== id);
  data.models.splice(index, 1);
  await savePriceData(data);
  return data;
}

// Issue operations
export async function addIssue(issue: Issue): Promise<PriceData> {
  const data = await getPriceData();
  if (data.issues.some(i => i.id === issue.id)) {
    throw new Error(`Issue with id "${issue.id}" already exists`);
  }
  data.issues.push(issue);
  await savePriceData(data);
  return data;
}

export async function updateIssue(id: string, updates: Partial<Issue>): Promise<PriceData> {
  const data = await getPriceData();
  const index = data.issues.findIndex(i => i.id === id);
  if (index === -1) {
    throw new Error(`Issue with id "${id}" not found`);
  }

  // If changing the id, update all related prices
  if (updates.id && updates.id !== id) {
    if (data.issues.some(i => i.id === updates.id)) {
      throw new Error(`Issue with id "${updates.id}" already exists`);
    }
    data.prices.forEach(p => {
      if (p.issueId === id) {
        p.issueId = updates.id!;
      }
    });
  }

  data.issues[index] = { ...data.issues[index], ...updates };
  await savePriceData(data);
  return data;
}

export async function deleteIssue(id: string): Promise<PriceData> {
  const data = await getPriceData();
  const index = data.issues.findIndex(i => i.id === id);
  if (index === -1) {
    throw new Error(`Issue with id "${id}" not found`);
  }

  // Remove all prices associated with this issue
  data.prices = data.prices.filter(p => p.issueId !== id);
  data.issues.splice(index, 1);
  await savePriceData(data);
  return data;
}

// Price operations
export async function addPrice(price: Price): Promise<PriceData> {
  const data = await getPriceData();

  // Validate model exists
  if (!data.models.some(m => m.id === price.modelId)) {
    throw new Error(`Model with id "${price.modelId}" not found`);
  }

  // Validate issue exists
  if (!data.issues.some(i => i.id === price.issueId)) {
    throw new Error(`Issue with id "${price.issueId}" not found`);
  }

  // Check for duplicate
  if (data.prices.some(p => p.modelId === price.modelId && p.issueId === price.issueId)) {
    throw new Error(`Price for model "${price.modelId}" and issue "${price.issueId}" already exists`);
  }

  data.prices.push(price);
  await savePriceData(data);
  return data;
}

export async function updatePrice(modelId: string, issueId: string, updates: Partial<Price>): Promise<PriceData> {
  const data = await getPriceData();
  const index = data.prices.findIndex(p => p.modelId === modelId && p.issueId === issueId);
  if (index === -1) {
    throw new Error(`Price for model "${modelId}" and issue "${issueId}" not found`);
  }

  // Don't allow changing modelId or issueId through update - use delete + add instead
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { modelId: _modelId, issueId: _issueId, ...safeUpdates } = updates;

  data.prices[index] = { ...data.prices[index], ...safeUpdates };
  await savePriceData(data);
  return data;
}

export async function deletePrice(modelId: string, issueId: string): Promise<PriceData> {
  const data = await getPriceData();
  const index = data.prices.findIndex(p => p.modelId === modelId && p.issueId === issueId);
  if (index === -1) {
    throw new Error(`Price for model "${modelId}" and issue "${issueId}" not found`);
  }

  data.prices.splice(index, 1);
  await savePriceData(data);
  return data;
}

// Update metadata (brand, currency, whatsapp, disclaimer)
export async function updateMetadata(updates: Partial<Pick<PriceData, 'brand' | 'currency' | 'whatsappNumber' | 'disclaimer'>>): Promise<PriceData> {
  const data = await getPriceData();
  Object.assign(data, updates);
  await savePriceData(data);
  return data;
}
