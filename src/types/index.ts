export interface User {
  email: string;
  name: string;
  role: "admin" | "sales";
  assignedTab: string;
  dailySends: number;
  lastActive: string;
}

export interface Lead {
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

export interface SheetConfig {
  name: string;
  tabName: string;
  messageTemplate: string;
}

export interface DashboardStats {
  date: string;
  totalSends: number;
  perUser: Record<string, number>;
}

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}
