const { Filter } = require("bad-words");
const tagalogBadWords = require("./tagalogBadWords");

const reviewWordFilter = new Filter();
reviewWordFilter.addWords(...tagalogBadWords);

const tagalogBadWordPhrases = [
  "putang ina",
  "putang ina mo",
  "gago ka",
  "tangina mo",
  "ulol ka",
  "tarantado ka",
  "kupal ka",
  "punyeta ka",
  "pakshet ka",
  "hayop ka",
  "bwisit ka",
  "walang hiya",
  "kupal na yan",
];

const escapeRegExp = (word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const tagalogPhrasePatterns = [...tagalogBadWordPhrases]
  .sort((first, second) => second.length - first.length)
  .map((phrase) => {
  const words = phrase.split(/\s+/).map(escapeRegExp);
  return new RegExp(`\\b${words.join("[\\s\\p{P}]+\\b")}\\b`, "giu");
  });

function cleanReviewText(text) {
  const phraseFiltered = tagalogPhrasePatterns.reduce(
    (value, pattern) => value.replace(pattern, (phrase) => phrase.replace(/[\p{L}\p{N}]/gu, "*")),
    text
  );
  return reviewWordFilter.clean(phraseFiltered);
}

module.exports = { cleanReviewText };
