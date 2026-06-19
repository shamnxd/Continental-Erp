export interface ITallyCache {
  id?: string;
  key: string;
  data: any;
  lastSyncedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
