import { NextRequest, NextResponse } from "next/server";
import { getAllCachedTabs, getCachedLeads } from "@/lib/sheet-cache";

export async function GET(request: NextRequest) {
  try {
    const tabs = await getAllCachedTabs();
    const skipSheets = ["Dashboard", "Users"];

    let totalLeads = 0;
    let sentLeads = 0;
    let pendingLeads = 0;
    let redLeads = 0;
    const categoryStats: Record<string, { total: number; sent: number; pending: number; red: number }> = {};

    for (const tab of tabs) {
      if (skipSheets.includes(tab)) continue;

      try {
        const leads = await getCachedLeads(tab);
        const sheetTotal = leads.length;
        const sheetSent = leads.filter((l) => l.texted).length;
        const sheetRed = leads.filter((l) => l.red).length;
        const sheetPending = leads.filter((l) => !l.texted && !l.red).length;

        totalLeads += sheetTotal;
        sentLeads += sheetSent;
        redLeads += sheetRed;
        pendingLeads += sheetPending;

        categoryStats[tab] = {
          total: sheetTotal,
          sent: sheetSent,
          pending: sheetPending,
          red: sheetRed,
        };
      } catch {
        // Skip tabs that fail
      }
    }

    return NextResponse.json({
      totalLeads,
      sentLeads,
      pendingLeads,
      redLeads,
      todaySends: 0,
      categoryStats,
      recentActivity: [],
    });
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
