import './QuantityStepper.css';

interface QuantityStepperProps {
  value: number;
  /** Highest selectable value, e.g. the seller's remaining stock. */
  max: number;
  min?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Accessible name for the group, e.g. "Quantity". */
  label?: string;
}

/** "− 2 +" picker, clamped to [min, max]. Typing a number works too. */
function QuantityStepper({
  value,
  max,
  min = 1,
  onChange,
  disabled = false,
  label = 'Quantity',
}: QuantityStepperProps) {
  const clamp = (next: number) => Math.min(max, Math.max(min, next));

  return (
    <div className="quantity-stepper" role="group" aria-label={label}>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = Number(event.target.value);
          if (Number.isFinite(next)) onChange(clamp(Math.trunc(next)));
        }}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
      >
        +
      </button>
    </div>
  );
}

export default QuantityStepper;
