import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { getBtcSpotPrice } from "@/lib/coinbase";
import { calculateGameResult } from "@/lib/game";

interface GuessData {
  direction: "up" | "down";
  startPrice: number;
  createdAt: number;
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.cookies.get("guest-id")?.value;
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Fetch active guess
    const guessData = await redis.get<GuessData>(`guess:${userId}`);
    if (!guessData) {
      return NextResponse.json(
        { error: "No active guess found" },
        { status: 400 },
      );
    }

    // 2. Validate 60-second window
    const elapsedSeconds = (Date.now() - guessData.createdAt) / 1000;
    if (elapsedSeconds < 60) {
      return NextResponse.json(
        {
          error: "Guess is still pending",
          remainingSeconds: Math.ceil(60 - elapsedSeconds),
        },
        { status: 400 },
      );
    }

    // 3. Resolve the game
    const currentPrice = await getBtcSpotPrice();
    const result = calculateGameResult(
      guessData.startPrice,
      currentPrice,
      guessData.direction,
    );

    // 4. Update the user's score (+1 for win, -1 for loss)
    let score = (await redis.get<number>(`user:${userId}:score`)) ?? 0;
    score = result.win ? score + 1 : score - 1;

    // 5. Save new score and wipe the active guess
    await redis.set(`user:${userId}:score`, score);
    await redis.del(`guess:${userId}`);

    return NextResponse.json({
      success: true,
      win: result.win,
      priceChange: result.priceChange,
      newScore: score,
      endPrice: currentPrice,
    });
  } catch (error) {
    console.error("[Resolve Error]:", error);
    return NextResponse.json(
      { error: "Failed to resolve guess" },
      { status: 500 },
    );
  }
}
