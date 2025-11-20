import {kOrigin} from "./merge.js";

export function setOrigin(obj: Record<string | symbol, unknown>, origin: string) {
  const originMap: Record<string, string | string[]> = {}

  for (const field in obj) {
    const value = obj[field] as unknown

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      setOrigin(value as Record<string | symbol, unknown>, origin)
      continue
    }

    if (value !== null && Array.isArray(value)) {
      originMap[field] = new Array(value.length).fill(origin)
      continue
    }

    originMap[field] = origin
  }

  return Object.defineProperty(obj, kOrigin, {
    value: originMap,
    enumerable: false
  })
}

export function getOrigin(obj: Record<string | symbol, unknown>) {
  return obj[kOrigin] as Record<string, string> ?? {}
}