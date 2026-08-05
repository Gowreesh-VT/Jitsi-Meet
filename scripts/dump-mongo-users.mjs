import { MongoClient } from 'mongodb';

async function dumpMongo() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);
  await client.connect();

  const dbs = await client.db().admin().listDatabases();
  console.log('Databases:', dbs.databases);

  for (const dbInfo of dbs.databases) {
    if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;
    const db = client.db(dbInfo.name);
    const collections = await db.listCollections().toArray();
    console.log(`\n=== Database: ${dbInfo.name} ===`);
    for (const c of collections) {
      const col = db.collection(c.name);
      const count = await col.countDocuments();
      console.log(`  Collection: ${c.name} (${count} docs)`);
      const sample = await col.find({}).limit(100).toArray();
      sample.forEach(doc => {
        const docStr = JSON.stringify(doc);
        if (/aryaman|kopathy|cyber|crab|cook|vishal|kivin/i.test(docStr)) {
          console.log(`    MATCH in [${c.name}]:`, docStr);
        }
      });
    }
  }

  await client.close();
}

dumpMongo().catch(console.error);
