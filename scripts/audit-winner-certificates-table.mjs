import fs from 'fs';
import path from 'path';

const INDEX_FILE = path.resolve('output/generated_winner_certificates/winner_certificates_index.json');

if (!fs.existsSync(INDEX_FILE)) {
  console.error('Index file missing!');
  process.exit(1);
}

const indexMap = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8'));

console.log('=== WINNER DATASET AUDIT & VERIFICATION ===\n');

const records = [];
let totalPdfs = 0;
let missingPdfs = 0;

for (const email of Object.keys(indexMap)) {
  const item = indexMap[email];
  for (const cert of item.certificates) {
    totalPdfs++;
    const exists = fs.existsSync(cert.pdfPath);
    if (!exists) missingPdfs++;
    records.push({
      email,
      name: item.name,
      eventTitle: cert.eventTitle,
      pdfPath: cert.pdfPath,
      exists
    });
  }
}

console.log(`Total Recipient Accounts: ${Object.keys(indexMap).length}`);
console.log(`Total Certificate PDFs: ${totalPdfs}`);
console.log(`Missing PDF Files: ${missingPdfs}\n`);

console.log(JSON.stringify(records, null, 2));
