import { NextRequest, NextResponse } from "next/server";
import { getSheetNames, getLeadsFromSheet } from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  try {
    const sheets = await getSheetNames();
    const skipSheets = ["Dashboard", "Users"];
    const activeSheets = sheets.filter((s) => !skipSheets.includes(s));

    const backup: Record<string, any[]> = {};

    for (const sheetName of activeSheets) {
      const leads = await getLeadsFromSheet(sheetName);
      backup[sheetName] = leads;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `kenco-backup-${timestamp}.json`;

    return NextResponse.json({
      filename,
      timestamp: new Date().toISOString(),
      sheets: activeSheets,
      data: backup,
      counts: Object.fromEntries(
        Object.entries(backup).map(([k, v]) => [k, v.length])
      ),
    });
  } catch (error: any) {
    console.error("Backup error:", error);
    return NextResponse.json(
      { error: error.message || "Backup failed" },
      { status: 500 }
    );
  }
}
