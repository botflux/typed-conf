import { describe, test } from "node:test"
import assert from "node:assert/strict"
import {DefaultEvaluator} from "./default-evaluator.js";

describe('DefaultEvaluator', function () {
  test("should be able to evaluate a function", async (t) => {
    // Given
    const evaluator = new DefaultEvaluator()
      .registerFunction({
        name: "hello",
        params: [],
        fn: () => "world"
      })

    // When
    const result = await evaluator.evaluate({
      source: "hello",
      args: []
    }, {})

    // Then
    assert.equal(result, "world")
  })

  test("should be able to evaluate a function call with positional args", async (t) => {
    // Given
    const evaluator = new DefaultEvaluator()
      .registerFunction({
        name: "hello",
        params: [
          {
            name: "name",
            type: "string",
            required: true
          }
        ],
        fn: ({ name }) => `Hello ${name}`
      })

    // When
    const result = await evaluator.evaluate({
      source: "hello",
      args: [
        "John"
      ]
    }, {})

    // Then
    assert.equal(result, "Hello John")
  })

  test("should be able to evaluate a function call with named args", async (t) => {
    // Given
    const evaluator = new DefaultEvaluator()
      .registerFunction({
        name: "hello",
        params: [
          {
            name: "name",
            type: "string",
            required: true
          }
        ],
        fn: ({ name }) => `Hello ${name}`
      })

    // When
    const result = await evaluator.evaluate({
      source: "hello",
      args: [],
      namedArgs: {
        name: "John"
      }
    }, {})

    // Then
    assert.deepStrictEqual(result, "Hello John")
  })

  test("should be able to throw an error if the function does not exist", async (t) => {
    // Given
    const evaluator = new DefaultEvaluator()

    // When
    // Then
    await assert.rejects(() => evaluator.evaluate({
      source: "unknown",
      args: []
    }, {}), new Error("Unknown function 'unknown', available functions are: "))
  })

  test("should be able to list the available functions when the expression calls an unknown function", async (t) => {
    // Given
    const evaluator = new DefaultEvaluator()
      .registerFunction({
        name: "hello",
        params: [],
        fn: () => "Hello"
      })
      .registerFunction({
        name: "goodbye",
        params: [],
        fn: () => "Goodbye"
      })

    // When
    // Then
    await assert.rejects(() => evaluator.evaluate({
      source: "unknown",
      args: []
    }, {}), new Error("Unknown function 'unknown', available functions are: hello, goodbye"))
  })

  test("should be able to throw if more params are passed than what the function accepts", async (t) => {
    // Given
    const evaluator = new DefaultEvaluator()
      .registerFunction({
        name: "hello",
        params: [
          {
            name: "name",
            type: "string",
            required: true
          }
        ],
        fn: ({ name }) => `Hello ${name}`
      })

    // When
    // Then
    await assert.rejects(() => evaluator.evaluate({
      source: "hello",
      args: [
        "John",
        "Doe"
      ]
    }, {}), new Error("Function 'hello' expects 1 parameter(s), got 2."))
  })

  test("should be able to throw if there are less passed params that required params", async (t) => {
    // Given
    const evaluator = new DefaultEvaluator()
      .registerFunction({
        name: "hello",
        params: [
          {
            name: "firstName",
            type: "string",
            required: true,
          },
          {
            name: "lastName",
            type: "string",
            required: true,
          }
        ],
        fn: ({ firstName, lastName }) => `Hello ${firstName} ${lastName}`
      })

    // When
    // Then
    await assert.rejects(() => evaluator.evaluate({
      source: "hello",
      args: [
        "John"
      ]
    }, {}), new Error("Function 'hello' expects 2 required parameter(s), got 1."))
  })

  test("should be able to throw an error if a named arg is missing", async (t) => {
    // Given
    const evaluator = new DefaultEvaluator()
      .registerFunction({
        name: "hello",
        params: [
          {
            name: "name",
            type: "string",
            required: true
          }
        ],
        fn: ({ name }) => `Hello ${name}`
      })

    // When
    // Then
    await assert.rejects(() => evaluator.evaluate({
      source: "hello",
      args: [],
      namedArgs: {
        firstName: "John"
      }
    }, {}), new Error("Named argument 'name' is missing for function 'hello'"))
  })
})