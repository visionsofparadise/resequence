import { Meter, Fader } from "@resequence/design-system";

interface Channel {
	readonly name: string;
	readonly color: string;
}

interface MixerPopoverProps {
	readonly channels: ReadonlyArray<Channel>;
}

export const MixerPopover: React.FC<MixerPopoverProps> = ({ channels }) => (
	<div className="flex gap-3 bg-elevated border border-border" style={{ padding: "8px 10px" }}>
		{channels.map((channel) => (
			<div key={channel.name} className="flex flex-col items-center gap-2" style={{ width: 36 }}>
				<div className="flex items-center gap-1" style={{ height: 80 }}>
					<Meter level={0.4} height={80} />
					<Fader value={0.75} label="" height={80} />
				</div>
				<div
					className="shrink-0"
					style={{
						width: 6,
						height: 6,
						backgroundColor: channel.color,
					}}
				/>
				<span className="type-label text-[8px] text-center" style={{ lineHeight: 1.2 }}>
					{channel.name}
				</span>
			</div>
		))}
	</div>
);
