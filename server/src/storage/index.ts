import path from "path";
import { IFileStorage } from "./IFileStorage";
import { LocalFileStorage } from "./LocalFileStorage";
import { S3FileStorage } from "./S3FileStorage";
import { env } from "../config/env";

let storageInstance: IFileStorage | null = null;

export function getFileStorage(): IFileStorage {
  if (storageInstance) return storageInstance;

  if (env.FILE_STORAGE_PROVIDER === "s3") {
    storageInstance = new S3FileStorage();
  } else {
    storageInstance = new LocalFileStorage(path.resolve(env.UPLOAD_DIR));
  }

  return storageInstance;
}

export type { IFileStorage, StoredFile, SaveFileInput } from "./IFileStorage";
