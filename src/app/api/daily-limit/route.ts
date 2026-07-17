import { NextRequest, NextResponse } from "next/server";
import { getDailyLimitStatus } from "@/lib/daily-limit";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const uid = searchParams.get("uid");

  if (!uid) {
    return NextResponse.json({ error: "uid required" }, { status: 400 });
  }

  try {
    const status = await getDailyLimitStatus(uid);
    return NextResponse.json(status);
  } catch (error: any) {
    console.error("Daily limit error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get limit status" },
      { status: 500 }
    );
  }
}
