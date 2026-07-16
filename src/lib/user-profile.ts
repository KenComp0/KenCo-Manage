import { app } from "./firebase";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";

const db = getFirestore(app);

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: "admin" | "sales";
  assignedTab: string;
  dailySends: number;
  lastSendDate: string;
  totalSends: number;
  createdAt: any;
  updatedAt: any;
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return snap.data() as UserProfile;
}

export async function createUserProfile(profile: Omit<UserProfile, "createdAt" | "updatedAt">) {
  const ref = doc(db, "users", profile.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    await updateDoc(ref, { updatedAt: serverTimestamp() });
    return existing.data() as UserProfile;
  }

  const data = {
    ...profile,
    dailySends: 0,
    lastSendDate: "",
    totalSends: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(ref, data);
  return data as UserProfile;
}

export async function incrementSendCount(uid: string): Promise<{ dailySends: number; totalSends: number }> {
  const today = new Date().toISOString().split("T")[0];
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return { dailySends: 0, totalSends: 0 };

  const data = snap.data() as UserProfile;

  if (data.lastSendDate !== today) {
    await updateDoc(ref, {
      dailySends: 1,
      lastSendDate: today,
      totalSends: increment(1),
      updatedAt: serverTimestamp(),
    });
    return { dailySends: 1, totalSends: data.totalSends + 1 };
  }

  await updateDoc(ref, {
    dailySends: increment(1),
    totalSends: increment(1),
    updatedAt: serverTimestamp(),
  });

  return { dailySends: data.dailySends + 1, totalSends: data.totalSends + 1 };
}

export async function resetDailyIfNewDay(uid: string): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return 0;

  const data = snap.data() as UserProfile;
  if (data.lastSendDate !== today) {
    await updateDoc(ref, { dailySends: 0, lastSendDate: today });
    return 0;
  }

  return data.dailySends;
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const { collection, getDocs } = await import("firebase/firestore");
  const snap = await getDocs(collection(db, "users"));
  return snap.docs.map((d) => d.data() as UserProfile);
}

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}
