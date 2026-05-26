import { IFileStorage, SaveFileInput, StoredFile } from "./IFileStorage";

/**
 * Placeholder for AWS S3 (or compatible) storage.
 * Set FILE_STORAGE_PROVIDER=s3 and implement using @aws-sdk/client-s3.
 *
 * Example shape:
 *   const client = new S3Client({ region: env.AWS_REGION });
 *   await client.send(new PutObjectCommand({ Bucket, Key: key, Body: stream }));
 *   return { key, url: `https://${bucket}.s3.amazonaws.com/${key}`, ... };
 */
export class S3FileStorage implements IFileStorage {
  public async save(_input: SaveFileInput): Promise<StoredFile> {
    throw new Error(
      "S3 storage is not configured. Set FILE_STORAGE_PROVIDER=local or implement S3FileStorage.",
    );
  }

  public async delete(_key: string): Promise<void> {
    throw new Error("S3 storage is not configured.");
  }
}
