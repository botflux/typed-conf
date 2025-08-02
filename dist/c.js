export const c = {
    config,
    string
};
function config(objSpec) {
    return {
        configSchema: {
            type: "object",
            spec: objSpec
        },
        load: async (opts) => {
            const { sources: { envs } } = opts;
            const entries = Object.entries(envs);
            return Object.fromEntries(entries.map(([key, value]) => [key.toLowerCase(), value]));
        }
    };
}
function string() {
    return {
        type: "string"
    };
}
//# sourceMappingURL=c.js.map