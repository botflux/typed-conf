import type { EnvSourceType } from "../sources/env/types.js";
import type {Alias, AnySourceType} from "../sources/interfaces.js";
import type {BaseSchema} from "./base.js";
import {String} from "typebox";

export type StringSchema = BaseSchema<string>

export function string(aliases: Alias<AnySourceType>[] = []): StringSchema {
  return {
    type: '',
    schema: String()
  }
}