import type {BaseSchema} from "../schemes2/base.js";
import type {JSONSchema} from "json-schema-to-typescript";
import {Ajv, type ErrorObject, type Schema} from "ajv";
import {getOrigin} from "../merging/origin-utils.js";
import {getValueAtPath} from "../utils.js";

export function getPreRefJsonSchema(base: BaseSchema<unknown>): JSONSchema {
  return base.jsonSchema
}

export class ValidationError extends AggregateError {
  errors: Error[] = []

  constructor(errors: Error[]) {
    super(errors, 'config validation failed');
    this.errors = errors;
  }
}

type MapErrorObjectToMessage = (obj: ErrorObject, origin?: string) => string

export class AjvValidator {
  #ajv = new Ajv()

  #messagesMap = new Map<string, MapErrorObjectToMessage>()
    .set('type', ((obj: ErrorObject<'type', { type: string }>, origin: string, value: unknown) => `${origin} must be ${obj.params.type}`) as MapErrorObjectToMessage)

  validate(schema: BaseSchema<unknown>, getJsonSchema: (base: BaseSchema<unknown>) => JSONSchema, data: unknown) {
    const jsonSchema = getJsonSchema(schema)

    if (jsonSchema.type !== 'object') {
      throw new Error("Not implemented at line 100 in validation.unit.ts")
    }

    const isValid = this.#ajv.compile(jsonSchema as Schema)

    if (!isValid(data)) {
      throw new ValidationError(this.#formatErrors(isValid.errors ?? [], data))
    }
  }

  #formatErrors(errors: ErrorObject[], data: unknown) {
    return errors.map(e => {
      const path = e.instancePath.slice(1).split('/')
      const parentObject = getValueAtPath(data as Record<string, unknown>, path.slice(0, -1)) as Record<string | symbol, unknown>
      const origins = getOrigin(parentObject)

      const origin = origins[path.at(-1)!]

      const mMapper = this.#messagesMap.get(e.keyword)
      const message = mMapper?.(e, origin) ?? e.message

      return new Error(message)
    })
  }
}