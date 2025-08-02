export type StringSchema = {
    type: "string";
};
export type ObjectSchema<T extends ObjectSpec> = {
    type: "object";
    spec: T;
};
export type ConfSchema = StringSchema;
export type ObjectSpec = Record<string, ConfSchema>;
export declare const c: {
    config: typeof config;
    string: typeof string;
};
export type Static<T> = T extends ObjectSchema<infer U> ? U : never;
export type LoadOpts = {
    sources: {
        envs: Record<string, string>;
    };
};
export type ConfigSpec<ConfigSchema extends ObjectSchema<Record<string, ConfSchema>>> = {
    configSchema: ConfigSchema;
    load: (opts: LoadOpts) => Promise<Static<ConfigSchema>>;
};
declare function config<T extends ObjectSpec>(objSpec: T): ConfigSpec<ObjectSchema<T>>;
declare function string(): StringSchema;
export {};
//# sourceMappingURL=c.d.ts.map