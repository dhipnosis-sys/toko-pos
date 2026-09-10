export type Role = "owner" | "cashier" | "warehouse";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  products?: { count: number }[];
};

export type Supplier = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  tax_id: string | null;
  opening_balance: number;
  total_purchases: number;
  total_paid: number;
  total_debt: number;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  debt_limit: number;
  total_purchases: number;
  total_paid: number;
  total_debt: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductUnit = "pcs" | "pack" | "box" | "karung" | "kg" | "ltr";

export type ProductUnitRow = {
  id?: number;
  unit: ProductUnit;
  factor: number;
  retail_price: number;
  wholesale_price: number;
  reseller_price: number;
  is_default?: boolean;
};

export type Product = {
  id: number;
  category_id: number | null;
  supplier_id: number | null;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  reseller_price: number;
  stock: number;
  min_stock: number;
  unit: ProductUnit;
  notes: string | null;
  image: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  supplier?: Supplier | null;
  units?: ProductUnitRow[];
};

export type PaymentMethod =
  | "cash"
  | "transfer"
  | "qris"
  | "ewallet"
  | "credit"
  | "debit"
  | "receivable";

export type Sale = {
  id: number;
  user_id: string;
  customer_id: number | null;
  invoice_number: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  change_amount: number;
  payment_method: PaymentMethod;
  status: "completed" | "pending" | "cancelled";
  notes: string | null;
  created_at: string;
  updated_at: string;
  sale_items?: SaleItem[];
  customer?: Customer | null;
  profile?: Pick<Profile, "name"> | null;
  payments?: Payment[];
};

export type SaleItem = {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit: string | null;
  unit_price: number;
  cost_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  product?: Product | null;
};

export type Purchase = {
  id: number;
  user_id: string;
  supplier_id: number | null;
  invoice_number: string;
  subtotal: number;
  grand_total: number;
  status: "completed" | "pending";
  notes: string | null;
  created_at: string;
  updated_at: string;
  purchase_items?: PurchaseItem[];
  supplier?: Supplier | null;
  profile?: Pick<Profile, "name"> | null;
};

export type PurchaseItem = {
  id: number;
  purchase_id: number;
  product_id: number;
  quantity: number;
  unit: string | null;
  cost_price: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  product?: Product | null;
};

export type Payment = {
  id: number;
  payable_type: "sale" | "supplier";
  payable_id: number;
  amount: number;
  payment_method: PaymentMethod;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type BOM = {
  id: number;
  product_id: number | null;
  finished_good_type: "product" | "manual";
  finished_good_name: string | null;
  finished_good_unit: string | null;
  name: string;
  quantity: number;
  unit: string | null;
  labor_cost: number;
  overhead_cost: number;
  profit_type: "percentage" | "amount";
  profit_value: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  product?: Product | null;
  items?: BOMItem[];
};

export type BOMItem = {
  id: number;
  bill_of_material_id: number;
  item_type: "product" | "manual";
  product_id: number | null;
  item_name: string | null;
  item_unit: string | null;
  quantity: number;
  unit_cost: number;
  created_at: string;
  updated_at: string;
  product?: Product | null;
};

export type ProductionStatus = "planned" | "completed" | "cancelled";

export type ProductionOrder = {
  id: number;
  order_number: string;
  product_id: number | null;
  finished_good_type: "product" | "manual";
  finished_good_name: string | null;
  bill_of_material_id: number | null;
  quantity: number;
  status: ProductionStatus;
  total_raw_material_cost: number;
  total_labor_cost: number;
  total_overhead_cost: number;
  total_cost: number;
  cost_per_unit: number;
  apply_cost_price: boolean;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
  product?: Product | null;
  bill_of_material?: BOM | null;
  profile?: Pick<Profile, "name"> | null;
  items?: ProductionOrderItem[];
};

export type ProductionOrderItem = {
  id: number;
  production_order_id: number;
  item_type: "product" | "manual";
  product_id: number | null;
  item_name: string | null;
  quantity_planned: number;
  quantity_used: number;
  unit_cost: number;
  subtotal: number;
  created_at: string;
  updated_at: string;
  product?: Product | null;
};

export type Settings = Record<string, string>;

export type HppSimulation = {
  success: boolean;
  message?: string;
  product_name?: string | null;
  product_id?: number | null;
  finished_good_type?: "product" | "manual";
  production_qty?: number;
  raw_material_cost?: number;
  labor_cost?: number;
  overhead_cost?: number;
  total_cost?: number;
  cost_per_unit?: number;
  profit_type?: "percentage" | "amount";
  profit_value?: number;
  profit_amount?: number;
  suggested_price?: number;
  suggested_price_per_unit?: number;
  details?: {
    item_name: string;
    item_type: "product" | "manual";
    qty_needed: number;
    unit: string | null;
    unit_cost: number;
    subtotal: number;
  }[];
};