/** Feature module registry — Modular Feature Materialization V1 */
import NotesFeature from './notes';
import AppointmentsFeature from './appointments';
import CalendarFeature from './calendar';
import AvailabilityFeature from './availability';
import ReservationsFeature from './reservations';
import DashboardFeature from './dashboard';
import CustomersFeature from './customers';
import ServicesFeature from './services';
import SettingsFeature from './settings';
import HaircutFeature from './haircut';
import WashFeature from './wash';
import StylingFeature from './styling';
import CustomerFeature from './customer';
import ServiceFeature from './service';
import DateFeature from './date';
import TimeFeature from './time';
import ModernFeature from './modern';
import CleanFeature from './clean';
import ResponsiveFeature from './responsive';

export const FEATURE_REGISTRY = [
  {
    id: 'notes',
    name: 'Notes',
    route: '/',
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
    id: 'dashboard',
    name: 'Dashboard',
    route: '/dashboard',
    component: DashboardFeature,
    sourcePath: 'src/features/dashboard/DashboardFeature.tsx',
    contractId: 'feature-dashboard',
    promptTerms: ["dashboard"],
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
    id: 'services',
    name: 'Services',
    route: '/services',
    component: ServicesFeature,
    sourcePath: 'src/features/services/ServicesFeature.tsx',
    contractId: 'feature-services',
    promptTerms: ["services"],
    status: 'generated' as const,
  },
  {
    id: 'settings',
    name: 'Settings',
    route: '/settings',
    component: SettingsFeature,
    sourcePath: 'src/features/settings/SettingsFeature.tsx',
    contractId: 'feature-settings',
    promptTerms: ["settings"],
    status: 'generated' as const,
  },
  {
    id: 'haircut',
    name: 'Haircut',
    route: '/haircut',
    component: HaircutFeature,
    sourcePath: 'src/features/haircut/HaircutFeature.tsx',
    contractId: 'feature-haircut',
    promptTerms: ["haircut"],
    status: 'generated' as const,
  },
  {
    id: 'wash',
    name: 'Wash',
    route: '/wash',
    component: WashFeature,
    sourcePath: 'src/features/wash/WashFeature.tsx',
    contractId: 'feature-wash',
    promptTerms: ["wash"],
    status: 'generated' as const,
  },
  {
    id: 'styling',
    name: 'Styling',
    route: '/styling',
    component: StylingFeature,
    sourcePath: 'src/features/styling/StylingFeature.tsx',
    contractId: 'feature-styling',
    promptTerms: ["styling"],
    status: 'generated' as const,
  },
  {
    id: 'customer',
    name: 'Customer',
    route: '/customer',
    component: CustomerFeature,
    sourcePath: 'src/features/customer/CustomerFeature.tsx',
    contractId: 'feature-customer',
    promptTerms: ["customer"],
    status: 'generated' as const,
  },
  {
    id: 'service',
    name: 'Service',
    route: '/service',
    component: ServiceFeature,
    sourcePath: 'src/features/service/ServiceFeature.tsx',
    contractId: 'feature-service',
    promptTerms: ["service"],
    status: 'generated' as const,
  },
  {
    id: 'date',
    name: 'Date',
    route: '/date',
    component: DateFeature,
    sourcePath: 'src/features/date/DateFeature.tsx',
    contractId: 'feature-date',
    promptTerms: ["date"],
    status: 'generated' as const,
  },
  {
    id: 'time',
    name: 'Time',
    route: '/time',
    component: TimeFeature,
    sourcePath: 'src/features/time/TimeFeature.tsx',
    contractId: 'feature-time',
    promptTerms: ["time"],
    status: 'generated' as const,
  },
  {
    id: 'modern',
    name: 'Modern',
    route: '/modern',
    component: ModernFeature,
    sourcePath: 'src/features/modern/ModernFeature.tsx',
    contractId: 'feature-modern',
    promptTerms: ["modern"],
    status: 'generated' as const,
  },
  {
    id: 'clean',
    name: 'Clean',
    route: '/clean',
    component: CleanFeature,
    sourcePath: 'src/features/clean/CleanFeature.tsx',
    contractId: 'feature-clean',
    promptTerms: ["clean"],
    status: 'generated' as const,
  },
  {
    id: 'responsive',
    name: 'Responsive',
    route: '/responsive',
    component: ResponsiveFeature,
    sourcePath: 'src/features/responsive/ResponsiveFeature.tsx',
    contractId: 'feature-responsive',
    promptTerms: ["responsive"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
