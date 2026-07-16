const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "..", "serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();
const db = getFirestore();

async function sync() {
  console.log("Syncing Firebase Auth ↔ Firestore...\n");

  // 1. Get all Auth users
  const authUsers = await auth.listUsers(100);
  const authUIDs = new Set(authUsers.users.map((u) => u.uid));
  console.log(`Firebase Auth: ${authUsers.users.length} users`);

  // 2. Get all Firestore users
  const firestoreSnap = await db.collection("users").get();
  const firestoreUIDs = new Set(firestoreSnap.docs.map((d) => d.id));
  console.log(`Firestore: ${firestoreSnap.size} users\n`);

  // 3. Create Firestore profiles for Auth users missing them
  console.log("--- Creating missing Firestore profiles ---");
  for (const user of authUsers.users) {
    if (!firestoreUIDs.has(user.uid)) {
      const role = user.customClaims?.role || "sales";
      await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        name: user.displayName || user.email?.split("@")[0] || "User",
        role: role,
        assignedTab: "Location",
        dailySends: 0,
        lastSendDate: "",
        totalSends: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`  ✓ Created: ${user.email} (${role})`);
    } else {
      console.log(`  ✓ Already exists: ${user.email}`);
    }
  }

  // 4. Remove Firestore users that no longer exist in Auth
  console.log("\n--- Removing deleted users from Firestore ---");
  for (const doc of firestoreSnap.docs) {
    if (!authUIDs.has(doc.id)) {
      await doc.ref.delete();
      console.log(`  ✗ Removed: ${doc.data().email}`);
    }
  }

  // 5. Show final state
  console.log("\n--- Final State ---");
  const finalSnap = await db.collection("users").get();
  finalSnap.forEach((doc) => {
    const d = doc.data();
    console.log(`  👤 ${d.email} | Role: ${d.role} | Tab: ${d.assignedTab} | Sends: ${d.totalSends}`);
  });

  console.log(`\n✅ Sync complete! ${finalSnap.size} users in Firestore.`);
  process.exit(0);
}

sync().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
