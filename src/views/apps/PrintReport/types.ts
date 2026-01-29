export interface KitchenAllocationItem {
  id: string;
  itemName: string;
  itemNo: string;
  quantity: number;
  amount: number;
  kitchenCategory: string;
  itemGroup: string;
  tableNo: string;
  department: string;
  user: string;
  txnDate: Date;
}

export interface DateRange {
  fromDate: Date | null;
  toDate: Date | null;
}

export type FilterType = 'all' | 'kitchen-category' | 'item-group' | 'table-department' | 'user';

export type TabType = 'current' | 'backdated';

export interface FilterOption {
  value: string;
  label: string;
  type: string;
}
