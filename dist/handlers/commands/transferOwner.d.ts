import { CommandContext } from "../../interfaces.js";
export default function transferOwnerHandler(ctx: CommandContext): Promise<any>;
/**
 * Handle 2FA password text from admin after /transferowner prompt.
 * Returns true if handled.
 */
export declare function handleTransferOwnerText(ctx: any): Promise<boolean>;
