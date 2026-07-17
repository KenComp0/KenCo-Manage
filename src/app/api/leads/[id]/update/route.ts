import { NextRequest, NextResponse } from "next/server";
import { updateLeadField } from "@/lib/google-sheets";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { tab, field, value, userName } = body;
  const rowNumber = parseInt(id, 10);

  if (!tab || !rowNumber || !field) {
    return NextResponse.json(
      { error: "Tab, row number, and field required" },
      { status: 400 }
    );
  }

  const allowedFields = ["TEXTED?", "AGREE?", "RED?", "Done By"];
  if (!allowedFields.includes(field)) {
    return NextResponse.json(
      { error: `Field must be one of: ${allowedFields.join(", ")}` },
      { status: 400 }
    );
  }

  const userId = request.headers.get("x-user-id") || userName || "anonymous";

  try {
    await updateLeadField(tab, rowNumber, field, value);

    if (field !== "Done By") {
      await updateLeadField(tab, rowNumber, "Done By", userId);
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${field} to ${value}`,
    });
  } catch (error: any) {
    console.error("Update error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update lead" },
      { status: 500 }
    );
  }
}
