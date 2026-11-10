const challengeAnswers = [
  "compass",
  "shadow",
  "echo",
  "mirror",
  "hourglass",
  "candle",
  "river",
  "book",
  "key",
  "time",
];

export function getChallengeAnswer(levelId, challengeIndex) {
  if (
    !Number.isInteger(levelId) ||
    levelId < 1 ||
    levelId > challengeAnswers.length ||
    !Number.isInteger(challengeIndex) ||
    challengeIndex < 0 ||
    challengeIndex >= levelId
  ) {
    return null;
  }

  return challengeAnswers[challengeIndex];
}

export function isCorrectChallengeAnswer(levelId, challengeIndex, answer) {
  const expectedAnswer = getChallengeAnswer(levelId, challengeIndex);
  if (!expectedAnswer || typeof answer !== "string") {
    return false;
  }

  const normalizedAnswer = answer
    .trim()
    .toLowerCase()
    .replace(/^(a|an)\s+/, "")
    .replace(/[.!?]+$/, "")
    .replace(/\s+/g, " ");

  return normalizedAnswer === expectedAnswer;
}

export default new Map(
  challengeAnswers.map((answer, index) => [index + 1, answer]),
);
