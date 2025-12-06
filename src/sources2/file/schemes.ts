import {ref} from "../../schemes2/ref.js";
import {string} from "../../schemes2/string.js";

/**
 * Create a reference to another file.
 */
export function file() {
  return ref({
    schema: string(),
    sourceName: 'file',
    refToSourceParams: (path: string) => ({file: path, encoding: 'utf-8'})
  })
}