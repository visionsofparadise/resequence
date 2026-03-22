const CloseButton = ({
  onClick,
  size = 12,
  className,
}: {
  onClick?: () => void;
  size?: number;
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`group ml-auto h-full aspect-square bg-border hover:bg-accent-primary border-none p-0 cursor-default flex items-center justify-center transition-colors focus-visible:outline focus-visible:outline-1 focus-visible:outline-text-secondary${className ? ` ${className}` : ''}`}
    aria-label="Close"
  >
    <svg width={size} height={size} viewBox="0 0 12 12" className="text-text-primary group-hover:text-surface group-hover:spin-slow transition-colors">
      <line x1="1" y1="1" x2="11" y2="11" stroke="currentColor" strokeWidth="2" />
      <line x1="11" y1="1" x2="1" y2="11" stroke="currentColor" strokeWidth="2" />
    </svg>
  </button>
);

export default CloseButton;
