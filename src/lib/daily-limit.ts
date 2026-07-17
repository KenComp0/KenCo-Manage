import { getAdminFirestore } from "./firebase-admin";

const DAILY_LIMIT = parseInt(process.env.DAILY_SEND_LIMIT || "30", 10);

export interface DailyLimitResult {
  allowed: boolean;
  dailySends: number;
  totalSends: number;
  dailyLimit: number;
  error?: string;
}

export async function checkAndIncrementDailyLimit(
  uid: string
): Promise<DailyLimitResult> {
  try {
    const db = getAdminFirestore();
    const today = new Date().toISOString().split("T")[0];
    const userRef = db.collection("users").doc(uid);

    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);

      if (!snap.exists) {
        return { allowed: true, dailySends: 0, totalSends: 0, dailyLimit: DAILY_LIMIT };
      }

      const data = snap.data()!;
      const currentDaily = data.lastSendDate === today ? (data.dailySends || 0) : 0;
      const currentTotal = data.totalSends || 0;

      if (currentDaily >= DAILY_LIMIT) {
        return { allowed: false, dailySends: currentDaily, totalSends: currentTotal, dailyLimit: DAILY_LIMIT };
      }

      const newDaily = currentDaily + 1;
      const newTotal = currentTotal + 1;

      tx.update(userRef, {
        dailySends: newDaily,
        lastSendDate: today,
        totalSends: newTotal,
      });

      return { allowed: true, dailySends: newDaily, totalSends: newTotal, dailyLimit: DAILY_LIMIT };
    });

    return result;
  } catch (error: any) {
    console.error("Firestore daily limit check failed, allowing send:", error.message);
    return { allowed: true, dailySends: 0, totalSends: 0, dailyLimit: DAILY_LIMIT, error: error.message };
  }
}

export async function getDailyLimitStatus(
  uid: string
): Promise<{ dailySends: number; totalSends: number; dailyLimit: number }> {
  try {
    const db = getAdminFirestore();
    const today = new Date().toISOString().split("T")[0];
    const snap = await db.collection("users").doc(uid).get();

    if (!snap.exists) {
      return { dailySends: 0, totalSends: 0, dailyLimit: DAILY_LIMIT };
    }

    const data = snap.data()!;
    return {
      dailySends: data.lastSendDate === today ? (data.dailySends || 0) : 0,
      totalSends: data.totalSends || 0,
      dailyLimit: DAILY_LIMIT,
    };
  } catch (error: any) {
    console.error("Firestore daily limit status failed:", error.message);
    return { dailySends: 0, totalSends: 0, dailyLimit: DAILY_LIMIT };
  }
}
