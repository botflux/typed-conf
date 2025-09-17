import type {SourceValue, ConfigWithMetadata} from "./source.js";

export function isSourceValue(value: unknown): value is SourceValue {
  return typeof value === "object" && 
         value !== null && 
         "value" in value && 
         "source" in value && 
         "originalNameInSource" in value
}

export function extractValue(value: unknown): unknown {
  if (isSourceValue(value)) {
    return value.value
  }
  return value
}

export function extractValues(config: ConfigWithMetadata): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(config)) {
    if (isSourceValue(value)) {
      result[key] = value.value
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = extractValues(value as ConfigWithMetadata)
    } else {
      result[key] = value
    }
  }
  
  return result
}

export function getSourceMetadata(config: ConfigWithMetadata, path: string[]): SourceValue | null {
  let current: any = config
  
  for (const segment of path) {
    if (typeof current !== "object" || current === null) {
      return null
    }
    current = current[segment]
  }
  
  return isSourceValue(current) ? current : null
}

export function mergeWithMetadata(target: ConfigWithMetadata, source: ConfigWithMetadata): ConfigWithMetadata {
  const result = { ...target }
  
  for (const [key, value] of Object.entries(source)) {
    if (isSourceValue(value)) {
      result[key] = value
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      const existingValue = result[key]
      if (typeof existingValue === "object" && existingValue !== null && !isSourceValue(existingValue)) {
        result[key] = mergeWithMetadata(existingValue as ConfigWithMetadata, value as ConfigWithMetadata)
      } else {
        result[key] = value
      }
    } else {
      result[key] = value
    }
  }
  
  return result
}