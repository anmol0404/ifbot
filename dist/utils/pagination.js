import env from "../services/env.js";
/**
 * Build navigation row: [◀️ Prev] [1/N] [▶️ Next]
 * Prev shows ✗ on first page, Next shows ✗ on last page.
 */
export function buildNavRow(page, total, prevCb, nextCb) {
    const isFirst = page === 0;
    const isLast = page >= total - 1;
    const prev = isFirst
        ? { text: "✗", callback_data: "noop" }
        : { text: "◀️ 𝗣𝗥𝗘𝗩", callback_data: prevCb };
    const counter = {
        text: `📄 ${page + 1} / ${total}`,
        callback_data: "noop",
    };
    const next = isLast
        ? { text: "✗", callback_data: "noop" }
        : { text: "𝗡𝗘𝗫𝗧 ▶️", callback_data: nextCb };
    return [prev, counter, next];
}
/**
 * Build full pagination keyboard for AIO/search results.
 */
export function buildAIOPaginationKeyboard(page, total, prevCb, nextCb, downloadLink) {
    return {
        inline_keyboard: [
            buildNavRow(page, total, prevCb, nextCb),
            [{ text: "𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗", url: downloadLink }],
            [{ text: "𝗝𝗼𝗶𝗻 𝗕𝗮𝗰𝗸-𝗨𝗽", url: env.backup }],
            [
                {
                    text: "𝗛𝗼𝘄 𝘁𝗼 𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱",
                    url: env.howToDownload || "https://t.me/Infinite_tips/17",
                },
            ],
        ],
    };
}
/**
 * Build full pagination keyboard for ongoing channel browsing.
 */
export function buildOngoingPaginationKeyboard(page, total, prevCb, nextCb, watchLink) {
    return {
        inline_keyboard: [
            buildNavRow(page, total, prevCb, nextCb),
            [{ text: "▶️ 𝗪𝗮𝘁𝗰𝗵 𝗖𝗵𝗮𝗻𝗻𝗲𝗹", url: watchLink }],
            [{ text: "𝗝𝗼𝗶𝗻 𝗕𝗮𝗰𝗸-𝗨𝗽", url: env.backup }],
        ],
    };
}
