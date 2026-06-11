import { MongoClient } from "mongodb";

const SOURCE_URI = "mongodb+srv://MIC:Gowreesh@mic.zxs8mbz.mongodb.net/Jitsi-Meet?retryWrites=true&w=majority";
const TARGET_URI = "mongodb+srv://MIC:Gowreesh@mic.zxs8mbz.mongodb.net/Jitsi-Meet-Test?retryWrites=true&w=majority";

async function main() {
  console.log("Connecting to source database...");
  const sourceClient = new MongoClient(SOURCE_URI);
  await sourceClient.connect();
  const sourceDb = sourceClient.db();
  const sourceEventsCol = sourceDb.collection("events");

  console.log("Fetching events from source...");
  const events = await sourceEventsCol.find({}).toArray();
  console.log(`Found ${events.length} events.`);

  if (events.length === 0) {
    console.log("No events found to migrate.");
    await sourceClient.close();
    return;
  }

  console.log("Connecting to target database...");
  const targetClient = new MongoClient(TARGET_URI);
  await targetClient.connect();
  const targetDb = targetClient.db();
  const targetEventsCol = targetDb.collection("events");

  console.log("Clearing target events collection...");
  await targetEventsCol.deleteMany({});

  console.log("Inserting events into target database...");
  const result = await targetEventsCol.insertMany(events);
  console.log(`Successfully migrated ${result.insertedCount} events.`);

  await sourceClient.close();
  await targetClient.close();
  console.log("Migration complete!");
}

main().catch((error) => {
  console.error("Migration failed:", error);
  process.exitCode = 1;
});
