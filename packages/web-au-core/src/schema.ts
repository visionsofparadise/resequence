import type { z } from "zod";
import type { LiveParameter, Parameter } from "./parameter";

declare const LIVE_BRAND: unique symbol;
export type LiveSchema<T extends z.ZodType = z.ZodType> = T & { readonly [LIVE_BRAND]: true };

export function live<T extends z.ZodType>(schema: T): LiveSchema<T> {
	return schema.meta({ live: true }) as LiveSchema<T>;
}

type SomeType = z.core.SomeType;

export type InferParameterField<T extends SomeType> =
	T extends LiveSchema ? LiveParameter
	: T extends z.ZodDefault<infer Inner> ? InferParameterField<Inner>
	: T extends z.ZodOptional<infer Inner> ? InferParameterField<Inner> | null
	: T extends z.ZodObject<infer Shape> ? { [K in keyof Shape]: InferParameterField<Shape[K]> }
	: T extends z.ZodArray<infer El> ? El extends z.ZodObject<infer _S> ? Array<InferParameterField<El>> : Parameter<z.infer<T>>
	: Parameter<z.infer<T>>;

export type InferParameters<S extends z.ZodObject> = {
	[K in keyof S["shape"]]: InferParameterField<S["shape"][K]>
};
