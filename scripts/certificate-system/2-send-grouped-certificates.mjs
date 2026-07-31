/**
 * Script 2 (Local Runner): Grouped Certificate Email Dispatcher
 * Reads generated certificates index, groups attachments by email,
 * and calls the Google Apps Script Web App to send exactly ONE email per participant.
 */

import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');
const LOG_FILE = path.resolve('output/dispatch_summary.json');

function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  }
}

async function sendGroupedCertificates() {
  console.log('=== Step 2: Grouped Email Dispatch Pipeline ===\n');

  loadEnv();

  const args = process.argv.slice(2);
  let gasUrl = process.env.GAS_WEB_APP_URL;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--gas-url' && args[i + 1]) {
      gasUrl = args[i + 1];
    }
  }

  if (!gasUrl) {
    console.error('Error: Google Apps Script Web App URL is required.');
    console.error('Please provide it in .env.local as GAS_WEB_APP_URL=... or via command line:');
    console.error('  node scripts/certificate-system/2-send-grouped-certificates.mjs --gas-url <WEB_APP_URL>');
    process.exit(1);
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Error: Index file ${INDEX_FILE} not found. Please run Script 1 first:`);
    console.error('  node scripts/certificate-system/1-generate-certificates.mjs');
    process.exit(1);
  }

  const indexMap = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const emails = Object.keys(indexMap);

  console.log(`Found ${emails.length} unique participants.`);
  console.log(`GAS Web App Endpoint: ${gasUrl}\n`);

  const dispatchSummary = [];
  let sentCount = 0;
  let failCount = 0;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const item = indexMap[email];
    const name = item.name;
    const certList = item.certificates;

    console.log(`[${i + 1}/${emails.length}] Preparing email for ${name} (${email}) - ${certList.length} certificate(s)...`);

    // Prepare attachments in Base64
    const attachments = [];
    let validAttachments = true;

    for (const cert of certList) {
      if (!fs.existsSync(cert.pdfPath)) {
        console.error(`  [Missing PDF] File not found: ${cert.pdfPath}`);
        validAttachments = false;
        break;
      }
      const pdfBytes = fs.readFileSync(cert.pdfPath);
      attachments.push({
        eventTitle: cert.eventTitle,
        filename: cert.filename,
        pdf_base64: pdfBytes.toString('base64')
      });
    }

    if (!validAttachments || attachments.length === 0) {
      dispatchSummary.push({ email, name, status: 'failed', error: 'One or more PDF files were missing locally' });
      failCount++;
      continue;
    }

    const payload = {
      email: email,
      name: name,
      certificates: attachments
    };

    try {
      const response = await fetch(gasUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const resText = await response.text();
      let result;
      try {
        result = JSON.parse(resText);
      } catch {
        result = { status: 'error', message: resText };
      }

      if (response.ok && result.status === 'success') {
        console.log(`  ✓ Email sent successfully (${attachments.length} attachment(s)).`);
        dispatchSummary.push({
          email,
          name,
          status: 'sent',
          certificatesCount: attachments.length,
          timestamp: new Date().toISOString()
        });
        sentCount++;
      } else {
        console.error(`  ✗ Failed to send email:`, result.message || resText);
        dispatchSummary.push({ email, name, status: 'failed', error: result.message || resText });
        failCount++;
      }

    } catch (err) {
      console.error(`  ✗ Network error sending email:`, err.message);
      dispatchSummary.push({ email, name, status: 'failed', error: err.message });
      failCount++;
    }
  }

  // Save dispatch summary log
  fs.writeFileSync(LOG_FILE, JSON.stringify(dispatchSummary, null, 2), 'utf-8');

  console.log('\n=============================================');
  console.log('Dispatch Summary:');
  console.log(`- Unique Recipients Processed: ${emails.length}`);
  console.log(`- Emails Successfully Sent: ${sentCount}`);
  console.log(`- Failed: ${failCount}`);
  console.log(`- Detailed log output saved to: ${LOG_FILE}`);
  console.log('=============================================\n');
}

sendGroupedCertificates().catch(err => {
  console.error('Unhandled error during dispatch:', err);
  process.exit(1);
});
