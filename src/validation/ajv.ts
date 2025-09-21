import type { JSONSchema } from "json-schema-to-typescript";
import type {SchemaValidator} from "./validator.js";
import { Ajv, type Schema } from "ajv";

export class AjvSchemaValidator implements SchemaValidator {
  #ajv = new Ajv()

  validate(schema: JSONSchema, toValidate: unknown, name: string): void {
    const isValid = this.#ajv.compile(schema as Schema)

    if (!isValid(toValidate)) {
      throw new Error(this.#ajv.errorsText(isValid.errors, { dataVar: name }))
    }
  }
}