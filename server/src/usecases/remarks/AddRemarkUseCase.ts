import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IRemarkRepository } from "../../interfaces/repositories/IRemarkRepository";
import { IRemark, IRemarkAttachment } from "../../interfaces/models/IRemark";
import { AddRemarkDto } from "../../dtos/remark.dto";

export interface AddRemarkInput {
  data: AddRemarkDto;
  user: string;
  attachment?: IRemarkAttachment;
}

@injectable()
export class AddRemarkUseCase implements IUseCase<AddRemarkInput, IRemark> {
  constructor(
    @inject("RemarkRepository") private _remarkRepository: IRemarkRepository,
  ) {}

  public async execute(input: AddRemarkInput): Promise<IRemark> {
    const { data, user, attachment } = input;

    const remark = await this._remarkRepository.create({
      entityType: data.entityType,
      entityId: data.entityId,
      user,
      text: data.text.trim(),
      attachments: attachment ? [attachment] : [],
      parentRemarkId: data.parentRemarkId ?? null,
      date: new Date(),
    });

    return remark;
  }
}
