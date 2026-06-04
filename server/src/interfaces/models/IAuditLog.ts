export interface IAuditLog {
  id?: string;
  timestamp?: Date;
  user: string;
  action: string;
  module: string;
  details: string;
}
