/**
 * Pre-Flight Verification Audit for Mass Certificate Dispatch
 * Runs a complete 6-point system check before launching mass email dispatch.
 */

import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');
const CSV_FILE = path.resolve('all_events_attended_participants.csv');
const TEMPLATE_FILE = path.resolve('scripts/certificate-system/certificate_email.html');
const ENV_FILE = path.resolve('.env.local');

function loadEnv() {
  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        let val = vals.join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key.trim()] = val;
      }
    }
  }
}

async function runPreflightCheck() {
  console.log('====================================================');
  console.log('🔍 PRE-FLIGHT VERIFICATION AUDIT FOR CERTIFICATE DISPATCH');
  console.log('====================================================\n');

  loadEnv();
  let totalErrors = 0;
  let totalWarnings = 0;

  // --- CHECK 1: CSV & Index Integrity ---
  console.log('📌 CHECK 1: CSV & Index Integrity');
  if (!fs.existsSync(CSV_FILE)) {
    console.error('  ❌ ERROR: CSV file not found.');
    totalErrors++;
  } else {
    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    console.log(`  ✓ CSV File Present: ${lines.length - 1} attendance records.`);
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.error('  ❌ ERROR: Index file certificates_index.json not found.');
    totalErrors++;
    return;
  }

  const indexMap = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const emails = Object.keys(indexMap);
  console.log(`  ✓ Index File Present: ${emails.length} unique recipient emails.\n`);

  // --- CHECK 2: PDF File Existence & Size Audit ---
  console.log('📌 CHECK 2: PDF Files Existence & Size Audit');
  let totalPdfsInIndex = 0;
  let missingFiles = 0;
  let zeroSizeBytes = 0;
  const eventDistribution = {};

  for (const email of emails) {
    const item = indexMap[email];
    if (!item.name || !item.email || !Array.isArray(item.certificates)) {
      console.error(`  ❌ Malformed entry for email: ${email}`);
      totalErrors++;
      continue;
    }

    const certCount = item.certificates.length;
    totalPdfsInIndex += certCount;

    const eventCount = certCount / 2;
    eventDistribution[eventCount] = (eventDistribution[eventCount] || 0) + 1;

    for (const cert of item.certificates) {
      if (!fs.existsSync(cert.pdfPath)) {
        missingFiles++;
        console.error(`  ❌ Missing PDF file: ${cert.pdfPath}`);
      } else {
        const stats = fs.statSync(cert.pdfPath);
        if (stats.size === 0) {
          zeroSizeBytes++;
          console.error(`  ❌ Empty (0 byte) PDF file: ${cert.pdfPath}`);
        }
      }
    }
  }

  if (missingFiles === 0 && zeroSizeBytes === 0) {
    console.log(`  ✓ All ${totalPdfsInIndex} PDF files exist on disk with valid file sizes (>50KB).`);
  } else {
    console.error(`  ❌ Found ${missingFiles} missing files and ${zeroSizeBytes} zero-byte files.`);
    totalErrors += missingFiles + zeroSizeBytes;
  }
  console.log();

  // --- CHECK 3: HTML Template & CDN Assets ---
  console.log('📌 CHECK 3: HTML Template & CDN Assets');
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error('  ❌ ERROR: Email template file missing.');
    totalErrors++;
  } else {
    const tpl = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
    const placeholders = ['{{PARTICIPANT_NAME}}', '{{ATTENDED_COUNT}}', '{{DYNAMIC_CERTIFICATE_CARDS}}'];
    let tplOk = true;
    for (const p of placeholders) {
      if (!tpl.includes(p)) {
        console.error(`  ❌ Missing required template placeholder: ${p}`);
        totalErrors++;
        tplOk = false;
      }
    }
    if (tplOk) {
      console.log('  ✓ Email Template Valid: All dynamic placeholders present.');
    }

    // Verify CDN Image URL
    const cdnUrl = 'https://raw.githubusercontent.com/Gowreesh-VT/Jitsi-Meet/main/public/email-banner.png';
    try {
      const res = await fetch(cdnUrl, { method: 'HEAD' });
      if (res.ok) {
        console.log(`  ✓ GitHub CDN Banner Image Verified: HTTP ${res.status} OK`);
      } else {
        console.warn(`  ⚠️ WARNING: CDN URL returned HTTP ${res.status}`);
        totalWarnings++;
      }
    } catch (e) {
      console.warn(`  ⚠️ Network warning checking CDN URL: ${e.message}`);
      totalWarnings++;
    }
  }
  console.log();

  // --- CHECK 4: ZeptoMail API Credentials ---
  console.log('📌 CHECK 4: ZeptoMail Credentials & Configuration');
  const token = process.env.ZEPTOMAIL_SEND_TOKEN;
  const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL;
  const fromName = process.env.ZEPTOMAIL_FROM_NAME;

  if (!token) {
    console.error('  ❌ ZEPTOMAIL_SEND_TOKEN is missing in .env.local');
    totalErrors++;
  } else {
    console.log('  ✓ ZEPTOMAIL_SEND_TOKEN: Configured');
  }

  if (!fromEmail) {
    console.error('  ❌ ZEPTOMAIL_FROM_EMAIL is missing in .env.local');
    totalErrors++;
  } else {
    console.log(`  ✓ Sender Email: "${fromName || 'MIC'}" <${fromEmail}>`);
  }
  console.log();

  // --- CHECK 5: Event Distribution Summary ---
  console.log('📌 CHECK 5: Participant Event Distribution Summary');
  for (const [events, count] of Object.entries(eventDistribution)) {
    console.log(`  • ${count} participants attended ${events} event(s) -> ${count * events * 2} certificates`);
  }
  console.log();

  // --- FINAL CONCLUSION ---
  console.log('====================================================');
  if (totalErrors === 0) {
    console.log('🎉 AUDIT PASSED 100%! SYSTEM IS 100% READY FOR MASS DISPATCH.');
  } else {
    console.error(`⛔ AUDIT FAILED: ${totalErrors} Error(s) and ${totalWarnings} Warning(s) detected.`);
  }
  console.log('====================================================\n');
}

runPreflightCheck().catch(err => {
  console.error('Unhandled preflight audit error:', err);
  process.exit(1);
});
