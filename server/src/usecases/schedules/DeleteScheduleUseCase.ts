import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IScheduleRepository } from "../../interfaces/repositories/IScheduleRepository";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { EnquiryStatus } from "../../interfaces/models/IEnquiry";
import { IComplaintRepository } from "../../interfaces/repositories/IComplaintRepository";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { ISchedule } from "../../interfaces/models/ISchedule";
import { appendEnquiryActivity } from "../../utils/enquiryActivity";

@injectable()
export class DeleteScheduleUseCase
  implements IUseCase<{ id: string; user: string }, boolean>
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
  ) {}

  public async execute(input: { id: string; user: string }): Promise<boolean> {
    const { id, user } = input;
    const existing = await this._scheduleRepository.findById(id);
    if (!existing) return false;

    const deleted = await this._scheduleRepository.delete(id);
    if (!deleted) return false;

    // Re-sync parent entity with remaining schedules
    await this.syncParentEntity(existing, user);

    return true;
  }

  private async syncParentEntity(schedule: ISchedule, user: string): Promise<void> {
    const { entityType, entityId } = schedule;

    if (entityType === "enquiry") {
      const schedules = await this._scheduleRepository.findByEntity("enquiry", entityId);
      const activeSchedules = schedules.filter((s) => s.status !== "Completed" && s.status !== "Cancelled");
      const nextSchedule = activeSchedules[0] || null;

      const enquiry = await this._enquiryRepository.findById(entityId);
      if (enquiry) {
        const activityMsg = `Schedule deleted: ${schedule.scheduleType}`;
        const activityLog = appendEnquiryActivity(enquiry.activityLog, "updated", activityMsg, user);

        if (nextSchedule) {
          let newStatus: EnquiryStatus = "Follow-up Required";
          if (nextSchedule.scheduleType === "Schedule Visit" || nextSchedule.scheduleType === "Enquiry Visit") {
            newStatus = "Site Visit Scheduled";
          }
          await this._enquiryRepository.update(entityId, {
            followUpDate: new Date(nextSchedule.scheduledDate),
            status: newStatus,
            assignedTo: nextSchedule.assignedTo[0] || "",
            assignedStaffId: nextSchedule.assignedStaffIds[0] || "",
            activityLog,
          });
        } else {
          await this._enquiryRepository.update(entityId, {
            followUpDate: null,
            assignedTo: "",
            assignedStaffId: "",
            activityLog,
          });
        }
      }
    } else if (entityType === "complaint") {
      const schedules = await this._scheduleRepository.findByEntity("complaint", entityId);
      const activeSchedules = schedules.filter((s) => s.status !== "Completed" && s.status !== "Cancelled");
      const nextSchedule = activeSchedules[0] || null;

      if (nextSchedule) {
        await this._complaintRepository.update(entityId, {
          expectedResolution: new Date(nextSchedule.scheduledDate),
          assignedStaffIds: nextSchedule.assignedStaffIds,
          assignedTo: nextSchedule.assignedTo,
        });
      } else {
        await this._complaintRepository.update(entityId, {
          assignedStaffIds: [],
          assignedTo: [],
        });
      }
    } else if (entityType === "amc") {
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
