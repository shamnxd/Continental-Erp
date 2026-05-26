import { IEnquiry } from "../interfaces/models/IEnquiry";
import { IEnquiryActivity, EnquiryActivityType } from "../interfaces/models/IEnquiryRemark";

export function appendEnquiryActivity(
  existing: IEnquiryActivity[] | undefined,
  type: EnquiryActivityType,
  message: string,
  user: string,
): IEnquiryActivity[] {
  return [
    ...(existing ?? []),
    {
      type,
      message,
      user,
      date: new Date(),
    },
  ];
}

export function buildUpdateActivities(
  prev: IEnquiry,
  patch: Partial<IEnquiry>,
  user: string,
): IEnquiryActivity[] {
  const entries: IEnquiryActivity[] = [];

  if (
    patch.assignedStaffId !== undefined &&
    String(patch.assignedStaffId || "") !== String(prev.assignedStaffId || "")
  ) {
    const fromName = prev.assignedTo?.trim() || "Unassigned";
    const toName = patch.assignedTo?.trim() || "Unassigned";
    const hadPrev = Boolean(prev.assignedStaffId);
    const hasNext = Boolean(patch.assignedStaffId);

    if (!hadPrev && hasNext) {
      entries.push({
        type: "assigned",
        message: `Assigned to ${toName}`,
        user,
        date: new Date(),
      });
    } else if (hadPrev && !hasNext) {
      entries.push({
        type: "reassigned",
        message: `Unassigned (was ${fromName})`,
        user,
        date: new Date(),
      });
    } else if (hadPrev && hasNext) {
      entries.push({
        type: "reassigned",
        message: `Reassigned from ${fromName} to ${toName}`,
        user,
        date: new Date(),
      });
    }
  }

  if (patch.status !== undefined && patch.status !== prev.status) {
    entries.push({
      type: "status_changed",
      message: `Status changed from "${prev.status}" to "${patch.status}"`,
      user,
      date: new Date(),
    });
  }

  if (patch.priority !== undefined && patch.priority !== prev.priority) {
    entries.push({
      type: "priority_changed",
      message: `Priority changed from ${prev.priority} to ${patch.priority}`,
      user,
      date: new Date(),
    });
  }

  const detailKeys: (keyof IEnquiry)[] = [
    "clientId",
    "clientName",
    "contactPerson",
    "phone",
    "email",
    "requirement",
    "description",
    "followUpDate",
    "date",
  ];

  const detailsChanged = detailKeys.some((key) => {
    if (patch[key] === undefined) return false;
    const a = patch[key];
    const b = prev[key];
    if (key === "followUpDate" || key === "date") {
      return new Date(String(a ?? "")).getTime() !== new Date(String(b ?? "")).getTime();
    }
    return String(a) !== String(b);
  });

  if (detailsChanged && entries.length === 0) {
    entries.push({
      type: "updated",
      message: "Enquiry details updated",
      user,
      date: new Date(),
    });
  } else if (detailsChanged) {
    entries.push({
      type: "updated",
      message: "Enquiry details updated",
      user,
      date: new Date(),
    });
  }

  return entries;
}
