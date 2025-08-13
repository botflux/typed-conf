export type IndirectionExpression = {
  source: string
  args: string[]
}

type Token = {
  type: "identifier" | "left_paren" | "right_paren" | "string" | "comma",
  lexeme?: string | undefined,
  column: number,
  literal?: unknown
}

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

          throw new Error(`Unknown token: ${char}`)
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

export function isIndirectionExpression(str: string): boolean {
  return str.startsWith("%") && str.includes("(") && str.includes(")")
}

export function compileIndirectionExpression(expression: string): IndirectionExpression {
  if (!expression.startsWith("%")) {
    throw new Error("Not an indirection expression")
  }

  const tokens = scan(expression)
  
  if (tokens.length === 0) {
    throw new Error("Empty expression")
  }

  const identifierToken = tokens[0]
  if (identifierToken?.type !== "identifier") {
    throw new Error("Expected function name")
  }

  const leftParenToken = tokens[1]
  if (leftParenToken?.type !== "left_paren") {
    throw new Error("Expected '(' after function name")
  }

  const rightParenIndex = tokens.findIndex(token => token.type === "right_paren")
  if (rightParenIndex === -1) {
    throw new Error("Expected closing ')'")
  }

  const argTokens = tokens.slice(2, rightParenIndex)
  const args: string[] = []

  for (let i = 0; i < argTokens.length; i++) {
    const token = argTokens[i]
    if (token?.type === "string") {
      args.push(token.literal as string)
    } else if (token?.type === "comma") {
      continue
    } else {
      throw new Error(`Unexpected token: ${token?.type}`)
    }
  }

  return {
    source: identifierToken.lexeme!,
    args
  }
}