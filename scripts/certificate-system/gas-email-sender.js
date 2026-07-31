/**
 * Script 2: Google Apps Script Email Sender (Production Ready)
 * 
 * Target: Google Apps Script (https://script.google.com)
 * Function: Receives grouped certificates per recipient and sends a single email with all PDFs attached.
 * 
 * Setup Instructions:
 * 1. Open https://script.google.com in your browser.
 * 2. Click "New Project" and paste this code into Code.gs.
 * 3. Click "Deploy" -> "New Deployment".
 * 4. Select type: "Web App".
 *    - Execute as: "Me"
 *    - Who has access: "Anyone"
 * 5. Click "Deploy", grant necessary Gmail permissions, and copy the Web App URL.
 * 6. Use the Web App URL with the local dispatcher script (2-send-grouped-certificates.mjs).
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJSON({ status: 'error', message: 'Empty payload received' }, 400);
    }

    const payload = JSON.parse(e.postData.contents);
    const { email, name, certificates } = payload;

    if (!email || !certificates || !Array.isArray(certificates) || certificates.length === 0) {
      return responseJSON({ status: 'error', message: 'Invalid request. "email" and non-empty "certificates" array required.' }, 400);
    }

    // 1. Build PDF Blob Attachments
    const pdfAttachments = certificates.map(cert => {
      const bytes = Utilities.base64Decode(cert.pdf_base64);
      const filename = cert.filename || `${cert.eventTitle || 'Certificate'}.pdf`;
      return Utilities.newBlob(bytes, 'application/pdf', filename);
    });

    // 2. Prepare Subject and Body based on single vs multiple event attendance
    const eventCount = certificates.length;
    const eventListText = certificates.map(c => `• ${c.eventTitle}`).join('\n');

    let subject = '';
    let body = '';

    if (eventCount === 1) {
      const eventTitle = certificates[0].eventTitle;
      subject = `Your Certificate of Completion: ${eventTitle}`;
      body = `Dear ${name || 'Participant'},\n\n` +
        `Thank you for participating in "${eventTitle}"!\n\n` +
        `We hope you had an engaging and insightful experience. Please find your official Certificate of Completion attached to this email.\n\n` +
        `Best regards,\n` +
        `Event Organizing Team\n` +
        `Vellore Institute of Technology`;
    } else {
      subject = `Your Certificates of Completion (${eventCount} Events Attended)`;
      body = `Dear ${name || 'Participant'},\n\n` +
        `Thank you for participating in our recent events! We appreciate your enthusiasm and active participation.\n\n` +
        `According to our records, you successfully attended the following ${eventCount} events:\n` +
        `${eventListText}\n\n` +
        `Please find all ${eventCount} of your official Certificates of Completion attached to this email.\n\n` +
        `Best regards,\n` +
        `Event Organizing Team\n` +
        `Vellore Institute of Technology`;
    }

    // 3. Send single email with all certificate attachments via Gmail API
    GmailApp.sendEmail(email, subject, body, {
      attachments: pdfAttachments,
      name: 'Event Organizing Team'
    });

    return responseJSON({
      status: 'success',
      email: email,
      certificatesSent: eventCount
    });

  } catch (error) {
    return responseJSON({
      status: 'error',
      message: error.toString()
    }, 500);
  }
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  return ContentService.createTextOutput('Google Apps Script Certificate Dispatcher Web App is active and ready.');
}
