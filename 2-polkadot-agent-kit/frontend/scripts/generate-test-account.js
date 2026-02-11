#!/usr/bin/env node

/**
 * Generate Test Polkadot Account
 *
 * This script generates a test account for development purposes.
 *
 * ⚠️  WARNING: NEVER use these accounts with real funds!
 * ⚠️  This is for DEVELOPMENT and TESTING only!
 *
 * Usage:
 *   node scripts/generate-test-account.js
 */

async function generateTestAccount() {
  try {
    // Dynamic imports to avoid build issues
    const { cryptoWaitReady, mnemonicGenerate, mnemonicToMiniSecret } =
      await import("@polkadot/util-crypto");
    const { Keyring } = await import("@polkadot/keyring");
    const { u8aToHex } = await import("@polkadot/util");

    console.log("🔐 Generating Test Polkadot Account...\n");
    console.log("⚠️  WARNING: For development/testing only!\n");

    // Wait for crypto to be ready
    await cryptoWaitReady();

    // Generate a new mnemonic
    const mnemonic = mnemonicGenerate();

    // Convert mnemonic to seed
    const seed = mnemonicToMiniSecret(mnemonic);

    // Create keyring
    const keyring = new Keyring({ type: "sr25519" });

    // Add account from mnemonic
    const pair = keyring.addFromUri(mnemonic);

    console.log("✅ Account Generated Successfully!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 ACCOUNT DETAILS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("🔑 Mnemonic Seed Phrase:");
    console.log(`   ${mnemonic}\n`);

    console.log("📍 SS58 Address (Polkadot):");
    console.log(`   ${pair.address}\n`);

    console.log("🔐 Private Key/Seed (for .env):");
    console.log(`   ${u8aToHex(seed)}\n`);

    console.log("🔓 Public Key:");
    console.log(`   ${u8aToHex(pair.publicKey)}\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("📝 Add to your .env file (Option 1 - Seed):");
    console.log(`POLKADOT_PRIVATE_KEY=${u8aToHex(seed)}\n`);

    console.log("📝 Or use the mnemonic directly (Option 2 - Recommended):");
    console.log(`POLKADOT_MNEMONIC="${mnemonic}"\n`);

    console.log("💡 In your code:");
    console.log("   // Option 1: From seed");
    console.log(
      `   const pair = keyring.addFromSeed(hexToU8a('${u8aToHex(seed)}'));\n`
    );
    console.log("   // Option 2: From mnemonic (easier)");
    console.log(`   const pair = keyring.addFromUri('${mnemonic}');\n`);

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    console.log("⚠️  SECURITY REMINDERS:");
    console.log("   • Save the mnemonic in a secure location");
    console.log("   • NEVER share your private key or mnemonic");
    console.log("   • NEVER commit .env to version control");
    console.log("   • Use ONLY for testing with small amounts");
    console.log("   • Delete test accounts after development\n");

    console.log("💰 To get test funds:");
    console.log("   • Westend: https://faucet.polkadot.io/westend");
    console.log("   • Use faucet with your address above\n");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("❌ Error generating account:", error);
    console.error("\n💡 Make sure you have installed dependencies:");
    console.error("   pnpm install\n");
    process.exit(1);
  }
}

// Predefined test accounts (from Substrate)
function showTestAccounts() {
  console.log("🧪 PREDEFINED TEST ACCOUNTS\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("These are well-known test accounts from Substrate.\n");

  const testAccounts = [
    {
      name: "Alice",
      uri: "//Alice",
      mnemonic:
        "bottom drive obey lake curtain smoke basket hold race lonely fit walk",
    },
    {
      name: "Bob",
      uri: "//Bob",
      mnemonic:
        "bottom drive obey lake curtain smoke basket hold race lonely fit walk",
    },
  ];

  console.log("⚠️  WARNING: These are PUBLIC test accounts.");
  console.log("   NEVER use them with real funds!\n");

  testAccounts.forEach((account) => {
    console.log(`👤 ${account.name}:`);
    console.log(`   URI: ${account.uri}`);
    console.log(`   Use in code: keyring.addFromUri('${account.uri}')\n`);
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

// Main
console.log("\n");
console.log("╔═══════════════════════════════════════════════════╗");
console.log("║   POLKADOT TEST ACCOUNT GENERATOR                ║");
console.log("║   For Development & Testing Only                 ║");
console.log("╚═══════════════════════════════════════════════════╝");
console.log("\n");

const args = process.argv.slice(2);

if (args.includes("--test-accounts")) {
  showTestAccounts();
} else {
  generateTestAccount();
}
