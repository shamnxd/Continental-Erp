export interface User {
  id: string;
  name: string;
  username?: string; // Legacy
  email: string;
  role?: string;
  permissions?: {
    crm: boolean;
    operations: boolean;
    finance: boolean;
    administration: boolean;
  };
}
