import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { isIndirectionExpression, compileIndirectionExpression } from "../indirection/compiler.js"

describe('isIndirectionExpression', () => {
  const testCases = [
    {
      expression: "%vault('secret/data/my_secret', 'foo')",
      expected: true,
      description: "valid vault expression with arguments"
    },
    {
      expression: "%env('MY_ENV')",
      expected: true,
      description: "valid env expression with single argument"
    },
    {
      expression: "%file('config.json', 'database.host')",
      expected: true,
      description: "valid file expression with arguments"
    },
    {
      expression: "%source()",
      expected: true,
      description: "valid expression with no arguments"
    },
    {
      expression: "%vault:secret",
      expected: true,
      description: "string starting with % (even if malformed)"
    },
    {
      expression: "%vault",
      expected: true,
      description: "string starting with % without parentheses"
    },
    {
      expression: "%",
      expected: true,
      description: "just % character"
    },
    {
      expression: "vault('secret/data/my_secret', 'foo')",
      expected: false,
      description: "expression without % prefix"
    },
    {
      expression: "regular string",
      expected: false,
      description: "regular string"
    },
    {
      expression: "",
      expected: false,
      description: "empty string"
    }
  ]

  for (const testCase of testCases) {
    test(`should return ${testCase.expected} for ${testCase.description}`, () => {
      assert.strictEqual(isIndirectionExpression(testCase.expression), testCase.expected)
    })
  }
})

describe('compileIndirectionExpression', () => {
  const successTestCases = [
    {
      name: "vault expression with two arguments",
      expression: "%vault('secret/data/my_secret', 'foo')",
      expected: {
        source: "vault",
        args: ["secret/data/my_secret", "foo"]
      }
    },
    {
      name: "env expression with one argument",
      expression: "%env('MY_ENV')",
      expected: {
        source: "env",
        args: ["MY_ENV"]
      }
    },
    {
      name: "file expression with two arguments",
      expression: "%file('config.json', 'database.host')",
      expected: {
        source: "file",
        args: ["config.json", "database.host"]
      }
    },
    {
      name: "expression with no arguments",
      expression: "%source()",
      expected: {
        source: "source",
        args: []
      }
    },
    {
      name: "expressions with spaces",
      expression: "% vault ( 'secret/data/my_secret' , 'foo' )",
      expected: {
        source: "vault",
        args: ["secret/data/my_secret", "foo"]
      }
    },
    {
      name: "double quotes",
      expression: '%vault("secret/data/my_secret", "foo")',
      expected: {
        source: "vault",
        args: ["secret/data/my_secret", "foo"]
      }
    },
    {
      name: "mixed quotes",
      expression: "%vault('secret/data/my_secret', \"foo\")",
      expected: {
        source: "vault",
        args: ["secret/data/my_secret", "foo"]
      }
    },
    {
      name: "complex paths and keys",
      expression: "%vault('secret/data/app/production/database', 'connection_string')",
      expected: {
        source: "vault",
        args: ["secret/data/app/production/database", "connection_string"]
      }
    },
    {
      name: "single argument with trailing comma",
      expression: "%env('MY_ENV',)",
      expected: {
        source: "env",
        args: ["MY_ENV"]
      }
    },
    {
      name: "multiple arguments with extra spaces",
      expression: "%vault( 'secret/data/my_secret' , 'foo' , 'bar' )",
      expected: {
        source: "vault",
        args: ["secret/data/my_secret", "foo", "bar"]
      }
    },
    {
      name: "named arguments",
      expression: "%vault(path='secret/data/my_secret', key='foo')",
      expected: {
        source: "vault",
        args: [],
        namedArgs: {
          path: "secret/data/my_secret",
          key: "foo"
        }
      }
    },
    {
      name: "single named argument",
      expression: "%env(name='MY_ENV')",
      expected: {
        source: "env",
        args: [],
        namedArgs: {
          name: "MY_ENV"
        }
      }
    },
    {
      name: "named arguments with spaces",
      expression: "% vault ( path = 'secret/data/my_secret' , key = 'foo' )",
      expected: {
        source: "vault",
        args: [],
        namedArgs: {
          path: "secret/data/my_secret",
          key: "foo"
        }
      }
    },
    {
      name: "named arguments with double quotes",
      expression: '%vault(path="secret/data/my_secret", key="foo")',
      expected: {
        source: "vault",
        args: [],
        namedArgs: {
          path: "secret/data/my_secret",
          key: "foo"
        }
      }
    },
    {
      name: "complex named arguments",
      expression: "%vault(path='secret/data/app/production/database', key='connection_string', version='v2')",
      expected: {
        source: "vault",
        args: [],
        namedArgs: {
          path: "secret/data/app/production/database",
          key: "connection_string",
          version: "v2"
        }
      }
    }
  ]

  for (const testCase of successTestCases) {
    test(`should parse ${testCase.name}`, () => {
      const result = compileIndirectionExpression(testCase.expression)
      assert.deepStrictEqual(result, testCase.expected)
    })
  }

  const errorTestCases = [
    {
      name: "expression not starting with %",
      expression: "vault('secret/data/my_secret', 'foo')",
      expectedError: "Not an indirection expression"
    },
    {
      name: "empty expression",
      expression: "%",
      expectedError: "Empty expression"
    },
    {
      name: "missing function name",
      expression: "%()",
      expectedError: "Expected function name"
    },
    {
      name: "missing opening parenthesis",
      expression: "%vault",
      expectedError: "Expected '(' after function name"
    },
    {
      name: "missing closing parenthesis",
      expression: "%vault('secret'",
      expectedError: "Expected closing ')'"
    },
    {
      name: "unclosed string",
      expression: "%vault('secret",
      expectedError: "String is not closed"
    },
    {
      name: "mixing positional and named arguments",
      expression: "%vault('secret/data/my_secret', key='foo')",
      expectedError: "Cannot mix positional and named arguments"
    },
    {
      name: "mixing named and positional arguments",
      expression: "%vault(path='secret/data/my_secret', 'foo')",
      expectedError: "Cannot mix positional and named arguments"
    },
    {
      name: "missing equals after parameter name",
      expression: "%vault(path 'secret/data/my_secret')",
      expectedError: "Expected '=' after parameter name"
    },
    {
      name: "missing value after equals",
      expression: "%vault(path=)",
      expectedError: "Expected string value after '='"
    }
  ]

  for (const testCase of errorTestCases) {
    test(`should throw error for ${testCase.name}`, () => {
      assert.throws(
        () => compileIndirectionExpression(testCase.expression),
        new Error(testCase.expectedError)
      )
    })
  }
})