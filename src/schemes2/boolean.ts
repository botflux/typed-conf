import {type BaseSchema, kType} from "./base.js";
import type {Alias} from "../schemes/base.js";

export type BooleanSchema<T> = BaseSchema<T> & {
  type: 'boolean'
}

export interface BooleanSchemaBuilder<T> {
  plain: BooleanSchema<T>
  aliases(...aliases: Alias[]): BooleanSchemaBuilder<T>;
}

class BooleanBuilder<T> implements BooleanSchemaBuilder<T> {
  plain: BooleanSchema<T>

  constructor(plain: BooleanSchema<T>) {
    this.plain = plain;
  }

  aliases(...aliases: Alias[]): BooleanSchemaBuilder<T> {
    return new BooleanBuilder({
      ...this.plain,
      aliases: [...this.plain.aliases, ...aliases],
    })
  }
}

export function boolean(): BooleanSchemaBuilder<boolean> {
  return new BooleanBuilder({
    type: 'boolean',
    schema: {
      type: 'boolean'
    },
    aliases: [],
    [kType]: true
  })
}