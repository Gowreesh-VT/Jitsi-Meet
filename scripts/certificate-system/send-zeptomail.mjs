/**
 * Script 2 (ZeptoMail): High-Speed Official Certificate Email Dispatcher
 * 
 * Sends certificates via official ZeptoMail API with 4 parallel workers,
 * 7MB attachment chunking (max ~9MB payload per email), exact error logging,
 * and automatic skipping of all previously sent emails (from both Zepto & GAS).
 * 
 * Usage:
 *   node scripts/certificate-system/send-zeptomail.mjs
 */

import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');
const LOG_FILE = path.resolve('output/zeptomail_dispatch_summary.json');
const GAS_LOG = path.resolve('output/gas_dispatch_summary.json');
const TEMPLATE_FILE = path.resolve('scripts/certificate-system/certificate_email.html');

// 7 MB max base64 attachment size per email part (keeps total HTTP request body under 9MB)
const MAX_ATTACHMENT_BYTES = 7 * 1024 * 1024;
const CONCURRENCY = 4;

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

async function sendZeptoMailCertificates() {
  console.log('=== Step 2: Official ZeptoMail Certificate Dispatch Pipeline ===\n');

  loadEnv();

  const token = process.env.ZEPTOMAIL_SEND_TOKEN;
  const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@microsoftinnovations.club';
  const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'Microsoft Innovations Club';
  const apiUrl = process.env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.in/v1.1/email';

  if (!token || !fromEmail) {
    console.error('Error: ZeptoMail credentials missing in .env.local.');
    process.exit(1);
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Error: Index file ${INDEX_FILE} not found. Please run Script 1 first.`);
    process.exit(1);
  }

  const indexMap = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const emails = Object.keys(indexMap);

  let templateRaw = '';
  if (fs.existsSync(TEMPLATE_FILE)) {
    templateRaw = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
  }

  // Load existing logs from both ZeptoMail and Google Apps Script
  let dispatchSummary = [];
  const sentEmailsSet = new Set();

  if (fs.existsSync(LOG_FILE)) {
    try {
      dispatchSummary = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
      dispatchSummary.filter(s => s.status === 'sent').forEach(s => sentEmailsSet.add(s.email.toLowerCase()));
    } catch {
      dispatchSummary = [];
    }
  }

  if (fs.existsSync(GAS_LOG)) {
    try {
      const gasSummary = JSON.parse(fs.readFileSync(GAS_LOG, 'utf-8'));
      gasSummary.filter(s => s.status === 'sent').forEach(s => sentEmailsSet.add(s.email.toLowerCase()));
    } catch {}
  }

  console.log(`Total Unique Participants: ${emails.length}`);
  console.log(`Already Delivered (Skipped): ${sentEmailsSet.size}`);
  console.log(`Remaining to Send: ${emails.length - sentEmailsSet.size}`);
  console.log(`Sender: "${fromName}" <${fromEmail}>`);
  console.log(`Concurrency: ${CONCURRENCY} parallel workers`);
  console.log(`ZeptoMail API Endpoint: ${apiUrl}\n`);

  let sentCount = sentEmailsSet.size;
  let failCount = 0;
  let processedCount = sentCount;

  // Filter queue for unsent emails
  const queue = emails.filter(e => !sentEmailsSet.has(e.toLowerCase()));

  async function processParticipant(email) {
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

    // Prepare attachments
    const allAttachments = [];
    let validAttachments = true;

    for (const cert of certList) {
      if (!fs.existsSync(cert.pdfPath)) {
        validAttachments = false;
        break;
      }
      const pdfBytes = fs.readFileSync(cert.pdfPath);
      const b64 = pdfBytes.toString('base64');
      allAttachments.push({
        content: b64,
        mime_type: 'application/pdf',
        name: cert.filename,
        byteLength: b64.length
      });
    }

    if (!validAttachments || allAttachments.length === 0) {
      updateSummaryRecord(email, name, 'failed', 'PDF missing locally');
      failCount++;
      processedCount++;
      console.log(renderProgressBar(processedCount, emails.length, sentCount, failCount));
      return;
    }

    // Chunk attachments into max 7MB batches
    const attachmentBatches = [];
    let currentBatch = [];
    let currentBatchBytes = 0;

    for (const att of allAttachments) {
      if (currentBatchBytes + att.byteLength > MAX_ATTACHMENT_BYTES && currentBatch.length > 0) {
        attachmentBatches.push(currentBatch);
        currentBatch = [];
        currentBatchBytes = 0;
      }
      currentBatch.push(att);
      currentBatchBytes += att.byteLength;
    }
    if (currentBatch.length > 0) {
      attachmentBatches.push(currentBatch);
    }

    const totalEmailParts = attachmentBatches.length;
    let participantAllSent = true;
    let lastErrorMsg = '';

    for (let partIdx = 0; partIdx < totalEmailParts; partIdx++) {
      const batchAtts = attachmentBatches[partIdx].map(a => ({
        content: a.content,
        mime_type: a.mime_type,
        name: a.name
      }));

      const batchTitles = [];
      for (const a of batchAtts) {
        const titleMatch = a.name.split(' - ')[0];
        if (titleMatch && !batchTitles.includes(titleMatch)) {
          batchTitles.push(titleMatch);
        }
      }

      let subject = '';
      if (totalEmailParts === 1) {
        subject = totalEvents === 1 
          ? `Your Certificate of Completion: ${uniqueEventTitles[0]}`
          : `Your Certificates of Completion (${totalEvents} Events Attended) - Summer of Building`;
      } else {
        subject = `Your Certificates of Completion (Part ${partIdx + 1}/${totalEmailParts}) - Summer of Building`;
      }

      const eventCardsHtml = batchTitles.map(title => `
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
          .replace(/{{ATTENDED_COUNT}}/g, String(batchTitles.length))
          .replace(/{{DYNAMIC_CERTIFICATE_CARDS}}/g, eventCardsHtml);
      } else {
        htmlbody = `<p>Dear ${name}, please find attached your certificates.</p>`;
      }

      const authHeader = token.startsWith('Zoho-enczapikey') ? token : `Zoho-enczapikey ${token}`;

      const payload = {
        from: { address: fromEmail, name: fromName },
        to: [{ email_address: { address: email, name: name } }],
        subject: subject,
        htmlbody: htmlbody,
        attachments: batchAtts
      };

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        const resText = await response.text();
        if (!response.ok) {
          participantAllSent = false;
          lastErrorMsg = resText;
          console.error(`\n  [API Error ${response.status}] ${email} (Part ${partIdx+1}/${totalEmailParts}):`, resText);
        }
      } catch (err) {
        participantAllSent = false;
        lastErrorMsg = err.message;
        console.error(`\n  [Network Error] ${email}:`, err.message);
      }

      await new Promise(r => setTimeout(r, 100));
    }

    if (participantAllSent) {
      sentCount++;
      updateSummaryRecord(email, name, 'sent', null, certList.length);
    } else {
      failCount++;
      updateSummaryRecord(email, name, 'failed', lastErrorMsg);
    }

    processedCount++;
    console.log(renderProgressBar(processedCount, emails.length, sentCount, failCount));

    if (processedCount % 5 === 0 || processedCount === emails.length) {
      fs.writeFileSync(LOG_FILE, JSON.stringify(dispatchSummary, null, 2), 'utf-8');
    }
  }

  function updateSummaryRecord(email, name, status, error, count) {
    const idx = dispatchSummary.findIndex(s => s.email.toLowerCase() === email.toLowerCase());
    const rec = {
      email,
      name,
      status,
      error: error || undefined,
      certificatesCount: count || undefined,
      timestamp: new Date().toISOString()
    };
    if (idx >= 0) {
      dispatchSummary[idx] = rec;
    } else {
      dispatchSummary.push(rec);
    }
  }

  // Run pool of CONCURRENCY workers
  const activeWorkers = [];
  for (let w = 0; w < CONCURRENCY; w++) {
    activeWorkers.push((async () => {
      while (queue.length > 0) {
        const nextEmail = queue.shift();
        if (nextEmail) {
          await processParticipant(nextEmail);
        }
      }
    })());
  }

  await Promise.all(activeWorkers);

  fs.writeFileSync(LOG_FILE, JSON.stringify(dispatchSummary, null, 2), 'utf-8');

  console.log('\n=============================================');
  console.log('Official ZeptoMail Dispatch Summary:');
  console.log(`- Total Unique Participants: ${emails.length}`);
  console.log(`- Emails Successfully Sent: ${sentCount}`);
  console.log(`- Failed: ${failCount}`);
  console.log(`- Log Output Saved to: ${LOG_FILE}`);
  console.log('=============================================\n');
}

sendZeptoMailCertificates().catch(err => {
  console.error('Unhandled error during ZeptoMail dispatch:', err);
  process.exit(1);
});
