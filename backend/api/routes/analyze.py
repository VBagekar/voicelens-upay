"""
VoiceLens API Routes
----------------------
POST /api/analyze-text     → analyze a single text with chosen model
POST /api/analyze-batch    → analyze multiple texts at once
POST /api/analyze-file     → analyze uploaded CSV / Excel file
GET  /api/models           → list available models + their metadata
GET  /api/health           → health check
"""

import os
import sys
import json
import pandas as pd
from flask import Blueprint, request, jsonify

# Allow model imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from utils.text_cleaner import clean_text, clean_batch

analyze_bp = Blueprint("analyze", __name__)

# ── Model registry (loaded once at startup via app.py) ────────────────────────
# These will be injected by app.py after models load
_models = {}


def register_models(models: dict):
    """Called by app.py to inject loaded models into routes."""
    global _models
    _models = models
    print(f"[Routes] Models registered: {list(_models.keys())}")


# ── Helpers ───────────────────────────────────────────────────────────────────
def get_model(name: str):
    """Get a model by name. Raises 400 if not found."""
    if name not in _models:
        return None, jsonify({
            "error": f"Model '{name}' not found. "
                     f"Available: {list(_models.keys())}"
        }), 400
    return _models[name], None, None


def format_result(result: dict, text: str) -> dict:
    """Add the original text to any model result."""
    return {**result, "text": text}


# ── GET /api/health ───────────────────────────────────────────────────────────
@analyze_bp.route("/health", methods=["GET"])
def health():
    """Simple health check — confirms API + models are loaded."""
    return jsonify({
        "status":  "ok",
        "models":  list(_models.keys()),
        "version": "1.0.0"
    })


# ── GET /api/models ───────────────────────────────────────────────────────────
@analyze_bp.route("/models", methods=["GET"])
def list_models():
    """Return available models with descriptions."""
    meta_path = os.path.join(
        os.path.dirname(__file__),
        "..", "..", "..", "models", "bert_voicelens", "training_metadata.json"
    )

    bert_meta = {}
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            bert_meta = json.load(f)

    return jsonify({
        "models": {
            "vader": {
                "name":        "VADER",
                "type":        "rule-based",
                "description": "Fast rule-based sentiment analyzer. "
                               "Best for short, clean text.",
                "accuracy":    "~29% (baseline)",
                "speed":       "very fast"
            },
            "textblob": {
                "name":        "TextBlob",
                "type":        "statistical",
                "description": "Pattern-based NLP. "
                               "Returns polarity + subjectivity.",
                "accuracy":    "~27% (baseline)",
                "speed":       "fast"
            },
            "bert": {
                "name":        "BERT",
                "type":        "deep-learning",
                "description": "Fine-tuned BERT transformer. "
                               "Best accuracy for NGO feedback.",
                "accuracy":    f"{bert_meta.get('test_accuracy', 89.27)}%",
                "speed":       "moderate"
            }
        }
    })


# ── POST /api/analyze-text ────────────────────────────────────────────────────
@analyze_bp.route("/analyze-text", methods=["POST"])
def analyze_text():
    """
    Analyze a single text entry.

    Request body:
        { "text": "...", "model": "bert" | "vader" | "textblob" | "all" }

    Response:
        Single model → { label, confidence, scores, model, text }
        all models   → { results: {vader:..., textblob:..., bert:...},
                         consensus, agreement, text }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    raw_text   = data.get("text", "")
    model_name = data.get("model", "bert").lower()

    # Clean + validate
    text, valid, err = clean_text(raw_text)
    if not valid:
        return jsonify({"error": err}), 400

    # Run all 3 models
    if model_name == "all":
        results = {}
        for name, model in _models.items():
            results[name] = format_result(model.analyze(text), text)

        labels    = [r["label"] for r in results.values()]
        consensus = max(set(labels), key=labels.count)

        return jsonify({
            "text":      text,
            "results":   results,
            "consensus": consensus,
            "agreement": len(set(labels)) == 1
        })

    # Run single model
    model, err_resp, code = get_model(model_name)
    if err_resp:
        return err_resp, code

    result = format_result(model.analyze(text), text)
    return jsonify(result)


# ── POST /api/analyze-batch ───────────────────────────────────────────────────
@analyze_bp.route("/analyze-batch", methods=["POST"])
def analyze_batch():
    """
    Analyze a list of texts.

    Request body:
        { "texts": ["...", "..."], "model": "bert" }

    Response:
        { "results": [...], "summary": {positive:n, neutral:n, negative:n},
          "total": n, "model": "bert" }
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be JSON."}), 400

    texts_raw  = data.get("texts", [])
    model_name = data.get("model", "bert").lower()

    if not isinstance(texts_raw, list) or len(texts_raw) == 0:
        return jsonify({"error": "Provide a non-empty list under 'texts'."}), 400

    if len(texts_raw) > 500:
        return jsonify({"error": "Max 500 texts per batch request."}), 400

    # Clean batch
    cleaned, errors = clean_batch(texts_raw)

    # Get model
    model, err_resp, code = get_model(model_name)
    if err_resp:
        return err_resp, code

    # Run predictions
    raw_results = model.analyze_batch(cleaned)

    # Attach original text + build summary
    results = []
    summary = {"positive": 0, "negative": 0, "neutral": 0}

    for i, r in enumerate(raw_results):
        if i < len(errors) and errors[i]["index"] == i:
            r["error"] = errors[i]["error"]
        r["text"] = texts_raw[i]
        results.append(r)
        summary[r["label"]] = summary.get(r["label"], 0) + 1

    total = len(results)
    return jsonify({
        "results": results,
        "summary": summary,
        "total":   total,
        "model":   model_name,
        "sentiment_distribution": {
            "positive_pct": round(summary["positive"] / total * 100, 1),
            "neutral_pct":  round(summary["neutral"]  / total * 100, 1),
            "negative_pct": round(summary["negative"] / total * 100, 1),
        }
    })


# ── POST /api/analyze-file ────────────────────────────────────────────────────
@analyze_bp.route("/analyze-file", methods=["POST"])
def analyze_file():
    """
    Analyze a CSV or Excel file upload.

    Form data:
        file  → CSV or XLSX file
        model → bert | vader | textblob (default: bert)
        column → name of text column (default: auto-detect)

    Response:
        { results, summary, sentiment_distribution, total, filename }
    """
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded. Use key 'file'."}), 400

    file       = request.files["file"]
    model_name = request.form.get("model", "bert").lower()
    col_hint   = request.form.get("column", "").strip()

    if file.filename == "":
        return jsonify({"error": "Empty filename."}), 400

    filename = file.filename.lower()

    # ── Read file ─────────────────────────────────────────────────────────────
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(file)
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(file)
        else:
            return jsonify({
                "error": "Only CSV and Excel files are supported."
            }), 400
    except Exception as e:
        return jsonify({"error": f"Could not read file: {str(e)}"}), 400

    if df.empty:
        return jsonify({"error": "File is empty."}), 400

    # ── Find text column ──────────────────────────────────────────────────────
    if col_hint and col_hint in df.columns:
        text_col = col_hint
    else:
        # Auto-detect: first column containing mostly strings
        candidates = ["text", "feedback", "comment",
                      "response", "review", "message"]
        text_col = None

        for c in candidates:
            if c in df.columns:
                text_col = c
                break

        if not text_col:
            # Fall back to first string column
            str_cols = df.select_dtypes(include="object").columns.tolist()
            if str_cols:
                text_col = str_cols[0]
            else:
                return jsonify({
                    "error": "No text column found. "
                             "Pass 'column' param with the column name."
                }), 400

    texts_raw = df[text_col].fillna("").tolist()

    if len(texts_raw) > 1000:
        texts_raw = texts_raw[:1000]   # Cap at 1000 rows

    # Clean + get model + predict
    cleaned, _ = clean_batch([str(t) for t in texts_raw])

    model, err_resp, code = get_model(model_name)
    if err_resp:
        return err_resp, code

    raw_results = model.analyze_batch(cleaned)

    results = []
    summary = {"positive": 0, "negative": 0, "neutral": 0}

    for i, r in enumerate(raw_results):
        r["text"] = texts_raw[i]
        results.append(r)
        summary[r["label"]] = summary.get(r["label"], 0) + 1

    total = len(results)
    return jsonify({
        "filename":    file.filename,
        "text_column": text_col,
        "total":       total,
        "results":     results,
        "summary":     summary,
        "sentiment_distribution": {
            "positive_pct": round(summary["positive"] / total * 100, 1),
            "neutral_pct":  round(summary["neutral"]  / total * 100, 1),
            "negative_pct": round(summary["negative"] / total * 100, 1),
        },
        "model": model_name
    })