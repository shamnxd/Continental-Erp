import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IVendorBill } from "../../interfaces/models/IVendorBill";
import { IVendorBillRepository } from "../../interfaces/repositories/IVendorBillRepository";

@injectable()
export class GetVendorBillsUseCase implements IUseCase<void, IVendorBill[]> {
  constructor(
    @inject("VendorBillRepository")
    private _billRepository: IVendorBillRepository
  ) {}

  public async execute(): Promise<IVendorBill[]> {
    return await this._billRepository.findAll();
  }
}
