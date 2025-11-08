import {describe, it} from "node:test";
import {string} from "./string.js";
import {expect} from "expect";
import {type Alias, type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import type {Visitor} from "../visitor/visitor.js";

export interface ArraySchemaBuilder<T> extends BaseSchemaBuilder<BaseSchema<T[]>> {
}

export type ArraySchema<T> = BaseSchema<T[]> & {
  type: 'array'
  items: BaseSchemaBuilder<BaseSchema<T>>
}

export class ArraySchemaBuilderCls<T> implements ArraySchemaBuilder<T> {
  schema: ArraySchema<T>

  constructor(schema: BaseSchemaBuilder<BaseSchema<T>>) {
    this.schema = {
      type: 'array',
      secret: false,
      optional: false,
      [kType]: "" as unknown as T[],
      aliases: [],
      items: schema,
      schema: {
        type: 'array',
        items: schema.schema.schema,
      },
      coerce: v => v,
      accept<R>(visitor: Visitor<R>): R {
        throw new Error("Not implemented at line 32 in array.unit.ts")
      }
    }
  }

  optional(): this {
    throw new Error("Method not implemented.");
  }

  aliases(...aliases: Alias[]): this {
    throw new Error("Method not implemented.");
  }

  secret(): this {
    throw new Error("Method not implemented.");
  }
}

function array<T>(builder: BaseSchemaBuilder<BaseSchema<T>>): ArraySchemaBuilder<T> {
  return new ArraySchemaBuilderCls(builder)
}

describe('array', function () {
  it('should be able to declare an array type', function () {
    // Given
    // When
    const schema = array(string())

    // Then
    expect(schema.schema.schema).toEqual({
      type: 'array',
      items: {
        type: 'string'
      }
    })
  })
})