import './OrderProgress.css';

export type TrackableOrderStatus = 'PLACED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

const steps = [
  { status: 'PLACED', label: 'Order placed' },
  { status: 'PROCESSING', label: 'Preparing' },
  { status: 'SHIPPED', label: 'Shipped' },
  { status: 'DELIVERED', label: 'Delivered' },
] as const;

const statusIndex: Record<Exclude<TrackableOrderStatus, 'CANCELLED'>, number> = {
  PLACED: 0,
  PROCESSING: 1,
  SHIPPED: 2,
  DELIVERED: 3,
};

function DeliveryTruck() {
  return (
    <svg viewBox="0 0 48 30" role="img" aria-label="Delivery vehicle">
      <path d="M3 4h25v17H3zM28 10h9l7 7v4H28z" />
      <path d="M32 13h4l4 4h-8z" className="truck-window" />
      <circle cx="12" cy="23" r="4" />
      <circle cx="36" cy="23" r="4" />
    </svg>
  );
}

interface OrderProgressProps {
  status: string;
  compact?: boolean;
}

export default function OrderProgress({ status, compact = false }: OrderProgressProps) {
  const normalized = status as TrackableOrderStatus;

  if (normalized === 'CANCELLED') {
    return <div className="order-progress-cancelled">Journey stopped · Order cancelled</div>;
  }

  const currentIndex = statusIndex[normalized] ?? 0;
  const progress = (currentIndex / (steps.length - 1)) * 100;

  return (
    <div
      className={`order-progress ${compact ? 'order-progress-compact' : ''}`}
      aria-label={`Delivery progress: ${steps[currentIndex].label}`}
    >
      <div className="order-progress-track" aria-hidden="true">
        <span className="order-progress-fill" style={{ width: `${progress}%` }} />
        <span className="order-progress-truck" style={{ left: `${progress}%` }}>
          <DeliveryTruck />
        </span>
      </div>
      <ol>
        {steps.map((step, index) => (
          <li
            key={step.status}
            className={`${index <= currentIndex ? 'is-complete' : ''} ${index === currentIndex ? 'is-current' : ''}`}
          >
            <span className="order-progress-dot" aria-hidden="true" />
            <span className="order-progress-label">{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
