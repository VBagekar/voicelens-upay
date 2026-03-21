"""
Environment verification script for VoiceLens.
Run this anytime to confirm your ML environment is healthy.
"""

import sys

def check_python():
    print(f"Python version     : {sys.version}")

def check_torch():
    try:
        import torch
        print(f"PyTorch version    : {torch.__version__}")
        print(f"CUDA available     : {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"CUDA version       : {torch.version.cuda}")
            print(f"GPU name           : {torch.cuda.get_device_name(0)}")
            vram = round(
                torch.cuda.get_device_properties(0).total_memory / 1024**3, 2
            )
            print(f"VRAM               : {vram} GB")
    except ImportError:
        print("PyTorch            : NOT INSTALLED")

def check_transformers():
    try:
        import transformers
        print(f"Transformers       : {transformers.__version__}")
    except ImportError:
        print("Transformers       : NOT INSTALLED")

def check_vader():
    try:
        from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
        print("VADER              : OK")
    except ImportError:
        print("VADER              : NOT INSTALLED")

def check_textblob():
    try:
        from textblob import TextBlob
        test = TextBlob("VoiceLens is working!")
        print(f"TextBlob           : OK (polarity test: {test.sentiment.polarity})")
    except ImportError:
        print("TextBlob           : NOT INSTALLED")

def check_flask():
    try:
        import flask
        print(f"Flask              : {flask.__version__}")
    except ImportError:
        print("Flask              : NOT INSTALLED")

def check_pandas():
    try:
        import pandas
        print(f"Pandas             : {pandas.__version__}")
    except ImportError:
        print("Pandas             : NOT INSTALLED")

if __name__ == "__main__":
    print("=" * 50)
    print("  VoiceLens – Environment Check")
    print("=" * 50)
    check_python()
    check_torch()
    check_transformers()
    check_vader()
    check_textblob()
    check_flask()
    check_pandas()
    print("=" * 50)
    print("  All checks complete!")
    print("=" * 50)