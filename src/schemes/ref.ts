import {type Alias, type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Visitor} from "../visitor/visitor.js";

export type RefSchema<T> = {
  type: "ref"
  targetSchema: BaseSchemaBuilder<BaseSchema<T>>
  sourceName: string
  toSourceParams: (ref: string) => Record<string, unknown>
} & BaseSchema<T>

export interface RefSchemaBuilder<T> extends BaseSchemaBuilder<RefSchema<T>> {
  secret(): this
}

export class RefSchemaBuilderCls<T> implements RefSchemaBuilder<T> {
  schema: RefSchema<T>


  constructor(
    targetSchema: BaseSchemaBuilder<BaseSchema<T>>,
    sourceName: string,
    toSourceParams: (ref: string) => Record<string, unknown>
  ) {
    this.schema = {
      type: "ref",
      [kType]: "" as unknown as T,
      secret: false,
      optional: false,
      accept<R>(visitor: Visitor<R>): R {
        throw new Error("Not implemented at line 19 in ref.ts")
      },
      aliases: [],
      schema: {
        type: "string"
      },
      targetSchema,
      sourceName,
      toSourceParams
    };
  }

  secret(): this {
    this.schema.secret = true
    return this
  }

  optional(): this {
    this.schema.optional = true
    return this
  }

  aliases(...aliases: Alias[]): this {
    this.schema.aliases = [...this.schema.aliases, ...aliases]
    return this
  }

}

export function ref<T>(target: BaseSchemaBuilder<BaseSchema<T>>, sourceName: string, toSourceParams: (ref: string) => Record<string, unknown>): RefSchemaBuilder<T> {
  return new RefSchemaBuilderCls(target, sourceName, toSourceParams)
}

export function isRef(schema: BaseSchema<unknown>): schema is RefSchema<unknown> {
  return "type" in schema && schema.type === "ref"
}