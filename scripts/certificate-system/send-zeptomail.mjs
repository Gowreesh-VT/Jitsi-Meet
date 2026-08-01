/**
 * Script 2 (ZeptoMail): Grouped Dual Certificate Email Dispatcher via ZeptoMail API
 * 
 * Sends exactly ONE email per participant containing ALL certificate PDF attachments
 * (1 MIC Certificate + 1 HackerRank Certificate for every event attended)
 * using Zoho ZeptoMail REST API.
 * 
 * Usage:
 *   node scripts/certificate-system/send-zeptomail.mjs
 */

import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');
const LOG_FILE = path.resolve('output/zeptomail_dispatch_summary.json');
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

async function sendZeptoMailCertificates() {
  console.log('=== Step 2: ZeptoMail Grouped Email Dispatch Pipeline ===\n');

  loadEnv();

  const token = process.env.ZEPTOMAIL_SEND_TOKEN;
  const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL;
  const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'Microsoft Innovations Club';
  const apiUrl = process.env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.in/v1.1/email';

  if (!token || !fromEmail) {
    console.error('Error: ZeptoMail credentials missing in .env.local.');
    console.error('Please set ZEPTOMAIL_SEND_TOKEN and ZEPTOMAIL_FROM_EMAIL in .env.local.\n');
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
  } else {
    console.warn(`Warning: Template file ${TEMPLATE_FILE} not found.`);
  }

  console.log(`Found ${emails.length} unique participants.`);
  console.log(`From Sender: "${fromName}" <${fromEmail}>`);
  console.log(`ZeptoMail API Endpoint: ${apiUrl}\n`);

  // Load existing log if resuming
  let dispatchSummary = [];
  const sentEmailsSet = new Set();

  if (fs.existsSync(LOG_FILE)) {
    try {
      dispatchSummary = JSON.parse(fs.readFileSync(LOG_FILE, 'utf-8'));
      dispatchSummary.filter(s => s.status === 'sent').forEach(s => sentEmailsSet.add(s.email));
      console.log(`Resuming session: ${sentEmailsSet.size} emails already sent previously.\n`);
    } catch {
      dispatchSummary = [];
    }
  }

  let sentCount = sentEmailsSet.size;
  let failCount = 0;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];

    if (sentEmailsSet.has(email)) {
      console.log(`[${i + 1}/${emails.length}] Skipping ${email} (already sent).`);
      continue;
    }

    const item = indexMap[email];
    const name = item.name;
    const certList = item.certificates;

    // Filter unique event titles for display cards in HTML body
    const uniqueEventTitles = [];
    for (const cert of certList) {
      const cleanTitle = cert.eventTitle.replace(/ \((MIC|HackerRank) Certificate\)/, '');
      if (!uniqueEventTitles.includes(cleanTitle)) {
        uniqueEventTitles.push(cleanTitle);
      }
    }

    const eventCount = uniqueEventTitles.length;

    console.log(`[${i + 1}/${emails.length}] Sending email to ${name} (${email}) - ${eventCount} event(s) (${certList.length} PDFs)...`);

    // Build attachments array for ZeptoMail API
    const attachments = [];
    let validAttachments = true;

    for (const cert of certList) {
      if (!fs.existsSync(cert.pdfPath)) {
        console.error(`  [Missing PDF] ${cert.pdfPath}`);
        validAttachments = false;
        break;
      }
      const pdfBytes = fs.readFileSync(cert.pdfPath);
      attachments.push({
        content: pdfBytes.toString('base64'),
        mime_type: 'application/pdf',
        name: cert.filename
      });
    }

    if (!validAttachments || attachments.length === 0) {
      dispatchSummary.push({ email, name, status: 'failed', error: 'PDF missing locally' });
      failCount++;
      continue;
    }

    // Build Subject & HTML Body
    const subject = eventCount === 1 
      ? `Your Certificates of Completion: ${uniqueEventTitles[0]}`
      : `Your Certificates of Completion (${eventCount} Events Attended) - Summer of Building`;

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
        .replace(/{{ATTENDED_COUNT}}/g, String(eventCount))
        .replace(/{{DYNAMIC_CERTIFICATE_CARDS}}/g, eventCardsHtml);
    } else {
      htmlbody = `<p>Dear ${name}, please find attached your certificates for ${eventCount} event(s).</p>`;
    }

    const authHeader = token.startsWith('Zoho-enczapikey') ? token : `Zoho-enczapikey ${token}`;

    const payload = {
      from: { address: fromEmail, name: fromName },
      to: [
        {
          email_address: { address: email, name: name }
        }
      ],
      subject: subject,
      htmlbody: htmlbody,
      attachments: attachments
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
      let result;
      try {
        result = JSON.parse(resText);
      } catch {
        result = { message: resText };
      }

      if (response.ok) {
        console.log(`  ✓ Sent via ZeptoMail (${attachments.length} attachment(s)).`);
        dispatchSummary.push({
          email,
          name,
          status: 'sent',
          certificatesCount: attachments.length,
          timestamp: new Date().toISOString()
        });
        sentCount++;
      } else {
        console.error(`  ✗ Failed to send via ZeptoMail:`, result.message || resText);
        dispatchSummary.push({ email, name, status: 'failed', error: result.message || resText });
        failCount++;
      }

    } catch (err) {
      console.error(`  ✗ Network error:`, err.message);
      dispatchSummary.push({ email, name, status: 'failed', error: err.message });
      failCount++;
    }

    // Save progress periodically
    fs.writeFileSync(LOG_FILE, JSON.stringify(dispatchSummary, null, 2), 'utf-8');

    // Throttling: wait 150ms between API calls
    await new Promise(r => setTimeout(r, 150));
  }

  console.log('\n=============================================');
  console.log('ZeptoMail Dispatch Summary:');
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
