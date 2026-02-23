import {Boolean as TypeboxBoolean, type TSchemaOptions} from "typebox";
import type {Alias, AnySourceType, Source} from "../sources/interfaces.js";
import type {BaseSchema} from "./base.js";

export type BooleanSchema<Sources extends Source<AnySourceType>> = BaseSchema<
  boolean,
  Sources
>;

export type BooleanOpts<A extends Alias<AnySourceType>> = {
  aliases?: A[];
  default?: boolean;
};

function normalizeOpts<A extends Alias<AnySourceType>>(
  aliasesOrOpts?: A[] | BooleanOpts<A>,
): BooleanOpts<A> {
  if (aliasesOrOpts === undefined) {
    return {};
  }
  if (Array.isArray(aliasesOrOpts)) {
    return {aliases: aliasesOrOpts};
  }
  return aliasesOrOpts;
}

function buildTypeboxOptions(
  opts: BooleanOpts<Alias<AnySourceType>>,
): TSchemaOptions {
  const typeboxOpts: TSchemaOptions = {};

  typeboxOpts.default = opts.default;

  return typeboxOpts;
}

export function boolean<A extends Alias<AnySourceType>>(
  aliasesOrOpts?: A[] | BooleanOpts<A>,
): BooleanSchema<A["source"]> {
  const opts = normalizeOpts(aliasesOrOpts);
  const aliases = opts.aliases ?? [];

  return {
    // This mutant can be ignored because the value should never by used, only the type.
    // Stryker disable next-line all
    type: false,
    schema: TypeboxBoolean(buildTypeboxOptions(opts)),
    structure: {kind: "leaf", aliases},
    sources: aliases.map((alias) => alias.source),
  };
}
