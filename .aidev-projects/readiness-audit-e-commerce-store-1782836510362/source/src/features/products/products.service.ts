/** Service adapter for products — Custom App */
import type { ProductsRecord } from './products.types';

const DEMO_PRODUCTS_RECORDS: ProductsRecord[] = [
  { id: 'products-1', label: 'Sample Products record', createdAt: new Date().toISOString() },
  { id: 'products-2', label: 'Products preview entry', createdAt: new Date().toISOString() },
];

export function listProductsRecords(): ProductsRecord[] {
  return DEMO_PRODUCTS_RECORDS;
}
