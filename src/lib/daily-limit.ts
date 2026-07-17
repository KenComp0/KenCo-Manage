import { getAdminFirestore } from "./firebase-admin";

const DAILY_LIMIT = parseInt(process.env.DAILY_SEND_LIMIT || "30", 10);

export interface DailyLimitResult {
  allowed: boolean;
  dailySends: number;
  totalSends: number;
  dailyLimit: number;
}

export async function checkAndIncrementDailyLimit(
  uid: string
): Promise<DailyLimitResult> {
  const db = getAdminFirestore();
  const today = new Date().toISOString().split("T")[0];
  const userRef = db.collection("users").doc(uid);

  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);

    if (!snap.exists) {
      return { allowed: false, dailySends: 0, totalSends: 0, dailyLimit: DAILY_LIMIT };
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
}

export async function getDailyLimitStatus(
  uid: string
): Promise<{ dailySends: number; totalSends: number; dailyLimit: number }> {
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
}
