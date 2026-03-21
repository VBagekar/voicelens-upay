"""
Text Cleaning Utility for VoiceLens
--------------------------------------
Sanitizes user input before passing to ML models.
Handles edge cases: empty text, too long, special chars, etc.
"""

import re
from typing import Tuple


MAX_CHARS = 1000   # Hard limit per text entry


def clean_text(text: str) -> Tuple[str, bool, str]:
    """
    Clean and validate a single text input.

    Returns:
        (cleaned_text, is_valid, error_message)
    """
    # ── Null / empty check ────────────────────────────────────────────────────
    if not text or not isinstance(text, str):
        return "", False, "Text cannot be empty."

    # ── Strip whitespace ──────────────────────────────────────────────────────
    text = text.strip()

    if len(text) == 0:
        return "", False, "Text cannot be empty."

    # ── Length check ──────────────────────────────────────────────────────────
    if len(text) > MAX_CHARS:
        text = text[:MAX_CHARS]   # Truncate silently

    # ── Remove control characters (keep newlines) ─────────────────────────────
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # ── Collapse multiple spaces ──────────────────────────────────────────────
    text = re.sub(r" {2,}", " ", text)

    # ── Minimum length ────────────────────────────────────────────────────────
    if len(text) < 3:
        return "", False, "Text is too short to analyze."

    return text, True, ""


def clean_batch(texts: list) -> Tuple[list, list]:
    """
    Clean a list of texts.

    Returns:
        (cleaned_texts, errors)
        errors is a list of (index, message) for any invalid entries
    """
    cleaned = []
    errors  = []

    for i, text in enumerate(texts):
        c, valid, msg = clean_text(str(text) if text else "")
        if valid:
            cleaned.append(c)
        else:
            cleaned.append("")
            errors.append({"index": i, "error": msg})

    return cleaned, errors