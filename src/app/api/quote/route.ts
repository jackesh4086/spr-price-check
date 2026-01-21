import { NextResponse } from "next/server";
import { verifyQuoteToken } from "@/lib/token";
import { getQuote, formatPrice } from "@/lib/quote";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";

  const result = await verifyQuoteToken(token);
  if (!result.valid || !result.payload) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = result.payload;
  const quote = getQuote(payload.modelId, payload.issueId);

  if (!quote) {
    return NextResponse.json({ ok: false, error: "Invalid token payload" }, { status: 400 });
  }

  const displayPrice = formatPrice(quote.pricing, quote.currency);

  return NextResponse.json({
    ok: true,
    brand: quote.brand,
    currency: quote.currency,
    disclaimer: quote.disclaimer,
    model: quote.model,
    issue: quote.issue,
    pricing: quote.pricing,
    displayPrice,
    phone: payload.phone,
  });
}
