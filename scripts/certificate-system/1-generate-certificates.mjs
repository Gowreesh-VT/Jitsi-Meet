/**
 * Script 1: Certificate Generation Pipeline (Production Ready)
 * Reads participant data from all_events_attended_participants.csv,
 * generates a PDF certificate for every participant-event entry using
 * public/templates/certificates (2).pdf template with precise text alignment,
 * and saves organized PDFs into output/generated_certificates/.
 */

import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const INPUT_CSV = path.resolve('all_events_attended_participants.csv');
const OUTPUT_DIR = path.resolve('output/generated_certificates');
const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');

// Template Paths (Prioritizes "certificates (2).pdf")
const TEMPLATE_PDF_PATHS = [
  path.resolve('public/templates/certificates (2).pdf'),
  path.resolve('public/certificates (2).pdf'),
  path.resolve('public/templates/certificates.pdf'),
  path.resolve('public/certificates.pdf')
];
const TEMPLATE_JPG_PATH = path.resolve('public/templates/Google.jpg');
const FONT_REGULAR_PATH = path.resolve('public/fonts/NotoSans-Regular.ttf');
const FONT_TAMIL_PATH = path.resolve('public/fonts/NotoSansTamil-Regular.ttf');

/**
 * Robust CSV parser handling quoted fields, commas, and line breaks
 */
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
  // Remove trailing registration numbers if appended to name (e.g. "Name 25BCE1447")
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

function hasTamilChars(text) {
  return /[\u0B80-\u0BFF]/.test(text);
}

async function generateAllCertificates() {
  console.log('=== Step 1: Certificate Generation Pipeline ===\n');

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

  // Flexible column mapping
  const eventTitleIdx = headers.findIndex(h => h.includes('event title') || h.includes('workshop title') || h.includes('event'));
  const eventDateIdx = headers.findIndex(h => h.includes('event date') || h.includes('date'));
  const nameIdx = headers.findIndex(h => h.includes('name'));
  const emailIdx = headers.findIndex(h => h.includes('email'));

  if (nameIdx === -1 || emailIdx === -1 || eventTitleIdx === -1) {
    console.error('Error: CSV must include "Name", "Email", and "Event Title" columns.');
    process.exit(1);
  }

  let templatePdfPath = TEMPLATE_PDF_PATHS.find(p => fs.existsSync(p));
  let templateJpgBytes = fs.existsSync(TEMPLATE_JPG_PATH) ? fs.readFileSync(TEMPLATE_JPG_PATH) : null;

  if (templatePdfPath) {
    console.log(`Using PDF Template: ${templatePdfPath}`);
  } else {
    console.log(`Using JPG Template: ${TEMPLATE_JPG_PATH}`);
  }

  const fontRegularBytes = fs.existsSync(FONT_REGULAR_PATH) ? fs.readFileSync(FONT_REGULAR_PATH) : null;
  const fontTamilBytes = fs.existsSync(FONT_TAMIL_PATH) ? fs.readFileSync(FONT_TAMIL_PATH) : null;

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const indexMap = {}; // email -> { name, email, certificates: [] }
  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const rawEventTitle = cols[eventTitleIdx] || 'Workshop';
    const rawName = cols[nameIdx] || '';
    const email = (cols[emailIdx] || '').toLowerCase().trim();
    const rawDate = eventDateIdx !== -1 ? cols[eventDateIdx] : '';

    if (!email || !email.includes('@') || !rawName) {
      console.warn(`[Row ${i + 1}] Skipped invalid row (missing name/email): ${cols.join(', ')}`);
      failCount++;
      continue;
    }

    const participantName = formatParticipantName(rawName);
    const eventTitle = rawEventTitle.trim();
    const dateStr = formatDate(rawDate);

    const safeEventFolder = sanitizeFilename(eventTitle);
    const safeParticipantName = sanitizeFilename(participantName);
    const safeEmail = sanitizeFilename(email);

    const eventFolder = path.join(OUTPUT_DIR, safeEventFolder);
    if (!fs.existsSync(eventFolder)) {
      fs.mkdirSync(eventFolder, { recursive: true });
    }

    const filename = `${safeEmail}_${safeParticipantName}.pdf`;
    const pdfPath = path.join(eventFolder, filename);

    try {
      let pdfDoc;
      let page;
      let width, height;

      if (templatePdfPath) {
        const templatePdfBytes = fs.readFileSync(templatePdfPath);
        pdfDoc = await PDFDocument.load(templatePdfBytes);
        page = pdfDoc.getPages()[0];
        const size = page.getSize();
        width = size.width;
        height = size.height;
      } else {
        pdfDoc = await PDFDocument.create();
        page = pdfDoc.addPage([841.89, 595.27]);
        width = 841.89;
        height = 595.27;

        if (templateJpgBytes) {
          const bgImg = await pdfDoc.embedJpg(templateJpgBytes);
          page.drawImage(bgImg, { x: 0, y: 0, width, height });
        }
      }

      pdfDoc.registerFontkit(fontkit);

      let customFontRegular = fontRegularBytes ? await pdfDoc.embedFont(fontRegularBytes) : null;
      let customFontTamil = fontTamilBytes ? await pdfDoc.embedFont(fontTamilBytes) : null;

      const nameFont = hasTamilChars(participantName) && customFontTamil ? customFontTamil : customFontRegular;
      const textFont = customFontRegular;

      // 1. Participant Name Line (Underline 1)
      const fontSizeName = participantName.length > 25 ? 24 : 31;
      const nameWidth = nameFont ? nameFont.widthOfTextAtSize(participantName, fontSizeName) : participantName.length * 13;
      page.drawText(participantName, {
        x: (width - nameWidth) / 2,
        y: 305,
        size: fontSizeName,
        font: nameFont || undefined,
        color: rgb(0.12, 0.12, 0.28),
      });

      // 2. Workshop Title / Event Name Line (Underline 2)
      const fontSizeEvent = eventTitle.length > 30 ? 13 : 15;
      const eventWidth = textFont ? textFont.widthOfTextAtSize(eventTitle, fontSizeEvent) : eventTitle.length * 7;
      const line2Center = 182.5;
      const eventX = Math.max(90, line2Center - (eventWidth / 2));
      page.drawText(eventTitle, {
        x: eventX,
        y: 245,
        size: fontSizeEvent,
        font: textFont || undefined,
        color: rgb(0.12, 0.12, 0.28),
      });

      // 3. Date Line (Underline 3)
      const fontSizeDate = 14;
      const dateWidth = textFont ? textFont.widthOfTextAtSize(dateStr, fontSizeDate) : dateStr.length * 7;
      const line3Center = 152.5;
      const dateX = Math.max(90, line3Center - (dateWidth / 2));
      page.drawText(dateStr, {
        x: dateX,
        y: 215,
        size: fontSizeDate,
        font: textFont || undefined,
        color: rgb(0.12, 0.12, 0.28),
      });

      const pdfBytes = await pdfDoc.save();
      fs.writeFileSync(pdfPath, pdfBytes);

      // Track recipient certificates for Script 2 grouping
      if (!indexMap[email]) {
        indexMap[email] = {
          name: participantName,
          email: email,
          certificates: []
        };
      }

      indexMap[email].certificates.push({
        eventTitle: eventTitle,
        pdfPath: pdfPath,
        filename: `${safeEventFolder} - ${safeParticipantName}.pdf`
      });

      successCount++;
      console.log(`[${i}/${rows.length - 1}] Generated -> [${eventTitle}] ${participantName} (${email})`);

    } catch (err) {
      console.error(`[Error] Failed generating certificate for ${participantName} (${email}):`, err);
      failCount++;
    }
  }

  // Write certificate index file
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexMap, null, 2), 'utf-8');

  console.log('\n=============================================');
  console.log(`Certificate Generation Summary:`);
  console.log(`- Total Certificates Generated: ${successCount}`);
  console.log(`- Unique Participants: ${Object.keys(indexMap).length}`);
  console.log(`- Failed / Skipped: ${failCount}`);
  console.log(`- Output Directory: ${OUTPUT_DIR}`);
  console.log(`- Certificate Index: ${INDEX_FILE}`);
  console.log('=============================================\n');
}

generateAllCertificates().catch(err => {
  console.error('Unhandled error during generation:', err);
  process.exit(1);
});
