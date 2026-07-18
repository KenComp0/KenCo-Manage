import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase-admin";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").split(",").map((e) => e.trim());

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, assignedTab, createdBy } = body;

    if (!ADMIN_EMAILS.includes(createdBy || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const auth = getAdminAuth();
    const db = getAdminFirestore();

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name || email.split("@")[0],
    });

    await db.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name: name || email.split("@")[0],
      role: role || "sales",
      assignedTab: assignedTab || "Location",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email,
        name: name || email.split("@")[0],
        role: role || "sales",
        assignedTab: assignedTab || "Location",
      },
    });
  } catch (error: any) {
    console.error("Create user error:", error.message);
    const message = error.code === "auth/email-already-exists"
      ? "An account with this email already exists"
      : error.message || "Failed to create user";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
