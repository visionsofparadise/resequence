import { CloseButton } from '@resequence/design-system';

interface ViewHeaderProps {
  title: string;
  unitColor?: string;
  metadata?: Array<{ label: string; className?: string }>;
  children?: React.ReactNode;
  borderVisible?: boolean;
  floating?: boolean;
}

const ViewHeader = ({
  title,
  unitColor = 'bg-unit-1',
  metadata,
  children,
  borderVisible = true,
  floating = false,
}: ViewHeaderProps) => (
  <div
    className={`flex items-center h-12 ${borderVisible ? 'border-b border-border' : 'border-b border-surface'} ${floating ? 'absolute top-0 left-0 right-0 z-10 bg-surface' : ''}`}
  >
    <div className={`shrink-0 ${unitColor} ${floating ? 'self-stretch' : 'h-full'} aspect-square`} />
    <div className="flex items-center gap-3 py-3 px-4 flex-1">
      <span className="type-display text-[24px] leading-none shrink-0">{title}</span>
      {(metadata ?? children) && (
        <div className="flex flex-col gap-0.5">
          {metadata?.map((item, ix) => (
            <span key={ix} className={`type-label leading-none ${item.className ?? ''}`}>
              {item.label}
            </span>
          ))}
          {children}
        </div>
      )}
    </div>
    <CloseButton />
  </div>
);

export default ViewHeader;
