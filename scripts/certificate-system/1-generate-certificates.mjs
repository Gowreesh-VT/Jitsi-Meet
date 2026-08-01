/**
 * Script 1: Superfast Dual Certificate Generation Pipeline (MIC + HackerRank)
 * Pre-embeds background template PNG once and uses copyPages for maximum performance.
 */

import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const INPUT_CSV = path.resolve('all_events_attended_participants.csv');
const OUTPUT_DIR = path.resolve('output/generated_certificates');
const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');

const TEMPLATE_MIC_PATH = path.resolve('public/templates/certificates (2).pdf');
const TEMPLATE_HR_PATH = path.resolve('public/templates/hackerrank_certificate_template.png');

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const rows = [];
  
  for (const line of lines) {
    const row = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }
  return rows;
}

function sanitizeFilename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, ' ').trim();
}

function formatParticipantName(rawName) {
  if (!rawName) return 'Participant';
  return rawName.replace(/\s+\b\d{2}[A-Z]{3}\d{4}\b/gi, '').trim();
}

function formatDate(rawDate) {
  if (!rawDate) return '22/7/2026';
  if (rawDate.includes('T')) {
    const d = new Date(rawDate);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  }
  const parts = rawDate.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}/${parts[0]}`;
  }
  return rawDate;
}

async function generateDualCertificates() {
  console.log('=== Superfast Dual Certificate Generation Pipeline (MIC + HackerRank) ===\n');

  if (!fs.existsSync(INPUT_CSV)) {
    console.error(`Error: CSV file not found at ${INPUT_CSV}`);
    process.exit(1);
  }

  const csvData = fs.readFileSync(INPUT_CSV, 'utf-8');
  const rows = parseCSV(csvData);

  if (rows.length < 2) {
    console.error('Error: CSV contains no data rows.');
    process.exit(1);
  }

  const headers = rows[0].map(h => h.toLowerCase().trim());
  const eventTitleIdx = headers.findIndex(h => h.includes('event title') || h.includes('workshop title') || h.includes('event'));
  const eventDateIdx = headers.findIndex(h => h.includes('event date') || h.includes('date'));
  const nameIdx = headers.findIndex(h => h.includes('name'));
  const emailIdx = headers.findIndex(h => h.includes('email'));

  if (nameIdx === -1 || emailIdx === -1 || eventTitleIdx === -1) {
    console.error('Error: CSV must include "Name", "Email", and "Event Title" columns.');
    process.exit(1);
  }

  const micPdfBytes = fs.existsSync(TEMPLATE_MIC_PATH) ? fs.readFileSync(TEMPLATE_MIC_PATH) : null;
  const hrImgBytes = fs.existsSync(TEMPLATE_HR_PATH) ? fs.readFileSync(TEMPLATE_HR_PATH) : null;

  if (!micPdfBytes) {
    console.error(`Error: MIC Template PDF not found at ${TEMPLATE_MIC_PATH}`);
    process.exit(1);
  }

  if (!hrImgBytes) {
    console.error(`Error: HackerRank Template PNG not found at ${TEMPLATE_HR_PATH}`);
    process.exit(1);
  }

  // Pre-load base documents for cloning
  const baseMicDoc = await PDFDocument.load(micPdfBytes);

  const baseHrDoc = await PDFDocument.create();
  const baseHrPage = baseHrDoc.addPage([841.89, 595.27]);
  const bgImg = await baseHrDoc.embedPng(hrImgBytes);
  baseHrPage.drawImage(bgImg, { x: 0, y: 0, width: 841.89, height: 595.27 });

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const indexMap = {};
  let successCount = 0;
  let failCount = 0;

  const tasks = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const rawEventTitle = cols[eventTitleIdx] || 'Workshop';
    const rawName = cols[nameIdx] || '';
    const email = (cols[emailIdx] || '').toLowerCase().trim();
    const rawDate = eventDateIdx !== -1 ? cols[eventDateIdx] : '';

    if (!email || !email.includes('@') || !rawName) {
      failCount++;
      continue;
    }
    tasks.push({ i, rawEventTitle, rawName, email, rawDate });
  }

  console.log(`Generating Dual Certificates (MIC & HackerRank) for ${tasks.length} attendance entries...`);

  const BATCH_SIZE = 250;
  for (let b = 0; b < tasks.length; b += BATCH_SIZE) {
    const batch = tasks.slice(b, b + BATCH_SIZE);

    await Promise.all(batch.map(async (t) => {
      const participantName = formatParticipantName(t.rawName);
      const eventTitle = t.rawEventTitle.trim();
      const dateStr = formatDate(t.rawDate);

      const safeEventFolder = sanitizeFilename(eventTitle);
      const safeParticipantName = sanitizeFilename(participantName);
      const safeEmail = sanitizeFilename(t.email);

      const eventFolder = path.join(OUTPUT_DIR, safeEventFolder);
      if (!fs.existsSync(eventFolder)) {
        fs.mkdirSync(eventFolder, { recursive: true });
      }

      const micFilename = `${safeEmail}_${safeParticipantName}_MIC.pdf`;
      const hrFilename = `${safeEmail}_${safeParticipantName}_HackerRank.pdf`;

      const micPdfPath = path.join(eventFolder, micFilename);
      const hrPdfPath = path.join(eventFolder, hrFilename);

      try {
        // --- 1. GENERATE MIC CERTIFICATE ---
        const micDoc = await PDFDocument.create();
        const [copiedMicPage] = await micDoc.copyPages(baseMicDoc, [0]);
        const micPage = micDoc.addPage(copiedMicPage);
        const { width: micW } = micPage.getSize();

        const nameFontMic = await micDoc.embedFont(StandardFonts.HelveticaBold);
        const textFontMic = await micDoc.embedFont(StandardFonts.Helvetica);

        // Draw Name
        const fontSizeNameMic = participantName.length > 25 ? 24 : 31;
        const nameWidthMic = nameFontMic.widthOfTextAtSize(participantName, fontSizeNameMic);
        micPage.drawText(participantName, {
          x: (micW - nameWidthMic) / 2,
          y: 305,
          size: fontSizeNameMic,
          font: nameFontMic,
          color: rgb(0.12, 0.12, 0.28),
        });

        // Draw Event Title
        const fontSizeEventMic = eventTitle.length > 30 ? 13 : 15;
        const eventWidthMic = textFontMic.widthOfTextAtSize(eventTitle, fontSizeEventMic);
        const line2Center = 182.5;
        const eventXMic = Math.max(90, line2Center - (eventWidthMic / 2));
        micPage.drawText(eventTitle, {
          x: eventXMic,
          y: 245,
          size: fontSizeEventMic,
          font: textFontMic,
          color: rgb(0.12, 0.12, 0.28),
        });

        // Draw Date
        const fontSizeDateMic = 14;
        const dateWidthMic = textFontMic.widthOfTextAtSize(dateStr, fontSizeDateMic);
        const line3Center = 152.5;
        const dateXMic = Math.max(90, line3Center - (dateWidthMic / 2));
        micPage.drawText(dateStr, {
          x: dateXMic,
          y: 215,
          size: fontSizeDateMic,
          font: textFontMic,
          color: rgb(0.12, 0.12, 0.28),
        });

        const micBytes = await micDoc.save();
        fs.writeFileSync(micPdfPath, micBytes);

        // --- 2. GENERATE HACKERRANK CERTIFICATE ---
        const hrDoc = await PDFDocument.create();
        const [copiedHrPage] = await hrDoc.copyPages(baseHrDoc, [0]);
        const hrPage = hrDoc.addPage(copiedHrPage);
        const { width: hrW } = hrPage.getSize();

        const nameFontHr = await hrDoc.embedFont(StandardFonts.HelveticaBold);
        const textFontHr = await hrDoc.embedFont(StandardFonts.Helvetica);

        // Blank out placeholder areas with clean white rectangles
        hrPage.drawRectangle({ x: 180, y: 310, width: 480, height: 50, color: rgb(1, 1, 1) });
        hrPage.drawRectangle({ x: 180, y: 232, width: 480, height: 35, color: rgb(1, 1, 1) });
        hrPage.drawRectangle({ x: 250, y: 198, width: 340, height: 25, color: rgb(1, 1, 1) });

        // Draw Recipient Name
        const fontSizeNameHr = participantName.length > 25 ? 26 : 32;
        const nameWidthHr = nameFontHr.widthOfTextAtSize(participantName, fontSizeNameHr);
        hrPage.drawText(participantName, {
          x: (hrW - nameWidthHr) / 2,
          y: 322,
          size: fontSizeNameHr,
          font: nameFontHr,
          color: rgb(0.05, 0.05, 0.05),
        });

        // Draw Event Title
        const fontSizeEventHr = eventTitle.length > 30 ? 16 : 20;
        const eventWidthHr = nameFontHr.widthOfTextAtSize(eventTitle, fontSizeEventHr);
        hrPage.drawText(eventTitle, {
          x: (hrW - eventWidthHr) / 2,
          y: 240,
          size: fontSizeEventHr,
          font: nameFontHr,
          color: rgb(0.05, 0.05, 0.05),
        });

        // Draw Date
        const fullDateText = `held on ${dateStr}`;
        const fontSizeDateHr = 13;
        const dateWidthHr = textFontHr.widthOfTextAtSize(fullDateText, fontSizeDateHr);
        hrPage.drawText(fullDateText, {
          x: (hrW - dateWidthHr) / 2,
          y: 205,
          size: fontSizeDateHr,
          font: textFontHr,
          color: rgb(0.25, 0.25, 0.25),
        });

        const hrBytes = await hrDoc.save();
        fs.writeFileSync(hrPdfPath, hrBytes);

        // Track both certificates in indexMap
        if (!indexMap[t.email]) {
          indexMap[t.email] = {
            name: participantName,
            email: t.email,
            certificates: []
          };
        }

        indexMap[t.email].certificates.push({
          eventTitle: `${eventTitle} (MIC Certificate)`,
          pdfPath: micPdfPath,
          filename: `${safeEventFolder} - ${safeParticipantName} (MIC Certificate).pdf`
        });

        indexMap[t.email].certificates.push({
          eventTitle: `${eventTitle} (HackerRank Certificate)`,
          pdfPath: hrPdfPath,
          filename: `${safeEventFolder} - ${safeParticipantName} (HackerRank Certificate).pdf`
        });

        successCount += 2;
      } catch (err) {
        console.error(`[Error] Failed generating dual certificates for ${participantName} (${t.email}):`, err);
        failCount++;
      }
    }));

    console.log(`Progress: ${Math.min(b + BATCH_SIZE, tasks.length)}/${tasks.length} entries processed (${successCount} PDFs)...`);
  }

  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexMap, null, 2), 'utf-8');

  console.log('\n=============================================');
  console.log(`Dual Certificate Generation Summary:`);
  console.log(`- Total PDFs Generated: ${successCount}`);
  console.log(`- Unique Participants (Emails): ${Object.keys(indexMap).length}`);
  console.log(`- Failed / Skipped: ${failCount}`);
  console.log(`- Output Directory: ${OUTPUT_DIR}`);
  console.log(`- Index File: ${INDEX_FILE}`);
  console.log('=============================================\n');
}

generateDualCertificates().catch(err => {
  console.error('Unhandled error during dual certificate generation:', err);
  process.exit(1);
});
