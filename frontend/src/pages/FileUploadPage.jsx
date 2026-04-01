import React, { useState, useRef } from "react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { analyzeFile } from "../services/api";

const MODEL_OPTIONS = [
    { value: "bert", label: "BERT", desc: "Most accurate · 89.27%" },
    { value: "vader", label: "VADER", desc: "Fastest · Rule-based" },
    { value: "textblob", label: "TextBlob", desc: "Statistical NLP" },
];

const FileUploadPage = ({ onAnalysisComplete }) => {
    const [file, setFile] = useState(null);
    const [model, setModel] = useState("bert");
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);

    // ── File selection ────────────────────────────────────────────────────────
    const handleFileSelect = (f) => {
        if (!f) return;
        const ext = f.name.split(".").pop().toLowerCase();
        if (!["csv", "xlsx", "xls"].includes(ext)) {
            setError("Only CSV and Excel (.xlsx / .xls) files are supported.");
            return;
        }
        setFile(f);
        setError("");
    };

    const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
    const onDragLeave = (e) => { e.preventDefault(); setDragging(false); };
    const onDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFileSelect(dropped);
    };

    // ── Analyze ───────────────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!file) { setError("Please upload a file first."); return; }
        setLoading(true);
        setError("");
        try {
            const res = await analyzeFile(file, model);
            // Pass results UP to App.js → auto-navigate to Dashboard
            onAnalysisComplete({ ...res.data, model });
        } catch (err) {
            setError(
                err.response?.data?.error ||
                "Cannot connect to API. Is Flask running on port 5000?"
            );
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 24px" }}>

            {/* Header */}
            <h1 style={{
                fontFamily: "Montserrat, sans-serif", fontSize: 28,
                fontWeight: 800, color: "#003C64", margin: "0 0 8px",
            }}>📂 File Upload Analyzer</h1>
            <p style={{
                fontFamily: "Open Sans, sans-serif", fontSize: 14,
                color: "#6b7280", marginBottom: 28,
            }}>
                Upload a CSV or Excel file of English feedback.
                Results will open automatically in the Dashboard.
            </p>

            <div style={{
                backgroundColor: "white", borderRadius: 20,
                padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            }}>

                {/* ── Drop Zone ── */}
                <div
                    onClick={() => inputRef.current && inputRef.current.click()}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    style={{
                        border: `2px dashed ${dragging ? "#003C64" : file ? "#22c55e" : "#d1d5db"
                            }`,
                        borderRadius: 16,
                        padding: "48px 24px",
                        textAlign: "center",
                        cursor: "pointer",
                        backgroundColor: dragging ? "#f0f9ff"
                            : file ? "#f0fdf4" : "#fafafa",
                        transition: "all 0.2s",
                        marginBottom: 24,
                        userSelect: "none",
                    }}
                >
                    {/* Hidden real input */}
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        style={{ display: "none" }}
                        onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                                handleFileSelect(e.target.files[0]);
                            }
                        }}
                    />

                    {file ? (
                        <>
                            <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
                            <p style={{
                                fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                                color: "#16a34a", fontSize: 16, margin: "0 0 4px",
                            }}>{file.name}</p>
                            <p style={{
                                fontFamily: "Open Sans, sans-serif",
                                fontSize: 12, color: "#6b7280", margin: "0 0 12px",
                            }}>
                                {(file.size / 1024).toFixed(1)} KB · Click to change
                            </p>
                            <span style={{
                                backgroundColor: "#dcfce7", color: "#16a34a",
                                fontSize: 12, padding: "4px 12px", borderRadius: 20,
                                fontFamily: "Open Sans, sans-serif",
                            }}>Ready to analyze →</span>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 44, marginBottom: 12 }}>📁</div>
                            <p style={{
                                fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                                color: "#003C64", fontSize: 16, margin: "0 0 6px",
                            }}>
                                {dragging ? "Drop it here!" : "Drag & Drop your file here"}
                            </p>
                            <p style={{
                                fontFamily: "Open Sans, sans-serif",
                                fontSize: 13, color: "#9ca3af", margin: "0 0 16px",
                            }}>or click anywhere here to browse</p>
                            <span style={{
                                backgroundColor: "#E9EAEC", color: "#6b7280",
                                fontSize: 12, padding: "4px 14px", borderRadius: 20,
                                fontFamily: "Open Sans, sans-serif",
                            }}>CSV · XLSX · XLS · Max 1000 rows · English only</span>
                        </>
                    )}
                </div>

                {/* ── Model Selector ── */}
                <p style={{
                    fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                    fontSize: 13, color: "#003C64", marginBottom: 10,
                }}>Choose Model</p>
                <div style={{
                    display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                    gap: 10, marginBottom: 20,
                }}>
                    {MODEL_OPTIONS.map(opt => (
                        <button
                            key={opt.value}
                            onClick={() => setModel(opt.value)}
                            style={{
                                padding: "14px 8px", borderRadius: 12, cursor: "pointer",
                                border: `2px solid ${model === opt.value ? "#F7AC2D" : "#E9EAEC"}`,
                                backgroundColor: model === opt.value ? "#fffbeb" : "white",
                                transition: "all 0.2s", textAlign: "left",
                            }}
                        >
                            <p style={{
                                fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                                fontSize: 13, color: "#003C64", margin: "0 0 2px",
                            }}>{opt.label}</p>
                            <p style={{
                                fontFamily: "Open Sans, sans-serif",
                                fontSize: 11, color: "#9ca3af", margin: 0,
                            }}>{opt.desc}</p>
                        </button>
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <p style={{
                        fontFamily: "Open Sans, sans-serif", fontSize: 13,
                        color: "#e11d48", marginBottom: 12,
                        padding: "10px 14px", backgroundColor: "#fff1f2",
                        borderRadius: 8,
                    }}>⚠️ {error}</p>
                )}

                {/* ── Analyze Button ── */}
                <button
                    onClick={handleAnalyze}
                    disabled={!file || loading}
                    style={{
                        width: "100%", padding: "16px",
                        borderRadius: 12, border: "none",
                        backgroundColor: !file || loading ? "#9ca3af" : "#003C64",
                        color: "white",
                        fontFamily: "Montserrat, sans-serif",
                        fontWeight: 700, fontSize: 15,
                        cursor: !file || loading ? "not-allowed" : "pointer",
                        transition: "background-color 0.2s",
                    }}
                >
                    {loading ? "⏳ Analyzing... Please wait" : "🔍 Analyze & View Dashboard →"}
                </button>

                {loading && (
                    <LoadingSpinner message="Running analysis on all rows..." />
                )}

                {/* Tips */}
                <div style={{
                    marginTop: 20, padding: "14px 16px",
                    backgroundColor: "#f0f9ff", borderRadius: 12,
                    borderLeft: "3px solid #38bdf8",
                }}>
                    <p style={{
                        fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                        fontSize: 12, color: "#0284c7", margin: "0 0 6px",
                    }}>💡 File Format Tips</p>
                    <p style={{
                        fontFamily: "Open Sans, sans-serif", fontSize: 12,
                        color: "#4b5563", margin: "0 0 4px", lineHeight: 1.6,
                    }}>
                        • Your file should have a column named <strong>feedback</strong>, <strong>text</strong>,
                        or <strong>comment</strong>
                    </p>
                    <p style={{
                        fontFamily: "Open Sans, sans-serif", fontSize: 12,
                        color: "#4b5563", margin: "0 0 4px",
                    }}>
                        • All feedback must be in <strong>English</strong>
                    </p>
                    <p style={{
                        fontFamily: "Open Sans, sans-serif", fontSize: 12,
                        color: "#4b5563", margin: 0,
                    }}>
                        • Maximum 1000 rows per file
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FileUploadPage;