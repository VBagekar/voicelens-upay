"""
BERT Fine-Tuner for VoiceLens
-------------------------------
Model  : bert-base-uncased (HuggingFace)
Task   : 3-class sentiment (negative=0, neutral=1, positive=2)
Device : CUDA (RTX 3050) with automatic CPU fallback
"""

import os
import json
import time
import torch
import numpy as np
import pandas as pd
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    BertTokenizer,
    BertForSequenceClassification,
    get_linear_schedule_with_warmup
)
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report

# ── Constants ─────────────────────────────────────────────────────────────────
MODEL_NAME   = "bert-base-uncased"
NUM_LABELS   = 3
MAX_LENGTH   = 128          # Max tokens per sentence
BATCH_SIZE   = 16           # Safe for 4GB VRAM
EPOCHS       = 3            # 3 epochs is enough for fine-tuning
LEARNING_RATE = 2e-5        # Standard for BERT fine-tuning
WARMUP_RATIO  = 0.1
SEED          = 42

LABEL2ID = {"negative": 0, "neutral": 1, "positive": 2}
ID2LABEL = {0: "negative", 1: "neutral", 2: "positive"}

# Paths
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR    = os.path.join(BASE_DIR, "..", "..", "..")
DATA_PATH   = os.path.join(ROOT_DIR, "data", "processed", "combined_dataset.csv")
MODEL_DIR   = os.path.join(ROOT_DIR, "models", "bert_voicelens")


# ── Dataset Class ─────────────────────────────────────────────────────────────
class NGOFeedbackDataset(Dataset):
    """
    PyTorch Dataset — converts text + label into BERT-ready tensors.
    Tokenizer handles padding, truncation, attention masks.
    """

    def __init__(self, texts: list, labels: list, tokenizer, max_length: int):
        self.texts     = texts
        self.labels    = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            str(self.texts[idx]),
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        return {
            "input_ids":      encoding["input_ids"].squeeze(0),
            "attention_mask": encoding["attention_mask"].squeeze(0),
            "label":          torch.tensor(self.labels[idx], dtype=torch.long)
        }


# ── Trainer Class ─────────────────────────────────────────────────────────────
class BertTrainer:

    def __init__(self):
        # Detect device
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[BertTrainer] Device: {self.device}")
        if self.device.type == "cuda":
            print(f"[BertTrainer] GPU: {torch.cuda.get_device_name(0)}")
            print(f"[BertTrainer] VRAM: {round(torch.cuda.get_device_properties(0).total_memory/1024**3,1)} GB")

        torch.manual_seed(SEED)

    def load_data(self):
        """Load and split dataset into train/val/test."""
        print(f"\n[BertTrainer] Loading data from: {DATA_PATH}")
        df = pd.read_csv(DATA_PATH).dropna(subset=["text", "label"])
        df = df[df["label"].isin(LABEL2ID.keys())]

        df["label_id"] = df["label"].map(LABEL2ID)

        texts  = df["text"].tolist()
        labels = df["label_id"].tolist()

        # 80% train | 10% val | 10% test
        X_train, X_temp, y_train, y_temp = train_test_split(
            texts, labels, test_size=0.2, random_state=SEED, stratify=labels
        )
        X_val, X_test, y_val, y_test = train_test_split(
            X_temp, y_temp, test_size=0.5, random_state=SEED, stratify=y_temp
        )

        print(f"  Train : {len(X_train)} | Val : {len(X_val)} | Test : {len(X_test)}")
        return X_train, X_val, X_test, y_train, y_val, y_test

    def build_dataloaders(self, X_train, X_val, X_test, y_train, y_val, y_test, tokenizer):
        """Wrap splits into PyTorch DataLoaders."""
        train_ds = NGOFeedbackDataset(X_train, y_train, tokenizer, MAX_LENGTH)
        val_ds   = NGOFeedbackDataset(X_val,   y_val,   tokenizer, MAX_LENGTH)
        test_ds  = NGOFeedbackDataset(X_test,  y_test,  tokenizer, MAX_LENGTH)

        train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True)
        val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False)
        test_loader  = DataLoader(test_ds,  batch_size=BATCH_SIZE, shuffle=False)

        return train_loader, val_loader, test_loader

    def compute_class_weights(self, labels: list) -> torch.Tensor:
        """
        Handle class imbalance by giving more weight to underrepresented classes.
        Neutral class (15%) gets higher weight than negative (47%).
        """
        counts  = np.bincount(labels)
        weights = 1.0 / counts
        weights = weights / weights.sum() * NUM_LABELS
        print(f"  Class weights → neg:{weights[0]:.3f} | neu:{weights[1]:.3f} | pos:{weights[2]:.3f}")
        return torch.tensor(weights, dtype=torch.float).to(self.device)

    def train_epoch(self, model, loader, optimizer, scheduler, weights):
        """Single training epoch."""
        model.train()
        total_loss, correct, total = 0, 0, 0
        loss_fn = torch.nn.CrossEntropyLoss(weight=weights)

        for batch in loader:
            input_ids      = batch["input_ids"].to(self.device)
            attention_mask = batch["attention_mask"].to(self.device)
            labels_batch   = batch["label"].to(self.device)

            optimizer.zero_grad()

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            loss    = loss_fn(outputs.logits, labels_batch)

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()
            preds       = outputs.logits.argmax(dim=1)
            correct    += (preds == labels_batch).sum().item()
            total      += len(labels_batch)

        return total_loss / len(loader), correct / total

    def evaluate(self, model, loader):
        """Evaluate on val or test set."""
        model.eval()
        all_preds, all_labels = [], []

        with torch.no_grad():
            for batch in loader:
                input_ids      = batch["input_ids"].to(self.device)
                attention_mask = batch["attention_mask"].to(self.device)
                labels_batch   = batch["label"].to(self.device)

                outputs = model(input_ids=input_ids, attention_mask=attention_mask)
                preds   = outputs.logits.argmax(dim=1)

                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels_batch.cpu().numpy())

        acc = accuracy_score(all_labels, all_preds)
        return acc, all_preds, all_labels

    def train(self):
        """Full training pipeline."""

        # 1. Load data
        X_train, X_val, X_test, y_train, y_val, y_test = self.load_data()

        # 2. Load tokenizer + model
        print(f"\n[BertTrainer] Loading {MODEL_NAME}...")
        tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
        model     = BertForSequenceClassification.from_pretrained(
            MODEL_NAME,
            num_labels=NUM_LABELS,
            id2label=ID2LABEL,
            label2id=LABEL2ID
        ).to(self.device)

        total_params = sum(p.numel() for p in model.parameters()) / 1e6
        print(f"  Model parameters: {total_params:.1f}M")

        # 3. Build dataloaders
        train_loader, val_loader, test_loader = self.build_dataloaders(
            X_train, X_val, X_test, y_train, y_val, y_test, tokenizer
        )

        # 4. Class weights for imbalance
        weights = self.compute_class_weights(y_train)

        # 5. Optimizer + scheduler
        optimizer = AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
        total_steps = len(train_loader) * EPOCHS
        warmup_steps = int(total_steps * WARMUP_RATIO)
        scheduler = get_linear_schedule_with_warmup(
            optimizer,
            num_warmup_steps=warmup_steps,
            num_training_steps=total_steps
        )

        # 6. Training loop
        print(f"\n[BertTrainer] Starting training — {EPOCHS} epochs")
        print(f"  Batch size   : {BATCH_SIZE}")
        print(f"  Total steps  : {total_steps}")
        print(f"  Warmup steps : {warmup_steps}")
        print("=" * 55)

        best_val_acc  = 0.0
        history       = []
        training_start = time.time()

        for epoch in range(1, EPOCHS + 1):
            epoch_start = time.time()

            train_loss, train_acc = self.train_epoch(
                model, train_loader, optimizer, scheduler, weights
            )
            val_acc, _, _ = self.evaluate(model, val_loader)

            epoch_time = round(time.time() - epoch_start, 1)
            history.append({
                "epoch": epoch,
                "train_loss": round(train_loss, 4),
                "train_acc":  round(train_acc * 100, 2),
                "val_acc":    round(val_acc * 100, 2)
            })

            print(
                f"  Epoch {epoch}/{EPOCHS} | "
                f"Loss: {train_loss:.4f} | "
                f"Train: {train_acc*100:.2f}% | "
                f"Val: {val_acc*100:.2f}% | "
                f"⏱ {epoch_time}s"
            )

            # Save best model
            if val_acc > best_val_acc:
                best_val_acc = val_acc
                os.makedirs(MODEL_DIR, exist_ok=True)
                model.save_pretrained(MODEL_DIR)
                tokenizer.save_pretrained(MODEL_DIR)
                print(f"  ✅ Best model saved (val_acc: {val_acc*100:.2f}%)")

        total_time = round(time.time() - training_start, 1)

        # 7. Final test evaluation
        print(f"\n[BertTrainer] Loading best model for final test evaluation...")
        best_model = BertForSequenceClassification.from_pretrained(MODEL_DIR).to(self.device)
        test_acc, test_preds, test_labels = self.evaluate(best_model, test_loader)

        print(f"\n{'='*55}")
        print(f"  FINAL TEST ACCURACY : {test_acc*100:.2f}%")
        print(f"  Training time       : {total_time}s")
        print(f"{'='*55}")
        print("\n  Per-class Report:")
        print(classification_report(
            test_labels, test_preds,
            target_names=["negative", "neutral", "positive"]
        ))

        # 8. Save training metadata
        metadata = {
            "model_name":   MODEL_NAME,
            "num_labels":   NUM_LABELS,
            "epochs":       EPOCHS,
            "batch_size":   BATCH_SIZE,
            "max_length":   MAX_LENGTH,
            "learning_rate": LEARNING_RATE,
            "test_accuracy": round(test_acc * 100, 2),
            "best_val_acc":  round(best_val_acc * 100, 2),
            "training_time": total_time,
            "history":       history,
            "label2id":      LABEL2ID,
            "id2label":      ID2LABEL
        }

        meta_path = os.path.join(MODEL_DIR, "training_metadata.json")
        with open(meta_path, "w") as f:
            json.dump(metadata, f, indent=2)

        print(f"\n  Model saved to  : {MODEL_DIR}")
        print(f"  Metadata saved  : {meta_path}")

        return metadata


if __name__ == "__main__":
    trainer = BertTrainer()
    trainer.train()