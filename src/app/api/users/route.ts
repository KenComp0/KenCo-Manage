import { NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");
    const db = getAdminFirestore();

    if (uid) {
      const doc = await db.collection("users").doc(uid).get();
      if (!doc.exists) {
        return NextResponse.json({ users: [] });
      }
      return NextResponse.json({ users: [{ id: doc.id, ...doc.data() }] });
    }

    const snapshot = await db.collection("users").get();
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Failed to fetch users:", error.message);
    return NextResponse.json({ users: [], error: error.message });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, name, role, assignedTab } = body;

    if (!uid) {
      return NextResponse.json({ error: "uid required" }, { status: 400 });
    }

    const db = getAdminFirestore();
    const userRef = db.collection("users").doc(uid);
    const existing = await userRef.get();

    if (existing.exists) {
      const updateData: any = { updatedAt: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;
      if (assignedTab !== undefined) updateData.assignedTab = assignedTab;
      await userRef.update(updateData);
      const updated = await userRef.get();
      return NextResponse.json({ user: { id: updated.id, ...updated.data() } });
    }

    if (!existing.exists && !email) {
      return NextResponse.json({ error: "email required for new users" }, { status: 400 });
    }

    const data = {
      uid,
      email,
      name: name || email.split("@")[0],
      role: role || "sales",
      assignedTab: assignedTab || "Location",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userRef.set(data);
    return NextResponse.json({ user: { id: uid, ...data } });
  } catch (error: any) {
    console.error("Failed to create/update user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
