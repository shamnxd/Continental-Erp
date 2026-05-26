export type AmcContractStatus = "Active" | "Due for Renewal" | "Expired";

export function computeAmcContractStatus(endDate: Date, now: Date = new Date()): AmcContractStatus {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  if (end < today) {
    return "Expired";
  }

  const renewalWindow = new Date(today);
  renewalWindow.setDate(renewalWindow.getDate() + 30);

  if (end <= renewalWindow) {
    return "Due for Renewal";
  }

  return "Active";
}

export function mapAmcStatusToClientAmcStatus(status: AmcContractStatus): "Active" | "Inactive" | "Expired" {
  if (status === "Expired") return "Expired";
  if (status === "Active" || status === "Due for Renewal") return "Active";
  return "Inactive";
}
