import { IClient } from "../models/IClient";
import { IPurchaseOrder } from "../models/IPurchaseOrder";
import { IQuotation } from "../models/IQuotation";

export interface ITallySyncService {
  enqueueClient(client: IClient): Promise<void>;
  enqueuePurchaseOrder(po: IPurchaseOrder): Promise<void>;
  enqueueQuotation(quotation: IQuotation): Promise<void>;
}
