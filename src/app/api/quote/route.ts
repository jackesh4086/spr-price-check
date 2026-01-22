import { NextResponse } from "next/server";
import { verifyQuoteToken } from "@/lib/token";
import { getQuoteAsync } from "@/lib/quote";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";

  const result = await verifyQuoteToken(token);
  if (!result.valid || !result.payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = result.payload;
  const quote = await getQuoteAsync(payload.modelId, payload.issueId);

  if (!quote) {
    return NextResponse.json({ error: "Invalid token payload" }, { status: 400 });
  }

  return NextResponse.json({
    quote: {
      brand: quote.brand,
      currency: quote.currency,
      disclaimer: quote.disclaimer,
      whatsappNumber: quote.whatsappNumber,
      model: quote.model,
      issue: quote.issue,
      pricing: quote.pricing,
      phone: payload.phone,
      validUntil: new Date(payload.exp * 1000).toISOString(),
    },
  });
}
