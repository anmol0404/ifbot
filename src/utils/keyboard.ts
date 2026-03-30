// keyboardExamples.ts
import { Markup } from "telegraf";

export function getCallbackInlineKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    Markup.button.callback("Button 1", "action1"),
    Markup.button.callback("Button 2", "action2"),
  ]);
}

export function getUrlInlineKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    Markup.button.url("Visit Website", "http://example.com"),
  ]);
}

export function getRemoveKeyboardMarkup(): ReturnType<typeof Markup.removeKeyboard> {
  return Markup.removeKeyboard();
}

export function getReplyKeyboardWithRowWidth(): ReturnType<typeof Markup.keyboard> {
  return Markup.keyboard(["Button 1", "Button 2"]).resize();
}

// export function getOneTimeInlineKeyboard() {
//   return Markup.inlineKeyboard([
//     Markup.button.callback("Button 1", "action1"),
//     Markup.button.callback("Button 2", "action2"),
//   ])
//     .resize()
//     .oneTime();
// }

// export function getLoginInlineKeyboard() {
//   return Markup.inlineKeyboard([Markup.button.login("Login Now")]);
// }

export function getMixedButtonsInlineKeyboard(
  movieList: Array<{ title: string; description: string; imageUrl: string }>
): ReturnType<typeof Markup.inlineKeyboard> {
  const buttons = movieList.map((movie, index) => {
    return [
      Markup.button.callback(movie.title, `selectMovie_${index}`),
      Markup.button.url("More Info", `https://example.com/movies/${index}`),
    ];
  });

  return Markup.inlineKeyboard(buttons.flat());
}

export function getSwitchToCurrentChatInlineKeyboard(): ReturnType<typeof Markup.inlineKeyboard> {
  return Markup.inlineKeyboard([
    Markup.button.switchToCurrentChat("Switch to Current Chat", "query"),
  ]);
}

// export function getCustomWidthReplyKeyboard() {
//   return Markup.keyboard(["Button 1", "Button 2"]).resize(2, 1);
// }
