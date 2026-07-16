const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const readline = require("readline");
const path = require("path");
const fs = require("fs");

const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, "..", "serviceAccountKey.json");

async function initFirebase() {
  try {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      throw new Error("File not found");
    }
    const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, "utf-8"));
    initializeApp({
      credential: cert(serviceAccount),
    });
    console.log("✓ Firebase Admin initialized\n");
    return true;
  } catch (error) {
    console.error("✗ Error: Could not load service account key");
    console.error(`  Path: ${SERVICE_ACCOUNT_PATH}`);
    console.error(`  Error details: ${error.message}`);
    console.error("  Download from: Firebase Console > Project Settings > Service Accounts");
    return false;
  }
}

async function createUser(email, password, displayName, role) {
  const auth = getAuth();
  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`  ⚠ User ${email} already exists (UID: ${userRecord.uid})`);
    } catch (e) {
      userRecord = null;
    }

    if (userRecord) {
      await auth.setCustomUserClaims(userRecord.uid, { role });
      console.log(`  ✓ Updated role to: ${role}`);
      return userRecord.uid;
    }

    const result = await auth.createUser({
      email,
      password,
      displayName,
      emailVerified: true,
    });

    await auth.setCustomUserClaims(result.uid, { role });

    console.log(`  ✓ Created: ${email} (UID: ${result.uid})`);
    console.log(`  ✓ Role: ${role}`);
    return result.uid;
  } catch (error) {
    console.error(`  ✗ Failed to create ${email}: ${error.message}`);
    return null;
  }
}

async function listUsers() {
  const auth = getAuth();
  try {
    const listResult = await auth.listUsers(100);
    console.log("\n📋 Current Users:");
    console.log("─".repeat(60));

    if (listResult.users.length === 0) {
      console.log("  No users found");
      return;
    }

    listResult.users.forEach((user) => {
      const role = user.customClaims?.role || "user";
      const roleIcon = role === "admin" ? "👑" : "👤";
      console.log(`  ${roleIcon} ${user.email} | Role: ${role} | UID: ${user.uid}`);
    });
    console.log("─".repeat(60));
  } catch (error) {
    console.error("Error listing users:", error.message);
  }
}

async function deleteUser(email) {
  const auth = getAuth();
  try {
    const user = await auth.getUserByEmail(email);
    await auth.deleteUser(user.uid);
    console.log(`✓ Deleted user: ${email}`);
  } catch (error) {
    console.error(`✗ Error deleting user: ${error.message}`);
  }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║         AutoSend - Firebase User Manager            ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const initialized = await initFirebase();
  if (!initialized) return;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (q) => new Promise((resolve) => rl.question(q, resolve));

  while (true) {
    console.log("\nOptions:");
    console.log("  1. Create Admin User");
    console.log("  2. Create Sales User");
    console.log("  3. Create Multiple Sales Users");
    console.log("  4. List All Users");
    console.log("  5. Delete User");
    console.log("  6. Exit");

    const choice = await question("\nSelect option (1-6): ");

    switch (choice) {
      case "1": {
        console.log("\n--- Create Admin User ---");
        const email = await question("Email: ");
        const password = await question("Password (min 6 chars): ");
        const name = await question("Display Name: ");

        if (password.length < 6) {
          console.log("✗ Password must be at least 6 characters");
          break;
        }

        await createUser(email, password, name, "admin");
        break;
      }

      case "2": {
        console.log("\n--- Create Sales User ---");
        const email = await question("Email: ");
        const password = await question("Password (min 6 chars): ");
        const name = await question("Display Name: ");
        const tab = await question("Assigned Tab (Doctors/Location/Immobile/Moto/Optic): ");

        if (password.length < 6) {
          console.log("✗ Password must be at least 6 characters");
          break;
        }

        const uid = await createUser(email, password, name, "sales");
        if (uid) {
          console.log(`  ✓ Assigned to tab: ${tab}`);
        }
        break;
      }

      case "3": {
        console.log("\n--- Create Multiple Sales Users ---");
        console.log("Enter users one per line (format: email password name tab)");
        console.log("Example: sara@kenco.com pass123 Sara Location");
        console.log("Type 'done' when finished:\n");

        const users = [];
        while (true) {
          const input = await question("> ");
          if (input.toLowerCase() === "done") break;

          const parts = input.split(" ");
          if (parts.length >= 3) {
            users.push({
              email: parts[0],
              password: parts[1],
              name: parts[2],
              tab: parts[3] || "Location",
            });
          } else {
            console.log("  Invalid format. Use: email password name tab");
          }
        }

        console.log(`\nCreating ${users.length} users...`);
        for (const u of users) {
          await createUser(u.email, u.password, u.name, "sales");
        }
        break;
      }

      case "4": {
        await listUsers();
        break;
      }

      case "5": {
        const email = await question("Enter email to delete: ");
        const confirm = await question(`Are you sure you want to delete ${email}? (yes/no): `);
        if (confirm.toLowerCase() === "yes") {
          await deleteUser(email);
        }
        break;
      }

      case "6": {
        console.log("Goodbye!");
        rl.close();
        process.exit(0);
      }

      default:
        console.log("Invalid option");
    }
  }
}

main();
