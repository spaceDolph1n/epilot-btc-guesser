import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getBtcSpotPrice } from "@/lib/coinbase";

export async function POST(req: NextRequest) {
  // 1. Identity Check
  const userId = req.cookies.get("guest-id")?.value;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Global IP Rate Limiting
    // Using x-forwarded-for to get the real client IP behind the proxy
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const rateLimitKey = `ratelimit:${ip}`;

    const currentRequests = await redis.incr(rateLimitKey);
    if (currentRequests === 1) {
      // First request in the window: set expiration to 60 seconds
      await redis.expire(rateLimitKey, 60);
    }

    if (currentRequests > 5) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429 },
      );
    }

    // 3. Game State Check (One guess per user per minute)
    const existingGuess = await redis.get(`guess:${userId}`);
    if (existingGuess) {
      return NextResponse.json(
        { error: "Active guess already exists" },
        { status: 400 },
      );
    }

    // 4. Input Validation
    const { direction } = await req.json();
    if (direction !== "up" && direction !== "down") {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    // 5. Execute Guess Logic
    const currentPrice = await getBtcSpotPrice();
    const guessData = {
      direction,
      startPrice: currentPrice,
      createdAt: Date.now(),
    };

    // Store guess with 5m TTL to prevent stale data buildup
    await redis.set(`guess:${userId}`, guessData, { ex: 300 });

    return NextResponse.json({ success: true, guess: guessData });
  } catch (error) {
    console.error("[Guess Error]:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
