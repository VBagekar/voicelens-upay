# 🎙️ VoiceLens — UPAY NGO Sentiment & Impact Analyzer

> AI-powered sentiment analysis tool built for UPAY NGO —
> turning community voices into actionable insights.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![PyTorch](https://img.shields.io/badge/PyTorch-2.5.1+cu121-red)
![BERT](https://img.shields.io/badge/BERT-89.27%25_Accuracy-green)
![Flask](https://img.shields.io/badge/Flask-3.0.3-lightgrey)
![React](https://img.shields.io/badge/React-18-61DAFB)

---

## 🌟 What is VoiceLens?

VoiceLens analyzes feedback from UPAY NGO volunteers, beneficiaries,
and community members — turning raw text into meaningful sentiment insights.

Whether it's a survey response, a bulk CSV upload, or a single comment,
VoiceLens tells you if the community feels **positive**, **neutral**, or **negative**
— and how confident the model is.

---

## 🎯 Key Features

| Feature | Description |
|---------|-------------|
| 📝 Text Analyzer | Single text sentiment with confidence scores |
| 📂 File Upload | Bulk CSV/Excel analysis up to 1000 rows |
| 🔁 Model Comparison | VADER vs TextBlob vs BERT side-by-side |
| ⬇️ CSV Export | Download analysis results |
| 🧠 Local ML Only | No external APIs — fully offline capable |

---

## 📊 Model Performance

| Model | Type | Accuracy | Speed |
|-------|------|----------|-------|
| **BERT** | Deep Learning (Fine-tuned) | **89.27%** | ~4s/batch |
| VADER | Rule-based | 56% | 0.23s |
| TextBlob | Statistical | 62% | 0.58s |

> BERT fine-tuned on 4,100 samples:
> SST-2 (2000) + GoEmotions (2000) + Synthetic NGO data (100)

---

## 🛠️ Tech Stack

### Backend
- **Python 3.11** + **Flask 3.0**
- **PyTorch 2.5.1 + CUDA 12.1** (RTX 3050 GPU)
- **HuggingFace Transformers** — `bert-base-uncased` fine-tuned
- **VADER** + **TextBlob** — baseline models
- **scikit-learn** — evaluation metrics

### Frontend
- **React 18** + **Tailwind CSS**
- **Recharts** — data visualization
- **Axios** — API communication
- UPAY Brand: Montserrat + Open Sans fonts

### Data
- SST-2 (Stanford Sentiment Treebank)
- GoEmotions (Google Research)
- Custom synthetic NGO feedback dataset

---

## 📁 Project Structure
```
voicelens-upay/
├── frontend/               # React UI
│   └── src/
│       ├── pages/          # Home, Analyzer, FileUpload
│       ├── components/     # Navbar, Footer, ResultCard
│       └── services/       # API calls (api.js)
├── backend/
│   ├── app.py              # Flask entry point
│   ├── models/
│   │   ├── baseline/       # VADER + TextBlob analyzers
│   │   └── bert/           # BERT trainer + inference
│   ├── api/routes/         # REST endpoints
│   └── utils/              # Text cleaning
├── models/
│   └── bert_voicelens/     # Saved fine-tuned model
├── data/
│   ├── raw/                # SST-2, GoEmotions
│   ├── processed/          # Combined dataset + results
│   └── synthetic/          # NGO feedback dataset
└── notebooks/              # Jupyter exploration
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11
- Node.js 18+
- NVIDIA GPU (optional but recommended)

### 1. Clone & Setup
```bash
git clone https://github.com/YOUR_USERNAME/voicelens-upay.git
cd voicelens-upay
```

### 2. Backend Setup
```powershell
# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Train BERT Model
```powershell
python backend\models\bert\bert_trainer.py
# Takes ~5 min on GPU, ~60 min on CPU
```

### 4. Start Flask API
```powershell
$env:CUDA_VISIBLE_DEVICES = "0"
python backend\app.py
# API runs on http://localhost:5000
```

### 5. Start React Frontend
```powershell
cd frontend
npm install
npm start
# UI runs on http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server + model status |
| GET | `/api/models` | List models + accuracy |
| POST | `/api/analyze-text` | Analyze single text |
| POST | `/api/analyze-batch` | Analyze list of texts |
| POST | `/api/analyze-file` | Analyze CSV/Excel file |

---

## 🏢 About UPAY NGO

UPAY is a student-driven NGO committed to education, empowerment,
and community development. VoiceLens was built to help UPAY understand
the emotional pulse of the communities they serve.

---

## 📄 License

MIT License © 2025 VoiceLens · Built for UPAY NGO