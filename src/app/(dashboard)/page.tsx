"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { StatsCard } from "@/components/StatsCard";
import {
  Users,
  Send,
  Clock,
  TrendingUp,
  XCircle,
  Calendar,
  ArrowUpDown,
} from "lucide-react";

interface CategoryStat {
  total: number;
  sent: number;
  pending: number;
  red: number;
}

interface DashboardData {
  totalLeads: number;
  sentLeads: number;
  pendingLeads: number;
  redLeads: number;
  categoryStats: Record<string, CategoryStat>;
}

interface DailyRow {
  date: string;
  total: number;
  byUser: Record<string, number>;
  byCategory: Record<string, number>;
}

const CATEGORY_COLORS: Record<string, string> = {
  Doctors: "#22c55e",
  Location: "#6366f1",
  Immobile: "#f59e0b",
  Immobilier: "#f59e0b",
  Moto: "#ef4444",
  Optic: "#8b5cf6",
};

const USER_COLORS = [
  "#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#14b8a6", "#f97316", "#84cc16",
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyRow[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dateRange, setDateRange] = useState(90);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchDailyStats();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    setDailyLoading(true);
    try {
      const res = await fetch(`/api/admin/daily-stats?days=${dateRange}`);
      const result = await res.json();
      setDailyStats(result.rows || []);
      setUsers(result.users || []);
    } catch (error) {
      console.error("Failed to fetch daily stats:", error);
    } finally {
      setDailyLoading(false);
    }
  };

  const categories = data?.categoryStats
    ? Object.entries(data.categoryStats).map(([name, stats]) => ({
        name,
        ...stats,
        color: CATEGORY_COLORS[name] || "#6366f1",
      }))
    : [];

  const today = new Date().toISOString().split("T")[0];
  const todayRow = dailyStats.find((r) => r.date === today);
  const todayTotal = todayRow?.total || 0;
  const todayUserEntries = todayRow
    ? Object.entries(todayRow.byUser).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted mt-1">
            Welcome back, {user?.email?.split("@")[0]}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Today</p>
          <p className="text-lg font-semibold text-foreground">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Leads"
          value={data?.totalLeads || 0}
          icon={<Users className="h-5 w-5" />}
          description="Across all categories"
        />
        <StatsCard
          title="Messages Sent"
          value={data?.sentLeads || 0}
          icon={<Send className="h-5 w-5" />}
          description="Successfully delivered"
          glow="success"
        />
        <StatsCard
          title="Pending"
          value={data?.pendingLeads || 0}
          icon={<Clock className="h-5 w-5" />}
          description="Awaiting outreach"
        />
        <StatsCard
          title="Red Flagged"
          value={data?.redLeads || 0}
          icon={<XCircle className="h-5 w-5" />}
          description="Invalid / Landlines"
          glow="danger"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
        </CardHeader>
        {categories.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No category data available</p>
        ) : (
          <div className="space-y-5">
            {categories.map((cat) => {
              const pct = cat.total > 0 ? Math.round((cat.sent / cat.total) * 100) : 0;
              return (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-sm font-medium text-foreground">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted">
                      <span>{cat.sent} sent</span>
                      <span>{cat.pending} pending</span>
                      <span className="font-medium text-foreground">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2.5 rounded-full bg-surface overflow-hidden flex">
                    <div
                      className="h-full transition-all duration-700 rounded-l-full"
                      style={{
                        width: `${cat.total > 0 ? (cat.sent / cat.total) * 100 : 0}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                    <div
                      className="h-full transition-all duration-700"
                      style={{
                        width: `${cat.total > 0 ? (cat.red / cat.total) * 100 : 0}%`,
                        backgroundColor: "#ef4444",
                        opacity: 0.6,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Today&apos;s Progress
          </CardTitle>
        </CardHeader>
        {todayUserEntries.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">No sends today yet</p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{todayTotal}</p>
                <p className="text-xs text-muted">Total Sends</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {todayUserEntries.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-surface/50">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: USER_COLORS[i % USER_COLORS.length] }}
                  >
                    {name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">{count}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Daily Interactions
            </CardTitle>
            <div className="flex gap-2">
              {[30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDateRange(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    dateRange === d
                      ? "bg-primary text-white"
                      : "bg-surface text-muted hover:text-foreground"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        {dailyLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 rounded-lg bg-surface animate-pulse" />
            ))}
          </div>
        ) : dailyStats.length === 0 ? (
          <p className="text-sm text-muted text-center py-8">No activity data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted uppercase tracking-wider sticky left-0 bg-card z-10">
                    Date
                  </th>
                  <th className="text-center py-3 px-3 text-xs font-medium text-muted uppercase tracking-wider">
                    Total
                  </th>
                  {users.map((u) => (
                    <th
                      key={u}
                      className="text-center py-3 px-3 text-xs font-medium text-muted uppercase tracking-wider"
                    >
                      {u}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dailyStats.map((row) => {
                  const isToday = row.date === today;
                  return (
                    <tr
                      key={row.date}
                      className={`border-b border-glass-border/50 transition-colors ${
                        isToday ? "bg-primary/5" : "hover:bg-surface/50"
                      }`}
                    >
                      <td className="py-2.5 px-3 text-foreground font-medium sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          {isToday && (
                            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                          )}
                          <span className={isToday ? "text-primary font-semibold" : ""}>
                            {new Date(row.date + "T12:00:00").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              weekday: "short",
                            })}
                          </span>
                        </div>
                      </td>
                      <td className="text-center py-2.5 px-3">
                        <span className={`font-bold ${row.total > 0 ? "text-foreground" : "text-muted"}`}>
                          {row.total}
                        </span>
                      </td>
                      {users.map((u) => {
                        const val = row.byUser[u] || 0;
                        return (
                          <td key={u} className="text-center py-2.5 px-3">
                            <span className={val > 0 ? "text-foreground" : "text-muted/50"}>
                              {val || "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
              {dailyStats.length > 1 && (
                <tfoot>
                  <tr className="border-t-2 border-glass-border font-bold">
                    <td className="py-3 px-3 text-foreground sticky left-0 bg-card z-10">Total</td>
                    <td className="text-center py-3 px-3 text-foreground">
                      {dailyStats.reduce((sum, r) => sum + r.total, 0)}
                    </td>
                    {users.map((u) => {
                      const total = dailyStats.reduce((sum, r) => sum + (r.byUser[u] || 0), 0);
                      return (
                        <td key={u} className="text-center py-3 px-3 text-foreground">
                          {total || "—"}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
