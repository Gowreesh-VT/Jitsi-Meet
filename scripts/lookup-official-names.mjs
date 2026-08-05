import fs from 'fs';
import path from 'path';

const csvPath = path.resolve('all_events_all_registrations.csv');
const content = fs.readFileSync(csvPath, 'utf-8');
const lines = content.split(/\r?\n/);

const emailToName = {};

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Simple CSV line parser handling quotes
  const matches = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g);
  if (!matches || matches.length < 2) continue;

  const rawName = matches[0].replace(/^"|"$/g, '').trim();
  const rawEmail = matches[1].replace(/^"|"$/g, '').trim().toLowerCase();

  if (rawEmail && !emailToName[rawEmail]) {
    // Clean name: e.g. "Siddharth Arumugam 25BCE1234" -> "Siddharth Arumugam"
    const cleanedName = rawName.replace(/\s+[0-9A-Z]{7,12}$/i, '').trim();
    emailToName[rawEmail] = cleanedName;
  }
}

const winnersList = [
  // Hackathons
  { event: 'Vibeathon', rank: 1, email: 'sharann.m2024@vitstudent.ac.in', tempName: 'Sharan M' },
  { event: 'Vibeathon', rank: 2, email: 'dhriti.vaz2024@vitstudent.ac.in', tempName: 'Dhiriti Vaz' },
  { event: 'Vibeathon', rank: 3, email: 'anish.mani2025@vitstudent.ac.in', tempName: 'Anish Prakash' },
  { event: 'Arcnight', rank: 1, email: 'lokithk93@gmail.com', tempName: 'Lokith K' },
  { event: 'Arcnight', rank: 1, email: 'abdullahmustafa1608@gmail.com', tempName: 'Abdullah Mustafa' },
  { event: 'Arcnight', rank: 1, email: 'sanjay.k.sundararajan@gmail.com', tempName: 'Sanjay K Sundararajan' },
  { event: 'Arcnight', rank: 2, email: 'kivinprasanna.r2025@vitstudent.ac.in', tempName: 'Kivin Prasanna R' },
  { event: 'Arcnight', rank: 2, email: 'yokash.h2025@vitstudent.ac.in', tempName: 'Yokash H' },
  { event: 'Arcnight', rank: 2, email: 'yashwantgokul.p2025@vitstudent.ac.in', tempName: 'Yashwant Gokul P' },
  { event: 'Arcnight', rank: 3, email: 'vishal.p2024@vitstudent.ac.in', tempName: 'Vishal P' },
  { event: 'Arcnight', rank: 3, email: 'shaileshhawale004@gmail.com', tempName: 'Shailesh Hawale' },

  // Contests & Sprints
  { event: 'CTF Contest 1', rank: 1, email: 'michelle.elvin2024@vitstudent.ac.in', tempName: 'Michelle Elvin' },
  { event: 'CTF Contest 1', rank: 2, email: 'anantupadhyay144@gmail.com', tempName: 'Anant Upadhyay' },
  { event: 'CTF Contest 1', rank: 3, email: 'sreeansh.dash2024@vitstudent.ac.in', tempName: 'Sreeansh Dash' },
  { event: 'CTF Contest 2', rank: 1, email: 'aryan.pillai2024@vitstudent.ac.in', tempName: 'Aryan Pillai' },
  { event: 'CTF Contest 2', rank: 2, email: 'siddharth.sameer2024@vitstudent.ac.in', tempName: 'Siddharth Sameer' },
  { event: 'CTF Contest 2', rank: 3, email: 'ajay.n2025@vitstudent.ac.in', tempName: 'Ajay N' },
  { event: 'Cybersecurity CTF', rank: 1, email: '0xmrnight@gmail.com', tempName: 'Siddharth Arumugam' },
  { event: 'Cybersecurity CTF', rank: 2, email: 'rohan.1252030019@vit.edu', tempName: 'Rohan Kokatare' },
  { event: 'Cybersecurity CTF', rank: 3, email: 'yashwantgokul.p2025@vitstudent.ac.in', tempName: 'Yashwant Gokul P' },
  { event: 'Design.Break.Fix', rank: 1, email: 'muthusahana.m2024@vitstudent.ac.in', tempName: 'M Muthu Sahana' },
  { event: 'Design.Break.Fix', rank: 2, email: 'aadi.verma2024@vitstudent.ac.in', tempName: 'Aadi Verma' },
  { event: 'Design.Break.Fix', rank: 3, email: 'santosh.m2024@vitstudent.ac.in', tempName: 'Santosh M' },
  { event: 'AI UI Sprint', rank: 1, email: 'amandeep.kujur2024@vitstudent.ac.in', tempName: 'Amandeep Kujur' },
  { event: 'AI UI Sprint', rank: 2, email: 'safa.sabreen2024@vitstudent.ac.in', tempName: 'Safa Sabreen' },
  { event: 'AI UI Sprint', rank: 3, email: 'swashiga.s2024@vitstudent.ac.in', tempName: 'Swashiga S' },
  { event: 'AI UI Sprint', rank: 3, email: 'kavin.s2024@vitstudent.ac.in', tempName: 'Kavin S' },
  { event: 'Full-Stack Blitz', rank: 1, email: 'aritra.naskar2024@vitstudent.ac.in', tempName: 'Aritra Naskar' },
  { event: 'Full-Stack Blitz', rank: 2, email: 'shruti.jori2024@vitstudent.ac.in', tempName: 'Shruti Jori' },
  { event: 'Full-Stack Blitz', rank: 2, email: 'swayam.sreetam2024@vitstudent.ac.in', tempName: 'Swayam Sreetam Das' },
  { event: 'Full-Stack Blitz', rank: 3, email: 'derek.jeremy2024@vitstudent.ac.in', tempName: 'Derek Jeremy Winkins' },
  { event: 'Full-Stack Blitz', rank: 3, email: 'prodhosh.vs2024@vitstudent.ac.in', tempName: 'Prodhosh VS' }
];

console.log('=== OFFICIAL NAME LOOKUP FROM REGISTRATION DATABASE ===\n');

const updatedWinners = [];

for (const w of winnersList) {
  const officialName = emailToName[w.email.toLowerCase()] || w.tempName;
  console.log(`- ${w.event} [Rank ${w.rank}]: "${w.tempName}" -> Official DB Name: "${officialName}" (${w.email})`);
  updatedWinners.push({
    ...w,
    officialName
  });
}

fs.writeFileSync('output/official_winner_names.json', JSON.stringify(updatedWinners, null, 2), 'utf-8');
console.log('\nSaved updated mapping to output/official_winner_names.json');
