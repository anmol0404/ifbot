import { Markup } from "telegraf";
export declare function getCallbackInlineKeyboard(): ReturnType<typeof Markup.inlineKeyboard>;
export declare function getUrlInlineKeyboard(): ReturnType<typeof Markup.inlineKeyboard>;
export declare function getRemoveKeyboardMarkup(): ReturnType<typeof Markup.removeKeyboard>;
export declare function getReplyKeyboardWithRowWidth(): ReturnType<typeof Markup.keyboard>;
export declare function getMixedButtonsInlineKeyboard(movieList: Array<{
    title: string;
    description: string;
    imageUrl: string;
}>): ReturnType<typeof Markup.inlineKeyboard>;
export declare function getSwitchToCurrentChatInlineKeyboard(): ReturnType<typeof Markup.inlineKeyboard>;
