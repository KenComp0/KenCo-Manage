export interface DailyLimitResult {
  allowed: boolean;
  dailySends: number;
  totalSends: number;
  dailyLimit: number;
}

export async function checkAndIncrementDailyLimit(
  uid: string
): Promise<DailyLimitResult> {
  return { allowed: true, dailySends: 0, totalSends: 0, dailyLimit: 0 };
}

export async function getDailyLimitStatus(
  uid: string
): Promise<{ dailySends: number; totalSends: number; dailyLimit: number }> {
  return { dailySends: 0, totalSends: 0, dailyLimit: 0 };
}
