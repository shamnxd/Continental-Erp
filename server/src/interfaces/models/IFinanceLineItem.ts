export interface IFinanceLineItem {
  description: string;
  itemCode?: string;
  unit: string;
  qty: number;
  rate: number;
  discountPercent: number;
  total: number;
  hsnSac?: string;
}
