import { google } from "googleapis";
import type { Lead } from "@/types";

const SCOPES = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive",
];

function getAuth() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set");
  }

  const credentials = JSON.parse(
    Buffer.from(serviceAccountKey, "base64").toString("utf-8")
  );

  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
}

function getSheets() {
  return google.sheets({ version: "v4", auth: getAuth() });
}

export async function getSpreadsheetId(): Promise<string> {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!sheetId) throw new Error("GOOGLE_SHEET_ID not set");
  return sheetId;
}

export async function getSheetNames(): Promise<string[]> {
  const sheets = getSheets();
  const spreadsheetId = await getSpreadsheetId();
  const res = await sheets.spreadsheets.get({ spreadsheetId });
  return (res.data.sheets || []).map((s) => s.properties?.title || "").filter(Boolean);
}

export async function getLeadsFromSheet(tabName: string): Promise<Lead[]> {
  const sheets = getSheets();
  const spreadsheetId = await getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:H`,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0].map((h: string) => h.toLowerCase().trim());
  const nameIdx = headers.indexOf("business name");
  const phoneIdx = headers.indexOf("phone number");
  const websiteIdx = headers.indexOf("website");
  const locationIdx = headers.indexOf("location");
  const textedIdx = headers.indexOf("texted?");
  const agreeIdx = headers.indexOf("agree?");
  const redIdx = headers.indexOf("red?");
  const doneByIdx = headers.indexOf("done by");

  return rows.slice(1).map((row: string[], index: number) => ({
    row: index + 2,
    businessName: row[nameIdx] || "",
    website: row[websiteIdx] || "",
    phoneNumber: row[phoneIdx] || "",
    location: row[locationIdx] || "",
    texted: isTruthy(row[textedIdx]),
    agree: isTruthy(row[agreeIdx]),
    red: isTruthy(row[redIdx]),
    doneBy: row[doneByIdx] || "",
  }));
}

export async function getLeadsPage(
  tabName: string,
  page: number,
  pageSize: number
): Promise<{ leads: Lead[]; total: number; page: number; totalPages: number }> {
  const sheets = getSheets();
  const spreadsheetId = await getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:H`,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return { leads: [], total: 0, page: 1, totalPages: 0 };

  const headers = rows[0].map((h: string) => h.toLowerCase().trim());
  const nameIdx = headers.indexOf("business name");
  const phoneIdx = headers.indexOf("phone number");
  const websiteIdx = headers.indexOf("website");
  const locationIdx = headers.indexOf("location");
  const textedIdx = headers.indexOf("texted?");
  const agreeIdx = headers.indexOf("agree?");
  const redIdx = headers.indexOf("red?");
  const doneByIdx = headers.indexOf("done by");

  const allLeads = rows.slice(1).map((row: string[], index: number) => ({
    row: index + 2,
    businessName: row[nameIdx] || "",
    website: row[websiteIdx] || "",
    phoneNumber: row[phoneIdx] || "",
    location: row[locationIdx] || "",
    texted: isTruthy(row[textedIdx]),
    agree: isTruthy(row[agreeIdx]),
    red: isTruthy(row[redIdx]),
    doneBy: row[doneByIdx] || "",
  }));

  const totalPages = Math.ceil(allLeads.length / pageSize);
  const start = (page - 1) * pageSize;
  const leads = allLeads.slice(start, start + pageSize);

  return { leads, total: allLeads.length, page, totalPages };
}

export async function getNextPendingLead(
  tabName: string,
  afterRow?: number
): Promise<Lead | null> {
  const sheets = getSheets();
  const spreadsheetId = await getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!A:H`,
  });

  const rows = res.data.values || [];
  if (rows.length < 2) return null;

  const headers = rows[0].map((h: string) => h.toLowerCase().trim());
  const nameIdx = headers.indexOf("business name");
  const phoneIdx = headers.indexOf("phone number");
  const websiteIdx = headers.indexOf("website");
  const locationIdx = headers.indexOf("location");
  const textedIdx = headers.indexOf("texted?");
  const agreeIdx = headers.indexOf("agree?");
  const redIdx = headers.indexOf("red?");
  const doneByIdx = headers.indexOf("done by");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowIndex = i + 1;

    if (afterRow && rowIndex <= afterRow) continue;

    const texted = isTruthy(row[textedIdx]);
    const red = isTruthy(row[redIdx]);
    const agree = isTruthy(row[agreeIdx]);
    const hasPhone = (row[phoneIdx] || "").trim().length > 0;

    if (!texted && !red && !agree && hasPhone) {
      return {
        row: rowIndex,
        businessName: row[nameIdx] || "",
        website: row[websiteIdx] || "",
        phoneNumber: row[phoneIdx] || "",
        location: row[locationIdx] || "",
        texted: false,
        agree: isTruthy(row[agreeIdx]),
        red: false,
        doneBy: row[doneByIdx] || "",
      };
    }
  }

  return null;
}

export async function getLeadStats(tabName: string) {
  const leads = await getLeadsFromSheet(tabName);
  return {
    total: leads.length,
    pending: leads.filter((l) => !l.texted && !l.red && !l.agree).length,
    sent: leads.filter((l) => l.texted).length,
    red: leads.filter((l) => l.red).length,
  };
}

export async function updateLeadField(
  tabName: string,
  rowNumber: number,
  field: string,
  value: string
): Promise<void> {
  const sheets = getSheets();
  const spreadsheetId = await getSpreadsheetId();

  const headers = await getHeaders(tabName);
  const colIndex = headers.findIndex((h) => h.toLowerCase() === field.toLowerCase());
  if (colIndex === -1) throw new Error(`Column "${field}" not found`);

  const colLetter = String.fromCharCode(65 + colIndex);

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabName}!${colLetter}${rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[value]] },
  });
}

async function getHeaders(tabName: string): Promise<string[]> {
  const sheets = getSheets();
  const spreadsheetId = await getSpreadsheetId();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabName}!1:1`,
  });

  return (res.data.values?.[0] || []).map((h: string) => h.trim());
}

export async function updateDashboardCount(date: string): Promise<void> {
  const sheets = getSheets();
  const spreadsheetId = await getSpreadsheetId();

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Dashboard!A:B",
    });

    const rows = res.data.values || [];
    const headers = rows[0] || [];
    const dateCol = headers.findIndex((h: string) => h.toLowerCase() === "date");
    const countCol = headers.findIndex((h: string) => h.toLowerCase() === "number");

    if (dateCol === -1 || countCol === -1) return;

    let targetRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][dateCol] === date) {
        targetRow = i + 1;
        break;
      }
    }

    if (targetRow === -1) {
      targetRow = rows.length + 1;
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Dashboard!A${targetRow}:B${targetRow}`,
        valueInputOption: "RAW",
        requestBody: { values: [[date, "0"]] },
      });
    }

    const currentVal = parseInt(rows[targetRow - 1]?.[countCol] || "0", 10);
    const newVal = currentVal + 1;

    const colLetter = String.fromCharCode(65 + countCol);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Dashboard!${colLetter}${targetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [[String(newVal)]] },
    });
  } catch (error) {
    console.error("Error updating dashboard:", error);
  }
}

function isTruthy(val: string | undefined): boolean {
  return (val || "").toUpperCase().trim() === "TRUE";
}
