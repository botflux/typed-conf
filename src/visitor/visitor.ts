import type {BaseSchema} from "../schemes/base.js";
import type {StringSchema} from "../schemes/string.js";
import type {BooleanSchema} from "../schemes/boolean.js";
import type {IntegerSchema} from "../schemes/integer.js";
import type {FloatSchema} from "../schemes/float.js";
import type {SecretSchema} from "../schemes/secret.js";
import type {ObjectSchema, ObjectSpec} from "../schemes/object.js";

export interface Visitor<Out> {
  visitString(schema: StringSchema): Out
  visitInteger(schema: IntegerSchema): Out
  visitFloat(schema: FloatSchema): Out
  visitBoolean(schema: BooleanSchema): Out
  visitObject(schema: ObjectSchema<ObjectSpec>): Out
  visitSecret(schema: SecretSchema): Out
  visit(schema: BaseSchema<unknown>): Out
}