import type { TSchema } from "typebox"

export type Leaf = {
	kind: "leaf"
}

export type Branch = {
	kind: "branch"
	children: Record<string, BaseSchema<unknown>>
}

export type BaseSchema<T> = {
	type: T
	schema: TSchema
	structure: Branch | Leaf
}