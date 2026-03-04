import { MongoClient, type Collection, type Db, type Document } from "mongodb";

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const defaultDbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error("MONGODB_URI is not set in environment variables.");
}

if (!defaultDbName) {
  throw new Error("MONGODB_DB is not set in environment variables.");
}

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export async function getDb(dbName?: string): Promise<Db> {
  const cli = await clientPromise;
  return cli.db(dbName ?? defaultDbName);
}

export async function getInterviewCollection<TSchema extends Document = Document>(): Promise<
  Collection<TSchema>
> {
  const db = await getDb();
  return db.collection<TSchema>("interview");
}

