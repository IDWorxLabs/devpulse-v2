import { useMemo, useState } from 'react';
import './cart.module.css';

export default function CartFeature() {
  const [items] = useState([{ id: 'item-1', label: 'Sample product', price: '$24.00' }]);
  const headline = useMemo(() => 'Review cart items before checkout.', []);

  return (
    <section className="modular-feature safe-payment-placeholder" data-feature-module="cart" data-safe-payment-placeholder="true">
      <header className="modular-feature-header">
        <h2>Cart</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-placeholder-notice="true">Payment integration placeholder — no real charges processed</p>
        <ul>{items.map((item) => (<li key={item.id}>{item.label} — {item.price}</li>))}</ul>
        <button type="button" data-interaction-control="true">Proceed to checkout</button>
      </div>
    </section>
  );
}
