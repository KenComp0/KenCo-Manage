import { NextRequest, NextResponse } from "next/server";
import { getSheetNames, getLeadsPage, getNextPendingLead, getLeadStats } from "@/lib/google-sheets";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab");
  const getTabs = searchParams.get("tabs");
  const getStats = searchParams.get("stats");
  const getNext = searchParams.get("next");
  const afterRow = searchParams.get("afterRow");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

  try {
    if (getTabs === "true") {
      const sheets = await getSheetNames();
      const skipSheets = ["Dashboard", "Users"];
      const filteredSheets = sheets.filter((s) => !skipSheets.includes(s));
      return NextResponse.json({ tabs: filteredSheets });
    }

    if (getStats === "true" && tab) {
      const stats = await getLeadStats(tab);
      return NextResponse.json({ stats });
    }

    if (getNext === "true" && tab) {
      const lead = await getNextPendingLead(tab, afterRow ? parseInt(afterRow, 10) : undefined);
      return NextResponse.json({ lead });
    }

    if (!tab) {
      return NextResponse.json({ error: "Tab parameter required" }, { status: 400 });
    }

    const result = await getLeadsPage(tab, page, pageSize);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
