"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Input } from "@/components/Input";
import {
  Search,
  Phone,
  Send,
  MapPin,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  History as HistoryIcon,
  ThumbsUp,
  RotateCcw,
  Loader2,
  Calendar,
  Filter,
} from "lucide-react";

interface HistoryLead {
  tab: string;
  row: number;
  businessName: string;
  website: string;
  phoneNumber: string;
  location: string;
  texted: boolean;
  agree: boolean;
  red: boolean;
  doneBy: string;
  lastActivity?: string;
  lastAction?: string;
}

interface Activity {
  id: string;
  userId: string;
  email: string;
  tab: string;
  row: number;
  businessName: string;
  action: string;
  timestamp: { seconds: number; nanoseconds: number };
}

const TAB_COLORS: Record<string, string> = {
  Doctors: "text-success",
  Location: "text-indigo-400",
  Immobile: "text-warning",
  Moto: "text-danger",
  Optic: "text-purple-400",
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  { key: "followup", label: "Follow Up" },
  { key: "agreed", label: "Agreed" },
  { key: "red", label: "Red" },
];

const DATE_FILTERS = [
  { key: "all", label: "All Time" },
  { key: "today", label: "Today" },
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
];

function formatTimestamp(ts: { seconds: number; nanoseconds: number } | undefined): string {
  if (!ts) return "";
  const date = new Date(ts.seconds * 1000);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function getDateRange(filter: string): { start?: Date; end?: Date } {
  const now = new Date();
  if (filter === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { start, end: now };
  }
  if (filter === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return { start, end: now };
  }
  if (filter === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, end: now };
  }
  return {};
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<HistoryLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterTab, setFilterTab] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email) {
      setPage(1);
      fetchHistory();
    }
  }, [user, page, dateFilter]);

  const fetchHistory = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const dateRange = getDateRange(dateFilter);
      const params = new URLSearchParams({
        history: "true",
        doneBy: user.email,
        page: String(page),
        pageSize: "50",
      });

      const [leadsRes, activityRes] = await Promise.all([
        fetch(`/api/leads?${params}`),
        fetch(`/api/activity?email=${encodeURIComponent(user.email)}${dateRange.start ? `&startDate=${dateRange.start.toISOString()}` : ""}${dateRange.end ? `&endDate=${dateRange.end.toISOString()}` : ""}`),
      ]);

      const leadsData = await leadsRes.json();
      const activityData = await activityRes.json();

      const activityMap = new Map<string, Activity>();
      for (const act of activityData.activities || []) {
        const key = `${act.tab}-${act.row}`;
        const existing = activityMap.get(key);
        if (!existing || act.timestamp.seconds > existing.timestamp.seconds) {
          activityMap.set(key, act);
        }
      }

      const enrichedLeads = (leadsData.leads || []).map((lead: HistoryLead) => {
        const key = `${lead.tab}-${lead.row}`;
        const act = activityMap.get(key);
        return {
          ...lead,
          lastActivity: act ? formatTimestamp(act.timestamp) : "",
          lastAction: act?.action || "",
        };
      });

      setLeads(enrichedLeads);
      setTotalPages(leadsData.totalPages || 1);
      setTotal(leadsData.total || 0);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const undoAll = useCallback(
    async (lead: HistoryLead) => {
      const key = `${lead.tab}-${lead.row}`;
      setUpdating(key);
      try {
        const fields = [
          { field: "TEXTED?", value: "" },
          { field: "AGREE?", value: "" },
          { field: "RED?", value: "" },
        ];
        for (const { field, value } of fields) {
          await fetch(`/api/leads/${lead.row}/update`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tab: lead.tab,
              field,
              value,
              userName: user?.email,
              businessName: lead.businessName,
            }),
          });
        }

        setLeads((prev) =>
          prev.map((l) => {
            if (l.tab === lead.tab && l.row === lead.row) {
              return { ...l, texted: false, agree: false, red: false, lastActivity: "Just now", lastAction: "undo" };
            }
            return l;
          })
        );
      } catch (error) {
        console.error("Failed to undo all:", error);
      } finally {
        setUpdating(null);
      }
    },
    [user?.email]
  );

  const updateLead = useCallback(
    async (lead: HistoryLead, field: string, value: string) => {
      const key = `${lead.tab}-${lead.row}`;
      setUpdating(key);
      try {
        await fetch(`/api/leads/${lead.row}/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tab: lead.tab,
            field,
            value,
            userName: user?.email,
            businessName: lead.businessName,
          }),
        });

        let action = "undo";
        if (field === "TEXTED?" && value === "TRUE") action = "texted";
        else if (field === "AGREE?" && value === "TRUE") action = "agreed";
        else if (field === "RED?" && value === "TRUE") action = "red";

        setLeads((prev) =>
          prev.map((l) => {
            if (l.tab === lead.tab && l.row === lead.row) {
              const updated = { ...l, lastActivity: "Just now", lastAction: action };
              if (field === "AGREE?") updated.agree = value === "TRUE";
              if (field === "TEXTED?") updated.texted = value === "TRUE";
              if (field === "RED?") updated.red = value === "TRUE";
              return updated;
            }
            return l;
          })
        );
      } catch (error) {
        console.error("Failed to update lead:", error);
      } finally {
        setUpdating(null);
      }
    },
    [user?.email]
  );

  const filteredLeads = leads.filter((lead) => {
    if (filterTab !== "all" && lead.tab !== filterTab) return false;

    if (statusFilter === "followup" && !(lead.texted && !lead.agree && !lead.red)) return false;
    if (statusFilter === "agreed" && !lead.agree) return false;
    if (statusFilter === "red" && !lead.red) return false;

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      lead.businessName.toLowerCase().includes(q) ||
      lead.phoneNumber.includes(search) ||
      lead.location.toLowerCase().includes(q)
    );
  });

  const stats = {
    total,
    texted: leads.filter((l) => l.texted && !l.red && !l.agree).length,
    red: leads.filter((l) => l.red).length,
    agree: leads.filter((l) => l.agree).length,
    followup: leads.filter((l) => l.texted && !l.agree && !l.red).length,
  };

  const tabs = [...new Set(leads.map((l) => l.tab))];

  const formatPhone = (phone: string): string | null => {
    const cleaned = phone.replace(/\D/g, "");
    if (!cleaned) return null;
    if (cleaned.startsWith("05") || cleaned.startsWith("5")) return null;
    if (cleaned.startsWith("0")) return `212${cleaned.slice(1)}`;
    if (cleaned.startsWith("212")) return cleaned;
    return `212${cleaned}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
          <HistoryIcon className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My History</h1>
          <p className="text-muted mt-0.5">Track and manage your contacted leads</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card key="total" className="p-4">
          <p className="text-xs text-muted">Total Contacted</p>
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
        </Card>
        <Card key="followup" className="p-4">
          <p className="text-xs text-muted">Awaiting Response</p>
          <p className="text-2xl font-bold text-indigo-400">{stats.followup}</p>
        </Card>
        <Card key="agree" className="p-4">
          <p className="text-xs text-muted">Agreed</p>
          <p className="text-2xl font-bold text-success">{stats.agree}</p>
        </Card>
        <Card key="red" className="p-4">
          <p className="text-xs text-muted">Red Flags</p>
          <p className="text-2xl font-bold text-danger">{stats.red}</p>
        </Card>
      </div>

      <Card>
        {/* Filters row 1: Tabs */}
        <div className="flex gap-2 flex-wrap mb-3">
          <button
            onClick={() => setFilterTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterTab === "all"
                ? "bg-primary text-white"
                : "bg-surface text-muted hover:text-foreground"
            }`}
          >
            All Categories
          </button>
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterTab === tab
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters row 2: Status + Date + Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="flex gap-1.5">
            {STATUS_FILTERS.map((sf) => (
              <button
                key={sf.key}
                onClick={() => setStatusFilter(sf.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  statusFilter === sf.key
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                {sf.key === "followup" && <Clock className="h-3 w-3" />}
                {sf.key === "agreed" && <CheckCircle className="h-3 w-3" />}
                {sf.key === "red" && <XCircle className="h-3 w-3" />}
                {sf.label}
              </button>
            ))}
          </div>

          <div className="flex gap-1.5">
            {DATE_FILTERS.map((df) => (
              <button
                key={df.key}
                onClick={() => setDateFilter(df.key)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  dateFilter === df.key
                    ? "bg-primary text-white"
                    : "bg-surface text-muted hover:text-foreground"
                }`}
              >
                <Calendar className="h-3 w-3" />
                {df.label}
              </button>
            ))}
          </div>

          <div className="flex-1">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>

        <p className="text-xs text-muted mb-4">
          {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""}
        </p>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-10 w-10 text-muted mx-auto mb-3" />
            <p className="text-muted">No history found</p>
            <p className="text-xs text-muted mt-1">
              {statusFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your filters"
                : "Start a session to see your contacted leads here"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Business</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Phone</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted hidden lg:table-cell">Location</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Category</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Status</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted hidden md:table-cell">Last Action</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, i) => {
                  const key = `${lead.tab}-${lead.row}`;
                  const isUpdating = updating === key;

                  return (
                    <tr
                      key={`${key}-${i}`}
                      className="border-b border-glass-border/50 hover:bg-surface/50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary flex-shrink-0">
                            {lead.businessName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground truncate max-w-[180px]">
                              {lead.businessName}
                            </p>
                            {lead.website && (
                              <a
                                href={lead.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                              >
                                <Globe className="h-3 w-3" />
                                Website
                              </a>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2 text-sm text-foreground">
                          <Phone className="h-3.5 w-3.5 text-muted" />
                          {lead.phoneNumber || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2 text-sm text-muted max-w-[160px] truncate">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                          {lead.location || "—"}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs font-medium ${TAB_COLORS[lead.tab] || "text-muted"}`}>
                          {lead.tab}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {isUpdating ? (
                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        ) : lead.red ? (
                          <Badge variant="danger"><XCircle className="h-3 w-3" /> RED</Badge>
                        ) : lead.agree ? (
                          <Badge variant="success"><CheckCircle className="h-3 w-3" /> Agreed</Badge>
                        ) : lead.texted ? (
                          <Badge variant="info"><Clock className="h-3 w-3" /> Awaiting</Badge>
                        ) : (
                          <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Pending</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 hidden md:table-cell">
                        {lead.lastActivity ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <Clock className="h-3 w-3" />
                            <span>{lead.lastActivity}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {lead.phoneNumber && (
                            <a href={`tel:${lead.phoneNumber.replace(/\D/g, "")}`}>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={(e) => {
                                  if (!lead.texted) {
                                    e.preventDefault();
                                    updateLead(lead, "TEXTED?", "TRUE").then(() => {
                                      window.location.href = `tel:${lead.phoneNumber.replace(/\D/g, "")}`;
                                    });
                                  }
                                }}
                              >
                                <Phone className="h-3.5 w-3.5" />
                              </Button>
                            </a>
                          )}
                          {lead.phoneNumber && formatPhone(lead.phoneNumber) && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => {
                                const phone = formatPhone(lead.phoneNumber);
                                if (phone) {
                                  if (!lead.texted) {
                                    updateLead(lead, "TEXTED?", "TRUE").then(() => {
                                      window.open(`https://wa.me/${phone}`, "_blank");
                                    });
                                  } else {
                                    window.open(`https://wa.me/${phone}`, "_blank");
                                  }
                                }
                              }}
                            >
                              <Send className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!lead.agree && !lead.red && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => updateLead(lead, "AGREE?", "TRUE")}
                              disabled={isUpdating}
                              title="Mark as Agreed"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {!lead.red && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => updateLead(lead, "RED?", "TRUE")}
                              disabled={isUpdating}
                              title="Mark as RED"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {(lead.texted || lead.agree || lead.red) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => undoAll(lead)}
                              disabled={isUpdating}
                              title="Undo All"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-glass-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <p className="text-sm text-muted">
              Page {page} of {totalPages}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
