export type Indirection = {
  source: string
  args: string[]
}

export function isIndirection(str: string): boolean {
  return str.startsWith("%")
}

export function parseIndirection(str: string): Indirection {
  const [ prefixedSourceName, ...splitRest ] = str.split(":")

  if (prefixedSourceName === undefined) {
    throw new Error("Cannot parse the indirection because it has no source name. Indirections must have the form '%source:value1'")
  }

  const sourceName = prefixedSourceName.replace("%", "")
  // re-join the rest, to allow indirection body with `:` in it.
  const rest = splitRest.join(":")

  const args = rest.split(",")

  return { source: sourceName, args }
}