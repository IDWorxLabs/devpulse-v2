import { useMemo } from 'react';
import './orders.module.css';

export default function OrdersFeature() {
  const orders = useMemo(() => [{ id: 'ord-1001', label: 'Mock order — placebo paid', total: '$24.00' }], []);
  const headline = useMemo(() => 'Order history with simulated confirmation records.', []);

  return (
    <section className="modular-feature safe-payment-placeholder" data-feature-module="orders" data-safe-payment-placeholder="true">
      <header className="modular-feature-header">
        <h2>Orders</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-placeholder-notice="true">Payment integration placeholder — no real charges processed</p>
        <ul>{orders.map((order) => (<li key={order.id}>{order.label} — {order.total}</li>))}</ul>
      </div>
    </section>
  );
}
