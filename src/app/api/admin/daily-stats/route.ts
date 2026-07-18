import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

interface DailyRow {
  date: string;
  total: number;
  byUser: Record<string, number>;
  byCategory: Record<string, number>;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "90", 10);

  try {
    const db = getAdminFirestore();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const snapshot = await db
      .collection("activity")
      .where("timestamp", ">=", cutoff)
      .orderBy("timestamp", "desc")
      .limit(10000)
      .get();

    const dailyMap: Record<string, DailyRow> = {};

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const ts = data.timestamp?.toDate?.();
      if (!ts) continue;
      if (data.action === "undo") continue;

      const dateStr = ts.toISOString().split("T")[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { date: dateStr, total: 0, byUser: {}, byCategory: {} };
      }

      const row = dailyMap[dateStr];
      row.total++;

      const email = data.email || data.userId || "unknown";
      const shortName = email.split("@")[0];
      row.byUser[shortName] = (row.byUser[shortName] || 0) + 1;

      const tab = data.tab || "unknown";
      row.byCategory[tab] = (row.byCategory[tab] || 0) + 1;
    }

    const rows = Object.values(dailyMap).sort((a, b) => b.date.localeCompare(a.date));

    const allUsers = new Set<string>();
    for (const row of rows) {
      for (const u of Object.keys(row.byUser)) allUsers.add(u);
    }

    return NextResponse.json({
      rows,
      users: Array.from(allUsers).sort(),
      totalDays: rows.length,
    });
  } catch (error: any) {
    console.error("Daily stats error:", error);
    return NextResponse.json({ rows: [], users: [], totalDays: 0, error: error.message });
  }
}
