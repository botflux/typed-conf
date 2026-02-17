const kOrigin = Symbol('origin')

export type Origin = Record<string, string>

export function getOrigin(obj: Record<string | symbol, unknown>): Origin | undefined {
  return obj[kOrigin] as Origin | undefined
}