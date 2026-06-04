export interface IUser {
  id?: string;
  name: string;
  username?: string; // Legacy field for database fallback
  email: string;
  passwordHash: string;
  refreshToken?: string | null;
  role?: string;
  permissions?: {
    crm: boolean;
    operations: boolean;
    finance: boolean;
    administration: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
}
