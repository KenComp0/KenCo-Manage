import { NextRequest, NextResponse } from "next/server";
import { getCachedLeads, getAllCachedTabs } from "@/lib/sheet-cache";
import type { Lead } from "@/types";

const SKIP_SHEETS = ["Dashboard", "Users"];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tab = searchParams.get("tab");
  const getTabs = searchParams.get("tabs");
  const getStats = searchParams.get("stats");
  const getNext = searchParams.get("next");
  const afterRow = searchParams.get("afterRow");
  const history = searchParams.get("history");
  const doneBy = searchParams.get("doneBy");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "50", 10);

  try {
    if (getTabs === "true") {
      const tabs = await getAllCachedTabs();
      return NextResponse.json({ tabs });
    }

    if (getStats === "true" && tab) {
      const leads = await getCachedLeads(tab);
      return NextResponse.json({
        stats: {
          total: leads.length,
          pending: leads.filter((l) => !l.texted && !l.red && !l.agree).length,
          sent: leads.filter((l) => l.texted).length,
          red: leads.filter((l) => l.red).length,
        },
      });
    }

    if (getNext === "true" && tab) {
      const leads = await getCachedLeads(tab);
      const after = afterRow ? parseInt(afterRow, 10) : 0;
      const nextLead = leads.find(
        (l) => l.row > after && !l.texted && !l.red && !l.agree && l.phoneNumber?.trim()
      );
      return NextResponse.json({ lead: nextLead || null });
    }

    if (history === "true" && doneBy) {
      const tabs = await getAllCachedTabs();
      const allLeads: Array<Lead & { tab: string }> = [];

      for (const sheetTab of tabs) {
        if (SKIP_SHEETS.includes(sheetTab)) continue;
        const leads = await getCachedLeads(sheetTab);
        for (const lead of leads) {
          if (lead.doneBy && lead.doneBy.toLowerCase().includes(doneBy.toLowerCase())) {
            allLeads.push({ tab: sheetTab, ...lead });
          }
        }
      }

      allLeads.sort((a, b) => b.row - a.row);
      const totalPages = Math.ceil(allLeads.length / pageSize);
      const start = (page - 1) * pageSize;
      const paged = allLeads.slice(start, start + pageSize);

      return NextResponse.json({ leads: paged, total: allLeads.length, page, totalPages });
    }

    if (!tab) {
      return NextResponse.json({ error: "Tab parameter required" }, { status: 400 });
    }

    const leads = await getCachedLeads(tab);
    const totalPages = Math.ceil(leads.length / pageSize);
    const start = (page - 1) * pageSize;
    const paged = leads.slice(start, start + pageSize);

    return NextResponse.json({
      leads: paged,
      total: leads.length,
      page,
      totalPages,
    });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
