import type { Pattern } from "@resequence/patterns";
import type { MidiUnit } from "@resequence/units";

export interface RouterOptions {
	readonly pattern?: Pattern;
	readonly ports?: Record<string, MidiUnit>;
}

export class Router {
	readonly type = ["router"] as const;

	private _pattern: Pattern | undefined;
	private readonly _ports: Map<string, MidiUnit>;

	static is(value: unknown): value is Router {
		return typeof value === "object" && value !== null && "type" in value && Array.isArray(value.type) && value.type[0] === "router";
	}

	constructor(options?: RouterOptions) {
		this._pattern = options?.pattern;
		this._ports = new Map(Object.entries(options?.ports ?? {}));
	}

	get pattern(): Pattern | undefined {
		return this._pattern;
	}

	get ports(): ReadonlyMap<string, MidiUnit> {
		return this._ports;
	}

	setPattern(pattern: Pattern): this {
		this._pattern = pattern;
		return this;
	}

	route(portKey: string, unit: MidiUnit): this {
		this._ports.set(portKey, unit);
		return this;
	}
}

export function router(options?: RouterOptions): Router {
	return new Router(options);
}
