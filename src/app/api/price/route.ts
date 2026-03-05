import { NextResponse } from "next/server";
import { getBtcSpotPrice } from "@/lib/coinbase";

export async function GET() {
  try {
    const price = await getBtcSpotPrice();
    return NextResponse.json({ price, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch price",
      },
      { status: 503 },
    );
  }
}
