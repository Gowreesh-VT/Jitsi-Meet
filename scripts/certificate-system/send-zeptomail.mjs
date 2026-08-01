/**
 * Script 2 (ZeptoMail): Grouped Certificate Email Dispatcher via ZeptoMail API
 * 
 * Sends exactly ONE email per participant containing ALL certificate PDF attachments
 * using Zoho ZeptoMail REST API.
 * 
 * Usage:
 *   ZEPTOMAIL_SEND_TOKEN="Zoho-enczapikey ..." ZEPTOMAIL_FROM_EMAIL="events@yourdomain.com" node scripts/certificate-system/send-zeptomail.mjs
 */

import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');
const LOG_FILE = path.resolve('output/zeptomail_dispatch_summary.json');

function loadEnv() {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        const rawVal = vals.join('=').trim();
        process.env[key.trim()] = rawVal.replace(/^["']|["']$/g, '');
      }
    }
  }
}

async function sendZeptoMailCertificates() {
  console.log('=== Step 2: ZeptoMail Grouped Email Dispatch Pipeline ===\n');

  loadEnv();

  const token = process.env.ZEPTOMAIL_SEND_TOKEN || process.env.ZEPTOMAIL_API_KEY;
  const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL || process.env.ZEPTOMAIL_SENDER_EMAIL;
  const fromName = process.env.ZEPTOMAIL_FROM_NAME || 'Event Organizing Team';
  const apiUrl = process.env.ZEPTOMAIL_API_URL || 'https://api.zeptomail.in/v1.1/email';

  if (!token) {
    console.error('Error: ZeptoMail Send Token is required.');
    console.error('Please set ZEPTOMAIL_SEND_TOKEN in .env.local or pass it in environment variables:');
    console.error('  ZEPTOMAIL_SEND_TOKEN="Zoho-enczapikey ..." ZEPTOMAIL_FROM_EMAIL="events@yourdomain.com" node scripts/certificate-system/send-zeptomail.mjs\n');
    process.exit(1);
  }

  if (!fromEmail) {
    console.error('Error: Sender email is required.');
    console.error('Please set ZEPTOMAIL_FROM_EMAIL in .env.local (e.g. ZEPTOMAIL_FROM_EMAIL="events@yourdomain.com").\n');
    process.exit(1);
  }

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Error: Index file ${INDEX_FILE} not found. Please run Script 1 first.`);
    process.exit(1);
  }

  const indexMap = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const emails = Object.keys(indexMap);

  console.log(`Found ${emails.length} unique participants.`);
  console.log(`From Sender: "${fromName}" <${fromEmail}>`);
  console.log(`ZeptoMail API Endpoint: ${apiUrl}\n`);

  const templatePath = path.resolve('scripts/certificate-system/certificate_email.html');
  let templateRaw = '';
  if (fs.existsSync(templatePath)) {
    templateRaw = fs.readFileSync(templatePath, 'utf-8');
  } else {
    console.warn(`Warning: Template file ${templatePath} not found. Falling back to plain HTML.`);
  }

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

    console.log(`[${i + 1}/${emails.length}] Sending email to ${name} (${email}) - ${certList.length} certificate(s)...`);

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
        name: cert.filename || `${cert.eventTitle}.pdf`
      });
    }

    if (!validAttachments || attachments.length === 0) {
      dispatchSummary.push({ email, name, status: 'failed', error: 'PDF missing locally' });
      failCount++;
      continue;
    }

    // Build Subject & Body using rich HTML template
    const totalCertCount = certList.length;
    const attendedEventCount = Math.max(1, Math.floor(certList.length / 2));

    const eventCardsHtml = certList.map(c => {
      const isHackerRank = c.eventTitle.includes('HackerRank');
      const isVIT = c.eventTitle.includes('MIC') || c.eventTitle.includes('VIT');

      let displayTitle = c.eventTitle;
      let badgeIcon = 'https://img.icons8.com/ios-glyphs/90/EAB308/graduation-cap.png';
      let badgeBg = 'rgba(234, 179, 8, 0.1)';
      let badgeAlt = '🎓';
      let certTypeLabel = 'Official VIT Certificate Attached (PDF)';

      if (isHackerRank) {
        displayTitle = c.eventTitle.replace('(HackerRank Certificate)', '- Official HackerRank Certificate');
        badgeIcon = 'https://img.icons8.com/ios-glyphs/90/3B82F6/trophy.png';
        badgeBg = 'rgba(59, 130, 246, 0.1)';
        badgeAlt = '🏆';
        certTypeLabel = 'Official HackerRank Certificate Attached (PDF)';
      } else if (isVIT) {
        displayTitle = c.eventTitle.replace('(MIC Certificate)', '- Official VIT Certificate');
      }

      return `
        <tr>
          <td style="padding-bottom: 12px;">
            <table class="cert-card" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
              style="background-color: #0D0B14; border: 1px solid #2B2544; border-radius: 12px; box-shadow: 0 4px 12px rgba(124, 118, 153, 0.04);">
              <tr>
                <td class="cert-card-cell" style="padding: 16px 20px;">
                  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                    <tr>
                      <td class="cert-badge-cell" width="44" style="padding-right: 16px;">
                        <div class="cert-badge" style="width: 44px; height: 44px; background-color: ${badgeBg}; border-radius: 8px; line-height: 44px; text-align: center;">
                          <img src="${badgeIcon}" width="22" height="22" alt="${badgeAlt}" style="display: inline-block; vertical-align: middle; border: 0;">
                        </div>
                      </td>
                      <td class="cert-title-cell">
                        <h4 class="text-title" style="margin: 0; font-family: system-ui, sans-serif; font-size: 15px; font-weight: 700; color: #FFFFFF;">
                          ${displayTitle}
                        </h4>
                        <span style="font-family: system-ui, sans-serif; font-size: 12px; color: #22C55E; display: inline-block; margin-top: 2px;">
                          ✓ ${certTypeLabel}
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    }).join('');

    const subject = attendedEventCount === 1 
      ? `Your Certificates of Completion (Official VIT & HackerRank) - Summer of Building`
      : `Your Certificates of Completion (${attendedEventCount} Events Attended - Official VIT & HackerRank)`;

    let htmlbody = '';
    if (templateRaw) {
      htmlbody = templateRaw
        .replace(/{{PARTICIPANT_NAME}}/g, name)
        .replace(/{{ATTENDED_COUNT}}/g, String(attendedEventCount))
        .replace(/{{TOTAL_CERT_COUNT}}/g, String(totalCertCount))
        .replace(/{{DYNAMIC_CERTIFICATE_CARDS}}/g, eventCardsHtml);
    } else {
      const eventListHtml = certList.map(c => `<li style="margin-bottom: 4px;"><strong>${c.eventTitle}</strong></li>`).join('');
      htmlbody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #1a237e; margin-top: 0;">Certificate of Completion</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Thank you for participating in our recent events during Summer of Building!</p>
          <p>You successfully attended the following <strong>${eventCount}</strong> event(s):</p>
          <ul style="color: #333; line-height: 1.6;">${eventListHtml}</ul>
          <p>Please find your official PDF certificate(s) attached to this email.</p>
        </div>
      `;
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
