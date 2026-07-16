const fs = require("fs");
const path = require("path");

const serviceAccountPath = path.join(
  __dirname,
  "..",
  "..",
  "service_account.json"
);

try {
  const content = fs.readFileSync(serviceAccountPath, "utf-8");
  const encoded = Buffer.from(content).toString("base64");
  console.log("\nEncoded service account key:");
  console.log(encoded);
  console.log("\nAdd this to your .env.local file:");
  console.log(`GOOGLE_SERVICE_ACCOUNT_KEY=${encoded}`);
} catch (error) {
  console.error("Error reading service account file:", error.message);
  console.log("\nPlease place your service_account.json in the project root.");
}
