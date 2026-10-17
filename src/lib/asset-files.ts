import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";

/** Files shipped in public/assets/, as site paths (e.g. "/assets/cover.jpg"), for the editor's "pick from assets" selects. */
export async function listAssetFiles(): Promise<string[]> {
  try {
    const files = await readdir(path.join(process.cwd(), "public", "assets"));
    return files.filter((f) => !f.startsWith(".")).sort().map((f) => `/assets/${encodeURIComponent(f)}`);
  } catch {
    return [];
  }
}
