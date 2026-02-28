import { parseArgs } from "node:util";
import type { BaseSchema, Leaf } from "../../schemes/base.js";
import { type BranchSchema, isBranch } from "../../schemes/utils.js";
import type { Alias, AnySourceType, Source } from "../interfaces.js";
import {
	mapKeyValueToObject,
	type KeyValue,
} from "../mapping/key-value-to-object.js";
import { AmbiguousCliArgError } from "./ambiguous-cli-arg.error.js";
import type { NormalizedCliSourceOpts } from "./factory.js";
import type { AliasOpts, Argv, CliSourceType } from "./types.js";
import type { TBoolean, TSchema } from "typebox";

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
		if (!isBranch(schema)) {
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

	#isTypeboxBoolean(schema: TSchema): schema is TBoolean {
		return (
			typeof schema === "object" &&
			schema !== null &&
			"type" in schema &&
			schema.type === "boolean"
		);
	}

	#collectSchemaEntries(
		schema: BranchSchema,
		prefix: string[] = [],
	): SchemaEntry[] {
		const isImplicit = this.#opts.mode !== "explicit";

		return Object.entries(schema.structure.children).flatMap(
			([key, childSchema]) => {
				const path = [...prefix, key];

				if (isBranch(childSchema))
					return this.#collectSchemaEntries(childSchema, path);

				const aliases = this.#extractAliases(childSchema.structure as Leaf);

				const flags = isImplicit
					? [{ long: this.#pathToFlagName(path) }, ...aliases]
					: aliases;

				const valueType = this.#isTypeboxBoolean(childSchema.schema)
					? "boolean"
					: "string";

				return [{ path, flags, valueType }];
			},
		);
	}

	#extractAliases(structure: Leaf): FlagEntry[] {
		return structure.aliases
			.filter((alias) => this.#isCliAlias(alias))
			.map((alias) => {
				const { aliasOpts } = alias;

				if (typeof aliasOpts === "string") {
					return { long: aliasOpts };
				}
				return aliasOpts;
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
}
