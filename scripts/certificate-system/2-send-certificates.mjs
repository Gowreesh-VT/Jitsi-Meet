/**
 * Universal Master Dispatcher: Send Certificates via ZeptoMail
 * 1 Single Email Per Person containing all attached PDF certificates.
 */

import fs from 'fs';
import path from 'path';
import https from 'https';

const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');
const LOG_FILE = path.resolve('output/zeptomail_master_dispatch_summary.json');
const TEMPLATE_PARTICIPANT = path.resolve('scripts/certificate-system/certificate_email.html');
const TEMPLATE_WINNER = path.resolve('scripts/certificate-system/winner_certificate_email.html');

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

function sendZeptoMailNative(apiUrl, authHeader, payloadJson) {
  return new Promise((resolve, reject) => {
    const url = new URL(apiUrl);
    const postData = Buffer.from(payloadJson, 'utf-8');

    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      },
      timeout: 90000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTPS request timed out after 90 seconds'));
    });

    req.write(postData);
    req.end();
  });
}

async function sendMasterCertificates() {
  console.log('=== UNIVERSAL CERTIFICATE DISPATCH PIPELINE (ZEPTOMAIL) ===\n');

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
    console.error(`Error: Index file not found at ${INDEX_FILE}. Run 1-generate-certificates.mjs first.`);
    process.exit(1);
  }

  const indexMap = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));
  const templateRaw = fs.readFileSync(TEMPLATE_PARTICIPANT, 'utf-8');
  const authHeader = token.startsWith('Zoho-enczapikey') ? token : `Zoho-enczapikey ${token}`;

  const emails = Object.keys(indexMap);
  const total = emails.length;
  const dispatchSummary = [];
  let sentCount = 0;
  let failCount = 0;

  console.log(`Total Accounts to Dispatch: ${total}\n`);

  for (let i = 0; i < total; i++) {
    const email = emails[i];
    const item = indexMap[email];
    const name = item.name;
    const certList = item.certificates || [];

    const uniqueEventTitles = [];
    for (const cert of certList) {
      const cleanTitle = cert.eventTitle.replace(/ \((MIC|HackerRank) Certificate\)/, '');
      if (!uniqueEventTitles.includes(cleanTitle)) {
        uniqueEventTitles.push(cleanTitle);
      }
    }

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
                        ✓ Official Certificate Attached
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
      .replace(/{{PARTICIPANT_NAME}}/g, name)
      .replace(/{{ATTENDED_COUNT}}/g, String(uniqueEventTitles.length))
      .replace(/{{TOTAL_CERT_COUNT}}/g, String(certList.length))
      .replace(/{{DYNAMIC_CERTIFICATE_CARDS}}/g, eventCardsHtml);

    const attachments = [];
    for (const cert of certList) {
      if (fs.existsSync(cert.pdfPath)) {
        attachments.push({
          content: fs.readFileSync(cert.pdfPath).toString('base64'),
          mime_type: 'application/pdf',
          name: cert.filename
        });
      }
    }

    const subject = uniqueEventTitles.length === 1
      ? `Your Certificate of Completion: ${uniqueEventTitles[0]} - MicroCraft`
      : `Your Certificates of Completion (${uniqueEventTitles.length} Events Attended) - Summer of Building`;

    const payload = {
      from: { address: fromEmail, name: fromName },
      to: [{ email_address: { address: email, name: name } }],
      subject: subject,
      htmlbody: htmlbody,
      attachments: attachments
    };

    console.log(`[${i + 1}/${total}] Dispatching to ${name} <${email}> (${attachments.length} PDFs)...`);

    try {
      const res = await sendZeptoMailNative(apiUrl, authHeader, JSON.stringify(payload));
      if (res.statusCode === 201 || res.statusCode === 200) {
        sentCount++;
        dispatchSummary.push({ email, name, status: 'sent', certCount: attachments.length, timestamp: new Date().toISOString() });
        console.log(`   ✓ Delivered successfully (Status ${res.statusCode})`);
      } else {
        failCount++;
        dispatchSummary.push({ email, name, status: 'failed', error: res.body, timestamp: new Date().toISOString() });
        console.error(`   ✗ ZeptoMail Error:`, res.body);
      }
    } catch (err) {
      failCount++;
      dispatchSummary.push({ email, name, status: 'failed', error: err.message, timestamp: new Date().toISOString() });
      console.error(`   ✗ Network Error:`, err.message);
    }

    await new Promise(r => setTimeout(r, 350));
  }

  fs.writeFileSync(LOG_FILE, JSON.stringify(dispatchSummary, null, 2), 'utf-8');
  console.log(`\nMaster Dispatch Finished: ${sentCount}/${total} Delivered. Summary saved: ${LOG_FILE}`);
}

sendMasterCertificates().catch(err => {
  console.error('Error during dispatch:', err);
  process.exit(1);
});
