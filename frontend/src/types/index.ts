export interface User {
  id: string;
  email: string;
  name: string;
  role: 'INTERNAL' | 'CLIENT';
}

export interface InventoryItem {
  id: string;
  jenisBarang: string;
  specBarang: string;
  kodeBarang: string;
  quantity: number;
  unitOfIssue: string;
  harga: number;
}
