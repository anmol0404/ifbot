export type ConfigCategory = "channels" | "links" | "text" | "ai" | "tokens" | "webhook";
export type ConfigVarType = "number" | "string" | "url" | "number[]" | "boolean";
export interface ConfigVarDefinition {
    envKey: string;
    envObjKey: string;
    displayName: string;
    category: ConfigCategory;
    type: ConfigVarType;
    sensitive: boolean;
    /** If true, the owner can wipe the value to empty from /config (persisted in DB). */
    clearable?: boolean;
}
export declare const CONFIG_CATEGORIES: Record<ConfigCategory, {
    label: string;
    emoji: string;
}>;
export declare const CONFIG_VARS: ConfigVarDefinition[];
export declare function getConfigVarByEnvKey(key: string): ConfigVarDefinition | undefined;
export declare function getConfigVarsByCategory(category: ConfigCategory): ConfigVarDefinition[];
/**
 * Parse a raw string into the runtime value for a config var type.
 * Empty / whitespace-only input always yields an empty value, never [0].
 */
export declare function parseConfigValue(def: ConfigVarDefinition, raw: string | undefined | null): any;
