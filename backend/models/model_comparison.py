"""
Model Comparison Engine for VoiceLens
---------------------------------------
Runs all 3 models on the same input and returns
a structured comparison — used by the API and dashboard.
"""

import os, sys, json, time
import pandas as pd
from sklearn.metrics import accuracy_score, classification_report

# Allow imports from subdirectories
sys.path.insert(0, os.path.dirname(__file__))

from baseline.vader_analyzer    import VaderAnalyzer
from baseline.textblob_analyzer import TextBlobAnalyzer
from bert.bert_analyzer         import BertAnalyzer

ROOT_DIR    = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
DATA_PATH   = os.path.join(ROOT_DIR, "data", "processed", "combined_dataset.csv")
RESULTS_DIR = os.path.join(ROOT_DIR, "data", "processed")


class ModelComparison:
    """
    Loads all 3 models once and provides:
      - Single text comparison
      - Batch dataset evaluation
      - Persistent results storage
    """

    def __init__(self):
        print("\n[ModelComparison] Loading all models...")
        self.models = {
            "vader":    VaderAnalyzer(),
            "textblob": TextBlobAnalyzer(),
            "bert":     BertAnalyzer(),
        }
        print("[ModelComparison] All models ready ✅\n")

    # ── Single text ───────────────────────────────────────────────────────────
    def compare_single(self, text: str) -> dict:
        """Run all 3 models on one text and return side-by-side results."""
        results = {}
        for name, model in self.models.items():
            t0 = time.time()
            r  = model.analyze(text)
            r["latency_ms"] = round((time.time() - t0) * 1000, 2)
            results[name]   = r

        # Determine overall consensus
        labels = [r["label"] for r in results.values()]
        consensus = max(set(labels), key=labels.count)

        return {
            "text":      text,
            "results":   results,
            "consensus": consensus,
            "agreement": len(set(labels)) == 1   # True if all 3 agree
        }

    # ── Full dataset evaluation ───────────────────────────────────────────────
    def evaluate_all(self, sample_size: int = 500) -> dict:
        """
        Evaluate all models on a dataset sample.
        Uses sample_size to keep evaluation fast.
        """
        print(f"[ModelComparison] Loading dataset (sample={sample_size})...")
        df = pd.read_csv(DATA_PATH).dropna(subset=["text", "label"])
        df = df[df["label"].isin(["positive", "negative", "neutral"])]
        df = df.sample(n=min(sample_size, len(df)), random_state=42)

        texts  = df["text"].tolist()
        labels = df["label"].tolist()

        comparison = {}

        for name, model in self.models.items():
            print(f"  Evaluating {name}...")
            t0    = time.time()
            preds = [r["label"] for r in model.analyze_batch(texts)]
            elapsed = round(time.time() - t0, 2)

            acc    = round(accuracy_score(labels, preds) * 100, 2)
            report = classification_report(
                labels, preds,
                labels=["negative", "neutral", "positive"],
                output_dict=True,
                zero_division=0
            )

            comparison[name] = {
                "accuracy":       acc,
                "time_seconds":   elapsed,
                "samples":        len(texts),
                "f1_negative":    round(report["negative"]["f1-score"]*100, 1),
                "f1_neutral":     round(report["neutral"]["f1-score"]*100,  1),
                "f1_positive":    round(report["positive"]["f1-score"]*100, 1),
                "macro_f1":       round(report["macro avg"]["f1-score"]*100, 1),
            }

        self._print_table(comparison)
        self._save_results(comparison)
        return comparison

    def _print_table(self, comp: dict):
        """Print a clean 3-model comparison table."""
        print(f"\n{'='*65}")
        print(f"  3-MODEL COMPARISON TABLE")
        print(f"{'='*65}")
        print(f"  {'Metric':<22} {'VADER':<14} {'TextBlob':<14} {'BERT'}")
        print(f"  {'-'*60}")

        metrics = [
            ("Accuracy",    "accuracy"),
            ("F1 - negative","f1_negative"),
            ("F1 - neutral", "f1_neutral"),
            ("F1 - positive","f1_positive"),
            ("Macro F1",    "macro_f1"),
            ("Speed (sec)", "time_seconds"),
        ]

        for label, key in metrics:
            v = comp["vader"][key]
            t = comp["textblob"][key]
            b = comp["bert"][key]
            suffix = "%" if key != "time_seconds" else "s"
            print(f"  {label:<22} {str(v)+suffix:<14} "
                  f"{str(t)+suffix:<14} {str(b)+suffix}")

        print(f"{'='*65}")

        # Winner banner
        accs   = {n: comp[n]["accuracy"] for n in comp}
        winner = max(accs, key=accs.get)
        print(f"  🏆 Best Model : {winner.upper()} "
              f"({accs[winner]}% accuracy)")
        print(f"{'='*65}\n")

    def _save_results(self, comp: dict):
        """Persist results to JSON for the dashboard."""
        out = os.path.join(RESULTS_DIR, "model_comparison.json")
        with open(out, "w") as f:
            json.dump(comp, f, indent=2)
        print(f"  Results saved → {out}")


# ── Run directly ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    mc = ModelComparison()

    # 1. Single text demo
    print("── Single Text Comparison ─────────────────────────────")
    demo = "The UPAY program completely transformed my child's confidence."
    result = mc.compare_single(demo)
    print(f"\n  Text: {demo}")
    print(f"\n  {'Model':<12} {'Label':<12} {'Confidence':<12} {'Latency'}")
    print(f"  {'-'*50}")
    for model, r in result["results"].items():
        print(f"  {model:<12} {r['label'].upper():<12} "
              f"{r['confidence']:<12} {r['latency_ms']}ms")
    print(f"\n  Consensus : {result['consensus'].upper()}")
    print(f"  All agree : {result['agreement']}")

    # 2. Full dataset evaluation
    print("\n── Full Dataset Evaluation (500 samples) ──────────────")
    mc.evaluate_all(sample_size=500)