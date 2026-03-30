/**
 * Build pagination inline keyboard rows with colored buttons (Bot API 9.4 style field).
 *
 * Style values: "primary" (blue), "secondary" (gray), "destructive" (red)
 * Telegraf types don't include `style` yet, so we cast to `any`.
 */
interface PaginationButton {
    text: string;
    callback_data?: string;
    url?: string;
    style?: string;
}
/**
 * Build navigation row: [◀️ Prev] [1/N] [▶️ Next]
 * - Prev/Next are secondary (gray) when active, destructive with ✗ when at boundary
 * - Page counter is primary (blue)
 */
export declare function buildNavRow(page: number, total: number, prevCb: string, nextCb: string): PaginationButton[];
/**
 * Build full pagination keyboard for AIO/search results.
 */
export declare function buildAIOPaginationKeyboard(page: number, total: number, prevCb: string, nextCb: string, downloadLink: string): {
    inline_keyboard: any[][];
};
/**
 * Build full pagination keyboard for ongoing channel browsing.
 */
export declare function buildOngoingPaginationKeyboard(page: number, total: number, prevCb: string, nextCb: string, watchLink: string): {
    inline_keyboard: any[][];
};
export {};
