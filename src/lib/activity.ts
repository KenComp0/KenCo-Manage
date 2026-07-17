import { app } from "./firebase";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  Timestamp,
} from "firebase/firestore";

const db = getFirestore(app);

export interface Activity {
  id?: string;
  userId: string;
  email: string;
  tab: string;
  row: number;
  businessName: string;
  action: "texted" | "called" | "agreed" | "red" | "undo";
  timestamp: Timestamp;
}

export async function logActivity(activity: Omit<Activity, "id" | "timestamp">) {
  try {
    await addDoc(collection(db, "activity"), {
      ...activity,
      timestamp: Timestamp.now(),
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
): Promise<{ activities: Activity[]; total: number }> {
  const constraints: any[] = [where("email", "==", email), orderBy("timestamp", "desc")];

  if (options?.tab) {
    constraints.push(where("tab", "==", options.tab));
  }

  if (options?.action) {
    constraints.push(where("action", "==", options.action));
  }

  if (options?.startDate) {
    constraints.push(where("timestamp", ">=", Timestamp.fromDate(options.startDate)));
  }

  if (options?.endDate) {
    constraints.push(where("timestamp", "<=", Timestamp.fromDate(options.endDate)));
  }

  const q = query(collection(db, "activity"), ...constraints, firestoreLimit(500));
  const snapshot = await getDocs(q);

  const activities = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Activity[];

  return { activities, total: activities.length };
}
