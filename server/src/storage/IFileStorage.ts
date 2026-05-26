/** Result of persisting an uploaded file — provider-agnostic. */
export interface StoredFile {
  /** Storage key (local path segment or S3 object key). */
  key: string;
  /** Public or app-served URL clients use to download the file. */
  url: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface SaveFileInput {
  /** Temp path from multer (disk storage). */
  tempPath: string;
  originalName: string;
  mimeType: string;
  size: number;
  /** Logical folder, e.g. `enquiries/{enquiryId}`. */
  folder: string;
}

/**
 * Abstraction over file storage. Swap `local` → `s3` via FILE_STORAGE_PROVIDER.
 * Register implementations in storage/index.ts.
 */
export interface IFileStorage {
  save(input: SaveFileInput): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}
