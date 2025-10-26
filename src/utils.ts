export function setValueAtPath(o: Record<string, unknown>, path: string[], value: unknown): void {
  const intermediate = path.slice(0, -1)
  const last = path.at(-1)

  if (last === undefined) {
    throw new Error("Path must contain at least one element")
  }

  let tmp = o

  for (const chunk of intermediate) {
    if (tmp[chunk] === undefined) {
      tmp[chunk] = {}
    }

    if (typeof tmp[chunk] !== "object" || tmp[chunk] === null) {
      throw new Error(`Cannot set value at path '${path.join(".")}' because the intermediate property "${chunk}" is not an object`)
    }

    tmp = tmp[chunk] as Record<string, unknown>
  }

  Object.defineProperty(tmp, last, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  })
}

export function getValueAtPath(o: Record<string, unknown>, path: string[]): unknown {
  let tmp: Record<string, unknown> = o

  const intermediateObjectPath = path.slice(0, -1)
  const key = path.at(-1)

  if (key === undefined) {
    throw new Error("Path must contain at least one element")
  }

  for (const key of intermediateObjectPath) {
    if (tmp[key] === undefined) {
      return
    }

    if (typeof tmp[key] !== "object" || tmp[key] === null) {
      throw new Error(`Cannot get value at path '${path.join(".")}' because the intermediate property "${key}" is not an object`)
    }

    tmp = tmp[key] as Record<string, unknown>
  }

  return tmp[key] as unknown
}

export function inlineCatchSync<T>(fn: () => T) {
  try {
    return [fn(), undefined] as const
  } catch (error: unknown) {
    return [undefined, error] as const
  }
}