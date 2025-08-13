import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { isIndirectionExpression, compileIndirectionExpression } from "./indirection-compiler.js"

describe('isIndirectionExpression', () => {
  test("should return true for valid indirection expressions", () => {
    assert.strictEqual(isIndirectionExpression("%vault('secret/data/my_secret', 'foo')"), true)
    assert.strictEqual(isIndirectionExpression("%env('MY_ENV')"), true)
    assert.strictEqual(isIndirectionExpression("%file('config.json', 'database.host')"), true)
  })

  test("should return false for invalid expressions", () => {
    assert.strictEqual(isIndirectionExpression("vault('secret/data/my_secret', 'foo')"), false)
    assert.strictEqual(isIndirectionExpression("%vault:secret"), false)
    assert.strictEqual(isIndirectionExpression("regular string"), false)
    assert.strictEqual(isIndirectionExpression("%vault"), false)
  })
})

describe('compileIndirectionExpression', () => {
  test("should parse vault expression with two arguments", () => {
    const expression = "%vault('secret/data/my_secret', 'foo')"
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "vault",
      args: ["secret/data/my_secret", "foo"]
    })
  })

  test("should parse env expression with one argument", () => {
    const expression = "%env('MY_ENV')"
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "env",
      args: ["MY_ENV"]
    })
  })

  test("should parse file expression with two arguments", () => {
    const expression = "%file('config.json', 'database.host')"
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "file",
      args: ["config.json", "database.host"]
    })
  })

  test("should parse expression with no arguments", () => {
    const expression = "%source()"
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "source",
      args: []
    })
  })

  test("should handle expressions with spaces", () => {
    const expression = "% vault ( 'secret/data/my_secret' , 'foo' )"
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "vault",
      args: ["secret/data/my_secret", "foo"]
    })
  })

  test("should handle double quotes", () => {
    const expression = '%vault("secret/data/my_secret", "foo")'
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "vault",
      args: ["secret/data/my_secret", "foo"]
    })
  })

  test("should handle mixed quotes", () => {
    const expression = "%vault('secret/data/my_secret', \"foo\")"
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "vault",
      args: ["secret/data/my_secret", "foo"]
    })
  })

  test("should handle complex paths and keys", () => {
    const expression = "%vault('secret/data/app/production/database', 'connection_string')"
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "vault",
      args: ["secret/data/app/production/database", "connection_string"]
    })
  })

  test("should throw error for expression not starting with %", () => {
    const expression = "vault('secret/data/my_secret', 'foo')"
    
    assert.throws(
      () => compileIndirectionExpression(expression),
      new Error("Not an indirection expression")
    )
  })

  test("should throw error for empty expression", () => {
    const expression = "%"
    
    assert.throws(
      () => compileIndirectionExpression(expression),
      new Error("Empty expression")
    )
  })

  test("should throw error for missing function name", () => {
    const expression = "%()"
    
    assert.throws(
      () => compileIndirectionExpression(expression),
      new Error("Expected function name")
    )
  })

  test("should throw error for missing opening parenthesis", () => {
    const expression = "%vault"
    
    assert.throws(
      () => compileIndirectionExpression(expression),
      new Error("Expected '(' after function name")
    )
  })

  test("should throw error for missing closing parenthesis", () => {
    const expression = "%vault('secret'"
    
    assert.throws(
      () => compileIndirectionExpression(expression),
      new Error("Expected closing ')'")
    )
  })

  test("should throw error for unclosed string", () => {
    const expression = "%vault('secret"
    
    assert.throws(
      () => compileIndirectionExpression(expression),
      new Error("String is not closed")
    )
  })

  test("should handle single argument with trailing comma", () => {
    const expression = "%env('MY_ENV',)"
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "env",
      args: ["MY_ENV"]
    })
  })

  test("should handle multiple arguments with extra spaces", () => {
    const expression = "%vault( 'secret/data/my_secret' , 'foo' , 'bar' )"
    
    const result = compileIndirectionExpression(expression)
    
    assert.deepStrictEqual(result, {
      source: "vault",
      args: ["secret/data/my_secret", "foo", "bar"]
    })
  })
})