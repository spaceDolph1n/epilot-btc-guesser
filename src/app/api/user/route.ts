import { NextRequest, NextResponse } from "next/server";
import { redis } from "@/lib/redis";

export async function GET(req: NextRequest) {
  const userId = req.cookies.get("guest-id")?.value;
  if (!userId)
    return NextResponse.json({ error: "No identity found" }, { status: 401 });

  const score = (await redis.get<number>(`user:${userId}:score`)) ?? 0;
  return NextResponse.json({ userId, score });
}
