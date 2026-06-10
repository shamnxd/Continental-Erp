import { injectable, inject } from "tsyringe";
import { IUseCase } from "../../interfaces/usecases/IUseCase";
import { IScheduleRepository } from "../../interfaces/repositories/IScheduleRepository";
import { IEnquiryRepository } from "../../interfaces/repositories/IEnquiryRepository";
import { EnquiryStatus } from "../../interfaces/models/IEnquiry";
import { IComplaintRepository } from "../../interfaces/repositories/IComplaintRepository";
import { IAmcRepository } from "../../interfaces/repositories/IAmcRepository";
import { IStaffRepository } from "../../interfaces/repositories/IStaffRepository";
import { CreateScheduleDto } from "../../dtos/schedule.dto";
import { ISchedule } from "../../interfaces/models/ISchedule";
import { appendEnquiryActivity } from "../../utils/enquiryActivity";

@injectable()
export class CreateScheduleUseCase
  implements IUseCase<{ data: CreateScheduleDto; user: string }, ISchedule>
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

  public async execute(input: { data: CreateScheduleDto; user: string }): Promise<ISchedule> {
    const { data, user } = input;

    let assignedStaffIds = data.assignedStaffIds ?? [];
    let assignedTo: string[] = [];

    if (assignedStaffIds.length > 0) {
      const staffList = await this._staffRepository.findByIds(assignedStaffIds);
      assignedStaffIds = staffList.map((s) => s.id!);
      assignedTo = staffList.map((s) => s.fullName);
    }

    const schedule = await this._scheduleRepository.create({
      ...data,
      assignedStaffIds,
      assignedTo,
    });

    // Auto-sync parent entity
    await this.syncParentEntity(schedule, user);

    return schedule;
  }

  private async syncParentEntity(schedule: ISchedule, user: string): Promise<void> {
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
        const activityMsg = `Schedule created: ${scheduleType} on ${formattedDate}`;
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
