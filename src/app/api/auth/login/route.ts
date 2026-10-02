import { eq } from "drizzle-orm";
import { z } from "zod";
import { handle } from "@/lib/api";
import { HttpError, passcodeOk, setSession } from "@/lib/auth";
import { db, schema } from "@/db/client";

export const POST = handle(async (req: Request) => {
  const { email, passcode } = z.object({ email: z.string().email(), passcode: z.string().optional() }).parse(await req.json());
  const [u] = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase()));
  if (!u) throw new HttpError(404, "No account with that email");
  if (!passcodeOk(u.role, passcode)) throw new HttpError(403, "Passcode required for this account");
  await setSession({ uid: u.id, name: u.name, role: u.role });
  return { ok: true, role: u.role };
});
