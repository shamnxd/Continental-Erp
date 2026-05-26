import { IAmcPayment, IAmcRemark } from "./IAmcRemark";

export type AmcContractStatus = "Active" | "Due for Renewal" | "Expired";
export type AmcFrequency = "Monthly" | "Quarterly" | "Bi-Annual" | "Annual";

export interface IAmc {
  id?: string;
  amcNo: string;
  clientId: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  startDate: Date;
  endDate: Date;
  frequency: AmcFrequency;
  nextVisit?: Date | null;
  status: AmcContractStatus;
  amount: number;
  visitsCompleted: number;
  totalVisits: number;
  serviceType: string;
  notes?: string;
  remarks?: IAmcRemark[];
  advancePaid?: number;
  payments?: IAmcPayment[];
  createdAt?: Date;
  updatedAt?: Date;
}
