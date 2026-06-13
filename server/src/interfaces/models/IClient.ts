export interface IClient {
  id?: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  gst?: string;
  city: string;
  address?: string;
  projectsCount: number;
  amcStatus: "Active" | "Inactive" | "Expired";
  createdAt?: Date;
  updatedAt?: Date;
  activeComplaintsCount?: number;
  activeEnquiriesCount?: number;
}
