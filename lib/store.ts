import { promises as fs } from "fs";
import path from "path";
import { Content, normalize } from "./content";

const FILE = path.join(process.cwd(), "data", "content.json");
export const UPLOAD_DIR = path.join(process.cwd(), "uploads");

export async function getContent(): Promise<Content> {
  return normalize(JSON.parse(await fs.readFile(FILE, "utf8")));
}

export async function saveContent(input: unknown): Promise<Content> {
  const content = normalize(input);
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(content, null, 2));
  await fs.rename(tmp, FILE); // atomic replace
  return content;
}
