"use client";

import { useEffect, useState } from "react";
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
}

const TAB_COLORS: Record<string, string> = {
  Doctors: "text-success",
  Location: "text-indigo-400",
  Immobile: "text-warning",
  Moto: "text-danger",
  Optic: "text-purple-400",
};

export default function HistoryPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<HistoryLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterTab, setFilterTab] = useState("all");

  useEffect(() => {
    if (user?.email) {
      fetchHistory();
    }
  }, [user, page]);

  const fetchHistory = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leads?history=true&doneBy=${encodeURIComponent(user.email)}&page=${page}&pageSize=20`
      );
      const data = await res.json();
      setLeads(data.leads || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    if (filterTab !== "all" && lead.tab !== filterTab) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      lead.businessName.toLowerCase().includes(q) ||
      lead.phoneNumber.includes(search) ||
      lead.location.toLowerCase().includes(q) ||
      lead.tab.toLowerCase().includes(q)
    );
  });

  const stats = {
    total,
    texted: leads.filter((l) => l.texted && !l.red).length,
    red: leads.filter((l) => l.red).length,
    agree: leads.filter((l) => l.agree).length,
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
          <p className="text-muted mt-0.5">All leads you&apos;ve contacted</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Contacted", value: stats.total, color: "text-foreground" },
          { label: "Texted", value: stats.texted, color: "text-success" },
          { label: "Agreed", value: stats.agree, color: "text-indigo-400" },
          { label: "Red Flags", value: stats.red, color: "text-danger" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        {/* Tab filter */}
        <div className="flex gap-2 flex-wrap mb-4">
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

        {/* Search */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <Input
              placeholder="Search by name, phone, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <p className="text-xs text-muted whitespace-nowrap">
            {filteredLeads.length} of {total} leads
          </p>
        </div>

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
              Start a session to see your contacted leads here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Business</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Phone</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted hidden md:table-cell">Location</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Category</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Status</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, i) => (
                  <tr
                    key={`${lead.tab}-${lead.row}-${i}`}
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
                    <td className="py-3 px-3 hidden md:table-cell">
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
                      {lead.red ? (
                        <Badge variant="danger"><XCircle className="h-3 w-3" /> RED</Badge>
                      ) : lead.agree ? (
                        <Badge variant="info"><CheckCircle className="h-3 w-3" /> Agreed</Badge>
                      ) : lead.texted ? (
                        <Badge variant="success"><CheckCircle className="h-3 w-3" /> Sent</Badge>
                      ) : (
                        <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Pending</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {lead.phoneNumber && (
                          <a href={`tel:${lead.phoneNumber.replace(/\D/g, "")}`}>
                            <Button size="sm" variant="primary">
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
                                window.open(`https://wa.me/${phone}`, "_blank");
                              }
                            }}
                          >
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
