import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Template Paths
const TEMPLATE_PDF_PATHS = [
  path.resolve('public/templates/certificates (2).pdf'),
  path.resolve('public/certificates (2).pdf'),
  path.resolve('public/templates/certificates.pdf'),
  path.resolve('public/certificates.pdf')
];
const FONT_REGULAR_PATH = path.resolve('public/fonts/NotoSans-Regular.ttf');
const OUTPUT_DIR = path.resolve('output');
const INDEX_FILE = path.resolve('output/generated_certificates/certificates_index.json');

/**
 * Add or edit test participants here!
 * - If a participant has multiple entries, each event generates a SEPARATE certificate PDF.
 * - Script 2 automatically groups all certificates for the same email and sends ONE single email containing all PDFs.
 */
const TEST_DATA = [
  {
    name: 'Sri Saidhakshini',
    email: 'srisaidhakshiniv@gmail.com',
    workshopTitle: 'Full Stack Blitz',
    date: '22/7/2026'
  },
  {
    name: 'Sri Saidhakshini',
    email: 'srisaidhakshiniv@gmail.com',
    workshopTitle: 'Ethical Hacking Lab',
    date: '23/7/2026'
  },
  {
    name: 'Gowreesh V T',
    email: 'vt.gowreesh43@gmail.com',
    workshopTitle: 'AI UI Sprint',
    date: '24/7/2026'
  },
  {
    name: 'Gowreesh V T',
    email: 'vt.gowreesh43@gmail.com',
    workshopTitle: 'Full Stack Blitz',
    date: '25/7/2026'
  }
];

function sanitizeFilename(name) {
  return name.replace(/[/\\?%*:|"<>]/g, '_').replace(/\s+/g, ' ').trim();
}

async function createTestCertificates() {
  console.log(`=== Creating ${TEST_DATA.length} Test Certificate(s) ===\n`);

  let templatePath = TEMPLATE_PDF_PATHS.find(p => fs.existsSync(p));
  if (!templatePath) {
    console.error(`Error: Certificate template PDF not found!`);
    process.exit(1);
  }

  console.log(`Using Template: ${templatePath}`);
  const templateBytes = fs.readFileSync(templatePath);

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const certDir = path.dirname(INDEX_FILE);
  if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

  const indexMap = {};

  for (let i = 0; i < TEST_DATA.length; i++) {
    const item = TEST_DATA[i];
    const name = item.name || 'Participant';
    const email = item.email || '';
    const workshopTitle = item.workshopTitle || item.WorkshopTitle || 'Workshop';
    const date = item.date || '22/7/2026';

    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);

    let fontRegular = null;
    if (fs.existsSync(FONT_REGULAR_PATH)) {
      fontRegular = await pdfDoc.embedFont(fs.readFileSync(FONT_REGULAR_PATH));
    }

    const firstPage = pdfDoc.getPages()[0];
    const { width } = firstPage.getSize();

    // 1. Participant Name (Underline 1)
    const fontSizeName = name.length > 25 ? 24 : 31;
    const nameWidth = fontRegular ? fontRegular.widthOfTextAtSize(name, fontSizeName) : name.length * 13;
    firstPage.drawText(name, {
      x: (width - nameWidth) / 2,
      y: 305,
      size: fontSizeName,
      font: fontRegular || undefined,
      color: rgb(0.12, 0.12, 0.28),
    });

    // 2. Workshop Title / Event Name (Underline 2)
    const fontSizeEvent = workshopTitle.length > 30 ? 13 : 15;
    const eventWidth = fontRegular ? fontRegular.widthOfTextAtSize(workshopTitle, fontSizeEvent) : workshopTitle.length * 7;
    const line2Center = 182.5;
    const eventX = Math.max(90, line2Center - (eventWidth / 2));
    firstPage.drawText(workshopTitle, {
      x: eventX,
      y: 245,
      size: fontSizeEvent,
      font: fontRegular || undefined,
      color: rgb(0.12, 0.12, 0.28),
    });

    // 3. Date (Underline 3)
    const fontSizeDate = 14;
    const dateWidth = fontRegular ? fontRegular.widthOfTextAtSize(date, fontSizeDate) : date.length * 7;
    const line3Center = 152.5;
    const dateX = Math.max(90, line3Center - (dateWidth / 2));
    firstPage.drawText(date, {
      x: dateX,
      y: 215,
      size: fontSizeDate,
      font: fontRegular || undefined,
      color: rgb(0.12, 0.12, 0.28),
    });

    const safeTitle = sanitizeFilename(workshopTitle);
    const safeName = sanitizeFilename(name);
    const safeEmail = sanitizeFilename(email.toLowerCase());

    const pdfBytes = await pdfDoc.save();
    const outputPath = path.join(OUTPUT_DIR, `test_${safeEmail}_${safeTitle}.pdf`);
    fs.writeFileSync(outputPath, pdfBytes);

    const emailKey = email.toLowerCase();
    if (!indexMap[emailKey]) {
      indexMap[emailKey] = {
        name: name,
        email: emailKey,
        certificates: []
      };
    }

    indexMap[emailKey].certificates.push({
      eventTitle: workshopTitle,
      pdfPath: outputPath,
      filename: `${safeTitle} - ${safeName}.pdf`
    });

    console.log(`[${i + 1}/${TEST_DATA.length}] Generated PDF: ${outputPath}`);
  }

  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexMap, null, 2), 'utf-8');

  console.log(`\n✓ Updated test certificate index: ${INDEX_FILE}`);
  console.log(`- Unique Recipients: ${Object.keys(indexMap).length}`);
  for (const [e, info] of Object.entries(indexMap)) {
    console.log(`  • ${info.name} (${e}): ${info.certificates.length} certificate(s)`);
  }
  console.log('\nRun Script 2 to dispatch emails with all grouped certificates attached!\n');
}

createTestCertificates().catch(err => {
  console.error('Error generating test certificates:', err);
  process.exit(1);
});
