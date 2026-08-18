import path from "node:path";

export const UPLOAD_ROOT = path.join(process.cwd(), "uploads");

export function projectUploadDir(projectId: string) {
  return path.join(UPLOAD_ROOT, projectId);
}
