"""
VoiceLens Flask Application Entry Point
-----------------------------------------
Loads all ML models ONCE at startup,
then registers API routes.
"""

import os
import sys
from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Allow imports from backend/
sys.path.insert(0, os.path.dirname(__file__))

from models.baseline.vader_analyzer    import VaderAnalyzer
from models.baseline.textblob_analyzer import TextBlobAnalyzer
from models.bert.bert_analyzer         import BertAnalyzer
from api.routes.analyze                import analyze_bp, register_models


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # ── Load all models once ──────────────────────────────────────────────────
    print("\n" + "="*55)
    print("  VoiceLens API — Starting Up")
    print("="*55)

    models = {
        "vader":    VaderAnalyzer(),
        "textblob": TextBlobAnalyzer(),
        "bert":     BertAnalyzer(),
    }

    # Inject models into routes
    register_models(models)

    # ── Register blueprints ───────────────────────────────────────────────────
    app.register_blueprint(analyze_bp, url_prefix="/api")

    print("="*55)
    print("  All models loaded. API ready!")
    print("="*55 + "\n")

    return app


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app  = create_app()
    app.run(
        host="0.0.0.0",
        port=port,
        debug=os.getenv("FLASK_DEBUG", "false").lower() == "true"
    )