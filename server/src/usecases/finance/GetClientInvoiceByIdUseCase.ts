import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IClientInvoice } from "../../interfaces/models/IClientInvoice";
import { IClientInvoiceRepository } from "../../interfaces/repositories/IClientInvoiceRepository";

@injectable()
export class GetClientInvoiceByIdUseCase implements IUseCase<string, IClientInvoice | null> {
  constructor(
    @inject("ClientInvoiceRepository")
    private _invoiceRepository: IClientInvoiceRepository
  ) {}

  public async execute(invoiceId: string): Promise<IClientInvoice | null> {
    return await this._invoiceRepository.findById(invoiceId);
  }
}
