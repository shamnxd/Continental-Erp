import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { IEnquiry, IEnquiryDrawing } from "../../interfaces/models/IEnquiry";
import { getFileStorage, StoredFile } from "../../storage";
import { appendEnquiryActivity } from "../../utils/enquiryActivity";

export interface AddEnquiryDrawingInput {
  enquiryId: string;
  storedFile: StoredFile;
  user: string;
}

@injectable()
export class AddEnquiryDrawingUseCase implements IUseCase<AddEnquiryDrawingInput, IEnquiry | null> {
  constructor(@inject("EnquiryRepository") private _enquiryRepository: IEnquiryRepository) {}

  public async execute(input: AddEnquiryDrawingInput): Promise<IEnquiry | null> {
    const enquiry = await this._enquiryRepository.findById(input.enquiryId);
    if (!enquiry) return null;

    const drawing: IEnquiryDrawing = {
      name: input.storedFile.originalName,
      storageKey: input.storedFile.key,
      url: input.storedFile.url,
      mimeType: input.storedFile.mimeType,
      size: input.storedFile.size,
      uploadDate: new Date(),
      uploadedBy: input.user || "Admin",
    };

    const drawings = [...(enquiry.drawings ?? []), drawing];
    const activityLog = appendEnquiryActivity(
      enquiry.activityLog,
      "file_uploaded",
      `Uploaded document: ${drawing.name}`,
      input.user || "Admin",
    );

    return await this._enquiryRepository.update(input.enquiryId, { drawings, activityLog });
  }
}

/** Persists multer temp file via configured storage provider. */
export async function persistUploadedFile(
  file: Express.Multer.File,
  folder: string,
): Promise<StoredFile> {
  const storage = getFileStorage();
  return storage.save({
    tempPath: file.path,
    originalName: file.originalname,
    mimeType: file.mimetype || "application/octet-stream",
    size: file.size,
    folder,
  });
}
