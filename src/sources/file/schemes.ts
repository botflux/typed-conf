import {ref} from "../../schemes/ref.js";
import {string} from "../../schemes/string.js";

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