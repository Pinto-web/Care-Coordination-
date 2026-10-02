import { db } from "../../db/client.js";
import { careRelationships } from "../../db/schema.js";
import { and, eq } from "drizzle-orm";

export async function canAccessElderly(caregiverId: string, elderlyId: string): Promise<boolean> {
  const rel = await db.query.careRelationships.findFirst({
    where: and(eq(careRelationships.caregiverId, caregiverId), eq(careRelationships.elderlyId, elderlyId)),
  });
  return !!rel;
}

export async function getElderlyForCaregiver(caregiverId: string) {
  const rels = await db.query.careRelationships.findMany({
    where: eq(careRelationships.caregiverId, caregiverId),
    with: {
      elderly: true,
    },
  });
  return rels.map((r) => r.elderly).filter(Boolean);
}
