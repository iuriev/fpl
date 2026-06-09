import styles from './FilterChipBar.module.css';

export interface FilterChipBarProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function FilterChipBar<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: FilterChipBarProps<T>) {
  return (
    <div className={styles.bar} role="tablist" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={value === opt.value}
          className={`${styles.chip} ${value === opt.value ? styles.chipActive : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
