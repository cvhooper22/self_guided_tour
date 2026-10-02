import { handle } from "@/lib/api";
import { clearSession } from "@/lib/auth";

export const POST = handle(async () => {
  await clearSession();
  return { ok: true };
});
