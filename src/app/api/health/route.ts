import { NextResponse } from "next/server";

export async function GET() {
  const diagnostics: Record<string, any> = {};

  // Check env vars
  diagnostics.hasServiceAccountKey = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  diagnostics.hasFirebaseProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  diagnostics.hasFirebaseApiKey = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const decoded = JSON.parse(
        Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64").toString("utf-8")
      );
      diagnostics.serviceAccountEmail = decoded.client_email;
      diagnostics.serviceAccountProjectId = decoded.project_id;
    } catch (e: any) {
      diagnostics.serviceAccountDecodeError = e.message;
    }
  }

  // Try Firebase Admin init
  try {
    const { getAdminFirestore } = await import("@/lib/firebase-admin");
    const db = getAdminFirestore();
    diagnostics.firestoreInit = "success";

    // Try a simple read
    try {
      const metaDoc = await db.collection("sheetCache").doc("_meta").get();
      diagnostics.firestoreRead = metaDoc.exists ? "found" : "empty";
    } catch (e: any) {
      diagnostics.firestoreReadError = e.message;
    }
  } catch (e: any) {
    diagnostics.firestoreInitError = e.message;
  }

  // Try Auth
  try {
    const { getAdminAuth } = await import("@/lib/firebase-admin");
    const auth = getAdminAuth();
    diagnostics.authInit = "success";
  } catch (e: any) {
    diagnostics.authInitError = e.message;
  }

  return NextResponse.json(diagnostics);
}
