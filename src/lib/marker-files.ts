import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { MARKER_DIR, MARKER_FILE_RE, MARKER_IMAGE_RE } from "./markers";

/** Image paths (e.g. "/markers/lantern.png") currently shipped in public/markers/. */
export async function listMarkerImages(): Promise<string[]> {
  try {
    const files = await readdir(path.join(process.cwd(), "public", MARKER_DIR));
    return files.filter((f) => MARKER_FILE_RE.test(f)).map((f) => `${MARKER_DIR}/${f}`).filter((p) => MARKER_IMAGE_RE.test(p)).sort();
  } catch {
    return [];
  }
}
