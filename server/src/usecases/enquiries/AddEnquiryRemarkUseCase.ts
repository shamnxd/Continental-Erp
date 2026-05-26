import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { IEnquiry } from "../../interfaces/models/IEnquiry";
import { AddEnquiryRemarkDto } from "../../dtos/enquiryRemark.dto";
import { appendEnquiryActivity } from "../../utils/enquiryActivity";

@injectable()
export class AddEnquiryRemarkUseCase
  implements IUseCase<{ enquiryId: string; data: AddEnquiryRemarkDto; user: string }, IEnquiry | null>
{
  constructor(@inject("EnquiryRepository") private _enquiryRepository: IEnquiryRepository) {}

  public async execute(params: {
    enquiryId: string;
    data: AddEnquiryRemarkDto;
    user: string;
  }): Promise<IEnquiry | null> {
    const enquiry = await this._enquiryRepository.findById(params.enquiryId);
    if (!enquiry) return null;

    const text = params.data.text.trim();
    const remarks = [
      ...(enquiry.remarks ?? []),
      {
        user: params.user || "Admin",
        date: new Date(),
        text,
      },
    ];

    const preview = text.length > 60 ? `${text.slice(0, 60)}…` : text;
    const activityLog = appendEnquiryActivity(
      enquiry.activityLog,
      "remark_added",
      `Remark added: ${preview}`,
      params.user || "Admin",
    );

    return await this._enquiryRepository.update(params.enquiryId, { remarks, activityLog });
  }
}
