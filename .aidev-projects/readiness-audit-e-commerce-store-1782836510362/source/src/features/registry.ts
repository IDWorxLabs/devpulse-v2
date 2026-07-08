/** Feature module registry — Modular Feature Materialization V1 */
import NavigationRouterFeature from './navigation-router';
import DashboardFeature from './dashboard';
import SettingsFeature from './settings';
import ProductsFeature from './products';
import CartFeature from './cart';
import CheckoutFeature from './checkout';
import OrdersFeature from './orders';
import PaymentsFeature from './payments';

export const FEATURE_REGISTRY = [
  {
    id: 'navigation-router',
    name: 'Navigation Router',
    route: '/navigation-router',
    component: NavigationRouterFeature,
    sourcePath: 'src/features/navigation-router/NavigationRouterFeature.tsx',
    contractId: 'feature-navigation-router',
    promptTerms: ["navigation router"],
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
    id: 'products',
    name: 'Products',
    route: '/products',
    component: ProductsFeature,
    sourcePath: 'src/features/products/ProductsFeature.tsx',
    contractId: 'feature-products',
    promptTerms: ["products"],
    status: 'generated' as const,
  },
  {
    id: 'cart',
    name: 'Cart',
    route: '/cart',
    component: CartFeature,
    sourcePath: 'src/features/cart/CartFeature.tsx',
    contractId: 'feature-cart',
    promptTerms: ["cart"],
    status: 'generated' as const,
  },
  {
    id: 'checkout',
    name: 'Checkout',
    route: '/checkout',
    component: CheckoutFeature,
    sourcePath: 'src/features/checkout/CheckoutFeature.tsx',
    contractId: 'feature-checkout',
    promptTerms: ["checkout"],
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
    id: 'payments',
    name: 'Payments',
    route: '/payments',
    component: PaymentsFeature,
    sourcePath: 'src/features/payments/PaymentsFeature.tsx',
    contractId: 'feature-payments',
    promptTerms: ["payments"],
    status: 'generated' as const,
  }
] as const;

export type FeatureRegistryEntry = (typeof FEATURE_REGISTRY)[number];
export type FeatureModuleId = FeatureRegistryEntry['id'];

export const FEATURE_MODULE_IDS = FEATURE_REGISTRY.map((entry) => entry.id);
