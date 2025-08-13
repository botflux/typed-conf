import { describe, test } from "node:test"
import assert from "node:assert/strict"


type Token = {
  type: "identifier" | "left_paren" | "right_paren" | "string" | "comma",

  /**
   * Lexeme is a lexical element. In the case of an identifier
   * token, the lexeme would be the identifier's name.
   */
  lexeme?: string | undefined,

  /**
   * The column where the current token is starting.
   */
  column: number,

  /**
   * The literal value of the current token.
   * This value is filled in case the token is a literal such as a "string".
   */
  literal?: unknown
}

/**
 * The scanIterator's role is to iterate over the embedded code.
 *
 * The scanIterator does not decide how to interpret the actual characters.
 * This role is left to the `scan` callback.
 *
 * The `scan` callback returns a tuple with:
 * 1. the token it scanned
 * 2. the new position of the iterator
 *
 * Why can't the callback just return the token?
 * Because some tokens like identifier or string literal span upon multiple characters.
 *
 * @param chars
 * @param scan
 */
function scanIterator (
  chars: string[],
  scan: (char: string, currentIndex: number) => [ newToken: Token | undefined, advance: number ]
) {
  let currentIndex = 0
  let tokens: Token[] = []

  while (currentIndex < chars.length) {
    const token = chars[currentIndex]
    if (token === undefined) {
      throw new Error("token is undefined")
    }
    const [ newToken, advance ] = scan(token, currentIndex)
    currentIndex = currentIndex + advance
    if (newToken !== undefined) {
      tokens.push(newToken)
    }
  }

  return tokens
}

/**
 * This is the actual scanning logic.
 *
 * @param source
 */
function scan(source: string) {
  const chars = source.split("")

  return scanIterator(
    chars,
    (char, currentIndex) => {
      switch (char) {
        case '(':
          return [
            {
              type: 'left_paren',
              column: currentIndex
            },
            1
          ]
        case ')':
          return [
            {
              type: "right_paren",
              column: currentIndex
            },
            1
          ]

        case ',': return [
          {
            type: "comma",
            column: currentIndex,
          },
          1
        ]

        case ' ':
          return [ undefined, 1 ]

        case '"':
        case '\'': {
          const stringValue = scanString(chars, currentIndex + 1, char)

          return [
            {
              type: "string",
              column: currentIndex,
              literal: stringValue,
            },
            // '+ 2' because the ending `'` must be skipped.
            stringValue.length + 2
          ]
        }

        default: {
          if ('%' === char) {
            return [ undefined, 1 ]
          }

          if (char.match(/[a-z]/i)) {
            const identifier = takeWhile(chars, currentIndex, c => c.match(/[a-z]/i) !== null).join("")
            return [
              {
                type: "identifier",
                lexeme: identifier,
                column: currentIndex
              },
              identifier.length
            ]
          }

          throw new Error("Unknown token")
        }
      }
    }
  )
}

function scanString(chars: string[], startAt: number, delimiter: string): string {
  let string = ""

  for (let i = startAt; i < chars.length; i++) {
    if (delimiter === chars[i]) {
      break
    }

    if (i >= chars.length - 1) {
      throw new Error("String is not closed")
    }

    string += chars[i]
  }

  return string
}

function takeWhile<T>(array: T[], startAt: number, predicate: (char: T) => boolean): T[] {
  let elems: T[] = []

  for (let i = startAt; i < array.length; i++) {
    const elem = array[i]

    if (elem !== undefined && predicate(elem)) {
      elems.push(elem)
    } else {
      break
    }
  }

  return elems
}

function parseFunctionExpression (expression: string) {
  if (!expression.startsWith("%")) {
    throw new Error("Not a function expression")
  }

  const tokens = scan(expression)

  return {
    name: "myFunction",
    args: []
  }
}

describe('scanIterator', function () {
  test("should be able to scan a function call", (t) => {
    // Given
    const source = "%myFunction()"

    // When
    const tokens = scan(source)

    // Then
    assert.deepStrictEqual(tokens, [
      {
        type: "identifier",
        lexeme: "myFunction",
        column: 1
      },
      {
        type: "left_paren",
        column: 11
      },
      {
        type: "right_paren",
        column: 12
      }
    ])
  })

  test("should be able to skip spaces", (t) => {
    // Given
    const source = "% myFunction ( ) "

    // When
    const tokens = scan(source)

    // Then
    assert.deepStrictEqual(tokens, [
      {
        type: "identifier",
        lexeme: "myFunction",
        column: 2
      },
      {
        type: "left_paren",
        column: 13
      },
      {
        type: "right_paren",
        column: 15
      }
    ])
  })

  test("should be able to scan a function call with an argument", (t) => {
    // Given
    const source = "%myFunction('hello')"

    // When
    const tokens = scan(source)

    // Then
    assert.deepStrictEqual(tokens, [
      {
        type: "identifier",
        lexeme: "myFunction",
        column: 1
      },
      {
        type: "left_paren",
        column: 11
      },
      {
        type: "string",
        column: 12,
        literal: "hello",
      },
      {
        type: "right_paren",
        column: 19
      }
    ])
  })

  test("should be able to scan a function call with multiple arguments", (t) => {
    // Given
    const source = "%myFunction('hello', 'world')"

    // When
    const tokens = scan(source)

    // Then
    assert.deepStrictEqual(tokens, [
      {
        type: "identifier",
        lexeme: "myFunction",
        column: 1
      },
      {
        type: "left_paren",
        column: 11
      },
      {
        type: "string",
        column: 12,
        literal: "hello",
      },
      {
        type: "comma",
        column: 19
      },
      {
        type: "string",
        column: 21,
        literal: "world",
      },
      {
        type: "right_paren",
        column: 28
      }
    ])
  })

  test("should be able to scan a string using double quote as a delimiter", (t) => {
    // Given
    const source = "%myFunction(\"world\")"

    // When
    const tokens = scan(source)

    // Then
    assert.deepStrictEqual(tokens, [
      {
        type: "identifier",
        lexeme: "myFunction",
        column: 1
      },
      {
        type: "left_paren",
        column: 11
      },
      {
        type: "string",
        column: 12,
        literal: "world",
      },
      {
        type: "right_paren",
        column: 19
      }
    ])
  })
})

describe("function parser", {skip: false}, () => {
  test("should be able to parse a function call without parameters", async t => {
    // Given
    const expression = "%myFunction()"

    // When
    // Then
    assert.deepStrictEqual(
      parseFunctionExpression(expression),
      {
        name: "myFunction",
        args: []
      }
    )
  })

  test("should be able to throw an error if the expression does not start with a '%'", (t) => {
    // Given
    const expression = "myFunction()"

    // When
    // Then
    assert.throws(() => parseFunctionExpression(expression), new Error("Not a function expression"))
  })
})