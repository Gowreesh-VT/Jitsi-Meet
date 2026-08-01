/**
 * Test Single HackerRank Certificate Generator (Shifted Up Additional 8px)
 * Shifts all 5 text lines up by an additional 8px (+13px total).
 */

import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const TEMPLATE_HR_PATH = path.resolve('public/templates/hackerrank_certificate_template.png');
const OUTPUT_PDF = path.resolve('output/test_single_hackerrank.pdf');

async function testSingleCertificate() {
  console.log('=== Generating Single Test HackerRank Certificate (Shifted Up +8px) ===\n');

  if (!fs.existsSync(TEMPLATE_HR_PATH)) {
    console.error(`Error: Template ${TEMPLATE_HR_PATH} not found.`);
    process.exit(1);
  }

  const hrImgBytes = fs.readFileSync(TEMPLATE_HR_PATH);

  const doc = await PDFDocument.create();
  const page = doc.addPage([841.89, 595.27]);
  const { width: pageW } = page.getSize();

  const bgImg = await doc.embedPng(hrImgBytes);
  page.drawImage(bgImg, { x: 0, y: 0, width: 841.89, height: 595.27 });

  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  const participantName = "Divya Priya";
  const eventTitle = "n8n Mail Bot";
  const dateStr = "22/7/2026";

  // White rectangle bounds inside center box
  page.drawRectangle({ x: 210, y: 225, width: 420, height: 136, color: rgb(1, 1, 1) });

  // 1. Subtitle 1: "This participation certificate is given to"
  const sub1Text = "This participation certificate is given to";
  const fontSizeSub1 = 13.5;
  const sub1Width = regularFont.widthOfTextAtSize(sub1Text, fontSizeSub1);
  page.drawText(sub1Text, {
    x: (pageW - sub1Width) / 2,
    y: 351,
    size: fontSizeSub1,
    font: regularFont,
    color: rgb(0.22, 0.22, 0.22),
  });

  // 2. Recipient Name: "[RECIPIENT NAME]"
  const fontSizeName = participantName.length > 25 ? 24 : 30;
  const nameWidth = boldFont.widthOfTextAtSize(participantName, fontSizeName);
  page.drawText(participantName, {
    x: (pageW - nameWidth) / 2,
    y: 316,
    size: fontSizeName,
    font: boldFont,
    color: rgb(0.05, 0.05, 0.05),
  });

  // 3. Subtitle 2: "for actively participating in the"
  const sub2Text = "for actively participating in the";
  const fontSizeSub2 = 13.5;
  const sub2Width = regularFont.widthOfTextAtSize(sub2Text, fontSizeSub2);
  page.drawText(sub2Text, {
    x: (pageW - sub2Width) / 2,
    y: 286,
    size: fontSizeSub2,
    font: regularFont,
    color: rgb(0.22, 0.22, 0.22),
  });

  // 4. Event Title: "[EVENT TITLE]"
  const fontSizeEvent = eventTitle.length > 30 ? 15 : 20;
  const eventWidth = boldFont.widthOfTextAtSize(eventTitle, fontSizeEvent);
  page.drawText(eventTitle, {
    x: (pageW - eventWidth) / 2,
    y: 256,
    size: fontSizeEvent,
    font: boldFont,
    color: rgb(0.05, 0.05, 0.05),
  });

  // 5. Date: "held on [DATE]"
  const dateText = `held on ${dateStr}`;
  const fontSizeDate = 12.5;
  const dateWidth = regularFont.widthOfTextAtSize(dateText, fontSizeDate);
  page.drawText(dateText, {
    x: (pageW - dateWidth) / 2,
    y: 231,
    size: fontSizeDate,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });

  const pdfBytes = await doc.save();
  fs.writeFileSync(OUTPUT_PDF, pdfBytes);

  console.log(`Saved sample test PDF to: ${OUTPUT_PDF}\n`);
}

testSingleCertificate().catch(console.error);
