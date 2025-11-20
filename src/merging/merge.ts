export const kOrigin = Symbol('origin')

/**
 * Merge two objects recursively.
 * The first param is mutated, and the second is not.
 *
 * Arrays are merged, but not their nested items.
 *
 * Also, this function merges a symbol property `kOrigin`.
 *
 * @param a
 * @param b
 */
export function merge(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  for (const key in b) {
    if (!(key in a) || a[key] === undefined) {
      a[key] = b[key]
    }

    if (typeof a[key] === 'object' && typeof b[key] === 'object' && !Array.isArray(a[key]) && !Array.isArray(b[key])) {
      merge(a[key] as Record<string, unknown>, b[key] as Record<string, unknown>)
    }

    if (Array.isArray(a[key]) && Array.isArray(b[key])) {
      a[key] = [...a[key], ...b[key]]
    }
  }

  if (kOrigin in a && kOrigin in b) {
    merge(a[kOrigin] as Record<string, unknown>, b[kOrigin] as Record<string, unknown>)
  }

  return a
}