export type ConfigCategory = "channels" | "links" | "text" | "ai" | "tokens";
export type ConfigVarType = "number" | "string" | "url" | "number[]";
export interface ConfigVarDefinition {
    envKey: string;
    envObjKey: string;
    displayName: string;
    category: ConfigCategory;
    type: ConfigVarType;
    sensitive: boolean;
}
export declare const CONFIG_CATEGORIES: Record<ConfigCategory, {
    label: string;
    emoji: string;
}>;
export declare const CONFIG_VARS: ConfigVarDefinition[];
export declare function getConfigVarByEnvKey(key: string): ConfigVarDefinition | undefined;
export declare function getConfigVarsByCategory(category: ConfigCategory): ConfigVarDefinition[];
