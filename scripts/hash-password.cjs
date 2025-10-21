#!/usr/bin/env node
const argon2 = require('argon2');

async function main() {
  const password = process.argv[2];
  if (!password) {
    console.error('Usage: node hash-password.cjs <password>');
    process.exit(1);
  }

  try {
    const hash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1
    });
    process.stdout.write(hash);
  } catch (err) {
    console.error('[argon2] Failed to hash password:', err.message || err);
    process.exit(1);
  }
}

main();
