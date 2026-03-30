import type { z } from "zod";
import type { InferParameters } from "./schema";

export class Parameter<T> {
	value: T;

	constructor(value: T) {
		this.value = value;
	}
}

export class LiveParameter {
	readonly path: string | null;
	value: number;
	readonly min: number;
	readonly max: number;
	private boundParam: AudioParam | null = null;
	private driven = false;
	private listeners = new Set<(value: number) => void>();

	constructor(path: string | null, value: number, min: number, max: number) {
		this.path = path;
		this.value = value;
		this.min = min;
		this.max = max;
	}

	get normalized(): number {
		return (this.value - this.min) / (this.max - this.min);
	}

	get audioParam(): AudioParam | null {
		return this.boundParam;
	}

	bind(param: AudioParam | null, driven: boolean): void {
		this.boundParam = param;
		this.driven = driven;
	}

	set(value: number): void {
		this.value = value;
		if (this.boundParam) this.boundParam.value = this.driven ? this.normalized : value;
		for (const listener of this.listeners) listener(value);
	}

	subscribe(listener: (value: number) => void): () => void {
		this.listeners.add(listener);

		return () => {
			this.listeners.delete(listener);
		};
	}
}

/**
 * Unwrap optional and default wrappers to get to the core Zod type.
 * Returns the innermost schema and any default value found during unwrapping.
 */
function unwrapField(field: z.ZodType): { inner: z.ZodType; defaultValue: unknown } {
	let current = field;
	let defaultValue: unknown = undefined;

	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	while (true) {
		const type = (current as unknown as { _zod: { def: { type: string } } })._zod.def.type;

		if (type === "default") {
			defaultValue = (current as unknown as { _zod: { def: { defaultValue: unknown } } })._zod.def.defaultValue;
			current = (current as unknown as { unwrap(): z.ZodType }).unwrap();
		} else if (type === "optional") {
			current = (current as unknown as { unwrap(): z.ZodType }).unwrap();
		} else {
			break;
		}
	}

	return { inner: current, defaultValue };
}

function getDefType(field: z.ZodType): string {
	return (field as unknown as { _zod: { def: { type: string } } })._zod.def.type;
}

function getMinValue(field: z.ZodType): number | undefined {
	return (field as unknown as { minValue?: number }).minValue;
}

function getMaxValue(field: z.ZodType): number | undefined {
	return (field as unknown as { maxValue?: number }).maxValue;
}

function unwrapElement(field: z.ZodType): z.ZodType {
	return (field as unknown as { unwrap(): z.ZodType }).unwrap();
}

function getShape(field: z.ZodType): Record<string, z.ZodType> {
	return (field as unknown as { shape: Record<string, z.ZodType> }).shape;
}

export function createParameters<S extends z.ZodObject>(
	input: object,
	schema: S,
): InferParameters<S> {
	const result: Record<string, unknown> = {};

	const id = (input as { id?: string }).id ?? null;
	const props = input as Record<string, unknown>;

	for (const [key, field] of Object.entries(getShape(schema))) {
		const meta = ((field as unknown as { meta(): Record<string, unknown> | undefined }).meta() ?? {});
		const { inner, defaultValue } = unwrapField(field);
		const innerType = getDefType(inner);
		const propValue = props[key];

		if (innerType === "optional" || innerType === "default") {
			// Should not happen after unwrapping, but guard defensively
			result[key] = new Parameter(propValue ?? defaultValue ?? null);
		} else if (innerType === "number" && meta.live === true) {
			const value = (propValue as number | undefined) ?? (defaultValue as number | undefined) ?? 0;
			const min = getMinValue(inner) ?? 0;
			const max = getMaxValue(inner) ?? 1;
			const path = id ? `${id}.${key}` : null;

			result[key] = new LiveParameter(path, value, min, max);
		} else if (innerType === "object") {
			const nestedId = id ? `${id}.${key}` : null;
			const nestedProps = (propValue as Record<string, unknown> | undefined) ?? {};

			result[key] = createParameters({ ...nestedProps, id: nestedId }, inner as z.ZodObject);
		} else if (innerType === "array") {
			const elementSchema = unwrapElement(inner);
			const elementType = getDefType(elementSchema);
			const items = (propValue as Array<unknown> | undefined) ?? [];

			if (elementType === "object") {
				result[key] = items.map((item, index) => {
					const nestedId = id ? `${id}.${key}.${index}` : null;

					return createParameters({ ...((item ?? {}) as Record<string, unknown>), id: nestedId }, elementSchema as z.ZodObject);
				});
			} else {
				result[key] = new Parameter(propValue ?? defaultValue ?? []);
			}
		} else {
			// Structural parameter: enum, string, boolean, etc.
			result[key] = new Parameter(propValue ?? defaultValue ?? null);
		}
	}

	return result as InferParameters<S>;
}

export function clearLiveParameters(target: unknown): void {
	if (target instanceof LiveParameter) {
		target.bind(null, false);

		return;
	}

	if (Array.isArray(target)) {
		for (const item of target) clearLiveParameters(item);

		return;
	}

	if (typeof target === "object" && target !== null) {
		for (const entry of Object.values(target)) clearLiveParameters(entry);
	}
}
