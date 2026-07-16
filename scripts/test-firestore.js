const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");
const fs = require("fs");

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "..", "serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();
const auth = getAuth();

async function test() {
  console.log("Testing Firestore connection...\n");

  // 1. List Firebase Auth users
  const listResult = await auth.listUsers(100);
  console.log(`Found ${listResult.users.length} users in Firebase Auth\n`);

  // 2. Create/update Firestore profiles for each user
  for (const user of listResult.users) {
    const role = user.customClaims?.role || "sales";
    const docRef = db.collection("users").doc(user.uid);
    const doc = await docRef.get();

    if (!doc.exists) {
      await docRef.set({
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
      console.log(`✓ Created Firestore profile: ${user.email} (${role})`);
    } else {
      console.log(`✓ Already exists: ${user.email}`);
    }
  }

  // 3. Verify by reading back
  console.log("\n--- All Firestore Users ---");
  const snapshot = await db.collection("users").get();
  snapshot.forEach((doc) => {
    const d = doc.data();
    console.log(`  👤 ${d.email} | Role: ${d.role} | Tab: ${d.assignedTab} | Sends: ${d.totalSends}`);
  });

  console.log("\n✅ Firestore is working!");
  process.exit(0);
}

test().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
