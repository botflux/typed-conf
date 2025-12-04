import { describe, it } from "node:test";
import {object} from "./object.js";
import {string} from "./string.js";
import {integer} from "./integer.js";
import {expect} from "expect";
import {array} from "./array.js";
import {union} from "./union.js";
import {kIndex, walk} from "./walk.js";
import {fatUnion} from "./fat-union.js";
import {intersection} from "./intersection.js";

describe('walk', {only: true}, function () {
  it('should be able to walk through an object', function () {
    // Given
    const schema = object({
      host: string(),
      port: integer(),
    })

    // When
    const nodes = Array.from(walk(schema))

    // Then
    expect(nodes).toEqual(
      [
        [[], schema],
        [['host'], schema.props.host],
        [['port'], schema.props.port],
      ]
    )
  })

  it('should be able to walk through nested objects', function () {
    // Given
    const schema = object({
      nested: object({
        foo: integer(),
      })
    })

    // When
    const nodes = Array.from(walk(schema))

    // Then
    expect(nodes).toEqual(
      [
        [[], schema],
        [['nested'], schema.props.nested],
        [['nested', 'foo'], schema.props.nested.props.foo],
      ]
    )
  })

  it('should be able to walk through arrays', function () {
    // Given
    const schema = object({
      ports: array({ item: integer() })
    })

    // When
    const nodes = Array.from(walk(schema))

    // Then
    expect(nodes).toEqual([
      [[], schema],
      [['ports'], schema.props.ports],
      [['ports', kIndex], schema.props.ports.items]
    ])
  })

  it('should be able to walk through array of objects', function () {
    // Given
    const schema = object({
      ports: array({ item: object({ port: integer() }) })
    })

    // When
    const nodes = Array.from(walk(schema))

    // Then
    expect(nodes).toEqual([
      [[], schema],
      [['ports'], array({ item: object({ port: integer() }) })],
      [['ports', kIndex], object({ port: integer() })],
      [['ports', kIndex, 'port'], integer()]
    ])
  })

  it('should be able to walk through unions', function () {
    // Given
    const schema = object({
      port: union([ integer(), string() ])
    })

    // When
    const nodes = Array.from(walk(schema))

    // Then
    expect(nodes).toEqual([
      [[], schema],
      [['port'], union([ integer(), string() ])],
      [['port'], integer()],
      [['port'], string()]
    ])
  })

  it('should be able to walk through unions with nested objects', function () {
    // Given
    const nestedSchema = object({ nested: string() })
    const schema = object({
      value: union([ nestedSchema, string() ])
    })

    // When
    const nodes = Array.from(walk(schema))

    // Then
    expect(nodes).toEqual([
      [[], schema],
      [['value'], schema.props.value],
      [['value'], nestedSchema],
      [['value', 'nested'], nestedSchema.props.nested],
      [['value'], string()]
    ])
  })

  it('should be able to walk through fat unions', function () {
    // Given
    const vaultSchema = object({ secret: string() })
    const fileSchema = object({ path: string() })
    const schema = object({
      certificate: fatUnion({
        vault: vaultSchema,
        file: fileSchema
      })
    })

    // When
    const nodes = Array.from(walk(schema))

    // Then
    expect(nodes).toEqual([
      [[], schema],
      [['certificate'], schema.props.certificate],
      [['certificate'], vaultSchema],
      [['certificate', 'secret'], vaultSchema.props.secret],
      [['certificate'], fileSchema],
      [['certificate', 'path'], fileSchema.props.path]
    ])
  })

  it('should be able to walk through intersections', function () {
    // Given
    const obj1 = object({ name: string() })
    const obj2 = object({ age: integer() })
    const schema = object({
      value: intersection([ obj1, obj2 ])
    })

    // When
    const nodes = Array.from(walk(schema))

    // Then
    expect(nodes).toEqual([
      [[], schema],
      [['value'], schema.props.value],
      [['value', 'name'], obj1.props.name],
      [['value'], obj2],
      [['value', 'age'], obj2.props.age]
    ])
  })
})