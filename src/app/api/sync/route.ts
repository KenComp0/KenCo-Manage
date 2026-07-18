import { NextResponse } from "next/server";
import { syncAllTabs } from "@/lib/sheet-cache";

export async function POST() {
  try {
    const result = await syncAllTabs();
    return NextResponse.json({
      success: true,
      synced: result.synced,
      errors: result.errors,
      message: `Synced ${result.synced.length} tabs${result.errors.length > 0 ? `, ${result.errors.length} failed` : ""}`,
    });
  } catch (error: any) {
    console.error("Sync error:", error.message);
    return NextResponse.json(
      { error: error.message || "Sync failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST();
}
