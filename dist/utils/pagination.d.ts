interface PaginationButton {
    text: string;
    callback_data?: string;
    url?: string;
}
/**
 * Build navigation row: [◀️ Prev] [1/N] [▶️ Next]
 * Prev shows ✗ on first page, Next shows ✗ on last page.
 */
export declare function buildNavRow(page: number, total: number, prevCb: string, nextCb: string): PaginationButton[];
/**
 * Build full pagination keyboard for AIO/search results.
 */
export declare function buildAIOPaginationKeyboard(page: number, total: number, prevCb: string, nextCb: string, downloadLink: string): any;
/**
 * Build full pagination keyboard for ongoing channel browsing.
 */
export declare function buildOngoingPaginationKeyboard(page: number, total: number, prevCb: string, nextCb: string, watchLink: string): any;
export {};
