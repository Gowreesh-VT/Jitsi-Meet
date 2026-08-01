/**
 * Script 2 (Local Runner): Google Apps Script Grouped Certificate Email Dispatcher
 * 
 * Reads generated certificates index, skips already sent emails from ZeptoMail,
 * builds the HTML template with CDN images, and sends via Google Apps Script Web App.
 * 
 * Usage:
 *   node scripts/certificate-system/2-send-grouped-certificates.mjs --gas-url <YOUR_GAS_WEB_APP_URL>
 */

import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');
const ZEPTO_LOG = path.resolve('output/zeptomail_dispatch_summary.json');
const GAS_LOG = path.resolve('output/gas_dispatch_summary.json');
const TEMPLATE_FILE = path.resolve('scripts/certificate-system/certificate_email.html');

function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
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

function renderProgressBar(current, total, sent, failed) {
  const width = 30;
  const pct = Math.round((current / total) * 100);
  const filled = Math.round((width * current) / total);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${pct}% (${current}/${total}) | ✓ Sent: ${sent} | ✗ Failed: ${failed}`;
}

async function sendGroupedCertificates() {
  console.log('=== Step 2: Google Apps Script Grouped Email Dispatch Pipeline ===\n');

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
    console.error('Please add GAS_WEB_APP_URL to .env.local or pass it as an argument:');
    console.error('  node scripts/certificate-system/2-send-grouped-certificates.mjs --gas-url <WEB_APP_URL>\n');
    process.exit(1);
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Error: Index file ${INDEX_FILE} not found.`);
    process.exit(1);
  }

  const indexMap = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const emails = Object.keys(indexMap);

  let templateRaw = '';
  if (fs.existsSync(TEMPLATE_FILE)) {
    templateRaw = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
  }

  // Load already sent set from ZeptoMail and GAS summary logs
  const sentEmailsSet = new Set();

  if (fs.existsSync(ZEPTO_LOG)) {
    try {
      const zeptoSummary = JSON.parse(fs.readFileSync(ZEPTO_LOG, 'utf-8'));
      zeptoSummary.filter(s => s.status === 'sent').forEach(s => sentEmailsSet.add(s.email.toLowerCase()));
    } catch {}
  }

  let gasSummary = [];
  if (fs.existsSync(GAS_LOG)) {
    try {
      gasSummary = JSON.parse(fs.readFileSync(GAS_LOG, 'utf-8'));
      gasSummary.filter(s => s.status === 'sent').forEach(s => sentEmailsSet.add(s.email.toLowerCase()));
    } catch {
      gasSummary = [];
    }
  }

  console.log(`Total Unique Participants: ${emails.length}`);
  console.log(`Already Sent (Skipped): ${sentEmailsSet.size}`);
  console.log(`Remaining to Send: ${emails.length - sentEmailsSet.size}`);
  console.log(`GAS Web App Endpoint: ${gasUrl}\n`);

  let sentCount = sentEmailsSet.size;
  let failCount = 0;
  let processedCount = sentCount;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    if (sentEmailsSet.has(email.toLowerCase())) {
      continue;
    }

    const item = indexMap[email];
    const name = item.name;
    const certList = item.certificates;

    // Filter unique event titles
    const uniqueEventTitles = [];
    for (const cert of certList) {
      const cleanTitle = cert.eventTitle.replace(/ \((MIC|HackerRank) Certificate\)/, '');
      if (!uniqueEventTitles.includes(cleanTitle)) {
        uniqueEventTitles.push(cleanTitle);
      }
    }

    const totalEvents = uniqueEventTitles.length;

    // Prepare attachments in Base64
    const attachments = [];
    let validAttachments = true;

    for (const cert of certList) {
      if (!fs.existsSync(cert.pdfPath)) {
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
      gasSummary.push({ email, name, status: 'failed', error: 'PDF missing locally' });
      failCount++;
      processedCount++;
      console.log(renderProgressBar(processedCount, emails.length, sentCount, failCount));
      continue;
    }

    const subject = totalEvents === 1 
      ? `Your Certificate of Completion: ${uniqueEventTitles[0]}`
      : `Your Certificates of Completion (${totalEvents} Events Attended) - Summer of Building`;

    const eventCardsHtml = uniqueEventTitles.map(title => `
      <tr>
        <td style="padding-bottom: 12px;">
          <table class="cert-card" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
            style="background-color: #0D0B14; border: 1px solid #2B2544; border-radius: 12px; box-shadow: 0 4px 12px rgba(124, 118, 153, 0.04);">
            <tr>
              <td class="cert-card-cell" style="padding: 16px 20px;">
                <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                  <tr>
                    <td class="cert-badge-cell" width="44" style="padding-right: 16px;">
                      <div class="cert-badge" style="width: 44px; height: 44px; background-color: rgba(234, 179, 8, 0.1); border-radius: 8px; line-height: 44px; text-align: center;">
                        <img src="https://img.icons8.com/ios-glyphs/90/EAB308/graduation-cap.png" width="22" height="22" alt="🎓" style="display: inline-block; vertical-align: middle; border: 0;">
                      </div>
                    </td>
                    <td class="cert-title-cell">
                      <h4 class="text-title" style="margin: 0; font-family: system-ui, sans-serif; font-size: 15px; font-weight: 700; color: #FFFFFF;">
                        ${title}
                      </h4>
                      <span style="font-family: system-ui, sans-serif; font-size: 12px; color: #22C55E; display: inline-block; margin-top: 2px;">
                        ✓ 2 Official Certificates Attached (1 VIT MIC + 1 HackerRank)
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `).join('');

    let htmlbody = '';
    if (templateRaw) {
      htmlbody = templateRaw
        .replace(/{{PARTICIPANT_NAME}}/g, name)
        .replace(/{{ATTENDED_COUNT}}/g, String(totalEvents))
        .replace(/{{DYNAMIC_CERTIFICATE_CARDS}}/g, eventCardsHtml);
    }

    const payload = {
      email: email,
      name: name,
      subject: subject,
      htmlbody: htmlbody,
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
        sentCount++;
        gasSummary.push({
          email,
          name,
          status: 'sent',
          certificatesCount: attachments.length,
          timestamp: new Date().toISOString()
        });
      } else {
        failCount++;
        gasSummary.push({ email, name, status: 'failed', error: result.message || resText });
      }

    } catch (err) {
      failCount++;
      gasSummary.push({ email, name, status: 'failed', error: err.message });
    }

    processedCount++;
    console.log(renderProgressBar(processedCount, emails.length, sentCount, failCount));

    if (processedCount % 5 === 0 || processedCount === emails.length) {
      fs.writeFileSync(GAS_LOG, JSON.stringify(gasSummary, null, 2), 'utf-8');
    }

    // Small delay between calls to respect Google Apps Script quotas
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(GAS_LOG, JSON.stringify(gasSummary, null, 2), 'utf-8');

  console.log('\n=============================================');
  console.log('Google Apps Script Dispatch Summary:');
  console.log(`- Total Unique Participants: ${emails.length}`);
  console.log(`- Emails Successfully Sent: ${sentCount}`);
  console.log(`- Failed: ${failCount}`);
  console.log(`- Detailed log saved to: ${GAS_LOG}`);
  console.log('=============================================\n');
}

sendGroupedCertificates().catch(err => {
  console.error('Unhandled error during dispatch:', err);
  process.exit(1);
});
