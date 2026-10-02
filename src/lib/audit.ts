import { db, schema } from "@/db/client";
import type { Session } from "./auth";

export async function audit(s: Session | null, action: string, entity: string, entityId?: string, details?: Record<string, unknown>) {
  await db.insert(schema.auditLog).values({
    actorId: s?.adminId ?? s?.uid ?? null,
    action,
    entity,
    entityId: entityId ?? null,
    details: s?.adminId ? { ...details, viewingAs: s.uid } : (details ?? null),
  });
}
