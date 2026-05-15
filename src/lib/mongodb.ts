import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/microsoftinnovationsclub";
const options = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
  var _mongooseConnection: Promise<typeof mongoose> | undefined;
}

function getClientPromise() {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }

  return global._mongoClientPromise;
}

const clientPromise = {
  then<TResult1 = MongoClient, TResult2 = never>(
    onfulfilled?: ((value: MongoClient) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return getClientPromise().then(onfulfilled, onrejected);
  },
  catch<TResult = never>(onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null) {
    return getClientPromise().catch(onrejected);
  },
  finally(onfinally?: (() => void) | null) {
    return getClientPromise().finally(onfinally);
  },
  [Symbol.toStringTag]: "Promise",
} as Promise<MongoClient>;

export default clientPromise;

export async function connectToDatabase() {
  if (!process.env.MONGODB_URI && process.env.NODE_ENV === "production") {
    throw new Error("Missing MONGODB_URI environment variable");
  }

  if (mongoose.connection.readyState >= 1) {
    return mongoose;
  }

  global._mongooseConnection = global._mongooseConnection ?? mongoose.connect(uri);
  return global._mongooseConnection;
}
