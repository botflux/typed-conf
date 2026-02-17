import type {Alias, Source} from "../interfaces.js";
import type {EnvSourceType} from "./types.js";
import type {BaseSchema} from "../../schemes/base.js";
import type {EnvSourceOpts, RequiredEnvSourceOpts} from "./factory.js";

export class EnvSource<Name extends string> implements Source<EnvSourceType<Name>> {
  #opts: RequiredEnvSourceOpts<Name>

  get name(): Name {
    return this.#opts.name;
  }

  constructor(opts: RequiredEnvSourceOpts<Name>) {
    this.#opts = opts;
  }

  alias(opts: EnvSourceType<Name>["Alias"]): Alias<EnvSourceType<Name>> {
    return {source: this, aliasOpts: opts};
  }

  loadFromSchema(schema: BaseSchema<unknown>, opts: EnvSourceType<Name>["LoadFromSchema"], inject: EnvSourceType<Name>["Inject"]): Promise<Record<string, unknown>> {
    return Promise.resolve({});
  }
}