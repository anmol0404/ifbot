var unwantedKeywords = [
    " sub",
    " subtitle",
    " subtitles",
    "sub ",
    "Subtitle ",
    "Subtitles ",
    " eng",
    "eng ",
    "drama ",
    "movie ",
    " drama",
    " movie",
    " mkv",
    "mkv ",
];
export function cleanString(inputString) {
    var cleanedString = inputString
        .replace(".", "")
        .replace(/[^A-Za-z0-9\s]/g, " ") // Special characters ko space se replace karega
        .toLowerCase()
        .replace(/[^\w\s]/gi, " ")
        .replace(/[()';:]/g, " ")
        .trim();
    // Common contractions jise remove karna hai (like 'm, 's, 're)
    cleanedString = cleanedString.replace(/\b(?:m|s|re|d|ll|ve|t)\b/gi, " ");
    for (var _i = 0, unwantedKeywords_1 = unwantedKeywords; _i < unwantedKeywords_1.length; _i++) {
        var keyword = unwantedKeywords_1[_i];
        var regex = new RegExp("\\b".concat(keyword, "\\b"), "gi");
        cleanedString = cleanedString.replace(regex, " ");
    }
    cleanedString = cleanedString.replace(/\s+/g, " ").trim();
    return cleanedString;
}
