/**
 * Safe Payment Placeholder Policy V1 — simulated checkout module source generation.
 */

import { SAFE_PAYMENT_PLACEHOLDER_NOTICE } from './safe-payment-placeholder-types.js';
import {
  cartItemsFromApprovedSampleDataPlan,
  emptyStateForSurface,
  type ApprovedSampleDataPlan,
} from '../contract-bound-generation-authority-v4/approved-sample-data-plan.js';

function collectionRecordsFromPlan(plan: ApprovedSampleDataPlan, entityType: string) {
  return plan.sampleCollections.find((collection) => collection.entityType === entityType)?.records ?? [];
}

function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/`/g, '\\`');
}

const PLACEHOLDER_MODULES = new Set(['cart', 'checkout', 'payments', 'orders']);

export function isSafePaymentPlaceholderModule(moduleId: string): boolean {
  return PLACEHOLDER_MODULES.has(moduleId);
}

export function buildSafePaymentPlaceholderComponentTsx(
  moduleId: string,
  appTitle: string,
  pascal: string,
  displayName: string,
  approvedSampleDataPlan?: ApprovedSampleDataPlan | null,
): string | null {
  if (!PLACEHOLDER_MODULES.has(moduleId)) return null;

  const notice = SAFE_PAYMENT_PLACEHOLDER_NOTICE;
  void appTitle;
  void displayName;

  if (moduleId === 'cart') {
    const cartItems = approvedSampleDataPlan ? cartItemsFromApprovedSampleDataPlan(approvedSampleDataPlan) : [];
    const emptyState = approvedSampleDataPlan ? emptyStateForSurface(approvedSampleDataPlan, 'CART') : null;
    const emptyTitle = emptyState?.title ?? 'Cart empty';
    const emptyMessage =
      emptyState?.message ?? 'Approved catalog items will appear here when records are present.';

    return `import { useMemo, useState } from 'react';
import './${moduleId}.module.css';

export default function ${pascal}Feature() {
  const [items] = useState(${JSON.stringify(cartItems)});
  const headline = useMemo(() => 'Review cart items before checkout.', []);

  return (
    <section className="modular-feature safe-payment-simulated" data-feature-module="cart" data-safe-payment-simulated="true">
      <header className="modular-feature-header">
        <h2>Cart</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-simulated-notice="true">${notice}</p>
        {items.length > 0 ? (
          <ul>{items.map((item) => (<li key={item.id}>{item.label} — {item.price}</li>))}</ul>
        ) : (
          <p className="modular-feature-empty-state" data-empty-state="true">${esc(emptyTitle)} — ${esc(emptyMessage)}</p>
        )}
        <button type="button" data-interaction-control="true">Proceed to checkout</button>
      </div>
    </section>
  );
}
`;
  }

  if (moduleId === 'checkout') {
    const cartItems = approvedSampleDataPlan ? cartItemsFromApprovedSampleDataPlan(approvedSampleDataPlan) : [];
    const itemCount = cartItems.length;
    const totalLabel = itemCount > 0 ? cartItems.map((item) => item.price).join(', ') : '$0.00';

    return `import { useMemo, useState } from 'react';
import './${moduleId}.module.css';

export default function ${pascal}Feature() {
  const [step, setStep] = useState<'form' | 'review' | 'confirm'>('form');
  const headline = useMemo(() => 'Checkout form, order review, and simulated payment status.', []);

  return (
    <section className="modular-feature safe-payment-simulated" data-feature-module="checkout" data-safe-payment-simulated="true">
      <header className="modular-feature-header">
        <h2>Checkout</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-simulated-notice="true">${notice}</p>
        {step === 'form' && (
          <form data-checkout-form="true" onSubmit={(e) => { e.preventDefault(); setStep('review'); }}>
            <label>Shipping address<input name="address" defaultValue="123 Main St" aria-label="Shipping address" /></label>
            <button type="submit">Review order</button>
          </form>
        )}
        {step === 'review' && (
          <div data-order-review="true">
            <p>Order review — ${itemCount} item(s), total ${totalLabel}</p>
            <button type="button" onClick={() => setStep('confirm')}>Place order (simulated)</button>
          </div>
        )}
        {step === 'confirm' && (
          <div data-order-confirmation-mock="true">
            <p data-payment-status="simulated-success">Payment status: simulated success</p>
            <p>Order confirmation reference (simulated)</p>
          </div>
        )}
      </div>
    </section>
  );
}
`;
  }

  if (moduleId === 'payments') {
    return `import { useMemo } from 'react';
import './${moduleId}.module.css';

export default function ${pascal}Feature() {
  const headline = useMemo(() => 'Simulated payment status panel — no real transaction execution.', []);

  return (
    <section className="modular-feature safe-payment-simulated" data-feature-module="payments" data-safe-payment-simulated="true">
      <header className="modular-feature-header">
        <h2>Payments</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-simulated-notice="true">${notice}</p>
        <p data-payment-status="simulated-idle">Status: simulated idle</p>
        <p data-no-real-transaction="true">No Stripe, PayPal, or card processor wired.</p>
      </div>
    </section>
  );
}
`;
  }

  if (moduleId === 'orders') {
    const orderRecords = approvedSampleDataPlan ? collectionRecordsFromPlan(approvedSampleDataPlan, 'orders') : [];
    const orders = orderRecords.map((record) => ({
      id: record.id,
      label: record.label,
      total: record.payload.total ?? '',
    }));
    const emptyState = approvedSampleDataPlan ? emptyStateForSurface(approvedSampleDataPlan, 'ORDERS') : null;
    const emptyTitle = emptyState?.title ?? 'No orders yet';
    const emptyMessage =
      emptyState?.message ?? 'Approved order records will appear here when records are present.';

    return `import { useMemo } from 'react';
import './${moduleId}.module.css';

export default function ${pascal}Feature() {
  const orders = useMemo(() => ${JSON.stringify(orders)}, []);
  const headline = useMemo(() => 'Order history with simulated confirmation records.', []);

  return (
    <section className="modular-feature safe-payment-simulated" data-feature-module="orders" data-safe-payment-simulated="true">
      <header className="modular-feature-header">
        <h2>Orders</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-simulated-notice="true">${notice}</p>
        {orders.length > 0 ? (
          <ul>{orders.map((order) => (<li key={order.id}>{order.label} — {order.total}</li>))}</ul>
        ) : (
          <p className="modular-feature-empty-state" data-empty-state="true">${esc(emptyTitle)} — ${esc(emptyMessage)}</p>
        )}
      </div>
    </section>
  );
}
`;
  }

  return null;
}

export function containsRealPaymentExecutionSource(source: string): boolean {
  const forbidden = [
    /\bstripe\.charges\.create\b/i,
    /\bpaymentIntents\.create\b/i,
    /\bprocessRealPayment\b/i,
    /\bchargeCard\b/i,
    /\bcapturePayment\b/i,
    /\bsk_live_[a-z0-9]+\b/i,
    /\bcreatePaymentIntent\s*\(/i,
    /\bPayPalSDK\.capture\b/i,
  ];
  return forbidden.some((pattern) => pattern.test(source));
}
