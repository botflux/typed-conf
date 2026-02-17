import type { Alias, AnySourceType, Source } from "../interfaces.js";
import type { EnvSourceType } from "./types.js";
import type { BaseSchema, Branch, Leaf } from "../../schemes/base.js";
import type { NormalizedEnvSourceOpts } from "./factory.js";
import { AmbiguousEnvNameError } from "./ambiguous-env-name.error.js";
import { appendOrigin } from "../origin.js";

type SchemaEntry = {
	path: string[];
	envNames: string[];
};

export class EnvSource<Name extends string>
	implements Source<EnvSourceType<Name>>
{
	#opts: NormalizedEnvSourceOpts<Name>;

	get name(): Name {
		return this.#opts.name;
	}

	constructor(opts: NormalizedEnvSourceOpts<Name>) {
		this.#opts = opts;
	}

	alias(opts: EnvSourceType<Name>["Alias"]): Alias<EnvSourceType<Name>> {
		return { source: this, aliasOpts: opts };
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
			const resolved = this.#resolveEnvValue(entry, envs);
			if (resolved !== undefined) {
				const target = this.#setNestedValue(result, entry.path, resolved.value);
				if (target !== undefined) {
					appendOrigin(
						target.parent,
						target.key,
						`${this.#opts.name}:${resolved.envKey}`,
					);
				}
			}
		}

		return result;
	}

	#ensureNoDuplicateEnvNames(entries: SchemaEntry[]): void {
		const envNameToPath = new Map<string, string>();
		for (const entry of entries) {
			const pathStr = entry.path.join(".");
			for (const envName of entry.envNames) {
				const existing = envNameToPath.get(envName);
				if (existing !== undefined) {
					throw new AmbiguousEnvNameError(envName, existing, pathStr);
				}
				envNameToPath.set(envName, pathStr);
			}
		}
	}

	#pathToEnvName(path: string[]): string {
		const mode = this.#opts.mode;
		if (mode === "explicit") {
			throw new Error("pathToEnvName should not be called in explicit mode");
		}
		return path.map(mode.namingConvention).join(mode.separator);
	}

	#collectSchemaEntries(
		schema: BaseSchema<unknown> & { structure: Branch },
		prefix: string[] = [],
	): SchemaEntry[] {
		const entries: SchemaEntry[] = [];
		const isImplicit = this.#opts.mode !== "explicit";

		for (const [key, childSchema] of Object.entries(
			schema.structure.children,
		)) {
			const path = [...prefix, key];

			if (this.#isBranch(childSchema)) {
				entries.push(...this.#collectSchemaEntries(childSchema, path));
			} else {
				const aliases = this.#extractAliases(childSchema.structure as Leaf);
				const envNames = isImplicit
					? [this.#pathToEnvName(path), ...aliases]
					: aliases;
				entries.push({ path, envNames });
			}
		}

		return entries;
	}

	#extractAliases(structure: Leaf): string[] {
		return structure.aliases
			.filter((alias) => this.#isEnvAlias(alias))
			.map((alias) => alias.aliasOpts);
	}

	#isEnvAlias(
		alias: Alias<AnySourceType>,
	): alias is Alias<EnvSourceType<string>> {
		return alias.source === this;
	}

	#resolveEnvValue(
		entry: SchemaEntry,
		envs: Record<string, string | undefined>,
	): { value: string; envKey: string } | undefined {
		for (const envName of entry.envNames) {
			const value = envs[envName];
			if (value !== undefined) {
				return { value, envKey: envName };
			}
		}
		return undefined;
	}

	#setNestedValue(
		obj: Record<string, unknown>,
		path: string[],
		value: unknown,
	): { parent: Record<string, unknown>; key: string } | undefined {
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
		if (lastKey === undefined) return undefined;
		current[lastKey] = value;
		return { parent: current, key: lastKey };
	}

	#isBranch(
		schema: BaseSchema<unknown>,
	): schema is BaseSchema<unknown> & { structure: Branch } {
		return schema.structure.kind === "branch";
	}
}
