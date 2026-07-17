import { NextRequest, NextResponse } from "next/server";
import { updateLeadField, updateDashboardCount } from "@/lib/google-sheets";
import { logActivity } from "@/lib/activity";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { tab, businessName, userName, red } = body;
  const rowNumber = parseInt(id, 10);

  if (!tab || !rowNumber) {
    return NextResponse.json(
      { error: "Tab and row number required" },
      { status: 400 }
    );
  }

  const userId = request.headers.get("x-user-id") || userName || "anonymous";

  try {
    if (red) {
      await updateLeadField(tab, rowNumber, "RED?", "TRUE");
      await updateLeadField(tab, rowNumber, "Done By", userId);

      await logActivity({
        userId,
        email: userId,
        tab,
        row: rowNumber,
        businessName,
        action: "red",
      });
    } else {
      await updateLeadField(tab, rowNumber, "TEXTED?", "TRUE");
      await updateLeadField(tab, rowNumber, "Done By", userId);

      const today = new Date().toISOString().split("T")[0];
      await updateDashboardCount(today);

      await logActivity({
        userId,
        email: userId,
        tab,
        row: rowNumber,
        businessName,
        action: "texted",
      });
    }

    return NextResponse.json({
      success: true,
      message: red
        ? `Marked as RED: ${businessName}`
        : `Message marked as sent to ${businessName}`,
    });
  } catch (error: any) {
    console.error("Send error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
