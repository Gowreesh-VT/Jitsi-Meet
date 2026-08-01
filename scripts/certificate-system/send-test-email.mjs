/**
 * Test Email Dispatcher for 3-Event Participant via ZeptoMail API
 * Sends a test email to gousemoideen1@gmail.com using participant data with 3 events.
 */

import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');
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

async function sendTestEmail() {
  console.log('=== Sending Test Email for 3-Event Participant via ZeptoMail ===\n');

  loadEnv();

  const token = process.env.ZEPTOMAIL_SEND_TOKEN;
  const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL;
  const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'Microsoft Innovations Club';
  const apiUrl = process.env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.in/v1.1/email';

  const recipientEmail = 'gousemoideen1@gmail.com';

  if (!token || !fromEmail) {
    console.error('Error: ZeptoMail credentials missing in .env.local.');
    process.exit(1);
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Error: Index file ${INDEX_FILE} not found.`);
    process.exit(1);
  }

  const indexMap = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));

  // Find participant with 3 events (6 certificates)
  let targetParticipant = null;
  for (const email of Object.keys(indexMap)) {
    if (indexMap[email].certificates.length === 6) {
      targetParticipant = indexMap[email];
      break;
    }
  }

  if (!targetParticipant) {
    console.error('Error: No participant found with 3 events.');
    process.exit(1);
  }

  console.log(`Selected Participant Data:`);
  console.log(`- Name: ${targetParticipant.name}`);
  console.log(`- Test Recipient Email: ${recipientEmail}`);
  console.log(`- Total Certificates: ${targetParticipant.certificates.length} (3 Events x 2 Certificates)\n`);

  // Load HTML template
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.error(`Error: Email template ${TEMPLATE_FILE} not found.`);
    process.exit(1);
  }
  const templateRaw = fs.readFileSync(TEMPLATE_FILE, 'utf-8');

  // Filter unique event titles for display cards in HTML body
  const uniqueEventTitles = [];
  const certList = targetParticipant.certificates;

  for (const cert of certList) {
    const cleanTitle = cert.eventTitle.replace(/ \((MIC|HackerRank) Certificate\)/, '');
    if (!uniqueEventTitles.includes(cleanTitle)) {
      uniqueEventTitles.push(cleanTitle);
    }
  }

  const eventCount = uniqueEventTitles.length;

  // Build HTML event cards
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

  const htmlbody = templateRaw
    .replace(/{{PARTICIPANT_NAME}}/g, targetParticipant.name)
    .replace(/{{ATTENDED_COUNT}}/g, String(eventCount))
    .replace(/{{DYNAMIC_CERTIFICATE_CARDS}}/g, eventCardsHtml);

  // Attach all 6 PDF certificates
  const attachments = [];
  for (const cert of certList) {
    if (!fs.existsSync(cert.pdfPath)) {
      console.error(`Error: Missing PDF file at ${cert.pdfPath}`);
      process.exit(1);
    }
    const pdfBytes = fs.readFileSync(cert.pdfPath);
    attachments.push({
      content: pdfBytes.toString('base64'),
      mime_type: 'application/pdf',
      name: cert.filename
    });
  }

  const subject = `Your Certificates of Completion (${eventCount} Events Attended) - Summer of Building`;

  const authHeader = token.startsWith('Zoho-enczapikey') ? token : `Zoho-enczapikey ${token}`;

  const payload = {
    from: { address: fromEmail, name: fromName },
    to: [
      {
        email_address: { address: recipientEmail, name: targetParticipant.name }
      }
    ],
    subject: subject,
    htmlbody: htmlbody,
    attachments: attachments
  };

  console.log(`Sending email to ${recipientEmail} with ${attachments.length} PDF attachments...`);

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
      console.log('\n=============================================');
      console.log('✓ TEST EMAIL SENT SUCCESSFULLY!');
      console.log(`- Recipient: ${recipientEmail}`);
      console.log(`- Events Included (${eventCount}): ${uniqueEventTitles.join(', ')}`);
      console.log(`- PDF Attachments (${attachments.length}):`);
      attachments.forEach(a => console.log(`  • ${a.name}`));
      console.log(`- ZeptoMail Request ID: ${result.request_id || result.message || 'Success'}`);
      console.log('=============================================\n');
    } else {
      console.error('\n✗ ZeptoMail API returned an error:', result);
    }
  } catch (err) {
    console.error('\n✗ Network error during ZeptoMail dispatch:', err.message);
  }
}

sendTestEmail().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
