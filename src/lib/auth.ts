import { NextRequest } from "next/server";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";

export interface AuthUser {
  uid: string;
  email: string | null;
  role: "admin" | "sales";
  assignedTab: string;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim());

export function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email);
}

export function getAssignedTab(email: string): string {
  const tabMap: Record<string, string> = {
    "sara@example.com": "Location",
    "ahmed@example.com": "Doctors",
    "fatima@example.com": "Moto",
  };
  return tabMap[email] || "Location";
}

export async function signIn(email: string, password: string) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function verifyApiAuth(request: NextRequest): { userId: string; email: string } | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.split(" ")[1];
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      userId: payload.sub,
      email: payload.email || "",
    };
  } catch {
    return null;
  }
}
