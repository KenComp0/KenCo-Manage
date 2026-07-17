"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { CATEGORIES, MESSAGES_MAP } from "@/lib/config";
import { incrementSendCount } from "@/lib/user-profile";
import {
  Play,
  SkipForward,
  Send,
  Phone,
  MapPin,
  Globe,
  XCircle,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  Zap,
  RotateCcw,
  LogOut,
  BarChart3,
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

  // Session state
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [selectedCategory, setSelectedCategory] = useState("Location");

  // Current lead
  const [currentLead, setCurrentLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [skipping, setSkipping] = useState(false);

  // Stats for this session
  const [sessionStats, setSessionStats] = useState({
    sent: 0,
    skipped: 0,
  });

  // Message
  const [message, setMessage] = useState("");

  // Daily stats from Firestore
  const [dailySends, setDailySends] = useState(0);
  const dailyLimit = parseInt(process.env.NEXT_PUBLIC_DAILY_LIMIT || "30", 10);

  useEffect(() => {
    setMessage(MESSAGES_MAP[selectedCategory] || "");
  }, [selectedCategory]);

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

    // Check daily limit
    if (dailySends >= dailyLimit) {
      alert(`Daily limit reached (${dailyLimit}). Try again tomorrow.`);
      return;
    }

    setSending(true);
    try {
      const formattedPhone = formatPhone(currentLead.phoneNumber);

      // Open WhatsApp
      if (formattedPhone) {
        const msg = message.replace("{business_name}", currentLead.businessName);
        const waUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(msg)}`;
        window.open(waUrl, "_blank");
      }

      // Update sheet
      await fetch(`/api/leads/${currentLead.row}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: selectedCategory,
          businessName: currentLead.businessName,
          userName: user.email,
        }),
      });

      // Update Firestore counter
      const counts = await incrementSendCount(user.uid);
      setDailySends(counts.dailySends);

      setSessionStats((prev) => ({ ...prev, sent: prev.sent + 1 }));

      // Load next lead
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

  // IDLE STATE — Pick category
  if (sessionState === "idle") {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 mb-6 glow-primary">
            <Zap className="h-10 w-10 text-primary" />
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

  // FINISHED STATE
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

  // ACTIVE STATE — Lead by lead
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Badge variant="info">{selectedCategory}</Badge>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-success flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" /> {sessionStats.sent} sent
            </span>
            <span className="text-warning flex items-center gap-1">
              <SkipForward className="h-3.5 w-3.5" /> {sessionStats.skipped} skipped
            </span>
            <span className="text-muted flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" /> {dailySends}/{dailyLimit} today
            </span>
          </div>
        </div>
        <Button variant="ghost" onClick={endSession}>
          <LogOut className="h-4 w-4" />
          End Session
        </Button>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${Math.min((dailySends / dailyLimit) * 100, 100)}%` }}
        />
      </div>

      {/* Current Lead Card */}
      {loading ? (
        <Card className="min-h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Phone className="h-6 w-6 text-primary" />
            </div>
            <p className="text-muted">Loading next lead...</p>
          </div>
        </Card>
      ) : !currentLead ? (
        <Card className="min-h-[400px] flex items-center justify-center">
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
        <Card className="min-h-[400px]">
          <div className="flex flex-col h-full">
            {/* Lead Info */}
            <div className="flex items-start gap-4 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
                {currentLead.businessName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold text-foreground mb-1">
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

            {/* Message Preview */}
            <div className="flex-1 p-4 rounded-xl bg-surface/50 mb-6">
              <p className="text-xs text-muted mb-2 font-medium">Message to send:</p>
              <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                {message.replace("{business_name}", currentLead.businessName)}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {currentLead.phoneNumber && formatPhone(currentLead.phoneNumber) && (
                <Button
                  variant="success"
                  size="lg"
                  className="flex-1"
                  onClick={handleSend}
                  loading={sending}
                  disabled={dailySends >= dailyLimit}
                >
                  <Send className="h-5 w-5" />
                  WhatsApp
                </Button>
              )}
              {currentLead.phoneNumber && (
                <a
                  href={`tel:${currentLead.phoneNumber.replace(/\D/g, "")}`}
                  className="flex-1"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                  >
                    <Phone className="h-5 w-5" />
                    Call
                  </Button>
                </a>
              )}
              <Button
                variant="secondary"
                size="lg"
                onClick={handleSkip}
                loading={skipping}
              >
                <SkipForward className="h-5 w-5" />
                Skip
              </Button>
              <Button
                variant="danger"
                size="lg"
                onClick={handleRedFlag}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>

            {dailySends >= dailyLimit && (
              <p className="text-sm text-danger text-center mt-3">
                Daily limit reached ({dailyLimit}). Come back tomorrow!
              </p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
