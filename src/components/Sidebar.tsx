"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Zap,
  Settings,
  LogOut,
  History,
  Menu,
  X,
} from "lucide-react";

interface SidebarProps {
  isAdmin: boolean;
  userName: string;
  onLogout: () => void;
}

export function Sidebar({ isAdmin, userName, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      adminOnly: true,
    },
    {
      label: "Leads",
      href: "/leads",
      icon: Users,
      adminOnly: false,
    },
    {
      label: "Start Session",
      href: "/send",
      icon: Zap,
      adminOnly: false,
    },
    {
      label: "History",
      href: "/history",
      icon: History,
      adminOnly: false,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: Settings,
      adminOnly: true,
    },
  ];

  const filteredItems = navItems.filter(
    (item) => !item.adminOnly || isAdmin
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 z-50 lg:hidden w-10 h-10 rounded-xl glass flex items-center justify-center"
        aria-label="Toggle menu"
      >
        {open ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 w-64 glass border-r border-glass-border flex flex-col z-40 transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">AutoSend</h1>
              <p className="text-xs text-muted">WhatsApp Platform</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {filteredItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary"
                    : "text-muted hover:text-foreground hover:bg-surface"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-glass-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {userName}
              </p>
              <p className="text-xs text-muted truncate">
                {isAdmin ? "Admin" : "Sales"}
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-muted hover:text-danger transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
