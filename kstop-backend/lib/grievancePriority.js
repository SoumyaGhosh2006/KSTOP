// Lightweight NLP-style grievance priority scoring.
// This intentionally uses the existing category score as a baseline and
// adds severity signals from the student's title + description. Keeping
// the ranker isolated means it can later be replaced by a trained model
// without changing the grievance API or database flow.

const CATEGORY_BASE_SCORE = {
  Water: 70, Electrical: 75, Plumbing: 60, Transport: 50,
  Internet: 45, Cleaning: 40, Food: 55, Other: 30,
};

const SEVERITY_KEYWORDS = [
  {
    score: 30,
    terms: [
      "fire", "smoke", "gas leak", "electric shock", "sparks", "explosion",
      "flood", "sewage overflow", "unconscious", "bleeding", "collapsed",
      "life threatening", "life-threatening", "emergency", "dangerous",
    ],
  },
  {
    score: 20,
    terms: [
      "no water", "no electricity", "power outage", "blackout", "short circuit",
      "severe leak", "major leak", "broken pipe", "unsafe", "health risk",
      "medical", "injury", "urgent",
    ],
  },
  {
    score: 10,
    terms: [
      "leak", "broken", "not working", "unusable", "infection", "fever",
      "dirty water", "contaminated", "repeated", "days", "week",
    ],
  },
];

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreText(text) {
  return SEVERITY_KEYWORDS.reduce((score, group) => {
    const matched = group.terms.some((term) => text.includes(term));
    return matched ? score + group.score : score;
  }, 0);
}

function calculateGrievancePriority({ title, description, category }) {
  const baseScore = CATEGORY_BASE_SCORE[category] ?? CATEGORY_BASE_SCORE.Other;
  const text = normalizeText(`${title || ""} ${description || ""}`);
  const keywordScore = scoreText(text);

  return Math.min(100, baseScore + keywordScore);
}

module.exports = { calculateGrievancePriority, CATEGORY_BASE_SCORE };