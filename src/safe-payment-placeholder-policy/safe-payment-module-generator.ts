/**
 * Safe Payment Placeholder Policy V1 — placeholder checkout module source generation.
 */

import { SAFE_PAYMENT_PLACEHOLDER_NOTICE } from './safe-payment-placeholder-types.js';

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
): string | null {
  if (!PLACEHOLDER_MODULES.has(moduleId)) return null;

  const notice = SAFE_PAYMENT_PLACEHOLDER_NOTICE;

  if (moduleId === 'cart') {
    return `import { useMemo, useState } from 'react';
import './${moduleId}.module.css';

export default function ${pascal}Feature() {
  const [items] = useState([{ id: 'item-1', label: 'Sample product', price: '$24.00' }]);
  const headline = useMemo(() => 'Review cart items before checkout.', []);

  return (
    <section className="modular-feature safe-payment-placeholder" data-feature-module="cart" data-safe-payment-placeholder="true">
      <header className="modular-feature-header">
        <h2>Cart</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-placeholder-notice="true">${notice}</p>
        <ul>{items.map((item) => (<li key={item.id}>{item.label} — {item.price}</li>))}</ul>
        <button type="button" data-interaction-control="true">Proceed to checkout</button>
      </div>
    </section>
  );
}
`;
  }

  if (moduleId === 'checkout') {
    return `import { useMemo, useState } from 'react';
import './${moduleId}.module.css';

export default function ${pascal}Feature() {
  const [step, setStep] = useState<'form' | 'review' | 'confirm'>('form');
  const headline = useMemo(() => 'Checkout form, order review, and placebo payment status.', []);

  return (
    <section className="modular-feature safe-payment-placeholder" data-feature-module="checkout" data-safe-payment-placeholder="true">
      <header className="modular-feature-header">
        <h2>Checkout</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-placeholder-notice="true">${notice}</p>
        {step === 'form' && (
          <form data-checkout-form="true" onSubmit={(e) => { e.preventDefault(); setStep('review'); }}>
            <label>Shipping address<input name="address" placeholder="123 Main St" /></label>
            <button type="submit">Review order</button>
          </form>
        )}
        {step === 'review' && (
          <div data-order-review="true">
            <p>Order review — 1 item, total $24.00</p>
            <button type="button" onClick={() => setStep('confirm')}>Place order (simulated)</button>
          </div>
        )}
        {step === 'confirm' && (
          <div data-order-confirmation-mock="true">
            <p data-payment-status="placebo-success">Payment status: placebo success (simulated)</p>
            <p>Order confirmation mock #ORD-${Date.now().toString().slice(-6)}</p>
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
  const headline = useMemo(() => 'Placebo payment status panel — no real transaction execution.', []);

  return (
    <section className="modular-feature safe-payment-placeholder" data-feature-module="payments" data-safe-payment-placeholder="true">
      <header className="modular-feature-header">
        <h2>Payments</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-placeholder-notice="true">${notice}</p>
        <p data-payment-status="placebo-idle">Status: placebo idle</p>
        <p data-no-real-transaction="true">No Stripe, PayPal, or card processor wired.</p>
      </div>
    </section>
  );
}
`;
  }

  if (moduleId === 'orders') {
    return `import { useMemo } from 'react';
import './${moduleId}.module.css';

export default function ${pascal}Feature() {
  const orders = useMemo(() => [{ id: 'ord-1001', label: 'Mock order — placebo paid', total: '$24.00' }], []);
  const headline = useMemo(() => 'Order history with simulated confirmation records.', []);

  return (
    <section className="modular-feature safe-payment-placeholder" data-feature-module="orders" data-safe-payment-placeholder="true">
      <header className="modular-feature-header">
        <h2>Orders</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-placeholder-notice="true">${notice}</p>
        <ul>{orders.map((order) => (<li key={order.id}>{order.label} — {order.total}</li>))}</ul>
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
