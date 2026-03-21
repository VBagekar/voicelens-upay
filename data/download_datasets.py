"""
Dataset downloader for VoiceLens.
Downloads SST-2 and GoEmotions from HuggingFace datasets library.
All data stays local after first download.
"""

from datasets import load_dataset
import pandas as pd
import os

def download_sst2(output_dir: str = "data/raw/sst2"):
    """Download SST-2 binary sentiment dataset."""
    print("\n[1/2] Downloading SST-2...")
    os.makedirs(output_dir, exist_ok=True)

    dataset = load_dataset("glue", "sst2")

    # Save train split (we use a 2000-sample subset to keep things fast)
    train_df = pd.DataFrame(dataset["train"]).sample(
        n=2000, random_state=42
    )[["sentence", "label"]]

    train_df.columns = ["text", "label"]
    # SST-2: 0 = negative, 1 = positive (no neutral)
    train_df["label"] = train_df["label"].map({0: "negative", 1: "positive"})
    train_df["source"] = "sst2"

    out_path = os.path.join(output_dir, "sst2_sample.csv")
    train_df.to_csv(out_path, index=False)
    print(f"  SST-2 saved: {out_path} ({len(train_df)} rows)")
    return train_df


def download_go_emotions(output_dir: str = "data/raw/go_emotions"):
    """Download GoEmotions and map to simplified 3-class labels."""
    print("\n[2/2] Downloading GoEmotions...")
    os.makedirs(output_dir, exist_ok=True)

    dataset = load_dataset("go_emotions", "simplified")
    train_df = pd.DataFrame(dataset["train"])

    # GoEmotions simplified has 3 labels: 0=negative, 1=neutral, 2=positive
    label_map = {0: "negative", 1: "neutral", 2: "positive"}

    # Each row can have multiple labels — keep only single-label rows
    train_df = train_df[train_df["labels"].apply(len) == 1].copy()
    train_df["label_id"] = train_df["labels"].apply(lambda x: x[0])
    train_df["label"] = train_df["label_id"].map(label_map)
    train_df = train_df[["text", "label"]].dropna()
    train_df["source"] = "go_emotions"

    # Sample 2000 rows
    sample_df = train_df.sample(n=2000, random_state=42)
    out_path = os.path.join(output_dir, "go_emotions_sample.csv")
    sample_df.to_csv(out_path, index=False)
    print(f"  GoEmotions saved: {out_path} ({len(sample_df)} rows)")
    return sample_df


def combine_datasets():
    """Merge all datasets into one master training file."""
    print("\n[Combining datasets...]")

    sst2_df = pd.read_csv("data/raw/sst2/sst2_sample.csv")
    go_df = pd.read_csv("data/raw/go_emotions/go_emotions_sample.csv")
    ngo_df = pd.read_csv("data/synthetic/ngo_feedback.csv")[
        ["text", "label", "source"]
    ]

    combined = pd.concat([sst2_df, go_df, ngo_df], ignore_index=True)

    # Shuffle the combined dataset
    combined = combined.sample(frac=1, random_state=42).reset_index(drop=True)

    # Map labels to IDs for ML models
    label_map = {"negative": 0, "neutral": 1, "positive": 2}
    combined["label_id"] = combined["label"].map(label_map)

    os.makedirs("data/processed", exist_ok=True)
    out_path = "data/processed/combined_dataset.csv"
    combined.to_csv(out_path, index=False)

    print("\n" + "=" * 50)
    print("  Combined Dataset Summary")
    print("=" * 50)
    print(f"  Total samples    : {len(combined)}")
    print(f"  Positive         : {len(combined[combined['label']=='positive'])}")
    print(f"  Negative         : {len(combined[combined['label']=='negative'])}")
    print(f"  Neutral          : {len(combined[combined['label']=='neutral'])}")
    print(f"\n  By Source:")
    print(combined["source"].value_counts().to_string())
    print(f"\n  Saved to: {out_path}")
    print("=" * 50)
    return combined


if __name__ == "__main__":
    download_sst2()
    download_go_emotions()
    combine_datasets()