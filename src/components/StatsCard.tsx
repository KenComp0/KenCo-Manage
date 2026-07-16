"use client";

import { Card, CardHeader, CardTitle, CardValue, CardDescription } from "./Card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  glow?: "primary" | "success" | "danger" | "warning";
}

export function StatsCard({
  title,
  value,
  description,
  icon,
  trend,
  trendValue,
  glow,
}: StatsCardProps) {
  return (
    <Card glow={glow} className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted">{title}</CardTitle>
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardValue>{value}</CardValue>
      {(description || trendValue) && (
        <div className="mt-2 flex items-center gap-2">
          {trend && (
            <span
              className={cn(
                "text-xs font-medium",
                trend === "up" && "text-success",
                trend === "down" && "text-danger",
                trend === "neutral" && "text-muted"
              )}
            >
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
              {trendValue}
            </span>
          )}
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
      )}
    </Card>
  );
}
