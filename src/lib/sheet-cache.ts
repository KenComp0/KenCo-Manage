import { getAdminFirestore } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { getLeadsFromSheet, getSheetNames } from "./google-sheets";
import type { Lead } from "@/types";

const CACHE_COLLECTION = "sheetCache";
const STALE_MS = 5 * 60 * 1000;

function isCacheStale(lastSynced: any): boolean {
  if (!lastSynced) return true;
  const ts = lastSynced.seconds ? lastSynced.seconds * 1000 : new Date(lastSynced).getTime();
  return Date.now() - ts > STALE_MS;
}

export async function syncAllTabs(): Promise<{ synced: string[]; errors: string[] }> {
  const db = getAdminFirestore();
  const sheets = await getSheetNames();
  const skipSheets = ["Dashboard", "Users"];
  const tabs = sheets.filter((s) => !skipSheets.includes(s));

  const synced: string[] = [];
  const errors: string[] = [];

  for (const tab of tabs) {
    try {
      const leads = await getLeadsFromSheet(tab);
      await db.collection(CACHE_COLLECTION).doc(tab).set({
        tabName: tab,
        leads,
        lastSynced: FieldValue.serverTimestamp(),
      });
      synced.push(tab);
    } catch (error: any) {
      console.error(`Failed to sync tab ${tab}:`, error.message);
      errors.push(tab);
    }
  }

  await db.collection(CACHE_COLLECTION).doc("_meta").set({
    lastSync: FieldValue.serverTimestamp(),
    syncedTabs: synced,
  });

  return { synced, errors };
}

export async function syncSingleTab(tabName: string): Promise<boolean> {
  const db = getAdminFirestore();
  const leads = await getLeadsFromSheet(tabName);
  await db.collection(CACHE_COLLECTION).doc(tabName).set({
    tabName,
    leads,
    lastSynced: FieldValue.serverTimestamp(),
  });
  return true;
}

export async function getCachedLeads(tabName: string): Promise<Lead[]> {
  const db = getAdminFirestore();
  const doc = await db.collection(CACHE_COLLECTION).doc(tabName).get();

  if (!doc.exists) {
    await syncSingleTab(tabName);
    const fresh = await db.collection(CACHE_COLLECTION).doc(tabName).get();
    return (fresh.data()?.leads as Lead[]) || [];
  }

  const data = doc.data()!;
  if (isCacheStale(data.lastSynced)) {
    await syncSingleTab(tabName);
    const fresh = await db.collection(CACHE_COLLECTION).doc(tabName).get();
    return (fresh.data()?.leads as Lead[]) || [];
  }

  return (data.leads as Lead[]) || [];
}

export async function getAllCachedTabs(): Promise<string[]> {
  const db = getAdminFirestore();
  const metaDoc = await db.collection(CACHE_COLLECTION).doc("_meta").get();

  if (metaDoc.exists) {
    const data = metaDoc.data()!;
    if (!isCacheStale(data.lastSync) && data.syncedTabs) {
      return data.syncedTabs;
    }
  }

  const result = await syncAllTabs();
  return result.synced;
}

export async function updateCachedLead(
  tabName: string,
  rowNumber: number,
  field: string,
  value: string
): Promise<void> {
  const db = getAdminFirestore();
  const doc = await db.collection(CACHE_COLLECTION).doc(tabName).get();

  if (!doc.exists) return;

  const data = doc.data()!;
  const leads = (data.leads as Lead[]) || [];

  const fieldMap: Record<string, keyof Lead> = {
    "TEXTED?": "texted",
    "AGREE?": "agree",
    "RED?": "red",
    "Done By": "doneBy",
  };

  const leadField = fieldMap[field];
  if (!leadField) return;

  const updatedLeads = leads.map((l) => {
    if (l.row === rowNumber) {
      const updated = { ...l };
      if (leadField === "texted" || leadField === "agree" || leadField === "red") {
        (updated as any)[leadField] = value.toUpperCase() === "TRUE";
      } else {
        (updated as any)[leadField] = value;
      }
      return updated;
    }
    return l;
  });

  await db.collection(CACHE_COLLECTION).doc(tabName).update({
    leads: updatedLeads,
  });
}

export async function getCachedLeadsAllTabs(): Promise<Record<string, Lead[]>> {
  const tabs = await getAllCachedTabs();
  const db = getAdminFirestore();
  const result: Record<string, Lead[]> = {};

  for (const tab of tabs) {
    const doc = await db.collection(CACHE_COLLECTION).doc(tab).get();
    if (doc.exists) {
      result[tab] = (doc.data()?.leads as Lead[]) || [];
    }
  }

  if (Object.keys(result).length === 0) {
    await syncAllTabs();
    for (const tab of tabs) {
      const doc = await db.collection(CACHE_COLLECTION).doc(tab).get();
      if (doc.exists) {
        result[tab] = (doc.data()?.leads as Lead[]) || [];
      }
    }
  }

  return result;
}
