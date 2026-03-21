"""
Baseline Model Evaluator for VoiceLens
----------------------------------------
Runs both VADER and TextBlob on our combined dataset
and reports accuracy, per-class metrics, and a comparison table.
Results saved to data/processed/baseline_results.json
"""

import pandas as pd
import json
import os
import time
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)

from vader_analyzer import VaderAnalyzer
from textblob_analyzer import TextBlobAnalyzer


def evaluate_model(name: str, analyzer, texts: list, true_labels: list) -> dict:
    """
    Run a model on all texts and compute metrics.
    Returns a results dictionary.
    """
    print(f"\n  Evaluating {name}...")
    start = time.time()

    results = analyzer.analyze_batch(texts)
    predicted = [r["label"] for r in results]

    elapsed = round(time.time() - start, 2)
    accuracy = round(accuracy_score(true_labels, predicted) * 100, 2)

    report = classification_report(
        true_labels,
        predicted,
        labels=["negative", "neutral", "positive"],
        output_dict=True,
        zero_division=0
    )

    cm = confusion_matrix(
        true_labels,
        predicted,
        labels=["negative", "neutral", "positive"]
    )

    return {
        "model":          name,
        "accuracy":       accuracy,
        "time_seconds":   elapsed,
        "samples_tested": len(texts),
        "report":         report,
        "confusion_matrix": cm.tolist()
    }


def print_comparison_table(vader_res: dict, textblob_res: dict):
    """Print a clean side-by-side comparison."""
    print("\n" + "=" * 60)
    print("  BASELINE MODEL COMPARISON")
    print("=" * 60)
    print(f"  {'Metric':<25} {'VADER':<15} {'TextBlob'}")
    print("-" * 60)
    print(f"  {'Accuracy':<25} {vader_res['accuracy']}%{'':<10} {textblob_res['accuracy']}%")
    print(f"  {'Speed (seconds)':<25} {vader_res['time_seconds']}s{'':<10} {textblob_res['time_seconds']}s")
    print(f"  {'Samples tested':<25} {vader_res['samples_tested']:<15} {textblob_res['samples_tested']}")
    print("-" * 60)

    for label in ["negative", "neutral", "positive"]:
        v_f1 = round(vader_res["report"][label]["f1-score"] * 100, 1)
        t_f1 = round(textblob_res["report"][label]["f1-score"] * 100, 1)
        print(f"  F1 - {label:<20} {v_f1}%{'':<10} {t_f1}%")

    print("=" * 60)

    # Winner
    if vader_res["accuracy"] > textblob_res["accuracy"]:
        print(f"  🏆 Winner: VADER (+{round(vader_res['accuracy'] - textblob_res['accuracy'], 2)}%)")
    elif textblob_res["accuracy"] > vader_res["accuracy"]:
        print(f"  🏆 Winner: TextBlob (+{round(textblob_res['accuracy'] - vader_res['accuracy'], 2)}%)")
    else:
        print("  🤝 Tie!")
    print("=" * 60)
def evaluate_by_source(name: str, analyzer, df: pd.DataFrame):
    """Show accuracy broken down by dataset source."""
    print(f"\n  {name} — Accuracy by Source:")
    print(f"  {'Source':<20} {'Accuracy':<12} {'Samples'}")
    print(f"  {'-'*45}")
    for source in df["source"].unique():
        subset = df[df["source"] == source]
        texts  = subset["text"].tolist()
        labels = subset["label"].tolist()
        preds  = [r["label"] for r in analyzer.analyze_batch(texts)]
        acc    = round(accuracy_score(labels, preds) * 100, 2)
        print(f"  {source:<20} {acc}%{'':<8} {len(texts)}")

def main():
    # ── Load dataset ──────────────────────────────────────────────────────────
    data_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "data", "processed", "combined_dataset.csv"
    )
    print(f"\n  Loading dataset from: {data_path}")
    df = pd.read_csv(data_path).dropna(subset=["text", "label"])

    # Use only rows with valid labels
    df = df[df["label"].isin(["positive", "negative", "neutral"])]

    texts = df["text"].tolist()
    labels = df["label"].tolist()
    print(f"  Dataset loaded: {len(texts)} samples")

    # ── Run evaluations ───────────────────────────────────────────────────────
    vader_res    = evaluate_model("VADER",    VaderAnalyzer(),    texts, labels)
    textblob_res = evaluate_model("TextBlob", TextBlobAnalyzer(), texts, labels)
    evaluate_by_source("VADER",    VaderAnalyzer(),    df)
    evaluate_by_source("TextBlob", TextBlobAnalyzer(), df)
    # ── Print comparison ──────────────────────────────────────────────────────
    print_comparison_table(vader_res, textblob_res)

    # ── Save results ──────────────────────────────────────────────────────────
    output = {
        "vader":    vader_res,
        "textblob": textblob_res
    }

    out_dir = os.path.join(
        os.path.dirname(__file__), "..", "..", "..", "data", "processed"
    )
    out_path = os.path.join(out_dir, "baseline_results.json")

    with open(out_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n  Results saved to: {out_path}")


if __name__ == "__main__":
    main()