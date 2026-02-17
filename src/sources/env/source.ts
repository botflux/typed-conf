import type {Alias, AnySourceType, Source} from "../interfaces.js";
import type {EnvSourceType} from "./types.js";
import type {BaseSchema, Branch, Leaf} from "../../schemes/base.js";
import type {RequiredEnvSourceOpts} from "./factory.js";
import {AmbiguousEnvNameError} from "./ambiguous-env-name.error.js";

type SchemaEntry = {
  path: string[];
  envName: string;
  aliases: string[];
};

export class EnvSource<Name extends string>
  implements Source<EnvSourceType<Name>> {
  #opts: RequiredEnvSourceOpts<Name>;

  get name(): Name {
    return this.#opts.name;
  }

  constructor(opts: RequiredEnvSourceOpts<Name>) {
    this.#opts = opts;
  }

  alias(opts: EnvSourceType<Name>["Alias"]): Alias<EnvSourceType<Name>> {
    return {source: this, aliasOpts: opts};
  }

  async loadFromSchema(
    schema: BaseSchema<unknown>,
    _opts: EnvSourceType<Name>["LoadFromSchema"],
    inject: EnvSourceType<Name>["Inject"],
  ): Promise<Record<string, unknown>> {
    if (!this.#isBranch(schema)) {
      return Promise.resolve({});
    }

    const entries = this.#collectSchemaEntries(schema);
    this.#ensureNoDuplicateEnvNames(entries);

    const result: Record<string, unknown> = {};
    const envs = inject ?? process.env;

    for (const entry of entries) {
      const value = this.#resolveEnvValue(entry, envs);
      if (value !== undefined) {
        this.#setNestedValue(result, entry.path, value);
      }
    }

    return result;
  }

  #ensureNoDuplicateEnvNames(entries: SchemaEntry[]): void {
    const envNameToPath = new Map<string, string>();
    for (const entry of entries) {
      const pathStr = entry.path.join(".");
      const existing = envNameToPath.get(entry.envName);
      if (existing !== undefined) {
        throw new AmbiguousEnvNameError(entry.envName, existing, pathStr);
      }
      envNameToPath.set(entry.envName, pathStr);
    }
  }

  #pathToEnvName(path: string[]): string {
    return path.map(this.#camelToScreamingSnake).join("_");
  }

  #collectSchemaEntries(
    schema: BaseSchema<unknown> & { structure: Branch },
    prefix: string[] = [],
  ): SchemaEntry[] {
    const entries: SchemaEntry[] = [];

    for (const [key, childSchema] of Object.entries(
      schema.structure.children,
    )) {
      const path = [...prefix, key];

      if (this.#isBranch(childSchema)) {
        entries.push(...this.#collectSchemaEntries(childSchema, path));
      } else {
        const aliases = this.#extractAliases(childSchema.structure as Leaf);
        entries.push({path, envName: this.#pathToEnvName(path), aliases});
      }
    }

    return entries;
  }

  #extractAliases(structure: Leaf): string[] {
    return structure.aliases
      .filter((alias) => this.#isEnvAlias(alias))
      .map((alias) => alias.aliasOpts);
  }

  #isEnvAlias(alias: Alias<AnySourceType>): alias is Alias<EnvSourceType<string>> {
    return alias.source === this
  }

  #resolveEnvValue(
    entry: SchemaEntry,
    envs: Record<string, string | undefined>,
  ): string | undefined {
    const implicitValue = envs[entry.envName];
    if (implicitValue !== undefined) {
      return implicitValue;
    }

    for (const alias of entry.aliases) {
      const aliasValue = envs[alias];
      if (aliasValue !== undefined) {
        return aliasValue;
      }
    }

    return undefined;
  }

  #camelToScreamingSnake(str: string): string {
    return str.replace(/([a-z])([A-Z])/g, "$1_$2").toUpperCase();
  }

  #setNestedValue(
    obj: Record<string, unknown>,
    path: string[],
    value: unknown,
  ): void {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (key === undefined) continue;
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    const lastKey = path[path.length - 1];
    if (lastKey === undefined) return;
    current[lastKey] = value;
  }

  #isBranch(
    schema: BaseSchema<unknown>,
  ): schema is BaseSchema<unknown> & { structure: Branch } {
    return schema.structure.kind === "branch";
  }
}
