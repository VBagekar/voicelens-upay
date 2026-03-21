import React, { useState } from "react";
import ResultCard, { ComparisonCard } from "../components/analyzer/ResultCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { analyzeText } from "../services/api";

const MODEL_OPTIONS = [
    { value: "bert", label: "BERT", desc: "89% accuracy · Best" },
    { value: "vader", label: "VADER", desc: "Fast · Rule-based" },
    { value: "textblob", label: "TextBlob", desc: "Statistical NLP" },
    { value: "all", label: "Compare All", desc: "See all 3 models" },
];

const AnalyzerPage = () => {
    const [text, setText] = useState("");
    const [model, setModel] = useState("bert");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleAnalyze = async () => {
        if (!text.trim()) { setError("Please enter some text."); return; }
        setError(""); setLoading(true); setResult(null);
        try {
            const res = await analyzeText(text, model);
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.error ||
                "Cannot connect to API. Is Flask running on port 5000?");
        } finally { setLoading(false); }
    };

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>

            {/* Header */}
            <h1 style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: 28, fontWeight: 800,
                color: "#003C64", marginBottom: 8,
            }}>📝 Text Analyzer</h1>
            <p style={{
                fontFamily: "Open Sans, sans-serif",
                fontSize: 14, color: "#6b7280", marginBottom: 28,
            }}>
                Analyze sentiment from volunteer feedback, survey responses,
                or any community text.
            </p>

            {/* Input Card */}
            <div style={{
                backgroundColor: "white", borderRadius: 20,
                padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                marginBottom: 24,
            }}>

                {/* Model Selector */}
                <p style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 13, fontWeight: 700,
                    color: "#003C64", marginBottom: 10,
                }}>Choose Model</p>

                <div style={{
                    display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                    gap: 10, marginBottom: 24,
                }}>
                    {MODEL_OPTIONS.map(opt => (
                        <button key={opt.value} onClick={() => setModel(opt.value)}
                            style={{
                                padding: "12px 8px", borderRadius: 12,
                                border: `2px solid ${model === opt.value ? "#F7AC2D" : "#E9EAEC"}`,
                                backgroundColor: model === opt.value ? "#fffbeb" : "white",
                                cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                            }}>
                            <p style={{
                                fontFamily: "Montserrat, sans-serif",
                                fontSize: 12, fontWeight: 700,
                                color: "#003C64", margin: "0 0 2px",
                            }}>{opt.label}</p>
                            <p style={{
                                fontFamily: "Open Sans, sans-serif",
                                fontSize: 11, color: "#9ca3af", margin: 0,
                            }}>{opt.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Text Area */}
                <p style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 13, fontWeight: 700,
                    color: "#003C64", marginBottom: 8,
                }}>Enter Feedback Text</p>

                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    rows={5}
                    placeholder="e.g. The UPAY tutoring program helped my child gain confidence..."
                    style={{
                        width: "100%", padding: 16,
                        borderRadius: 12,
                        border: `2px solid ${text ? "#2D8F91" : "#E9EAEC"}`,
                        fontFamily: "Open Sans, sans-serif",
                        fontSize: 14, color: "#003C64",
                        resize: "vertical", outline: "none",
                        boxSizing: "border-box", transition: "border-color 0.2s",
                    }}
                />

                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 16,
                }}>
                    {error
                        ? <p style={{ fontSize: 12, color: "#e11d48", margin: 0 }}>{error}</p>
                        : <span />
                    }
                    <p style={{
                        fontSize: 12, margin: 0,
                        color: text.length > 900 ? "#e11d48" : "#9ca3af",
                    }}>{text.length}/1000</p>
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 12 }}>
                    <button
                        onClick={handleAnalyze}
                        disabled={loading || !text.trim()}
                        style={{
                            flex: 1, padding: "14px 24px",
                            borderRadius: 12, border: "none",
                            fontFamily: "Montserrat, sans-serif",
                            fontWeight: 700, fontSize: 14,
                            color: "white", cursor: loading || !text.trim() ? "not-allowed" : "pointer",
                            backgroundColor: loading || !text.trim() ? "#9ca3af" : "#003C64",
                            transition: "background-color 0.2s",
                        }}>
                        {loading ? "⏳ Analyzing..." : "🔍 Analyze Sentiment"}
                    </button>

                    {(text || result) && (
                        <button
                            onClick={() => { setText(""); setResult(null); setError(""); }}
                            style={{
                                padding: "14px 20px", borderRadius: 12,
                                border: "2px solid #E9EAEC",
                                backgroundColor: "white",
                                fontFamily: "Open Sans, sans-serif",
                                fontSize: 14, color: "#6b7280", cursor: "pointer",
                            }}>Clear</button>
                    )}
                </div>
            </div>

            {/* Results */}
            {loading && <LoadingSpinner message="Running sentiment analysis..." />}

            {result && !loading && (
                <div>
                    <h2 style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: 18, fontWeight: 700,
                        color: "#003C64", marginBottom: 12,
                    }}>Analysis Result</h2>
                    {result.results
                        ? <ComparisonCard result={result} />
                        : <ResultCard result={result} />
                    }
                </div>
            )}
        </div>
    );
};

export default AnalyzerPage;