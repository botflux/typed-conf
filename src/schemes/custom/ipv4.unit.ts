import {describe, it} from "node:test";
import {expect} from "expect";
import {envAlias} from "../../sources/env/alias.js";
import {ipv4} from "./ipv4.js";

describe('ipv4', function () {
  it('should be able to declare an ipv4', function () {
    // Given
    // When
    const schema = ipv4()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      type: 'ipv4',
      jsonSchema: {
        type: 'string',
        format: 'ipv4',
      },
      aliases: [],
    }))
  })

  it('should be able to declare aliases', function () {
    // Given
    // When
    const schema = ipv4({
      aliases: [ envAlias('FOO') ]
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      aliases: [envAlias('FOO')]
    }))
  })

  it('should be able to declare a default value', function () {
    // Given
    // When
    const schema = ipv4({
      defaultValue: '0.0.0.0'
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      defaultValue: '0.0.0.0'
    }))
  })

  it('should be able to mark as deprecated', function () {
    // Given
    // When
    const schema = ipv4({
      deprecated: true
    })

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: true,
      jsonSchema: expect.objectContaining({ deprecated: true }),
    }))
  })

  it('should not be deprecated by default', function () {
    // Given
    // When
    const schema = ipv4()

    // Then
    expect(schema).toEqual(expect.objectContaining({
      deprecated: false,
    }))
  })
})