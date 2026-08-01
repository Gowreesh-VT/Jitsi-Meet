/**
 * Test Email Dispatcher via Google Apps Script Web App
 * Sends 1-event test email to gousemoideen1@gmail.com
 */

import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');
const TEMPLATE_FILE = path.resolve('scripts/certificate-system/certificate_email.html');

async function sendGasTestEmail() {
  const gasUrl = process.argv[2] || 'https://script.google.com/macros/s/AKfycbwiZHw000oSwlV8vr3zWiPsq7g8jhTWK1WIZVvbEtIjTN-nJyp2F11LJYDIDTbmx8zx7Q/exec';
  const recipientEmail = 'gousemoideen1@gmail.com';

  console.log('=== Sending Test Email via Google Apps Script Web App ===\n');
  console.log(`Target GAS URL: ${gasUrl}`);
  console.log(`Recipient Email: ${recipientEmail}\n`);

  if (!fs.existsSync(INDEX_FILE)) {
    console.error(`Error: Index file ${INDEX_FILE} not found.`);
    process.exit(1);
  }

  const indexMap = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));

  // Find participant with 1 event (2 certificates)
  let targetParticipant = null;
  for (const email of Object.keys(indexMap)) {
    if (indexMap[email].certificates.length === 2) {
      targetParticipant = indexMap[email];
      break;
    }
  }

  if (!targetParticipant) {
    console.error('Error: No participant found with 1 event.');
    process.exit(1);
  }

  console.log(`Selected Participant Data: ${targetParticipant.name}`);
  console.log(`Certificates: ${targetParticipant.certificates.map(c => c.filename).join(', ')}\n`);

  let templateRaw = '';
  if (fs.existsSync(TEMPLATE_FILE)) {
    templateRaw = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
  }

  const certList = targetParticipant.certificates;
  const uniqueEventTitles = [];
  for (const cert of certList) {
    const cleanTitle = cert.eventTitle.replace(/ \((MIC|HackerRank) Certificate\)/, '');
    if (!uniqueEventTitles.includes(cleanTitle)) {
      uniqueEventTitles.push(cleanTitle);
    }
  }

  const eventCount = uniqueEventTitles.length;
  const subject = `Your Certificate of Completion: ${uniqueEventTitles[0]}`;

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
      .replace(/{{PARTICIPANT_NAME}}/g, targetParticipant.name)
      .replace(/{{ATTENDED_COUNT}}/g, String(eventCount))
      .replace(/{{DYNAMIC_CERTIFICATE_CARDS}}/g, eventCardsHtml);
  }

  const attachments = [];
  for (const cert of certList) {
    if (!fs.existsSync(cert.pdfPath)) {
      console.error(`Error: Missing PDF ${cert.pdfPath}`);
      process.exit(1);
    }
    const pdfBytes = fs.readFileSync(cert.pdfPath);
    attachments.push({
      eventTitle: cert.eventTitle,
      filename: cert.filename,
      pdf_base64: pdfBytes.toString('base64')
    });
  }

  const payload = {
    email: recipientEmail,
    name: targetParticipant.name,
    subject: subject,
    htmlbody: htmlbody,
    certificates: attachments
  };

  console.log(`Sending HTTP POST request to Google Apps Script Web App...`);

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
      console.log('\n=============================================');
      console.log('✓ GOOGLE APPS SCRIPT TEST EMAIL SENT SUCCESSFULLY!');
      console.log(`- Recipient: ${recipientEmail}`);
      console.log(`- Event Included: ${uniqueEventTitles[0]}`);
      console.log(`- PDF Attachments (2):`);
      attachments.forEach(a => console.log(`  • ${a.filename}`));
      console.log('=============================================\n');
    } else {
      console.error('\n✗ Google Apps Script API returned an error:', result);
    }

  } catch (err) {
    console.error('\n✗ Network error calling GAS Web App:', err.message);
  }
}

sendGasTestEmail().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
