import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

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

async function searchMongo() {
  loadEnv();
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/microsoftinnovationsclub';
  console.log(`Connecting to Mongo at ${uri}...`);

  const client = new MongoClient(uri);
  await client.connect();
  console.log('Connected to MongoDB!\n');

  const dbs = await client.db().admin().listDatabases();
  console.log('Available Databases:', dbs.databases.map(d => d.name));

  const dbNamesToSearch = ['microsoftinnovationsclub', ...dbs.databases.map(d => d.name).filter(n => !['admin', 'config', 'local'].includes(n))];

  const queries = [
    { label: 'Aryaman', regex: /aryaman/i },
    { label: 'Kopathy', regex: /kopathy/i },
    { label: 'Cybercooks', regex: /cyber\s*cook/i },
    { label: 'Big Crabs', regex: /big\s*crab/i }
  ];

  for (const dbName of new Set(dbNamesToSearch)) {
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    console.log(`\nSearching Database [${dbName}] (${collections.length} collections)...`);

    for (const colInfo of collections) {
      const col = db.collection(colInfo.name);
      for (const q of queries) {
        // Search in string fields
        const docs = await col.find({
          $or: [
            { name: q.regex },
            { email: q.regex },
            { teamName: q.regex },
            { "team.name": q.regex },
            { "team.members": q.regex },
            { "members.name": q.regex },
            { "members.email": q.regex },
            { eventTitle: q.regex },
            { registrationNumber: q.regex }
          ]
        }).toArray();

        if (docs.length > 0) {
          console.log(`  ✓ Found ${docs.length} match(es) for "${q.label}" in collection [${colInfo.name}]:`);
          docs.forEach(doc => {
            console.log(`    - ID: ${doc._id}`);
            console.log(`      Fields:`, JSON.stringify(doc, null, 2));
          });
        }
      }
    }
  }

  await client.close();
  console.log('\nSearch completed.');
}

searchMongo().catch(err => {
  console.error('Mongo search error:', err);
  process.exit(1);
});
