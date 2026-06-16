import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IMinorJobRepository } from "../../interfaces/repositories/IMinorJobRepository";
import { IQuotationRepository } from "../../interfaces/repositories/IQuotationRepository";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { UpdateMinorJobDto } from "../../dtos/minorJob.dto";
import { IMinorJob } from "../../interfaces/models/IMinorJob";

@injectable()
export class UpdateMinorJobUseCase implements IUseCase<{ id: string; data: UpdateMinorJobDto }, IMinorJob | null> {
  constructor(
    @inject("MinorJobRepository") private _minorJobRepository: IMinorJobRepository,
    @inject("QuotationRepository") private _quotationRepository: IQuotationRepository,
    @inject("EnquiryRepository") private _enquiryRepository: IEnquiryRepository
  ) {}

  public async execute(params: { id: string; data: UpdateMinorJobDto }): Promise<IMinorJob | null> {
    const updatedJob = await this._minorJobRepository.update(params.id, params.data as any);

    if (updatedJob && params.data.status === "Completed" && updatedJob.quotationRef) {
      try {
        const quotation = await this._quotationRepository.findById(updatedJob.quotationRef);
        if (quotation && quotation.enquiryId) {
          await this._enquiryRepository.update(quotation.enquiryId, {
            status: "Closed" as any
          });
        }
      } catch (err) {
        console.error("Failed to automatically close enquiry upon minor job completion:", err);
      }
    }

    return updatedJob;
  }
}
