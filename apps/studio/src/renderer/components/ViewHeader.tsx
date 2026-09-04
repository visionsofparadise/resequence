import { CloseButton } from "@resequence/design-system";

interface ViewHeaderProps {
	readonly title: string;
	readonly unitColor?: string;
	readonly metadata?: Array<{ label: string; className?: string }>;
	readonly onClose: () => void;
	readonly children?: React.ReactNode;
	readonly floating?: boolean;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({
	title,
	unitColor,
	metadata,
	onClose,
	children,
	floating = false,
}) => (
	<div
		className={`flex items-center h-12 border-b border-border ${floating ? "absolute top-0 left-0 right-0 z-10 bg-surface" : ""}`}
	>
		<div className="shrink-0 h-full aspect-square" style={{ backgroundColor: unitColor ?? "var(--color-unit-1)" }} />
		<div className="flex items-center gap-3 py-3 px-4 flex-1">
			<span className="type-display text-[18px] leading-none shrink-0">{title}</span>
			{(metadata ?? children) && (
				<div className="flex flex-col gap-0.5">
					{metadata?.map((item, ix) => (
						<span key={ix} className={`type-label leading-none ${item.className ?? ""}`}>
							{item.label}
						</span>
					))}
					{children}
				</div>
			)}
		</div>
		<CloseButton onClick={onClose} />
	</div>
);
