#!/usr/bin/env node
// scripts/generate-vapid-keys.js
// Generates VAPID keys for Web Push notifications

const webpush = require("web-push");

console.log("🔑 Generating VAPID keys for Web Push notifications...\n");

const vapidKeys = webpush.generateVAPIDKeys();

console.log("✅ VAPID keys generated successfully!\n");
console.log("Add these to your config/secrets.ts file:\n");
console.log("webPushEnabled: true,");
console.log(`vapidPublicKey: "${vapidKeys.publicKey}",`);
console.log(`vapidPrivateKey: "${vapidKeys.privateKey}",`);
console.log('vapidSubject: "mailto:support@yourdomain.com",\n');

console.log("⚠️  IMPORTANT:");
console.log("- Keep the private key secret!");
console.log("- Never commit the private key to version control");
console.log("- Use the public key in your client-side code");
console.log("- The subject should be a mailto: or https: URL\n");
