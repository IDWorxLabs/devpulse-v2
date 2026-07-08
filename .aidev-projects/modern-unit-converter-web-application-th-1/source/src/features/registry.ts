/** Feature module registry — Modular Feature Materialization V1 */
import NotesFeature from './notes';
import AppointmentsFeature from './appointments';
import CalendarFeature from './calendar';
import AvailabilityFeature from './availability';
import ReservationsFeature from './reservations';
import RevenueFeature from './revenue';
import CustomersFeature from './customers';
import OrdersFeature from './orders';
import StaffFeature from './staff';
import InventoryFeature from './inventory';
import TaxesFeature from './taxes';
import CurrencyFeature from './currency';

export const FEATURE_REGISTRY = [
  {
    id: 'notes',
    name: 'Notes',
    route: '/notes',
    component: NotesFeature,
    sourcePath: 'src/features/notes/NotesFeature.tsx',
    contractId: 'feature-notes',
    promptTerms: ["notes"],
    status: 'generated' as const,
  },
  {
    id: 'appointments',
    name: 'Appointments',
    route: '/appointments',
    component: AppointmentsFeature,
    sourcePath: 'src/features/appointments/AppointmentsFeature.tsx',
    contractId: 'feature-appointments',
    promptTerms: ["appointments"],
    status: 'generated' as const,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    route: '/calendar',
    component: CalendarFeature,
    sourcePath: 'src/features/calendar/CalendarFeature.tsx',
    contractId: 'feature-calendar',
    promptTerms: ["calendar"],
    status: 'generated' as const,
  },
  {
    id: 'availability',
    name: 'Availability',
    route: '/availability',
    component: AvailabilityFeature,
    sourcePath: 'src/features/availability/AvailabilityFeature.tsx',
    contractId: 'feature-availability',
    promptTerms: ["availability"],
    status: 'generated' as const,
  },
  {
    id: 'reservations',
    name: 'Reservations',
    route: '/reservations',
    component: ReservationsFeature,
    sourcePath: 'src/features/reservations/ReservationsFeature.tsx',
    contractId: 'feature-reservations',
    promptTerms: ["reservations"],
    status: 'generated' as const,
  },
  {
    id: 'revenue',
    name: 'Revenue',
    route: '/revenue',
    component: RevenueFeature,
    sourcePath: 'src/features/revenue/RevenueFeature.tsx',
    contractId: 'feature-revenue',
    promptTerms: ["revenue"],
    status: 'generated' as const,
  },
  {
    id: 'customers',
    name: 'Customers',
    route: '/customers',
    component: CustomersFeature,
    sourcePath: 'src/features/customers/CustomersFeature.tsx',
    contractId: 'feature-customers',
    promptTerms: ["customers"],
    status: 'generated' as const,
  },
  {
    id: 'orders',
    name: 'Orders',
    route: '/orders',
    component: OrdersFeature,
    sourcePath: 'src/features/orders/OrdersFeature.tsx',
    contractId: 'feature-orders',
    promptTerms: ["orders"],
    status: 'generated' as const,
  },
  {
    id: 'staff',
    name: 'Staff',
    route: '/staff',
    component: StaffFeature,
    sourcePath: 'src/features/staff/StaffFeature.tsx',
    contractId: 'feature-staff',
    promptTerms: ["staff"],
    status: 'generated' as const,
  },
  {
    id: 'inventory',
    name: 'Inventory',
    route: '/inventory',
    component: InventoryFeature,
    sourcePath: 'src/features/inventory/InventoryFeature.tsx',
    contractId: 'feature-inventory',
    promptTerms: ["inventory"],
    status: 'generated' as const,
  },
  {
    id: 'taxes',
    name: 'Taxes',
    route: '/taxes',
    component: TaxesFeature,
    sourcePath: 'src/features/taxes/TaxesFeature.tsx',
    contractId: 'feature-taxes',
    promptTerms: ["taxes"],
    status: 'generated' as const,
  },
  {
    id: 'currency',
    name: 'Currency',
    route: '/currency',
    component: CurrencyFeature,
    sourcePath: 'src/features/currency/CurrencyFeature.tsx',
    contractId: 'feature-currency',
    promptTerms: ["currency"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
