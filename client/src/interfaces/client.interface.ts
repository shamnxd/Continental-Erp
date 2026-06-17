export interface Client {
  id?: string;
  _id?: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email: string;
  gst?: string;
  city: string;
  address?: string;
  projectsCount: number;
  amcStatus: "Active" | "Inactive" | "Expired";
  createdAt?: string;
  updatedAt?: string;
  activeComplaintsCount?: number;
  activeEnquiriesCount?: number;
}
