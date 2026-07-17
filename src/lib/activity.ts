import { getAdminFirestore } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export interface Activity {
  id?: string;
  userId: string;
  email: string;
  tab: string;
  row: number;
  businessName: string;
  action: "texted" | "called" | "agreed" | "red" | "undo";
  timestamp?: FieldValue;
  timestampDate?: Date;
}

export async function logActivity(activity: Omit<Activity, "id" | "timestamp" | "timestampDate">) {
  try {
    const db = getAdminFirestore();
    await db.collection("activity").add({
      ...activity,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

export async function getUserActivity(
  email: string,
  options?: {
    tab?: string;
    startDate?: Date;
    endDate?: Date;
    action?: string;
    pageSize?: number;
    pageNum?: number;
  }
): Promise<{ activities: any[]; total: number }> {
  const db = getAdminFirestore();
  let q: FirebaseFirestore.Query = db
    .collection("activity")
    .where("email", "==", email)
    .orderBy("timestamp", "desc");

  if (options?.tab) {
    q = q.where("tab", "==", options.tab);
  }

  if (options?.action) {
    q = q.where("action", "==", options.action);
  }

  if (options?.startDate) {
    q = q.where("timestamp", ">=", options.startDate);
  }

  if (options?.endDate) {
    q = q.where("timestamp", "<=", options.endDate);
  }

  q = q.limit(500);
  const snapshot = await q.get();

  const activities = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { activities, total: activities.length };
}
