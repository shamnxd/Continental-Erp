import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IScheduleRepository } from "../../interfaces/repositories/IScheduleRepository";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { EnquiryStatus } from "../../interfaces/models/IEnquiry";
import { IComplaintRepository } from "../../interfaces/repositories/IComplaintRepository";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IStaffRepository } from "../../interfaces/repositories/IStaffRepository";
import { UpdateScheduleDto } from "../../dtos/schedule.dto";
import { ISchedule } from "../../interfaces/models/ISchedule";
import { appendEnquiryActivity } from "../../utils/enquiryActivity";

@injectable()
export class UpdateScheduleUseCase
  implements IUseCase<{ id: string; data: UpdateScheduleDto; user: string }, ISchedule | null>
{
  constructor(
    @inject("ScheduleRepository")
    private _scheduleRepository: IScheduleRepository,
    @inject("EnquiryRepository")
    private _enquiryRepository: IEnquiryRepository,
    @inject("ComplaintRepository")
    private _complaintRepository: IComplaintRepository,
    @inject("AmcRepository")
    private _amcRepository: IAmcRepository,
    @inject("StaffRepository")
    private _staffRepository: IStaffRepository,
  ) {}

  public async execute(input: {
    id: string;
    data: UpdateScheduleDto;
    user: string;
  }): Promise<ISchedule | null> {
    const { id, data, user } = input;

    const existing = await this._scheduleRepository.findById(id);
    if (!existing) return null;

    const patch: Partial<ISchedule> = { ...data };

    if (data.assignedStaffIds !== undefined) {
      let assignedStaffIds = data.assignedStaffIds ?? [];
      let assignedTo: string[] = [];

      if (assignedStaffIds.length > 0) {
        const staffList = await this._staffRepository.findByIds(assignedStaffIds);
        assignedStaffIds = staffList.map((s) => s.id!);
        assignedTo = staffList.map((s) => s.fullName);
      }
      patch.assignedStaffIds = assignedStaffIds;
      patch.assignedTo = assignedTo;
    }

    const updated = await this._scheduleRepository.update(id, patch);
    if (!updated) return null;

    const wasCompletedTransition = existing.status !== "Completed" && updated.status === "Completed";
    const wasCancelledTransition = existing.status !== "Cancelled" && updated.status === "Cancelled";

    // Sync parent entity
    await this.syncParentEntity(updated, user, wasCompletedTransition, wasCancelledTransition);

    return updated;
  }

  private async syncParentEntity(
    schedule: ISchedule,
    user: string,
    wasCompletedTransition: boolean,
    wasCancelledTransition: boolean
  ): Promise<void> {
    const { entityType, entityId, scheduledDate, status, assignedStaffIds, assignedTo, scheduleType } = schedule;

    if (entityType === "enquiry") {
      const enquiry = await this._enquiryRepository.findById(entityId);
      if (enquiry) {
        let newStatus: EnquiryStatus = enquiry.status;
        if (scheduleType === "Schedule Visit" || scheduleType === "Enquiry Visit") {
          newStatus = "Site Visit Scheduled";
        } else if (scheduleType === "Follow-up") {
          newStatus = "Follow-up Required";
        }

        const formattedDate = new Date(scheduledDate).toLocaleDateString("en-GB");
        let activityMsg = `Schedule updated: ${scheduleType} on ${formattedDate}`;
        if (wasCompletedTransition) {
          activityMsg = `Schedule completed: ${scheduleType} on ${formattedDate}`;
        } else if (wasCancelledTransition) {
          activityMsg = `Schedule cancelled: ${scheduleType} on ${formattedDate}`;
        }
        const activityLog = appendEnquiryActivity(enquiry.activityLog, "updated", activityMsg, user);

        await this._enquiryRepository.update(entityId, {
          followUpDate: new Date(scheduledDate),
          status: newStatus,
          assignedTo: assignedTo[0] || "",
          assignedStaffId: assignedStaffIds[0] || "",
          activityLog,
        });
      }
    } else if (entityType === "complaint") {
      const complaint = await this._complaintRepository.findById(entityId);
      if (complaint) {
        let compStatus = complaint.status;
        if (status === "Completed") {
          compStatus = "Resolved";
        } else if (status === "In Progress") {
          compStatus = "In Progress";
        } else if (status === "Scheduled") {
          compStatus = "In Progress";
        }

        await this._complaintRepository.update(entityId, {
          expectedResolution: new Date(scheduledDate),
          assignedStaffIds,
          assignedTo,
          status: compStatus,
        });
      }
    } else if (entityType === "amc") {
      const amc = await this._amcRepository.findById(entityId);
      if (amc) {
        const schedules = await this._scheduleRepository.findByEntity("amc", entityId);
        const activeSchedules = schedules.filter((s) => s.status !== "Completed" && s.status !== "Cancelled");
        const nextVisitDate = activeSchedules.length > 0 ? activeSchedules[0].scheduledDate : null;
        const completedCount = schedules.filter((s) => s.status === "Completed").length;

        await this._amcRepository.update(entityId, {
          nextVisit: nextVisitDate ? new Date(nextVisitDate) : null,
          visitsCompleted: completedCount,
        });
      }
    }
  }
}
