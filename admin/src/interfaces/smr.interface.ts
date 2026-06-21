export interface ACUnit {
  type: string;
  make: string;
  modelNo: string;
  serialNo: string;
  quantity: number;
  location: string;
}

export interface WorkDoneChecklist {
  filtersCleaned: boolean;
  coilsCleaned: boolean;
  compressorCurrentChecked: boolean;
  electricalConnectionsTightened: boolean;
  gasPressureChecked: boolean;
}

export interface SMRApproval {
  clientRepName: string;
  designation: string;
  signature: string; // Base64 PNG
  hasSeal: boolean;
  date: string;
}

export interface SMR {
  id?: string;
  smrNo: string;
  complaintId?: string;
  amcVisitId?: string;
  clientId: string;
  clientName: string;
  clientLocation: string;
  contactName: string;
  date: string;
  jobNumber?: string;
  natureOfComplaint: string;
  acUnits: ACUnit[];
  serviceRendered: string;
  workDoneChecklist: WorkDoneChecklist;
  compressorCurrentValue: string;
  status: "Draft" | "Pending Approval" | "Approved" | "Rejected";
  approval?: SMRApproval;
  createdAt?: string;
  updatedAt?: string;
}
