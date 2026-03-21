"""
TextBlob Sentiment Analyzer for VoiceLens
------------------------------------------
TextBlob:
- Pattern-based NLP library
- Uses a Naive Bayes classifier trained on movie reviews
- Returns polarity (-1 to +1) and subjectivity (0 to 1)
- Subjectivity tells us: is this an opinion or a fact?
  0.0 = objective fact | 1.0 = pure personal opinion
"""

from textblob import TextBlob
from typing import Dict


class TextBlobAnalyzer:
    """
    Wraps TextBlob to produce 3-class sentiment labels
    matching our dataset: positive / neutral / negative
    """

    POSITIVE_THRESHOLD = 0.1
    NEGATIVE_THRESHOLD = -0.1

    def __init__(self):
        print("[TextBlobAnalyzer] Initialized ✅")

    def analyze(self, text: str) -> Dict:
        """
        Analyze a single piece of text.

        Args:
            text: Input string to analyze

        Returns:
            dict with keys: label, confidence, scores, model
        """
        if not text or not text.strip():
            return {
                "label": "neutral",
                "confidence": 0.0,
                "scores": {},
                "model": "textblob"
            }

        blob = TextBlob(str(text))
        polarity = blob.sentiment.polarity
        subjectivity = blob.sentiment.subjectivity

        if polarity >= self.POSITIVE_THRESHOLD:
            label = "positive"
            confidence = round(polarity, 4)
        elif polarity <= self.NEGATIVE_THRESHOLD:
            label = "negative"
            confidence = round(abs(polarity), 4)
        else:
            label = "neutral"
            confidence = round(1 - abs(polarity), 4)

        return {
            "label": label,
            "confidence": confidence,
            "scores": {
                "polarity":     round(polarity, 4),
                "subjectivity": round(subjectivity, 4),
            },
            "model": "textblob"
        }

    def analyze_batch(self, texts: list) -> list:
        """Analyze a list of texts. Returns list of result dicts."""
        return [self.analyze(t) for t in texts]


# ── Quick self-test when run directly ────────────────────────────────────────
if __name__ == "__main__":
    analyzer = TextBlobAnalyzer()

    test_cases = [
        "The tutoring sessions helped my child improve significantly in math.",
        "UPAY volunteers were extremely caring and dedicated to our community.",
        "I feel hopeful about my future after the skill development program.",
        "The sessions were too infrequent and poorly organized.",
        "Volunteers seemed disinterested and were often absent.",
        "Promised resources were never delivered to our school.",
        "The program session took place at the community hall on Sunday.",
        "UPAY has been operating in this district for the past five years.",
        "Classes were held every Saturday for two months.",
        "It was okay I guess.",
        "AMAZING WORK!! Absolutely life-changing experience!!!",
        "Terrible. Waste of time. Very disappointed.",
    ]

    print("\n" + "=" * 70)
    print("  TextBlob Analyzer — NGO Feedback Test")
    print("=" * 70)
    print(f"  {'Text':<48} {'Label':<10} {'Polarity':<10} {'Subjectivity'}")
    print("-" * 70)

    for text in test_cases:
        result = analyzer.analyze(text)
        truncated = text[:45] + "..." if len(text) > 45 else text
        print(
            f"  {truncated:<48} "
            f"{result['label'].upper():<10} "
            f"{result['scores']['polarity']:<10} "
            f"{result['scores']['subjectivity']}"
        )

    print("=" * 70)