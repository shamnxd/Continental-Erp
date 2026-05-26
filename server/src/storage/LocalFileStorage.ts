import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { IFileStorage, SaveFileInput, StoredFile } from "./IFileStorage";
import { env } from "../config/env";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export class LocalFileStorage implements IFileStorage {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = path.resolve(rootDir);
  }

  private resolveKey(folder: string, filename: string): string {
    return path.posix.join(folder.replace(/\\/g, "/"), filename);
  }

  public async save(input: SaveFileInput): Promise<StoredFile> {
    const safeName = `${randomUUID()}-${sanitizeFilename(input.originalName)}`;
    const key = this.resolveKey(input.folder, safeName);
    const destPath = path.join(this.rootDir, key);

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.rename(input.tempPath, destPath);

    const url = `${env.API_PUBLIC_URL}/uploads/${key.replace(/\\/g, "/")}`;

    return {
      key,
      url,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size,
    };
  }

  public async delete(key: string): Promise<void> {
    const filePath = path.join(this.rootDir, key);
    try {
      await fs.unlink(filePath);
    } catch {
      // ignore missing file
    }
  }
}
