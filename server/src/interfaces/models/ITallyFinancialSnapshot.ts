export interface ITallyFinancialSnapshot {
  id?: string;
  periodStart: Date;
  periodEnd: Date;
  revenue: number;
  expenses: number;
  netProfit: number;
  grossProfit: number;
  topExpenseLedgers: Array<{ ledgerName: string; amount: number }>;
  tallySyncedAt: Date;
}
