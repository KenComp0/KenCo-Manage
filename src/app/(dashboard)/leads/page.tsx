"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { Input } from "@/components/Input";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/Modal";
import { MESSAGES_MAP } from "@/lib/config";
import {
  Search,
  Send,
  Phone,
  MapPin,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Lead {
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

interface LeadStats {
  total: number;
  pending: number;
  sent: number;
  red: number;
}

export default function LeadsPage() {
  const { user, isAdmin } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("Location");
  const [tabs, setTabs] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<LeadStats>({ total: 0, pending: 0, sent: 0, red: 0 });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTabs();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [selectedTab]);

  useEffect(() => {
    fetchLeads();
  }, [selectedTab, page]);

  useEffect(() => {
    fetchStats();
  }, [selectedTab]);

  const fetchTabs = async () => {
    try {
      const res = await fetch("/api/leads?tabs=true");
      const data = await res.json();
      setTabs(data.tabs || []);
      if (data.tabs?.length && !data.tabs.includes(selectedTab)) {
        setSelectedTab(data.tabs[0]);
      }
    } catch (error) {
      console.error("Failed to fetch tabs:", error);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/leads?tab=${selectedTab}&page=${page}&pageSize=30`
      );
      const data = await res.json();
      setLeads(data.leads || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error("Failed to fetch leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/leads?tab=${selectedTab}&stats=true`);
      const data = await res.json();
      setStats(data.stats || { total: 0, pending: 0, sent: 0, red: 0 });
    } catch {}
  };

  const filteredLeads = leads.filter((lead) => {
    if (!search) return true;
    return (
      lead.businessName.toLowerCase().includes(search.toLowerCase()) ||
      lead.phoneNumber.includes(search) ||
      lead.location.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleSend = async (lead: Lead) => {
    setSelectedLead(lead);
    setShowSendModal(true);
  };

  const confirmSend = async () => {
    if (!selectedLead) return;
    setSending(true);
    try {
      await fetch(`/api/leads/${selectedLead.row}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: selectedTab,
          businessName: selectedLead.businessName,
          userName: user?.email,
        }),
      });

      setLeads((prev) =>
        prev.map((l) =>
          l.row === selectedLead.row
            ? { ...l, texted: true, doneBy: user?.email || "" }
            : l
        )
      );
      setStats((prev) => ({
        ...prev,
        sent: prev.sent + 1,
        pending: prev.pending - 1,
      }));
      setShowSendModal(false);
      setSelectedLead(null);
    } catch (error) {
      console.error("Failed to send:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-muted mt-1">Browse and manage leads</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-warning" },
          { label: "Sent", value: stats.sent, color: "text-success" },
          { label: "Red", value: stats.red, color: "text-danger" },
        ].map((stat) => (
          <Card key={stat.label} className="p-4">
            <p className="text-xs text-muted">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        {/* Tabs */}
        <div className="flex gap-2 flex-wrap mb-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedTab === tab
                  ? "bg-primary text-white"
                  : "bg-surface text-muted hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search + Pagination info */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search leads..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <p className="text-sm text-muted whitespace-nowrap">
            Page {page} of {totalPages} ({total} leads)
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />
            ))}
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-glass-border">
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted hidden sm:table-cell">#</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Business</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Phone</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted hidden md:table-cell">Location</th>
                  <th className="text-left py-3 px-3 text-xs font-medium text-muted">Status</th>
                  <th className="text-right py-3 px-3 text-xs font-medium text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.row}
                    className="border-b border-glass-border/50 hover:bg-surface/50 transition-colors"
                  >
                    <td className="py-3 px-3 text-xs text-muted hidden sm:table-cell">{lead.row}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {lead.businessName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground truncate max-w-[160px]">
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
                      <div className="flex items-center gap-2 text-sm text-muted max-w-[200px] truncate">
                        <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                        {lead.location || "—"}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {lead.red ? (
                        <Badge variant="danger"><XCircle className="h-3 w-3" /> RED</Badge>
                      ) : lead.texted ? (
                        <Badge variant="success"><CheckCircle className="h-3 w-3" /> Sent</Badge>
                      ) : (
                        <Badge variant="warning"><AlertTriangle className="h-3 w-3" /> Pending</Badge>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {!lead.texted && !lead.red && lead.phoneNumber && (
                        <Button size="sm" onClick={() => handleSend(lead)}>
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                      )}
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
              onClick={() => { setPage((p) => Math.max(1, p - 1)); }}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                      page === pageNum
                        ? "bg-primary text-white"
                        : "text-muted hover:text-foreground hover:bg-surface"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); }}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      {/* Send Modal */}
      <Modal open={showSendModal} onClose={() => setShowSendModal(false)}>
        <ModalHeader>Send WhatsApp Message</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface/50">
              <p className="text-sm font-medium text-foreground mb-1">
                {selectedLead?.businessName}
              </p>
              <p className="text-sm text-muted">{selectedLead?.phoneNumber}</p>
            </div>
            <div className="p-4 rounded-xl bg-surface/50">
              <p className="text-xs text-muted mb-2">Message Preview:</p>
              <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-6">
                {(MESSAGES_MAP[selectedTab] || "")
                  .replace("{business_name}", selectedLead?.businessName || "")}
              </p>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowSendModal(false)}>Cancel</Button>
          <Button variant="success" onClick={confirmSend} loading={sending}>
            <Send className="h-4 w-4" /> Confirm Send
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
