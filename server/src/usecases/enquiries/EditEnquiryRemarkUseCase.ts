import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { IEnquiry } from "../../interfaces/models/IEnquiry";
import { EditEnquiryRemarkDto } from "../../dtos/enquiryRemark.dto";
import { appendEnquiryActivity } from "../../utils/enquiryActivity";
import { remarkKey, updateRemarkText } from "../../utils/remarkEdit";

@injectable()
export class EditEnquiryRemarkUseCase
  implements
    IUseCase<
      { enquiryId: string; remarkKey: string; data: EditEnquiryRemarkDto; user: string },
      IEnquiry | null
    >
{
  constructor(@inject("EnquiryRepository") private _enquiryRepository: IEnquiryRepository) {}

  public async execute(params: {
    enquiryId: string;
    remarkKey: string;
    data: EditEnquiryRemarkDto;
    user: string;
  }): Promise<IEnquiry | null> {
    const enquiry = await this._enquiryRepository.findById(params.enquiryId);
    if (!enquiry) return null;

    const existing = (enquiry.remarks ?? []).map((r, i) => ({
      ...r,
      id: r.id ?? remarkKey(r, i),
    }));

    const remarks = updateRemarkText(existing, params.remarkKey, params.data.text);
    if (!remarks) return null;

    const activityLog = appendEnquiryActivity(
      enquiry.activityLog,
      "updated",
      "Remark edited",
      params.user || "Admin",
    );

    return await this._enquiryRepository.update(params.enquiryId, {
      remarks: remarks.map(({ id, user, date, text }) => ({ id, user, date, text })),
      activityLog,
    });
  }
}
