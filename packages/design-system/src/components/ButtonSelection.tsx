const ButtonSelection = ({
  options,
  active,
  onSelect,
  columns,
  className,
}: {
  options: Array<string>;
  active: string;
  onSelect?: (option: string) => void;
  columns?: number;
  className?: string;
}) => (
  <div
    className={`${columns ? 'grid gap-1' : 'flex flex-wrap gap-1'}${className ? ` ${className}` : ''}`}
    style={columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined}
  >
    {options.map((option) => (
      <button
        key={option}
        onClick={() => onSelect?.(option)}
        className={`type-label transition-colors px-2 py-1 cursor-pointer border-none ${
          option === active
            ? 'bg-text-primary text-surface'
            : 'bg-transparent text-text-secondary hover:text-text-primary'
        }`}
        aria-label={option}
      >
        {option}
      </button>
    ))}
  </div>
);

export default ButtonSelection;
