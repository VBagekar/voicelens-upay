"""
BERT Inference Analyzer for VoiceLens
---------------------------------------
Loads the saved fine-tuned model and runs predictions.
Designed for speed — model loads ONCE, predicts many times.
"""

import os
import torch
from transformers import BertTokenizer, BertForSequenceClassification
from typing import Dict, List

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR  = os.path.abspath(os.path.join(BASE_DIR, "..", "..", ".."))
MODEL_DIR = os.path.join(ROOT_DIR, "models", "bert_voicelens")

ID2LABEL  = {0: "negative", 1: "neutral", 2: "positive"}
MAX_LEN   = 128


class BertAnalyzer:
    """
    Singleton-style inference wrapper.
    Load once at server startup, reuse for every request.
    """

    def __init__(self):
        os.environ["CUDA_VISIBLE_DEVICES"] = "0"
        self.device = torch.device(
            "cuda:0" if torch.cuda.is_available() else "cpu"
        )

        print(f"[BertAnalyzer] Loading model from: {MODEL_DIR}")

        if not os.path.exists(MODEL_DIR):
            raise FileNotFoundError(
                f"Model not found at {MODEL_DIR}. "
                "Run bert_trainer.py first."
            )

        self.tokenizer = BertTokenizer.from_pretrained(MODEL_DIR)
        self.model     = BertForSequenceClassification.from_pretrained(
            MODEL_DIR
        ).to(self.device)
        self.model.eval()

        print(f"[BertAnalyzer] Ready on {self.device} ✅")

    @torch.no_grad()
    def analyze(self, text: str) -> Dict:
        """Predict sentiment for a single text."""
        if not text or not text.strip():
            return {
                "label": "neutral", "confidence": 0.0,
                "scores": {}, "model": "bert"
            }

        enc = self.tokenizer(
            str(text),
            max_length=MAX_LEN,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        input_ids = enc["input_ids"].to(self.device)
        attn_mask = enc["attention_mask"].to(self.device)

        logits = self.model(
            input_ids=input_ids,
            attention_mask=attn_mask
        ).logits

        probs      = torch.softmax(logits, dim=1).squeeze()
        pred_id    = probs.argmax().item()
        label      = ID2LABEL[pred_id]
        confidence = round(probs[pred_id].item(), 4)

        return {
            "label":      label,
            "confidence": confidence,
            "scores": {
                "negative": round(probs[0].item(), 4),
                "neutral":  round(probs[1].item(), 4),
                "positive": round(probs[2].item(), 4),
            },
            "model": "bert"
        }

    @torch.no_grad()
    def analyze_batch(self, texts: List[str]) -> List[Dict]:
        """Predict sentiment for a list of texts efficiently."""
        results = []
        # Process in mini-batches of 32 for efficiency
        batch_size = 32
        for i in range(0, len(texts), batch_size):
            batch = texts[i: i + batch_size]
            enc   = self.tokenizer(
                batch,
                max_length=MAX_LEN,
                padding=True,
                truncation=True,
                return_tensors="pt"
            )
            input_ids = enc["input_ids"].to(self.device)
            attn_mask = enc["attention_mask"].to(self.device)

            logits = self.model(
                input_ids=input_ids,
                attention_mask=attn_mask
            ).logits
            probs  = torch.softmax(logits, dim=1)

            for j in range(len(batch)):
                p       = probs[j]
                pred_id = p.argmax().item()
                results.append({
                    "label":      ID2LABEL[pred_id],
                    "confidence": round(p[pred_id].item(), 4),
                    "scores": {
                        "negative": round(p[0].item(), 4),
                        "neutral":  round(p[1].item(), 4),
                        "positive": round(p[2].item(), 4),
                    },
                    "model": "bert"
                })
        return results


# ── Quick test ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    analyzer = BertAnalyzer()

    tests = [
        "The tutoring sessions helped my child improve significantly.",
        "UPAY volunteers were extremely caring and dedicated.",
        "I feel hopeful about my future after the skill program.",
        "The sessions were too infrequent and poorly organized.",
        "Volunteers seemed disinterested and were often absent.",
        "Promised resources were never delivered to our school.",
        "The program session took place at the community hall.",
        "UPAY has been operating in this district for five years.",
        "It was okay I guess.",
        "AMAZING!! Absolutely life-changing experience!!!",
    ]

    print(f"\n{'='*65}")
    print(f"  BERT Analyzer — Inference Test")
    print(f"{'='*65}")
    print(f"  {'Text':<45} {'Label':<10} {'Conf'}")
    print(f"  {'-'*60}")

    for text in tests:
        r   = analyzer.analyze(text)
        txt = text[:42] + "..." if len(text) > 42 else text
        print(f"  {txt:<45} {r['label'].upper():<10} {r['confidence']:.4f}")

    print(f"{'='*65}")