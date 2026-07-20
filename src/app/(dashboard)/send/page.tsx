"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { CATEGORIES, MESSAGES_MAP } from "@/lib/config";
import {
  Play,
  SkipForward,
  Send,
  Phone,
  MapPin,
  Globe,
  XCircle,
  CheckCircle,
  RotateCcw,
  LogOut,
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

type SessionState = "idle" | "active" | "finished";

export default function SendPage() {
  const { user, profile } = useAuth();

  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [selectedCategory, setSelectedCategory] = useState("Location");

  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const [sessionStats, setSessionStats] = useState({ sent: 0, skipped: 0 });

  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(`msg_template_${selectedCategory}`);
    setMessage(saved || MESSAGES_MAP[selectedCategory] || "");
  }, [selectedCategory]);

  useEffect(() => {
    if (message) {
      localStorage.setItem(`msg_template_${selectedCategory}`, message);
    }
  }, [message, selectedCategory]);

  const fetchNextLead = useCallback(
    async (afterRow?: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          tab: selectedCategory,
          next: "true",
        });
        if (afterRow) params.set("afterRow", String(afterRow));

        const res = await fetch(`/api/leads?${params}`);
        const data = await res.json();
        setCurrentLead(data.lead);
      } catch (error) {
        console.error("Failed to fetch lead:", error);
      } finally {
        setLoading(false);
      }
    },
    [selectedCategory]
  );

  const startSession = () => {
    setSessionState("active");
    setSessionStats({ sent: 0, skipped: 0 });
    fetchNextLead();
  };

  const endSession = () => {
    setSessionState("finished");
    setCurrentLead(null);
  };

  const handleSend = async () => {
    if (!currentLead || !user) return;

    setSending(true);
    try {
      const formattedPhone = formatPhone(currentLead.phoneNumber);

      if (formattedPhone) {
        const msg = message.replace("{business_name}", currentLead.businessName);
        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, "_blank");
      }

      const res = await fetch(`/api/leads/${currentLead.row}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: selectedCategory,
          businessName: currentLead.businessName,
          userName: user.email,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Send failed");

      setSessionStats((prev) => ({ ...prev, sent: prev.sent + 1 }));
      await fetchNextLead(currentLead.row);
    } catch (error) {
      console.error("Send failed:", error);
    } finally {
      setSending(false);
    }
  };

  const handleSkip = async () => {
    if (!currentLead) return;
    setSkipping(true);
    setSessionStats((prev) => ({ ...prev, skipped: prev.skipped + 1 }));
    await fetchNextLead(currentLead.row);
    setSkipping(false);
  };

  const handleRedFlag = async () => {
    if (!currentLead) return;
    try {
      await fetch(`/api/leads/${currentLead.row}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: selectedCategory,
          businessName: currentLead.businessName,
          userName: user?.email,
          red: true,
        }),
      });
    } catch {}
    await fetchNextLead(currentLead.row);
  };

  const formatPhone = (phone: string): string | null => {
    const cleaned = phone.replace(/\D/g, "");
    if (!cleaned) return null;
    if (cleaned.startsWith("05") || cleaned.startsWith("5")) return null;
    if (cleaned.startsWith("0")) return `212${cleaned.slice(1)}`;
    if (cleaned.startsWith("212")) return cleaned;
    return `212${cleaned}`;
  };

  const isLandline = (phone: string): boolean => {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.startsWith("05") || cleaned.startsWith("5");
  };

  if (sessionState === "idle") {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-6 glow-primary">
            <Play className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Start Session</h1>
          <p className="text-muted">Pick a category and start calling leads one by one</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select Category</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                  selectedCategory === cat.name
                    ? "bg-primary/20 border-2 border-primary"
                    : "glass border-2 border-transparent hover:border-glass-border"
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <div>
                  <p className="font-medium text-foreground">{cat.label}</p>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Message Preview</CardTitle>
          </CardHeader>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-40 p-4 rounded-xl bg-surface border border-glass-border text-sm text-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
            placeholder="Type your message..."
          />
          <p className="text-xs text-muted mt-2">
            Use {"{business_name}"} to personalize
          </p>
        </Card>

        <div className="text-center">
          <Button size="lg" onClick={startSession} className="px-12">
            <Play className="h-5 w-5" />
            Start Session
          </Button>
        </div>
      </div>
    );
  }

  if (sessionState === "finished") {
    return (
      <div className="max-w-lg mx-auto space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-success/20 mb-6 glow-success">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Session Complete</h1>
          <p className="text-muted">Great work! Here&apos;s your summary.</p>
        </div>

        <Card>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div>
              <p className="text-4xl font-bold text-success">{sessionStats.sent}</p>
              <p className="text-sm text-muted mt-1">Messages Sent</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-warning">{sessionStats.skipped}</p>
              <p className="text-sm text-muted mt-1">Skipped</p>
            </div>
          </div>
        </Card>

        <div className="flex gap-4">
          <Button
            className="flex-1"
            onClick={() => {
              setSessionState("idle");
              setSessionStats({ sent: 0, skipped: 0 });
            }}
          >
            <RotateCcw className="h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="info">{selectedCategory}</Badge>
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            <span className="text-success flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> {sessionStats.sent} sent
            </span>
            <span className="text-warning flex items-center gap-1">
              <SkipForward className="h-3.5 w-3.5" /> {sessionStats.skipped} skipped
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={endSession}>
          <LogOut className="h-4 w-4" />
          End Session
        </Button>
      </div>

      {loading ? (
        <Card className="min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted">Loading next lead...</p>
          </div>
        </Card>
      ) : !currentLead ? (
        <Card className="min-h-[300px] sm:min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/20 mb-4">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">All Done!</h2>
            <p className="text-muted mb-6">No more pending leads in {selectedCategory}</p>
            <Button onClick={endSession}>
              <LogOut className="h-4 w-4" />
              End Session
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="min-h-[300px] sm:min-h-[400px]">
          <div className="flex flex-col h-full">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                {currentLead.businessName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                  {currentLead.businessName}
                </h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5" />
                    {currentLead.phoneNumber || "No phone"}
                    {currentLead.phoneNumber && isLandline(currentLead.phoneNumber) && (
                      <Badge variant="warning" className="ml-1">Landline</Badge>
                    )}
                  </span>
                  {currentLead.location && (
                    <span className="flex items-center gap-1.5 max-w-[300px] truncate">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                      {currentLead.location}
                    </span>
                  )}
                  {currentLead.website && (
                    <a
                      href={currentLead.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-primary hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-6 space-y-2">
              <p className="text-xs text-muted font-medium">Edit message (saves per category):</p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full h-20 sm:h-28 p-3 rounded-xl bg-surface border border-glass-border text-sm text-foreground resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                placeholder="Type your message..."
              />
              <p className="text-xs text-muted">
                Preview: {message.replace("{business_name}", currentLead.businessName).slice(0, 120)}
                {message.replace("{business_name}", currentLead.businessName).length > 120 ? "..." : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:gap-3 gap-2">
              {currentLead.phoneNumber && formatPhone(currentLead.phoneNumber) && (
                <Button
                  variant="success"
                  size="lg"
                  className="w-full"
                  onClick={handleSend}
                  loading={sending}
                >
                  <Send className="h-5 w-5" />
                  WhatsApp
                </Button>
              )}
              {currentLead.phoneNumber && (
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={async () => {
                    if (!currentLead || !user) return;
                    setSending(true);
                    try {
                      await fetch(`/api/leads/${currentLead.row}/update`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          tab: selectedCategory,
                          field: "TEXTED?",
                          value: "TRUE",
                          userName: user.email,
                          businessName: currentLead.businessName,
                        }),
                      });
                    } catch (error) {
                      console.error("Failed to mark as called:", error);
                    } finally {
                      setSending(false);
                      window.location.href = `tel:${currentLead.phoneNumber.replace(/\D/g, "")}`;
                    }
                  }}
                  loading={sending}
                >
                  <Phone className="h-5 w-5" />
                  Call
                </Button>
              )}
              <Button
                variant="secondary"
                size="lg"
                className="w-full"
                onClick={handleSkip}
                loading={skipping}
              >
                <SkipForward className="h-5 w-5" />
                Skip
              </Button>
              <Button
                variant="danger"
                size="lg"
                className="w-full"
                onClick={handleRedFlag}
              >
                <XCircle className="h-5 w-5" />
                Red Flag
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
