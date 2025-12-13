import {describe, it} from "node:test";
import {expect} from "expect";
import {integer} from "../integer.js";
import {port} from "./port.js";

describe('port', function () {
  it('should be able to declare a port entry', function () {
    // Given
    // When
    const schema = port()

    // Then
    expect(schema).toEqual(integer({ min: 0, max: 65535 }))
  })

  it('should be able to exclude reserved ports', function () {
    // Given
    // When
    const schema = port({ excludeSystemPorts: true })

    // Then
    expect(schema).toEqual(integer({ min: 1025, max: 65535 }))
  })
})