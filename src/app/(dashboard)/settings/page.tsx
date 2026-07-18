"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardHeader, CardTitle } from "@/components/Card";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Badge } from "@/components/Badge";
import { getAllUsers, updateUserProfile, type UserProfile } from "@/lib/user-profile";
import {
  Users,
  Shield,
  Settings as SettingsIcon,
  Download,
  RefreshCw,
  Target,
  UserPlus,
  Mail,
  Lock,
  X,
} from "lucide-react";

export default function SettingsPage() {
  const { user, profile, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [backing, setBacking] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    name: "",
    role: "sales" as "admin" | "sales",
    assignedTab: "Location",
  });

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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    setCreateSuccess("");

    try {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newUser,
          createdBy: user?.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create user");
        return;
      }

      setCreateSuccess(`Account created for ${newUser.email}. They can now log in.`);
      setNewUser({ email: "", password: "", name: "", role: "sales", assignedTab: "Location" });
      await loadUsers();
    } catch (error: any) {
      setCreateError(error.message || "Failed to create user");
    } finally {
      setCreating(false);
    }
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

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync");
      const data = await res.json();
      if (data.success) {
        alert(`Synced ${data.synced.length} tabs successfully`);
      } else {
        alert(`Sync failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      alert("Sync failed. Try again.");
    } finally {
      setSyncing(false);
    }
  };

  if (!user) return null;

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
        </div>
      </div>
    );
  }

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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Members
              </CardTitle>
              <Button size="sm" onClick={() => setShowCreateUser(true)}>
                <UserPlus className="h-4 w-4" />
                Add User
              </Button>
            </div>
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
              <button
                onClick={handleSync}
                disabled={syncing}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-success/10 hover:bg-success/20 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 text-success ${syncing ? "animate-spin" : ""}`} />
                <span className="text-sm font-medium text-success">
                  {syncing ? "Syncing from Google Sheet..." : "Sync Google Sheet → Cache"}
                </span>
              </button>
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
              <p>1. Admin creates accounts via <strong className="text-foreground">Settings → Add User</strong></p>
              <p>2. Sales person logs in and goes to <strong className="text-foreground">Start Session</strong></p>
              <p>3. Pick a category (Doctors, Location, etc.)</p>
              <p>4. See one lead at a time — call or send WhatsApp</p>
              <p>5. Click Send to mark as done, or Skip to move on</p>
            </div>
          </Card>
        </div>
      </div>

      {showCreateUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md glass-card rounded-2xl p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground">Create New User</h3>
              <button
                onClick={() => {
                  setShowCreateUser(false);
                  setCreateError("");
                  setCreateSuccess("");
                }}
                className="p-1 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createSuccess && (
              <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-sm text-success mb-4">
                {createSuccess}
              </div>
            )}

            {createError && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/20 text-sm text-danger mb-4">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="user@kenco.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                icon={<Mail className="h-4 w-4" />}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Min 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                icon={<Lock className="h-4 w-4" />}
                required
                minLength={6}
              />

              <Input
                label="Name"
                type="text"
                placeholder="Full name"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                required
              />

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "admin" | "sales" })}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-glass-border text-foreground"
                >
                  <option value="sales">Sales</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Assigned Category</label>
                <select
                  value={newUser.assignedTab}
                  onChange={(e) => setNewUser({ ...newUser, assignedTab: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-glass-border text-foreground"
                >
                  <option value="Doctors">Doctors</option>
                  <option value="Location">Location</option>
                  <option value="Immobile">Immobile</option>
                  <option value="Moto">Moto</option>
                  <option value="Optic">Optic</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowCreateUser(false);
                    setCreateError("");
                    setCreateSuccess("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  loading={creating}
                >
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
