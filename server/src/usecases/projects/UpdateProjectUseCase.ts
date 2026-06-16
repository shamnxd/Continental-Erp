import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IProjectRepository } from "../../interfaces/repositories/IProjectRepository";
import { IQuotationRepository } from "../../interfaces/repositories/IQuotationRepository";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { UpdateProjectDto } from "../../dtos/project.dto";
import { IProject } from "../../interfaces/models/IProject";

@injectable()
export class UpdateProjectUseCase implements IUseCase<{ id: string; data: UpdateProjectDto }, IProject | null> {
  constructor(
    @inject("ProjectRepository") private _projectRepository: IProjectRepository,
    @inject("QuotationRepository") private _quotationRepository: IQuotationRepository,
    @inject("EnquiryRepository") private _enquiryRepository: IEnquiryRepository
  ) {}

  public async execute(params: { id: string; data: UpdateProjectDto }): Promise<IProject | null> {
    const updatedProject = await this._projectRepository.update(params.id, params.data as any);

    if (updatedProject && params.data.status === "Completed" && updatedProject.quotationRef) {
      try {
        const quotation = await this._quotationRepository.findById(updatedProject.quotationRef);
        if (quotation && quotation.enquiryId) {
          await this._enquiryRepository.update(quotation.enquiryId, {
            status: "Closed" as any
          });
        }
      } catch (err) {
        console.error("Failed to automatically close enquiry upon project completion:", err);
      }
    }

    return updatedProject;
  }
}
