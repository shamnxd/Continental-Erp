import mongoose from "mongoose";
import { ScheduleModel } from "../models/Schedule";
import { EnquiryModel } from "../models/Enquiry";
import { ComplaintModel } from "../models/Complaint";
import { AmcModel } from "../models/Amc";

export async function migrateSchedules(): Promise<void> {
  console.log("[Migration] Starting schedule data migration check...");
  try {
    const db = mongoose.connection.db;
    if (!db) {
      console.log("[Migration] Database connection not ready. Skipping.");
      return;
    }

    // 1. Migrate Enquiries
    const enquiries = await EnquiryModel.find({
      followUpDate: { $ne: null },
    }).exec();

    console.log(`[Migration] Found ${enquiries.length} enquiries with follow-up dates.`);
    for (const enq of enquiries) {
      if (!enq.followUpDate) continue;

      const exists = await ScheduleModel.findOne({
        entityType: "enquiry",
        entityId: enq._id.toString(),
        scheduledDate: enq.followUpDate,
      }).exec();

      if (!exists) {
        const scheduleType =
          enq.status === "Site Visit Scheduled" ? "Schedule Visit" : "Follow-up";

        let assignedStaffIds: string[] = [];
        let assignedTo: string[] = [];

        if ((enq as any).assignedStaffIds && (enq as any).assignedStaffIds.length > 0) {
          assignedStaffIds = (enq as any).assignedStaffIds;
          assignedTo = Array.isArray(enq.assignedTo) ? enq.assignedTo : [enq.assignedTo];
        } else if (enq.assignedStaffId) {
          assignedStaffIds = [enq.assignedStaffId];
          assignedTo = [enq.assignedTo];
        }

        await ScheduleModel.create({
          entityType: "enquiry",
          entityId: enq._id.toString(),
          entityNo: enq.enquiryNo,
          clientName: enq.clientName,
          clientRef: enq.clientRef || null,
          title: enq.requirement || "Site visit / Follow-up",
          scheduleType,
          scheduledDate: enq.followUpDate,
          status: enq.status === "Closed" ? "Completed" : "Scheduled",
          assignedStaffIds,
          assignedTo,
          notes: enq.description || "",
        });
        console.log(`[Migration] Migrated Enquiry schedule: ${enq.enquiryNo}`);
      }
    }

    // 2. Migrate Complaints
    const complaints = await ComplaintModel.find({
      expectedResolution: { $ne: null },
    }).exec();

    console.log(`[Migration] Found ${complaints.length} complaints with expected resolutions.`);
    for (const comp of complaints) {
      if (!comp.expectedResolution) continue;

      const exists = await ScheduleModel.findOne({
        entityType: "complaint",
        entityId: comp._id.toString(),
        scheduledDate: comp.expectedResolution,
      }).exec();

      if (!exists) {
        await ScheduleModel.create({
          entityType: "complaint",
          entityId: comp._id.toString(),
          entityNo: comp.complaintNo,
          clientName: comp.clientName,
          clientRef: comp.clientRef || null,
          title: comp.issue || "Complaint Resolution",
          scheduleType: "Complaint Resolution",
          scheduledDate: comp.expectedResolution,
          status: comp.status === "Resolved" ? "Completed" : "Scheduled",
          assignedStaffIds: comp.assignedStaffIds || [],
          assignedTo: comp.assignedTo || [],
          notes: comp.description || "",
        });
        console.log(`[Migration] Migrated Complaint schedule: ${comp.complaintNo}`);
      }
    }

    // 3. Migrate AMC Visits (Direct MongoDB collection query to avoid dependency on deleted model)
    const collections = await db.listCollections({ name: "amcvisits" }).toArray();
    if (collections.length > 0) {
      const amcVisitsCursor = db.collection("amcvisits").find({});
      const visits = await amcVisitsCursor.toArray();
      console.log(`[Migration] Found ${visits.length} legacy AMC visits to migrate.`);

      for (const visit of visits) {
        const amcId = visit.amcId;
        if (!amcId) continue;

        const contract = await AmcModel.findById(amcId).exec();
        if (!contract) continue;

        const exists = await ScheduleModel.findOne({
          entityType: "amc",
          entityId: contract._id.toString(),
          scheduledDate: visit.scheduledDate,
        }).exec();

        if (!exists) {
          const statusMap: Record<string, string> = {
            Scheduled: "Scheduled",
            Completed: "Completed",
            Cancelled: "Cancelled",
          };

          const assignedStaffIds = visit.assignedStaffIds
            ? visit.assignedStaffIds.map((id: any) => id.toString())
            : [];

          await ScheduleModel.create({
            entityType: "amc",
            entityId: contract._id.toString(),
            entityNo: contract.amcNo,
            clientName: contract.clientName,
            clientRef: contract.clientId || null,
            title: contract.serviceType || "AMC Service Visit",
            scheduleType: "AMC Visit",
            scheduledDate: visit.scheduledDate,
            status: statusMap[visit.status] || "Scheduled",
            assignedStaffIds,
            assignedTo: [], // Will be resolved dynamically on load or create
            notes: visit.notes || "",
            smrId: visit.smrId || null,
          });
          console.log(`[Migration] Migrated legacy AMC visit: ${contract.amcNo} on ${visit.scheduledDate}`);
        }
      }
    } else {
      console.log("[Migration] No legacy 'amcvisits' collection found.");
    }

    console.log("[Migration] Schedule data migration check completed successfully.");
  } catch (err) {
    console.error("[Migration] Error during schedule migration:", err);
  }
}
