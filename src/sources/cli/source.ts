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
import type { ParseArgsConfig } from "node:util";
import { kebabCase } from "../../naming/kebab-case.js";

type ParsedValues = ReturnType<typeof parseArgs>;

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

		const keyValues = this.#extractKeyValues(
			entries,
			values as unknown as ParsedValues,
		);

		return mapKeyValueToObject(keyValues);
	}

	#extractKeyValues(entries: SchemaEntry[], values: ParsedValues) {
		const keyValues: KeyValue[] = [];

		for (const entry of entries) {
			const resolved = this.#resolveCliValue(entry, values);

			if (resolved === undefined) {
				continue;
			}

			keyValues.push([
				entry.path,
				resolved.value,
				`${this.#opts.name}:--${resolved.flagName}`,
			]);
		}
		return keyValues;
	}

	#pathToFlagName(path: string[]): string {
		const { mode: mMode } = this.#opts;
		const namingConvention =
			typeof mMode === "string" ? kebabCase : mMode.namingConvention;

		return path.map(namingConvention).join(".");
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

	#buildParseArgsOptions(entries: SchemaEntry[]): ParseArgsConfig["options"] {
		return entries
			.flatMap((entry) =>
				entry.flags.map((flag) => [flag, entry.valueType] as const),
			)
			.reduce(
				(acc, [flag, type]) => ({
					...acc,
					[flag.long]: {
						type,
						...(flag.short !== undefined && {
							short: flag.short,
						}),
					},
				}),
				{} as ParseArgsConfig["options"],
			);
	}

	#resolveCliValue(
		entry: SchemaEntry,
		values: Record<string, unknown>,
	): { value: unknown; flagName: string } | undefined {
		const mFlag = entry.flags.find((f) => values[f.long] !== undefined);

		if (mFlag === undefined) {
			return undefined;
		}

		return {
			value: values[mFlag.long],
			flagName: mFlag.long,
		};
	}
}
