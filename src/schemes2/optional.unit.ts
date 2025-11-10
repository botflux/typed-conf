import {describe, it} from "node:test";
import {string} from "./string.js";
import {expect} from "expect";
import {type BaseSchema, type BaseSchemaBuilder, kType} from "./base.js";
import {expectTypeOf} from "expect-type";

export type SchemaType<S> = S extends BaseSchema<infer T> ? T : never

export type OptionalSchema<S extends BaseSchema<unknown>> = BaseSchema<SchemaType<S> | undefined> & {
  type: 'optional'
  inner: BaseSchemaBuilder<S>
}

export function optional<S extends BaseSchema<unknown>>(schema: BaseSchemaBuilder<S>): OptionalSchema<S> {
  return {
    type: 'optional',
    optional: true,
    inner: schema,
    schema: schema.plain.schema,
    [kType]: '' as unknown as (SchemaType<S> | undefined),
    secret: false,
    aliases: []
  }
}

describe('optional', function () {
  it('should be able to declare an optional type', function () {
    // Given
    // When
    const schema = optional(string())

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'optional',
      inner: string()
    }))
  })

  it('should make the underlying schema type nullable', function () {
    // Given
    // When
    const schema = optional(string())

    // Then
    expectTypeOf(schema[kType]).toEqualTypeOf<string | undefined>()
  })
})