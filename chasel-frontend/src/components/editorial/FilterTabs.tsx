import './FilterTabs.css';

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  /** Optional trailing count, rendered muted next to the label. */
  count?: number;
}

interface FilterTabsProps<T extends string> {
  ariaLabel: string;
  options: readonly FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /**
   * `pill` — solid ink block on the active option (browse categories).
   * `underline` — rule under the active option (message folders).
   */
  variant?: 'pill' | 'underline';
}

/**
 * One horizontal row of mutually exclusive filters. Both editorial pages use
 * the same control with different weights, so the behaviour lives here once.
 */
function FilterTabs<T extends string>({
  ariaLabel,
  options,
  value,
  onChange,
  variant = 'pill',
}: FilterTabsProps<T>) {
  return (
    <div className={`ed-tabs ed-tabs-${variant}`} role="tablist" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            type="button"
            role="tab"
            key={option.value}
            className={`ed-tab ${isActive ? 'active' : ''}`}
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
          >
            {option.label}
            {option.count !== undefined && (
              <span className="ed-tab-count">{option.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default FilterTabs;
