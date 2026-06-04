import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IClientInvoice } from "../../interfaces/models/IClientInvoice";
import { IClientInvoiceRepository } from "../../interfaces/repositories/IClientInvoiceRepository";

@injectable()
export class GetClientInvoicesUseCase implements IUseCase<void, IClientInvoice[]> {
  constructor(
    @inject("ClientInvoiceRepository")
    private _invoiceRepository: IClientInvoiceRepository
  ) {}

  public async execute(): Promise<IClientInvoice[]> {
    return await this._invoiceRepository.findAll();
  }
}
