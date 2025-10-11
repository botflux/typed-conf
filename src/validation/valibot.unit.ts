import {describe, test} from "node:test";
import {ValibotValidator} from "./valibot.js";
import {c} from "../loader.js";
import assert from "node:assert/strict";

describe("schemes validation", () => {
  const validator = new ValibotValidator()

  describe('string', function () {
    test("should be able to declare a string", (t) => {
      // Given
      const schema = c.object({
        hostname: c.string()
      })

      const data = {hostname: true}

      // When
      // Then
      assert.throws(
        () => validator.validate(schema.schema, data)
      )
    })
  })
})