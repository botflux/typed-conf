import { parseArgs } from "node:util";
import type { BaseSchema, Branch, Leaf } from "../../schemes/base.js";
import type { Alias, AnySourceType, Source } from "../interfaces.js";
import { appendOrigin } from "../origin.js";
import { AmbiguousCliArgError } from "./ambiguous-cli-arg.error.js";
import type { NormalizedCliSourceOpts } from "./factory.js";
import type { AliasOpts, Argv, CliSourceType } from "./types.js";

type SchemaEntry = {
	path: string[];
	flagNames: string[];
};

export class CliSource<Name extends string>
	implements Source<CliSourceType<Name>>
{
	#opts: NormalizedCliSourceOpts<Name>;

	get name(): Name {
		return this.#opts.name;
	}

	constructor(opts: NormalizedCliSourceOpts<Name>) {
		this.#opts = opts;
	}

	alias(opts: AliasOpts): Alias<CliSourceType<Name>> {
		return { source: this, aliasOpts: opts };
	}

	async loadFromSchema(
		schema: BaseSchema<unknown, Source<AnySourceType>>,
		_opts: undefined,
		inject: Argv,
	): Promise<Record<string, unknown>> {
		if (!this.#isBranch(schema)) {
			return {};
		}

		const entries = this.#collectSchemaEntries(schema);
		this.#ensureNoDuplicateFlagNames(entries);
		const parseArgsOptions = this.#buildParseArgsOptions(entries);

		const argv = inject ?? process.argv.slice(2);
		const { values } = parseArgs({
			args: argv,
			options: parseArgsOptions,
			strict: false,
			allowPositionals: true,
		});

		const result: Record<string, unknown> = {};

		for (const entry of entries) {
			const resolved = this.#resolveCliValue(entry, values);
			if (resolved !== undefined) {
				const target = this.#setNestedValue(result, entry.path, resolved.value);
				if (target !== undefined) {
					appendOrigin(
						target.parent,
						target.key,
						`${this.#opts.name}:--${resolved.flagName}`,
					);
				}
			}
		}

		return result;
	}

	#pathToFlagName(path: string[]): string {
		const mode = this.#opts.mode;
		if (mode === "explicit") {
			throw new Error("pathToFlagName should not be called in explicit mode");
		}
		return path.map(mode.namingConvention).join(".");
	}

	#ensureNoDuplicateFlagNames(entries: SchemaEntry[]): void {
		const flagNameToPath = new Map<string, string>();
		for (const entry of entries) {
			const pathStr = entry.path.join(".");
			for (const flagName of entry.flagNames) {
				const existing = flagNameToPath.get(flagName);
				if (existing !== undefined) {
					throw new AmbiguousCliArgError(`--${flagName}`, existing, pathStr);
				}
				flagNameToPath.set(flagName, pathStr);
			}
		}
	}

	#collectSchemaEntries(
		schema: BaseSchema<unknown, Source<AnySourceType>> & { structure: Branch },
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
				const flagNames = isImplicit
					? [this.#pathToFlagName(path), ...aliases]
					: aliases;
				entries.push({ path, flagNames });
			}
		}

		return entries;
	}

	#extractAliases(structure: Leaf): string[] {
		return structure.aliases
			.filter((alias) => this.#isCliAlias(alias))
			.map((alias) => {
				const opts = alias.aliasOpts;
				return typeof opts === "string" ? opts : opts.long;
			});
	}

	#isCliAlias(
		alias: Alias<AnySourceType>,
	): alias is Alias<CliSourceType<string>> {
		return alias.source === this;
	}

	#buildParseArgsOptions(
		entries: SchemaEntry[],
	): Record<string, { type: "string"; short?: string }> {
		const options: Record<string, { type: "string"; short?: string }> = {};

		for (const entry of entries) {
			for (const flagName of entry.flagNames) {
				options[flagName] = { type: "string" };
			}
		}

		// Add short aliases from explicit aliases
		if (this.#opts.mode === "explicit") {
			return options;
		}

		return options;
	}

	#resolveCliValue(
		entry: SchemaEntry,
		values: Record<string, unknown>,
	): { value: string; flagName: string } | undefined {
		for (const flagName of entry.flagNames) {
			const value = values[flagName];
			if (typeof value === "string") {
				return { value, flagName };
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
		schema: BaseSchema<unknown, Source<AnySourceType>>,
	): schema is BaseSchema<unknown, Source<AnySourceType>> & {
		structure: Branch;
	} {
		return schema.structure.kind === "branch";
	}
}
