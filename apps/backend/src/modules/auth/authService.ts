import crypto from "crypto";
import { db } from "../../db/client.js";
import { users, elderlyProfiles, careRelationships } from "../../db/schema.js";
import { eq, and } from "drizzle-orm";
import { logger } from "../../logger.js";

const DEFAULT_CAREGIVER_EMAIL = "caregiver@example.com";
const DEFAULT_CAREGIVER_PASSWORD = "password123";
const DEFAULT_CAREGIVER_NAME = "Caregiver Demo";
const DEFAULT_ELDERLY_NAME = "Elderly Demo";

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, hash] = stored.split(":");
    if (!salt || !hash) return false;
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash));
  } catch {
    return false;
  }
}

export async function ensureSeeded() {
  let caregiver = await db.query.users.findFirst({
    where: eq(users.email, DEFAULT_CAREGIVER_EMAIL),
  });

  if (!caregiver) {
    const [created] = await db
      .insert(users)
      .values({
        role: "CAREGIVER",
        fullName: DEFAULT_CAREGIVER_NAME,
        email: DEFAULT_CAREGIVER_EMAIL,
        passwordHash: hashPassword(DEFAULT_CAREGIVER_PASSWORD),
      })
      .returning();
    caregiver = created;
    logger.info({ caregiverId: caregiver.id }, "Seeded caregiver user");
  }

  let elderly = await db.query.users.findFirst({
    where: and(eq(users.role, "ELDERLY"), eq(users.fullName, DEFAULT_ELDERLY_NAME)),
  });

  if (!elderly) {
    const [createdE] = await db
      .insert(users)
      .values({
        role: "ELDERLY",
        fullName: DEFAULT_ELDERLY_NAME,
        createdBy: caregiver.id,
      })
      .returning();
    elderly = createdE;
    await db
      .insert(elderlyProfiles)
      .values({
        userId: elderly.id,
        timezone: "Asia/Kolkata",
      })
      .onConflictDoNothing();
    logger.info({ elderlyId: elderly.id }, "Seeded elderly user");
  } else {
    await db
      .insert(elderlyProfiles)
      .values({
        userId: elderly.id,
        timezone: "Asia/Kolkata",
      })
      .onConflictDoNothing();
  }

  const rel = await db.query.careRelationships.findFirst({
    where: and(eq(careRelationships.caregiverId, caregiver.id), eq(careRelationships.elderlyId, elderly.id)),
  });
  if (!rel) {
    await db.insert(careRelationships).values({
      caregiverId: caregiver.id,
      elderlyId: elderly.id,
      isPrimary: true,
    });
    logger.info({ caregiverId: caregiver.id, elderlyId: elderly.id }, "Seeded care relationship");
  }

  return { caregiver, elderly };
}

export async function verifyCaregiverCredentials(email: string, password: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user || user.role !== "CAREGIVER" || !user.passwordHash) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return user;
}
