import { getDb } from "@/lib/mongodb";

export type InviteLinkDoc = {
  name: string;
  code: string;
  index: 1 | 2 | 3;
  createdAt: Date;
  updatedAt: Date;
};

const COLLECTION = "invite_links";
const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 22;

function randomCode(length = CODE_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export async function findInviteByCode(code: string): Promise<InviteLinkDoc | null> {
  const db = await getDb();
  const collection = db.collection<InviteLinkDoc>(COLLECTION);
  return collection.findOne({ code });
}

export async function createInviteLink(
  name: string,
  index: 1 | 2 | 3
): Promise<InviteLinkDoc> {
  const db = await getDb();
  const collection = db.collection<InviteLinkDoc>(COLLECTION);
  await collection.createIndex({ code: 1 }, { unique: true });

  const now = new Date();

  // Retry a few times in case of a rare code collision.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode();
    const doc: InviteLinkDoc = {
      name,
      code,
      index,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await collection.insertOne(doc);
      return doc;
    } catch (error: any) {
      if (error?.code === 11000) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to generate a unique invite code.");
}

