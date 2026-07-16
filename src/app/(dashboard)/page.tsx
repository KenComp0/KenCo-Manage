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
  todaySends: number;
  categoryStats: Record<string, CategoryStat>;
}

const CATEGORY_COLORS: Record<string, string> = {
  Doctors: "#22c55e",
  Location: "#6366f1",
  Immobile: "#f59e0b",
  Immobilier: "#f59e0b",
  Moto: "#ef4444",
  Optic: "#8b5cf6",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="glass-card rounded-2xl h-32 animate-pulse" />
          ))}
        </div>
        <div className="glass-card rounded-2xl h-64 animate-pulse" />
      </div>
    );
  }

  const categories = data?.categoryStats
    ? Object.entries(data.categoryStats).map(([name, stats]) => ({
        name,
        ...stats,
        color: CATEGORY_COLORS[name] || "#6366f1",
      }))
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
    </div>
  );
}
