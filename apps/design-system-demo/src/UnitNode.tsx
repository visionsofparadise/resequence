import { Knob, ButtonSelection } from "@resequence/design-system";

interface KnobParam {
	type: "knob";
	label: string;
	value: number;
	overridden?: boolean;
}
interface SelectionParam {
	type: "selection";
	label: string;
	options: Array<string>;
	active: string;
}

type Param = KnobParam | SelectionParam;

interface UnitNodeProps {
	name: string;
	controls: Array<Param>;
	hasInput?: boolean;
	hasOutput?: boolean;
}

const PORT_SIZE = 4;

const UnitNode = ({ name, controls, hasInput = false, hasOutput = false }: UnitNodeProps) => {
	const knobs = controls.filter((item): item is KnobParam => item.type === "knob");
	const selections = controls.filter((item): item is SelectionParam => item.type === "selection");

	return (
		<div className="bg-elevated border border-border p-3 w-[200px] relative">
			{hasInput && (
				<div
					className="absolute top-1/2 -translate-y-1/2 rounded-full bg-dimmed"
					style={{ left: -PORT_SIZE / 2 - 1, width: PORT_SIZE, height: PORT_SIZE }}
				/>
			)}
			{hasOutput && (
				<div
					className="absolute top-1/2 -translate-y-1/2 rounded-full bg-dimmed"
					style={{ right: -PORT_SIZE / 2 - 1, width: PORT_SIZE, height: PORT_SIZE }}
				/>
			)}

			<div className="flex items-start justify-between mb-3">
				<span className="type-display text-[16px]">{name}</span>
				<div className="flex flex-col">
					<button className="type-label text-dimmed hover:text-text-primary transition-colors bg-transparent border-none p-0 cursor-pointer leading-none">
						BYP
					</button>
					<button className="type-label text-dimmed hover:text-text-primary transition-colors bg-transparent border-none p-0 cursor-pointer leading-none">
						RST
					</button>
				</div>
			</div>

			{selections.map((sel) => (
				<div key={sel.label} className="mb-3">
					<span className="type-label block mb-1">{sel.label}</span>
					<ButtonSelection
						options={sel.options}
						active={sel.active}
						columns={sel.options.length >= 3 ? 3 : undefined}
					/>
				</div>
			))}

			{knobs.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{knobs.map((knob) => (
						<Knob key={knob.label} value={knob.value} label={knob.label} size={28} overridden={knob.overridden} />
					))}
				</div>
			)}
		</div>
	);
};

export default UnitNode;
export type { Param };
