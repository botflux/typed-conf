import {type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type RefSchema<T> = BaseSchema<T> & {
  type: 'ref'
  sourceName: string
  refToSourceParams: (ref: string) => Record<string, unknown>
  refSchema: BaseSchemaBuilder<BaseSchema<T>>
}

export interface RefSchemaBuilder<T> extends BaseSchemaBuilder<RefSchema<T>> {
  aliases(...aliases: Alias[]): RefSchemaBuilder<T>
}

class RefBuilder<T> implements RefSchemaBuilder<T> {
  plain: RefSchema<T>;

  constructor(plain: RefSchema<T>) {
    this.plain = plain;
  }

  aliases(...aliases: Alias[]): RefSchemaBuilder<T> {
    return new RefBuilder({
      ...this.plain,
      aliases: [...this.plain.aliases, ...aliases]
    })
  }
}

export function ref<T>(
  schema: BaseSchemaBuilder<BaseSchema<T>>,
  sourceName: string,
  refToSourceParams: (ref: string) => Record<string, unknown>
): RefSchemaBuilder<T> {
  return new RefBuilder({
    [kType]: schema.plain[kType] as T,
    type: 'ref',
    sourceName,
    schema: {
      type: 'string'
    },
    aliases: [],
    refSchema: schema,
    refToSourceParams,
  })
}