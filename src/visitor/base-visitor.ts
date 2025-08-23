import type { StringSchemaBuilder, IntegerSchema, FloatSchema, BooleanSchema, ObjectSchema, ObjectSpec, SecretSchema, BaseSchema } from "../schemes.js";
import type {Visitor} from "./visitor.js";

export abstract class BaseVisitor<R> implements Visitor<R> {
    abstract visitString(schema: StringSchemaBuilder): R
    abstract visitInteger(schema: IntegerSchema): R
    abstract visitFloat(schema: FloatSchema): R
    abstract visitBoolean(schema: BooleanSchema): R
    abstract visitObject(schema: ObjectSchema<ObjectSpec>): R
    abstract visitSecret(schema: SecretSchema): R

    visit(schema: BaseSchema<unknown>): R {
      if (! ("type" in schema)) {
        throw new Error("Schema does not have a type")
      }

      switch (schema.type) {
        case "string": return this.visitString(schema as StringSchemaBuilder)
        case "integer": return this.visitInteger(schema as IntegerSchema)
        case "float": return this.visitFloat(schema as FloatSchema)
        case "boolean": return this.visitBoolean(schema as BooleanSchema)
        case "object": return this.visitObject(schema as ObjectSchema<ObjectSpec>)
        case "secret": return this.visitSecret(schema as SecretSchema)
        default: throw new Error(
          `Unknown type '${schema.type}'`
        )
      }
    }
}