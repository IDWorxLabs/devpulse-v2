import { useMemo, useState } from 'react';
import './checkout.module.css';

export default function CheckoutFeature() {
  const [step, setStep] = useState<'form' | 'review' | 'confirm'>('form');
  const headline = useMemo(() => 'Checkout form, order review, and placebo payment status.', []);

  return (
    <section className="modular-feature safe-payment-placeholder" data-feature-module="checkout" data-safe-payment-placeholder="true">
      <header className="modular-feature-header">
        <h2>Checkout</h2>
        <p>{headline}</p>
      </header>
      <div className="modular-feature-body">
        <p className="safe-payment-notice" data-payment-placeholder-notice="true">Payment integration placeholder — no real charges processed</p>
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
            <p>Order confirmation mock #ORD-273971</p>
          </div>
        )}
      </div>
    </section>
  );
}
