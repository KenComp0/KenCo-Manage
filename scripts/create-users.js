const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");
const fs = require("fs");

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "..", "serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));

initializeApp({ credential: cert(serviceAccount) });
const auth = getAuth();

async function create(email, password, name, role) {
  try {
    let user;
    try {
      user = await auth.getUserByEmail(email);
      console.log(`⚠ ${email} already exists`);
    } catch {
      user = await auth.createUser({ email, password, displayName: name, emailVerified: true });
      console.log(`✓ Created: ${email} (${user.uid})`);
    }
    await auth.setCustomUserClaims(user.uid, { role });
    console.log(`  → Role: ${role}`);
  } catch (err) {
    console.log(`✗ Failed ${email}: ${err.message}`);
  }
}

async function main() {
  console.log("Creating users...\n");

  // ADMIN
  await create("admin@kenco.com", "Admin123!", "Admin", "admin");
  console.log();

  // SALES TEAM
  await create("sara@kenco.com", "Sara123!", "Sara", "sales");
  await create("ahmed@kenco.com", "Ahmed123!", "Ahmed", "sales");
  await create("fatima@kenco.com", "Fatima123!", "Fatima", "sales");
  await create("youssef@kenco.com", "Youssef123!", "Youssef", "sales");

  console.log("\n✅ Done! Users created.");
  process.exit(0);
}

main();
