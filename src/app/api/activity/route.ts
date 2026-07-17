import { NextRequest, NextResponse } from "next/server";
import { getUserActivity } from "@/lib/activity";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const tab = searchParams.get("tab") || undefined;
  const action = searchParams.get("action") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    const options: any = {};
    if (tab) options.tab = tab;
    if (action) options.action = action;
    if (startDate) options.startDate = new Date(startDate);
    if (endDate) options.endDate = new Date(endDate + "T23:59:59");

    const result = await getUserActivity(email, options);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Activity API error:", error);
    return NextResponse.json({ activities: [], total: 0 });
  }
}
