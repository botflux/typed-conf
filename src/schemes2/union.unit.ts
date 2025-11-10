import {describe, it} from "node:test";
import {string} from "./string.js";
import {integer} from "./integer.js";
import {expect} from "expect";
import {type BaseSchema, kType} from "./base.js";
import {envAlias} from "../sources/envs/envs.js";
import type {Alias} from "../schemes/base.js";

export type UnionSchema<S extends BaseSchema<unknown>> = BaseSchema<S[typeof kType]> & {
  type: 'union'
  schemes: S[]
}

export type UnionOpts = {
  aliases?: Alias[];
}

function union<S extends BaseSchema<unknown>>(schemes: S[], opts: UnionOpts = {}): UnionSchema<S> {
  const { aliases = [] } = opts;

  return {
    type: 'union',
    schemes,
    [kType]: '' as unknown as S[typeof kType],
    schema: {
      type: 'object',
      oneOf: schemes.map(s => s.schema)
    },
    aliases
  }
}

describe('union', function () {
  it('should be able to declare an union', function () {
    // Given
    // When
    const schema = union([
      string(),
      integer(),
    ])

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'union',
      schemes: [
        string(),
        integer(),
      ],
      schema: {
        type: 'object',
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'integer'
          }
        ]
      }
    }))
  })

  it('should have no aliases by default', function () {
    // Given

    // When
    const schema = union([ integer(), string() ])

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: []
    }))
  })

  it('should be able to declare an alias', function () {
    // Given
    // When
    const schema = union([ string(), integer() ], {
      aliases: [ envAlias('FOO') ]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })
})