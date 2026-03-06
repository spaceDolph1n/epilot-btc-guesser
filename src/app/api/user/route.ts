import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("guest-id")?.value;
  if (!userId) return NextResponse.json({ score: 0 });

  try {
    const score = (await redis.get<number>(`user:${userId}:score`)) ?? 0;

    // NEW: Fetch any active guess the user might have locked in
    const activeGuess = await redis.get(`guess:${userId}`);

    return NextResponse.json({
      userId,
      score,
      activeGuess, // Pass it to the frontend
    });
  } catch (error) {
    console.error("[User Error]:", error);
    return NextResponse.json({ score: 0 }, { status: 500 });
  }
}
