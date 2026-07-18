export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "sales";
  assignedTab: string;
  createdAt: any;
  updatedAt: any;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/users?uid=${uid}`);
    const data = await res.json();
    if (!data.users || data.users.length === 0) return null;
    return data.users.find((u: any) => u.id === uid || u.uid === uid) || null;
  } catch (error) {
    console.error("Failed to get user profile:", error);
    return null;
  }
}

export async function createUserProfile(
  profile: Omit<UserProfile, "createdAt" | "updatedAt">
): Promise<UserProfile> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to create user");
  return data.user;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const res = await fetch("/api/users");
  const data = await res.json();
  return (data.users || []).map((u: any) => ({
    uid: u.id || u.uid,
    email: u.email || "",
    name: u.name || "",
    role: u.role || "sales",
    assignedTab: u.assignedTab || "Location",

    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uid, ...data }),
  });
  if (!res.ok) {
    const result = await res.json();
    throw new Error(result.error || "Failed to update user");
  }
}
