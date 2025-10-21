#!/usr/bin/env node
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { resolve } = require('path');
const argon2 = require('argon2');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

(async () => {
  const root = resolve(__dirname, '..');
  const bootstrapPath = resolve(root, 'apps', 'api', 'bootstrap.json');
  if (!existsSync(bootstrapPath)) {
    console.error('bootstrap.json 不存在，跳过 post-install');
    process.exit(0);
  }

  const raw = JSON.parse(readFileSync(bootstrapPath, 'utf-8'));
  const secret = raw.totpSecret || speakeasy.generateSecret({ length: 20 }).base32;
  const hash = await argon2.hash(raw.adminPassword, { type: argon2.argon2id });
  const apiEnvPath = resolve(root, 'apps', 'api', '.env');
  let apiEnv = readFileSync(apiEnvPath, 'utf-8');
  if (!apiEnv.includes('ADMIN_PASSWORD_HASH')) {
    apiEnv += `\nADMIN_PASSWORD_HASH=${hash}`;
  } else {
    apiEnv = apiEnv.replace(/ADMIN_PASSWORD_HASH=.*/g, `ADMIN_PASSWORD_HASH=${hash}`);
  }
  if (!apiEnv.includes('TOTP_SECRET')) {
    apiEnv += `\nTOTP_SECRET=${secret}`;
  } else {
    apiEnv = apiEnv.replace(/TOTP_SECRET=.*/g, `TOTP_SECRET=${secret}`);
  }
  writeFileSync(apiEnvPath, apiEnv.trim() + '\n');

  const adminEnvPath = resolve(root, 'apps', 'admin', '.env');
  let adminEnv = readFileSync(adminEnvPath, 'utf-8');
  if (!adminEnv.includes('TOTP_SECRET')) {
    adminEnv += `\nTOTP_SECRET=${secret}`;
  } else {
    adminEnv = adminEnv.replace(/TOTP_SECRET=.*/g, `TOTP_SECRET=${secret}`);
  }
  writeFileSync(adminEnvPath, adminEnv.trim() + '\n');

  const otp = speakeasy.otpauthURL({
    secret: secret,
    label: '分解力后台',
    issuer: 'Decomind'
  });
  const outDir = resolve(root, 'artifacts');
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }
  const qrPath = resolve(outDir, 'admin-totp.png');
  await qrcode.toFile(qrPath, otp, { width: 300 });
  console.log(`TOTP 二维码已生成: ${qrPath}`);

  writeFileSync(bootstrapPath, JSON.stringify({ generatedAt: new Date().toISOString(), totpSecret: secret }, null, 2));
})();
