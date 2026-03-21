import React, { useState, useRef } from "react";
import ResultCard from "../components/analyzer/ResultCard";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { analyzeFile } from "../services/api";

const MODEL_OPTIONS = [
    { value: "bert", label: "BERT", desc: "Most accurate" },
    { value: "vader", label: "VADER", desc: "Fastest" },
    { value: "textblob", label: "TextBlob", desc: "Statistical" },
];

const SENTIMENT_COLORS = {
    positive: { bg: "#f0fdf4", color: "#16a34a", border: "#22c55e" },
    neutral: { bg: "#f0f9ff", color: "#0284c7", border: "#38bdf8" },
    negative: { bg: "#fff1f2", color: "#e11d48", border: "#f43f5e" },
};

// ── Donut chart (pure SVG, no library needed) ─────────────────────────────────
const MiniDonut = ({ positive, neutral, negative, total }) => {
    if (total === 0) return null;

    const size = 120;
    const cx = size / 2;
    const cy = size / 2;
    const r = 44;
    const stroke = 16;
    const circ = 2 * Math.PI * r;

    const segments = [
        { pct: positive / total, color: "#22c55e" },
        { pct: neutral / total, color: "#38bdf8" },
        { pct: negative / total, color: "#f43f5e" },
    ];

    let offset = 0;
    const paths = segments.map((seg, i) => {
        const dash = seg.pct * circ;
        const gap = circ - dash;
        const rotate = offset * 360 - 90;
        offset += seg.pct;
        return (
            <circle
                key={i} cx={cx} cy={cy} r={r}
                fill="none" stroke={seg.color}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${gap}`}
                transform={`rotate(${rotate} ${cx} ${cy})`}
            />
        );
    });

    return (
        <svg width={size} height={size}>
            <circle cx={cx} cy={cy} r={r} fill="none"
                stroke="#E9EAEC" strokeWidth={stroke} />
            {paths}
            <text x={cx} y={cy - 6} textAnchor="middle"
                style={{
                    fontFamily: "Montserrat,sans-serif",
                    fontSize: 18, fontWeight: 800, fill: "#003C64"
                }}>
                {total}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle"
                style={{
                    fontFamily: "Open Sans,sans-serif",
                    fontSize: 10, fill: "#6b7280"
                }}>
                texts
            </text>
        </svg>
    );
};

// ── Summary bar (e.g. ████░░ 72%) ────────────────────────────────────────────
const SummaryBar = ({ label, count, total, colorKey }) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    const cfg = SENTIMENT_COLORS[colorKey];
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: 4
            }}>
                <span style={{
                    fontFamily: "Open Sans,sans-serif", fontSize: 13,
                    color: "#374151", textTransform: "capitalize",
                }}>{label}</span>
                <span style={{
                    fontFamily: "Montserrat,sans-serif", fontSize: 13,
                    fontWeight: 700, color: cfg.color,
                }}>{count} <span style={{ fontWeight: 400, color: "#9ca3af" }}>
                        ({pct}%)
                    </span></span>
            </div>
            <div style={{
                height: 10, backgroundColor: "#E9EAEC",
                borderRadius: 99, overflow: "hidden",
            }}>
                <div style={{
                    height: "100%", width: `${pct}%`,
                    backgroundColor: cfg.border,
                    borderRadius: 99, transition: "width 0.8s ease",
                }} />
            </div>
        </div>
    );
};

// ── Download helper ───────────────────────────────────────────────────────────
const downloadCSV = (results, filename) => {
    const header = "text,label,confidence,model";
    const rows = results.map(r =>
        `"${String(r.text).replace(/"/g, '""')}",${r.label},${r.confidence},${r.model}`
    );
    const blob = new Blob([[header, ...rows].join("\n")],
        { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voicelens_${filename}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
const FileUploadPage = () => {
    const [file, setFile] = useState(null);
    const [model, setModel] = useState("bert");
    const [dragging, setDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");
    const [showAll, setShowAll] = useState(false);
    const inputRef = useRef();

    // ── Drag & drop handlers ──────────────────────────────────────────────────
    const onDragOver = e => { e.preventDefault(); setDragging(true); };
    const onDragLeave = e => { e.preventDefault(); setDragging(false); };
    const onDrop = e => {
        e.preventDefault(); setDragging(false);
        const dropped = e.dataTransfer.files[0];
        if (dropped) handleFileSelect(dropped);
    };
    const onFileInput = e => {
        if (e.target.files[0]) handleFileSelect(e.target.files[0]);
    };

    const handleFileSelect = (f) => {
        const ext = f.name.split(".").pop().toLowerCase();
        if (!["csv", "xlsx", "xls"].includes(ext)) {
            setError("Only CSV and Excel (.xlsx / .xls) files are supported.");
            return;
        }
        setFile(f);
        setError("");
        setResult(null);
    };

    // ── Analyze ───────────────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!file) { setError("Please upload a file first."); return; }
        setLoading(true); setError(""); setResult(null);
        try {
            const res = await analyzeFile(file, model);
            setResult(res.data);
        } catch (err) {
            setError(
                err.response?.data?.error ||
                "Could not connect to API. Is Flask running on port 5000?"
            );
        } finally { setLoading(false); }
    };

    const handleReset = () => {
        setFile(null); setResult(null);
        setError(""); setShowAll(false);
        if (inputRef.current) inputRef.current.value = "";
    };

    // ── Derived stats ─────────────────────────────────────────────────────────
    const summary = result?.summary || {};
    const total = result?.total || 0;
    const topLabel = Object.entries(summary).sort((a, b) => b[1] - a[1])[0]?.[0];
    const avgConf = result?.results?.length
        ? Math.round(
            result.results.reduce((s, r) => s + (r.confidence || 0), 0)
            / result.results.length * 100
        )
        : 0;

    const displayResults = showAll
        ? result?.results
        : result?.results?.slice(0, 8);

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>

            {/* ── Header ── */}
            <h1 style={{
                fontFamily: "Montserrat,sans-serif", fontSize: 28,
                fontWeight: 800, color: "#003C64", margin: "0 0 8px",
            }}>📂 File Upload Analyzer</h1>
            <p style={{
                fontFamily: "Open Sans,sans-serif", fontSize: 14,
                color: "#6b7280", marginBottom: 28,
            }}>
                Upload a CSV or Excel file of community feedback.
                VoiceLens analyzes every row and gives you a full sentiment report.
            </p>

            {/* ── Upload + Config Card ── */}
            {!result && (
                <div style={{
                    backgroundColor: "white", borderRadius: 20,
                    padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                    marginBottom: 24,
                }}>

                    {/* Drop Zone */}
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        style={{
                            border: `2px dashed ${dragging ? "#003C64" : file ? "#22c55e" : "#d1d5db"}`,
                            borderRadius: 16, padding: "40px 24px",
                            textAlign: "center", cursor: "pointer",
                            backgroundColor: dragging ? "#f0f9ff"
                                : file ? "#f0fdf4" : "#fafafa",
                            transition: "all 0.2s", marginBottom: 24,
                        }}>
                        <input ref={inputRef} type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={onFileInput}
                            style={{ display: "none" }} />

                        {file ? (
                            <>
                                <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                                <p style={{
                                    fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                                    color: "#16a34a", fontSize: 15, margin: "0 0 4px",
                                }}>{file.name}</p>
                                <p style={{
                                    fontFamily: "Open Sans,sans-serif",
                                    fontSize: 12, color: "#6b7280", margin: 0,
                                }}>
                                    {(file.size / 1024).toFixed(1)} KB
                                    · Click to change file
                                </p>
                            </>
                        ) : (
                            <>
                                <div style={{ fontSize: 40, marginBottom: 12 }}>📁</div>
                                <p style={{
                                    fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                                    color: "#003C64", fontSize: 15, margin: "0 0 6px",
                                }}>
                                    {dragging ? "Drop it here!" : "Drag & Drop your file here"}
                                </p>
                                <p style={{
                                    fontFamily: "Open Sans,sans-serif",
                                    fontSize: 13, color: "#9ca3af", margin: "0 0 16px",
                                }}>or click to browse</p>
                                <span style={{
                                    backgroundColor: "#E9EAEC", color: "#6b7280",
                                    fontSize: 12, padding: "4px 12px", borderRadius: 20,
                                    fontFamily: "Open Sans,sans-serif",
                                }}>CSV · XLSX · XLS · Max 1000 rows</span>
                            </>
                        )}
                    </div>

                    {/* Model Selector */}
                    <p style={{
                        fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                        fontSize: 13, color: "#003C64", marginBottom: 10,
                    }}>Choose Model</p>
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(3,1fr)",
                        gap: 10, marginBottom: 20,
                    }}>
                        {MODEL_OPTIONS.map(opt => (
                            <button key={opt.value} onClick={() => setModel(opt.value)}
                                style={{
                                    padding: "12px 8px", borderRadius: 12, cursor: "pointer",
                                    border: `2px solid ${model === opt.value ? "#F7AC2D" : "#E9EAEC"}`,
                                    backgroundColor: model === opt.value ? "#fffbeb" : "white",
                                    transition: "all 0.2s", textAlign: "left",
                                }}>
                                <p style={{
                                    fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                                    fontSize: 13, color: "#003C64", margin: "0 0 2px",
                                }}>{opt.label}</p>
                                <p style={{
                                    fontFamily: "Open Sans,sans-serif",
                                    fontSize: 11, color: "#9ca3af", margin: 0,
                                }}>{opt.desc}</p>
                            </button>
                        ))}
                    </div>

                    {error && (
                        <p style={{
                            fontFamily: "Open Sans,sans-serif", fontSize: 13,
                            color: "#e11d48", marginBottom: 12,
                        }}>⚠️ {error}</p>
                    )}

                    {/* Analyze Button */}
                    <button
                        onClick={handleAnalyze}
                        disabled={!file || loading}
                        style={{
                            width: "100%", padding: "14px",
                            borderRadius: 12, border: "none",
                            backgroundColor: !file || loading ? "#9ca3af" : "#003C64",
                            color: "white", fontFamily: "Montserrat,sans-serif",
                            fontWeight: 700, fontSize: 15,
                            cursor: !file || loading ? "not-allowed" : "pointer",
                        }}>
                        {loading ? "⏳ Analyzing..." : "🔍 Analyze File"}
                    </button>
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <LoadingSpinner message="Analyzing all rows with BERT..." />
            )}

            {/* ── RESULTS ── */}
            {result && !loading && (
                <>
                    {/* Summary Header */}
                    <div style={{
                        backgroundColor: "#003C64", borderRadius: 20,
                        padding: 24, marginBottom: 20, color: "white",
                        display: "flex", justifyContent: "space-between",
                        alignItems: "center", flexWrap: "wrap", gap: 16,
                    }}>
                        <div>
                            <h2 style={{
                                fontFamily: "Montserrat,sans-serif", fontSize: 20,
                                fontWeight: 800, margin: "0 0 4px", color: "white",
                            }}>
                                Analysis Complete ✅
                            </h2>
                            <p style={{
                                fontFamily: "Open Sans,sans-serif",
                                fontSize: 13, opacity: 0.8, margin: 0,
                            }}>
                                {result.filename} · {total} rows · Column: "{result.text_column}"
                            </p>
                        </div>
                        <div style={{ display: "flex", gap: 10 }}>
                            <button
                                onClick={() => downloadCSV(result.results, result.filename)}
                                style={{
                                    padding: "10px 18px", borderRadius: 10,
                                    border: "2px solid #F7AC2D",
                                    backgroundColor: "transparent", color: "#F7AC2D",
                                    fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                                    fontSize: 13, cursor: "pointer",
                                }}>⬇️ Download CSV</button>
                            <button onClick={handleReset}
                                style={{
                                    padding: "10px 18px", borderRadius: 10,
                                    border: "2px solid white",
                                    backgroundColor: "transparent", color: "white",
                                    fontFamily: "Open Sans,sans-serif",
                                    fontSize: 13, cursor: "pointer",
                                }}>Upload New</button>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                        gap: 16, marginBottom: 20,
                    }}>
                        {[
                            { label: "Total Rows", value: total, icon: "📋" },
                            { label: "Avg Confidence", value: `${avgConf}%`, icon: "🎯" },
                            { label: "Top Sentiment", value: topLabel || "—", icon: "📈" },
                            { label: "Model Used", value: result.model?.toUpperCase(), icon: "🧠" },
                        ].map((s, i) => (
                            <div key={i} style={{
                                backgroundColor: "white", borderRadius: 16, padding: 16,
                                textAlign: "center",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                border: "1px solid #E9EAEC",
                            }}>
                                <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                                <p style={{
                                    fontFamily: "Montserrat,sans-serif", fontWeight: 800,
                                    fontSize: 18, color: "#003C64", margin: "0 0 2px",
                                    textTransform: "capitalize",
                                }}>{s.value}</p>
                                <p style={{
                                    fontFamily: "Open Sans,sans-serif",
                                    fontSize: 11, color: "#6b7280", margin: 0,
                                }}>{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Distribution + Donut */}
                    <div style={{
                        display: "grid", gridTemplateColumns: "1fr 180px",
                        gap: 20, marginBottom: 20,
                    }}>
                        <div style={{
                            backgroundColor: "white", borderRadius: 16,
                            padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            border: "1px solid #E9EAEC",
                        }}>
                            <p style={{
                                fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                                fontSize: 14, color: "#003C64", marginBottom: 16,
                            }}>Sentiment Breakdown</p>
                            <SummaryBar label="Positive" count={summary.positive || 0}
                                total={total} colorKey="positive" />
                            <SummaryBar label="Neutral" count={summary.neutral || 0}
                                total={total} colorKey="neutral" />
                            <SummaryBar label="Negative" count={summary.negative || 0}
                                total={total} colorKey="negative" />
                        </div>

                        <div style={{
                            backgroundColor: "white", borderRadius: 16,
                            padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            border: "1px solid #E9EAEC",
                            display: "flex", alignItems: "center",
                            justifyContent: "center",
                        }}>
                            <MiniDonut
                                positive={summary.positive || 0}
                                neutral={summary.neutral || 0}
                                negative={summary.negative || 0}
                                total={total}
                            />
                        </div>
                    </div>

                    {/* Individual Results */}
                    <div style={{
                        backgroundColor: "white", borderRadius: 16,
                        padding: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        border: "1px solid #E9EAEC",
                    }}>
                        <div style={{
                            display: "flex", justifyContent: "space-between",
                            alignItems: "center", marginBottom: 16,
                        }}>
                            <p style={{
                                fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                                fontSize: 14, color: "#003C64", margin: 0,
                            }}>Individual Results</p>
                            <span style={{
                                fontFamily: "Open Sans,sans-serif",
                                fontSize: 12, color: "#9ca3af",
                            }}>
                                Showing {displayResults?.length} of {total}
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {displayResults?.map((r, i) => (
                                <ResultCard key={i} result={r} showText={true} />
                            ))}
                        </div>

                        {result.results?.length > 8 && (
                            <button
                                onClick={() => setShowAll(!showAll)}
                                style={{
                                    width: "100%", marginTop: 16, padding: "12px",
                                    borderRadius: 12, border: "2px solid #E9EAEC",
                                    backgroundColor: "white", cursor: "pointer",
                                    fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                                    fontSize: 13, color: "#003C64",
                                }}>
                                {showAll
                                    ? "Show Less ↑"
                                    : `Show All ${total} Results ↓`}
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default FileUploadPage;