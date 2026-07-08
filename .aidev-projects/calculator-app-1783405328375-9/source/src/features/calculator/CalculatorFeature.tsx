import { useCallback, useMemo, useState } from 'react';
import './calculator.module.css';

type Operator = '+' | '-' | '×' | '÷';

function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return 'Error';
  const text = String(value);
  return text.length > 12 ? value.toExponential(6) : text;
}

export default function CalculatorFeature() {
  const [display, setDisplay] = useState('0');
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const currentValue = useMemo(() => {
    const parsed = Number.parseFloat(display);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [display]);

  const applyOperator = useCallback((left: number, right: number, op: Operator): number => {
    switch (op) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '×':
        return left * right;
      case '÷':
        return right === 0 ? Number.NaN : left / right;
      default:
        return right;
    }
  }, []);

  const inputDigit = useCallback((digit: string) => {
    setDisplay((prev) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return digit;
      }
      if (prev === '0') return digit;
      if (prev.length >= 12) return prev;
      return prev + digit;
    });
  }, [waitingForOperand]);

  const inputDecimal = useCallback(() => {
    setDisplay((prev) => {
      if (waitingForOperand) {
        setWaitingForOperand(false);
        return '0.';
      }
      return prev.includes('.') ? prev : prev + '.';
    });
  }, [waitingForOperand]);

  const clearAll = useCallback(() => {
    setDisplay('0');
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  }, []);

  const deleteLast = useCallback(() => {
    setDisplay((prev) => {
      if (waitingForOperand || prev.length <= 1 || prev === 'Error') return '0';
      const next = prev.slice(0, -1);
      return next.length === 0 || next === '-' ? '0' : next;
    });
  }, [waitingForOperand]);

  const chooseOperator = useCallback((nextOperator: Operator) => {
    setDisplay((prev) => {
      const value = Number.parseFloat(prev);
      const resolved = Number.isFinite(value) ? value : 0;
      if (storedValue !== null && operator && !waitingForOperand) {
        const result = applyOperator(storedValue, resolved, operator);
        const formatted = formatDisplay(result);
        setStoredValue(result);
        setOperator(nextOperator);
        setWaitingForOperand(true);
        return formatted;
      }
      setStoredValue(resolved);
      setOperator(nextOperator);
      setWaitingForOperand(true);
      return prev;
    });
  }, [applyOperator, operator, storedValue, waitingForOperand]);

  const equals = useCallback(() => {
    if (operator === null || storedValue === null) return;
    const result = applyOperator(storedValue, currentValue, operator);
    setDisplay(formatDisplay(result));
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  }, [applyOperator, currentValue, operator, storedValue]);

  const buttons = [
    { label: 'C', action: clearAll, className: 'utility' },
    { label: '⌫', action: deleteLast, className: 'utility' },
    { label: '÷', action: () => chooseOperator('÷'), className: 'operator' },
    { label: '×', action: () => chooseOperator('×'), className: 'operator' },
    { label: '7', action: () => inputDigit('7'), className: 'digit' },
    { label: '8', action: () => inputDigit('8'), className: 'digit' },
    { label: '9', action: () => inputDigit('9'), className: 'digit' },
    { label: '-', action: () => chooseOperator('-'), className: 'operator' },
    { label: '4', action: () => inputDigit('4'), className: 'digit' },
    { label: '5', action: () => inputDigit('5'), className: 'digit' },
    { label: '6', action: () => inputDigit('6'), className: 'digit' },
    { label: '+', action: () => chooseOperator('+'), className: 'operator' },
    { label: '1', action: () => inputDigit('1'), className: 'digit' },
    { label: '2', action: () => inputDigit('2'), className: 'digit' },
    { label: '3', action: () => inputDigit('3'), className: 'digit' },
    { label: '=', action: equals, className: 'equals' },
    { label: '0', action: () => inputDigit('0'), className: 'digit wide' },
    { label: '.', action: inputDecimal, className: 'digit' },
  ] as const;

  return (
    <section
      className="calculator-feature"
      data-feature-module="calculator"
      data-modular-feature-v1="true"
      data-prompt-terms="calculator,numbers,operators,equals,clear"
    >
      <header className="calculator-header">
        <h1>calculator</h1>
        <p>Number pad with + − × ÷, clear, delete, and equals.</p>
      </header>
      <output className="calculator-display" aria-live="polite" data-testid="calculator-display">
        {display}
      </output>
      <div className="calculator-keypad" role="group" aria-label="Calculator keypad">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            className={`calculator-key ${button.className}`}
            onClick={button.action}
            data-operator={button.className === 'operator' ? button.label : undefined}
            data-digit={button.className === 'digit' || button.className === 'digit wide' ? button.label : undefined}
          >
            {button.label}
          </button>
        ))}
      </div>
    </section>
  );
}
