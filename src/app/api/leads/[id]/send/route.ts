import { NextRequest, NextResponse } from "next/server";
import { updateLeadField, updateDashboardCount } from "@/lib/google-sheets";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { tab, businessName, userName } = body;
  const rowNumber = parseInt(id, 10);

  if (!tab || !rowNumber) {
    return NextResponse.json(
      { error: "Tab and row number required" },
      { status: 400 }
    );
  }

  const userId = request.headers.get("x-user-id") || userName || "anonymous";
  const dailyLimit = parseInt(process.env.DAILY_SEND_LIMIT || "30", 10);

  try {
    await updateLeadField(tab, rowNumber, "TEXTED?", "TRUE");
    await updateLeadField(tab, rowNumber, "Done By", userId);

    const today = new Date().toISOString().split("T")[0];
    await updateDashboardCount(today);

    return NextResponse.json({
      success: true,
      message: `Message marked as sent to ${businessName}`,
    });
  } catch (error: any) {
    console.error("Send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
