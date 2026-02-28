export class AmbiguousCliArgError extends Error {
	constructor(
		argName: string,
		firstEntryPath: string,
		secondEntryPath: string,
	) {
		super(
			`Two CLI args were found with the same name "${argName}". First entry: "${firstEntryPath}". Second entry: "${secondEntryPath}".`,
		);
		this.name = AmbiguousCliArgError.name;
	}
}
