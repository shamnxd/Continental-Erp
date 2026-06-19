import { injectable } from "tsyringe";
import { ITallySyncService } from "../interfaces/services/ITallySyncService";
import { IClient } from "../interfaces/models/IClient";
import { IPurchaseOrder } from "../interfaces/models/IPurchaseOrder";
import { IQuotation } from "../interfaces/models/IQuotation";
import { TallySyncQueueModel } from "../models/TallySyncQueue";
import { processPendingQueue } from "../config/tallySocket";
import { Logger } from "../utils/logger";

@injectable()
export class TallySyncService implements ITallySyncService {

  public async enqueueClient(client: IClient): Promise<void> {
    try {
      if (!client.id) {
        Logger.warn("[TallySyncService] Cannot enqueue client: Client lacks ID.");
        return;
      }

      const payload = {
        companyName: client.companyName,
        contactPerson: client.contactPerson,
        phone: client.phone,
        email: client.email,
        gst: client.gst || "",
        city: client.city,
        address: client.address || "",
        parentCompany: client.parentCompany || ""
      };

      // Check if there's already a pending or processing item for this client in the queue
      const existing = await TallySyncQueueModel.findOne({
        entityType: "Client",
        entityId: client.id,
        status: { $in: ["Pending", "Processing"] }
      });

      if (existing) {
        // Update the payload of the existing pending item
        existing.payload = payload;
        await existing.save();
        Logger.info(`[TallySyncService] Updated existing queue item for Client: ${client.companyName}`);
      } else {
        // Create new queue item
        await TallySyncQueueModel.create({
          entityType: "Client",
          entityId: client.id,
          payload,
          status: "Pending",
          attempts: 0
        });
        Logger.info(`[TallySyncService] Enqueued Client: ${client.companyName}`);
      }

      // Notify websocket broker
      processPendingQueue();
    } catch (error) {
      Logger.error("[TallySyncService] Error enqueuing Client", error);
    }
  }

  public async enqueuePurchaseOrder(po: IPurchaseOrder): Promise<void> {
    try {
      if (!po.id) {
        Logger.warn("[TallySyncService] Cannot enqueue PO: PO lacks ID.");
        return;
      }

      const payload = {
        poNo: po.poNo,
        vendorName: po.vendorName,
        amount: po.amount,
        items: po.items.map(i => ({
          description: i.description,
          qty: i.qty,
          rate: i.rate,
          total: i.total
        })),
        date: po.createdAt || new Date()
      };

      const existing = await TallySyncQueueModel.findOne({
        entityType: "PurchaseOrder",
        entityId: po.id,
        status: { $in: ["Pending", "Processing"] }
      });

      if (existing) {
        existing.payload = payload;
        await existing.save();
        Logger.info(`[TallySyncService] Updated existing queue item for PO: ${po.poNo}`);
      } else {
        await TallySyncQueueModel.create({
          entityType: "PurchaseOrder",
          entityId: po.id,
          payload,
          status: "Pending",
          attempts: 0
        });
        Logger.info(`[TallySyncService] Enqueued PO: ${po.poNo}`);
      }

      processPendingQueue();
    } catch (error) {
      Logger.error("[TallySyncService] Error enqueuing Purchase Order", error);
    }
  }

  public async enqueueQuotation(quotation: IQuotation): Promise<void> {
    try {
      if (!quotation.id) {
        Logger.warn("[TallySyncService] Cannot enqueue Quotation: Quotation lacks ID.");
        return;
      }

      const payload = {
        quotationNo: quotation.quotationNo,
        clientName: quotation.clientName,
        amount: quotation.amount,
        gstPercent: quotation.gstPercent,
        gst: quotation.gst,
        total: quotation.total,
        date: quotation.date || new Date(),
        items: quotation.items.map(i => ({
          description: i.description,
          qty: i.qty,
          rate: i.rate,
          total: i.total
        }))
      };

      const existing = await TallySyncQueueModel.findOne({
        entityType: "Quotation",
        entityId: quotation.id,
        status: { $in: ["Pending", "Processing"] }
      });

      if (existing) {
        existing.payload = payload;
        await existing.save();
        Logger.info(`[TallySyncService] Updated existing queue item for Quotation: ${quotation.quotationNo}`);
      } else {
        await TallySyncQueueModel.create({
          entityType: "Quotation",
          entityId: quotation.id,
          payload,
          status: "Pending",
          attempts: 0
        });
        Logger.info(`[TallySyncService] Enqueued Quotation: ${quotation.quotationNo}`);
      }

      processPendingQueue();
    } catch (error) {
      Logger.error("[TallySyncService] Error enqueuing Quotation", error);
    }
  }
}
