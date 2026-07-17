"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { getAllUsers, updateUserProfile, type UserProfile } from "@/lib/user-profile";
import {
  Users,
  Shield,
  Settings as SettingsIcon,
  Save,
  CheckCircle,
  BarChart3,
  Calendar,
  Target,
  Download,
} from "lucide-react";

export default function SettingsPage() {
  const { user, profile, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backing, setBacking] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTab = async (uid: string, tab: string) => {
    await updateUserProfile(uid, { assignedTab: tab });
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, assignedTab: tab } : u))
    );
  };

  const handleUpdateRole = async (uid: string, role: "admin" | "sales") => {
    await updateUserProfile(uid, { role });
    setUsers((prev) =>
      prev.map((u) => (u.uid === uid ? { ...u, role } : u))
    );
  };

  const handleBackup = async () => {
    setBacking(true);
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = data.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Backup failed:", error);
      alert("Backup failed. Try again.");
    } finally {
      setBacking(false);
    }
  };

  if (!user) return null;

  // SALES VIEW
  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted mt-1">Your account and stats</p>
        </div>

        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {profile?.name?.charAt(0) || user.email?.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{profile?.name}</h2>
              <p className="text-sm text-muted">{user.email}</p>
              <Badge variant="default" className="mt-1">{profile?.role}</Badge>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-3 mb-3">
              <Target className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted">Assigned Category</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{profile?.assignedTab}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-3">
              <BarChart3 className="h-5 w-5 text-success" />
              <p className="text-sm text-muted">Sent Today</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{profile?.dailySends || 0}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-3">
              <Calendar className="h-5 w-5 text-warning" />
              <p className="text-sm text-muted">All Time Total</p>
            </div>
            <p className="text-2xl font-bold text-foreground">{profile?.totalSends || 0}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted">Daily Limit</p>
            </div>
            <p className="text-2xl font-bold text-foreground">30</p>
          </Card>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted mt-1">Manage team and configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </CardTitle>
          </CardHeader>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-surface animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.uid}
                  className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-surface/50"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary flex-shrink-0">
                    {u.name?.charAt(0) || u.email?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted truncate">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-right text-xs text-muted">
                      <p>{u.totalSends || 0} total</p>
                      <p>{u.dailySends || 0} today</p>
                    </div>
                    <Badge variant={u.role === "admin" ? "info" : "default"}>
                      {u.role}
                    </Badge>
                    <select
                      value={u.assignedTab}
                      onChange={(e) => handleUpdateTab(u.uid, e.target.value)}
                      className="px-2 py-1.5 rounded-lg text-xs bg-surface border border-glass-border"
                    >
                      <option value="Doctors">Doctors</option>
                      <option value="Location">Location</option>
                      <option value="Immobile">Immobile</option>
                      <option value="Moto">Moto</option>
                      <option value="Optic">Optic</option>
                    </select>
                  </div>
                </div>
              ))}
              {users.length === 0 && (
                <p className="text-sm text-muted text-center py-4">No users found</p>
              )}
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Configuration
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-surface/50">
                <p className="text-sm font-medium text-foreground mb-1">
                  Daily Send Limit
                </p>
                <p className="text-xs text-muted">30 messages per user per day</p>
              </div>
              <div className="p-4 rounded-xl bg-surface/50">
                <p className="text-sm font-medium text-foreground mb-1">
                  Rate Limiting
                </p>
                <p className="text-xs text-muted">100 API requests per minute</p>
              </div>
              <button
                onClick={handleBackup}
                disabled={backing}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <Download className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">
                  {backing ? "Backing up..." : "Download Backup (JSON)"}
                </span>
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                How It Works
              </CardTitle>
            </CardHeader>
            <div className="space-y-2 text-sm text-muted">
              <p>1. Sales person logs in and goes to <strong className="text-foreground">Start Session</strong></p>
              <p>2. Pick a category (Doctors, Location, etc.)</p>
              <p>3. See one lead at a time — call or send WhatsApp</p>
              <p>4. Click Send to mark as done, or Skip to move on</p>
              <p>5. Stats are tracked in Firebase automatically</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
