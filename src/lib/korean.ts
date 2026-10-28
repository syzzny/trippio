/** 받침에 따라 '로/으로' 조사 선택 (ㄹ 받침은 '로') */
export const withRo = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}로`;
  const jong = code % 28;
  return `${word}${jong === 0 || jong === 8 ? '로' : '으로'}`;
};

/** 받침에 따라 '을/를' 조사 선택 */
export const withEul = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  if (code < 0 || code > 11171) return `${word}를`;
  return `${word}${code % 28 === 0 ? '를' : '을'}`;
};
