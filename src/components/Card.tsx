"use client";

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: "primary" | "success" | "danger" | "warning";
}

export function Card({ children, className, glow }: CardProps) {
  const glowClasses = {
    primary: "glow-primary",
    success: "glow-success",
    danger: "glow-danger",
    warning: "shadow-[0_0_20px_rgba(245,158,11,0.3)]",
  };

  return (
    <div
      className={cn(
        "glass-card rounded-2xl p-6",
        glow && glowClasses[glow],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h3 className={cn("text-lg font-semibold text-foreground", className)}>
      {children}
    </h3>
  );
}

export function CardValue({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("text-3xl font-bold text-foreground", className)}>
      {children}
    </div>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-sm text-muted", className)}>{children}</p>
  );
}
