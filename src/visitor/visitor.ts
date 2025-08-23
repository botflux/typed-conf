import {
  type BaseSchema,
  type BooleanSchema,
  type FloatSchema,
  type IntegerSchema,
  type ObjectSchema, type ObjectSpec, type SecretSchema,
  type StringSchema
} from "../schemes.js"

export interface Visitor<Out> {
  visitString(schema: StringSchema): Out
  visitInteger(schema: IntegerSchema): Out
  visitFloat(schema: FloatSchema): Out
  visitBoolean(schema: BooleanSchema): Out
  visitObject(schema: ObjectSchema<ObjectSpec>): Out
  visitSecret(schema: SecretSchema): Out
  visit(schema: BaseSchema<unknown>): Out
}