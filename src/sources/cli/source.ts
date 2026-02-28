import { parseArgs } from "node:util";
import type { BaseSchema, Branch, Leaf } from "../../schemes/base.js";
import type { Alias, AnySourceType, Source } from "../interfaces.js";
import {
	mapKeyValueToObject,
	type KeyValue,
} from "../mapping/key-value-to-object.js";
import { AmbiguousCliArgError } from "./ambiguous-cli-arg.error.js";
import type { NormalizedCliSourceOpts } from "./factory.js";
import type { AliasOpts, Argv, CliSourceType } from "./types.js";

type FlagEntry = {
	long: string;
	short?: string;
};

type SchemaEntry = {
	path: string[];
	flags: FlagEntry[];
	valueType: "string" | "boolean";
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

		const keyValues: KeyValue[] = [];

		for (const entry of entries) {
			const resolved = this.#resolveCliValue(entry, values);
			if (resolved !== undefined) {
				keyValues.push([
					entry.path,
					resolved.value,
					`${this.#opts.name}:--${resolved.flagName}`,
				]);
			}
		}

		return mapKeyValueToObject(keyValues);
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
			for (const flag of entry.flags) {
				const existing = flagNameToPath.get(flag.long);
				if (existing !== undefined) {
					throw new AmbiguousCliArgError(`--${flag.long}`, existing, pathStr);
				}
				flagNameToPath.set(flag.long, pathStr);
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
				const flags: FlagEntry[] = isImplicit
					? [{ long: this.#pathToFlagName(path) }, ...aliases]
					: aliases;
				const schemaType = (childSchema.schema as { type?: string }).type;
				const valueType = schemaType === "boolean" ? "boolean" : "string";
				entries.push({ path, flags, valueType });
			}
		}

		return entries;
	}

	#extractAliases(structure: Leaf): FlagEntry[] {
		return structure.aliases
			.filter((alias) => this.#isCliAlias(alias))
			.map((alias) => {
				const opts = alias.aliasOpts;
				if (typeof opts === "string") {
					return { long: opts };
				}
				const entry: FlagEntry = { long: opts.long };
				if (opts.short !== undefined) {
					entry.short = opts.short;
				}
				return entry;
			});
	}

	#isCliAlias(
		alias: Alias<AnySourceType>,
	): alias is Alias<CliSourceType<string>> {
		return alias.source === this;
	}

	#buildParseArgsOptions(
		entries: SchemaEntry[],
	): Record<string, { type: "string" | "boolean"; short?: string }> {
		const options: Record<
			string,
			{ type: "string" | "boolean"; short?: string }
		> = {};

		for (const entry of entries) {
			for (const flag of entry.flags) {
				const opt: { type: "string" | "boolean"; short?: string } = {
					type: entry.valueType,
				};
				if (flag.short !== undefined) {
					opt.short = flag.short;
				}
				options[flag.long] = opt;
			}
		}

		return options;
	}

	#resolveCliValue(
		entry: SchemaEntry,
		values: Record<string, unknown>,
	): { value: string | boolean; flagName: string } | undefined {
		for (const flag of entry.flags) {
			const value = values[flag.long];
			if (typeof value === "string" || typeof value === "boolean") {
				return { value, flagName: flag.long };
			}
		}
		return undefined;
	}

	#isBranch(
		schema: BaseSchema<unknown, Source<AnySourceType>>,
	): schema is BaseSchema<unknown, Source<AnySourceType>> & {
		structure: Branch;
	} {
		return schema.structure.kind === "branch";
	}
}
