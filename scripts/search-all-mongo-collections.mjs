import { MongoClient } from 'mongodb';

async function queryAllMongo() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);
  await client.connect();

  const dbs = await client.db().admin().listDatabases();
  console.log('Available MongoDB Databases:', dbs.databases.map(d => d.name));

  for (const dbInfo of dbs.databases) {
    if (['admin', 'config', 'local'].includes(dbInfo.name)) continue;
    const db = client.db(dbInfo.name);
    const collections = await db.listCollections().toArray();
    console.log(`\n========================================`);
    console.log(`DATABASE: ${dbInfo.name} (${collections.length} collections)`);
    console.log(`========================================`);

    for (const colInfo of collections) {
      const col = db.collection(colInfo.name);
      const docs = await col.find({}).toArray();
      console.log(`\nCollection: [${colInfo.name}] — ${docs.length} documents`);

      docs.forEach((doc, idx) => {
        const docStr = JSON.stringify(doc, null, 2);
        console.log(`  --- Document #${idx + 1} ---`);
        console.log(docStr);
      });
    }
  }

  await client.close();
}

queryAllMongo().catch(console.error);
