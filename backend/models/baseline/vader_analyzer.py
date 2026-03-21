"""
VADER Sentiment Analyzer for VoiceLens
---------------------------------------
VADER (Valence Aware Dictionary and sEntiment Reasoner)
- Rule-based model using a curated sentiment lexicon
- Works great on short social media-style text
- Returns compound score: -1.0 (most negative) to +1.0 (most positive)
- No training required — runs instantly
"""

from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from typing import Dict


class VaderAnalyzer:
    """
    Wraps VADER to produce 3-class sentiment labels
    matching our dataset: positive / neutral / negative
    """

    # Thresholds recommended by VADER authors
    POSITIVE_THRESHOLD = 0.05
    NEGATIVE_THRESHOLD = -0.05

    def __init__(self):
        self.analyzer = SentimentIntensityAnalyzer()
        print("[VaderAnalyzer] Initialized ✅")

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
                "model": "vader"
            }

        scores = self.analyzer.polarity_scores(text)
        compound = scores["compound"]

        # Map compound score to 3-class label
        if compound >= self.POSITIVE_THRESHOLD:
            label = "positive"
            confidence = round(compound, 4)
        elif compound <= self.NEGATIVE_THRESHOLD:
            label = "negative"
            confidence = round(abs(compound), 4)
        else:
            label = "neutral"
            confidence = round(1 - abs(compound), 4)

        return {
            "label": label,
            "confidence": confidence,
            "scores": {
                "positive": round(scores["pos"], 4),
                "negative": round(scores["neg"], 4),
                "neutral":  round(scores["neu"], 4),
                "compound": round(scores["compound"], 4),
            },
            "model": "vader"
        }

    def analyze_batch(self, texts: list) -> list:
        """Analyze a list of texts. Returns list of result dicts."""
        return [self.analyze(t) for t in texts]


# ── Quick self-test when run directly ────────────────────────────────────────
if __name__ == "__main__":
    analyzer = VaderAnalyzer()

    test_cases = [
        # Positive NGO feedback
        "The tutoring sessions helped my child improve significantly in math.",
        "UPAY volunteers were extremely caring and dedicated to our community.",
        "I feel hopeful about my future after the skill development program.",
        # Negative NGO feedback
        "The sessions were too infrequent and poorly organized.",
        "Volunteers seemed disinterested and were often absent.",
        "Promised resources were never delivered to our school.",
        # Neutral NGO feedback
        "The program session took place at the community hall on Sunday.",
        "UPAY has been operating in this district for the past five years.",
        "Classes were held every Saturday for two months.",
        # Edge cases
        "It was okay I guess.",
        "AMAZING WORK!! Absolutely life-changing experience!!!",
        "Terrible. Waste of time. Very disappointed.",
    ]

    print("\n" + "=" * 65)
    print("  VADER Analyzer — NGO Feedback Test")
    print("=" * 65)
    print(f"  {'Text':<48} {'Label':<10} {'Conf'}")
    print("-" * 65)

    for text in test_cases:
        result = analyzer.analyze(text)
        truncated = text[:45] + "..." if len(text) > 45 else text
        label_colored = result["label"].upper()
        print(f"  {truncated:<48} {label_colored:<10} {result['confidence']:.4f}")

    print("=" * 65)