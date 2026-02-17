export type SomeRequired<
	T extends Record<string, unknown>,
	RequiredKeys extends keyof T,
> = Omit<T, RequiredKeys> & Required<Pick<T, RequiredKeys>>;
