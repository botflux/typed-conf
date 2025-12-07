import {ref, type RefSchema} from "../../schemes/ref.js";
import {string} from "../../schemes/string.js";

export type EncodingToSchemaType<Encoding extends (BufferEncoding | undefined)> = Encoding extends BufferEncoding ? string : Buffer

/**
 * Create a reference to another file.
 */
export function file<Encoding extends (BufferEncoding | undefined) = undefined>(encoding?: Encoding): RefSchema<EncodingToSchemaType<Encoding>> {
  // @ts-expect-error This is mistyped because I haven't created a buffer schema yet.
  return ref({
    schema: string(),
    sourceName: 'file',
    refToSourceParams: (path: string) => ({file: path, encoding})
  })
}