import React, { useState } from "react";

// ── Config ────────────────────────────────────────────────────────────────────
const CFG = {
    positive: { color: "#16a34a", bg: "#f0fdf4", border: "#22c55e", emoji: "😊" },
    neutral: { color: "#0284c7", bg: "#f0f9ff", border: "#38bdf8", emoji: "😐" },
    negative: { color: "#e11d48", bg: "#fff1f2", border: "#f43f5e", emoji: "😔" },
};

// ── Pure SVG Donut (no library) ───────────────────────────────────────────────
const DonutChart = ({ positive, neutral, negative, total }) => {
    if (!total) return null;
    const r = 70, stroke = 18, circ = 2 * Math.PI * r;
    const segs = [
        { pct: positive / total, color: "#22c55e" },
        { pct: neutral / total, color: "#38bdf8" },
        { pct: negative / total, color: "#f43f5e" },
    ];
    let offset = 0;
    return (
        <svg viewBox="0 0 160 160" width="160" height="160">
            <circle cx="80" cy="80" r={r} fill="none"
                stroke="#E9EAEC" strokeWidth={stroke} />
            {segs.map((s, i) => {
                const dash = s.pct * circ;
                const rotate = offset * 360 - 90;
                offset += s.pct;
                return (
                    <circle key={i} cx="80" cy="80" r={r}
                        fill="none" stroke={s.color} strokeWidth={stroke}
                        strokeDasharray={`${dash} ${circ - dash}`}
                        transform={`rotate(${rotate} 80 80)`}
                    />
                );
            })}
            <text x="80" y="74" textAnchor="middle"
                style={{
                    fontFamily: "Montserrat,sans-serif",
                    fontSize: 22, fontWeight: 800, fill: "#003C64"
                }}>
                {total}
            </text>
            <text x="80" y="92" textAnchor="middle"
                style={{
                    fontFamily: "Open Sans,sans-serif",
                    fontSize: 11, fill: "#6b7280"
                }}>
                analyzed
            </text>
        </svg>
    );
};

// ── Bar row ───────────────────────────────────────────────────────────────────
const Bar = ({ label, count, total, cfg }) => {
    const pct = total ? Math.round(count / total * 100) : 0;
    return (
        <div style={{ marginBottom: 14 }}>
            <div style={{
                display: "flex", justifyContent: "space-between",
                marginBottom: 5
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{cfg.emoji}</span>
                    <span style={{
                        fontFamily: "Open Sans,sans-serif", fontSize: 13,
                        color: "#374151", textTransform: "capitalize"
                    }}>
                        {label}
                    </span>
                </div>
                <span style={{
                    fontFamily: "Montserrat,sans-serif", fontSize: 13,
                    fontWeight: 700, color: cfg.color
                }}>
                    {count} <span style={{ color: "#9ca3af", fontWeight: 400 }}>({pct}%)</span>
                </span>
            </div>
            <div style={{
                height: 10, backgroundColor: "#E9EAEC",
                borderRadius: 99, overflow: "hidden"
            }}>
                <div style={{
                    height: "100%", width: `${pct}%`,
                    backgroundColor: cfg.border, borderRadius: 99,
                    transition: "width 1s ease",
                }} />
            </div>
        </div>
    );
};

// ── Impact Score ──────────────────────────────────────────────────────────────
const impactScore = (pos, neg, total) => {
    if (!total) return 0;
    return Math.max(0, Math.min(100,
        Math.round(((pos - neg * 0.5) / total) * 100)
    ));
};

const impactMeta = (score) => {
    if (score >= 70) return { label: "Strong Positive Impact 🌟", color: "#16a34a" };
    if (score >= 50) return { label: "Moderate Positive Impact 😊", color: "#2D8F91" };
    if (score >= 30) return { label: "Mixed Sentiment ⚖️", color: "#f59e0b" };
    return { label: "Needs Attention ⚠️", color: "#e11d48" };
};

// ── Download CSV helper ───────────────────────────────────────────────────────
const downloadCSV = (results, filename) => {
    const header = "feedback,sentiment,confidence,model";
    const rows = results.map(r =>
        `"${String(r.text || "").replace(/"/g, '""')}",${r.label},${Math.round((r.confidence || 0) * 100)}%,${r.model}`
    );
    const blob = new Blob([[header, ...rows].join("\n")],
        { type: "text/csv;charset=utf-8;" });
    const a = Object.assign(document.createElement("a"),
        {
            href: URL.createObjectURL(blob),
            download: `voicelens_${filename || "results"}.csv`
        });
    a.click();
};

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const DashboardPage = ({ uploadResults, setActivePage }) => {
    const [showAll, setShowAll] = useState(false);
    const [filter, setFilter] = useState("all");

    // ── No data state ─────────────────────────────────────────────────────────
    if (!uploadResults) {
        return (
            <div style={{
                maxWidth: 700, margin: "0 auto", padding: "60px 24px",
                textAlign: "center"
            }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📊</div>
                <h2 style={{
                    fontFamily: "Montserrat,sans-serif", fontSize: 24,
                    fontWeight: 800, color: "#003C64", marginBottom: 12,
                }}>No Analysis Yet</h2>
                <p style={{
                    fontFamily: "Open Sans,sans-serif", fontSize: 15,
                    color: "#6b7280", marginBottom: 28, lineHeight: 1.7,
                }}>
                    Upload a CSV or Excel file in the File Upload page
                    to see your full sentiment analysis dashboard here.
                </p>
                <button
                    onClick={() => setActivePage("file")}
                    style={{
                        padding: "14px 32px", borderRadius: 12, border: "none",
                        backgroundColor: "#003C64", color: "white",
                        fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                        fontSize: 14, cursor: "pointer",
                    }}>
                    📂 Upload File Now →
                </button>
            </div>
        );
    }

    // ── Derived stats ─────────────────────────────────────────────────────────
    const { results = [], summary = {}, total = 0,
        filename = "file", model = "bert" } = uploadResults;

    const pos = summary.positive || 0;
    const neu = summary.neutral || 0;
    const neg = summary.negative || 0;
    const score = impactScore(pos, neg, total);
    const meta = impactMeta(score);
    const avgConf = results.length
        ? Math.round(results.reduce((s, r) => s + (r.confidence || 0), 0) / results.length * 100)
        : 0;

    // Filter + paginate
    const filtered = filter === "all"
        ? results
        : results.filter(r => r.label === filter);
    const displayed = showAll ? filtered : filtered.slice(0, 10);

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

            {/* ── Header ── */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12,
            }}>
                <div>
                    <h1 style={{
                        fontFamily: "Montserrat,sans-serif", fontSize: 28,
                        fontWeight: 800, color: "#003C64", margin: "0 0 4px",
                    }}>📊 Analysis Dashboard</h1>
                    <p style={{
                        fontFamily: "Open Sans,sans-serif", fontSize: 13,
                        color: "#6b7280", margin: 0,
                    }}>
                        Results for <strong>{filename}</strong> ·
                        Model: <strong>{model.toUpperCase()}</strong> ·
                        {total} rows analyzed
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                    <button
                        onClick={() => downloadCSV(results, filename)}
                        style={{
                            padding: "10px 16px", borderRadius: 10,
                            border: "2px solid #003C64", backgroundColor: "white",
                            color: "#003C64", fontFamily: "Montserrat,sans-serif",
                            fontWeight: 700, fontSize: 12, cursor: "pointer",
                        }}>⬇️ Export CSV</button>
                    <button
                        onClick={() => setActivePage("file")}
                        style={{
                            padding: "10px 16px", borderRadius: 10,
                            border: "2px solid #E9EAEC", backgroundColor: "white",
                            color: "#6b7280", fontFamily: "Open Sans,sans-serif",
                            fontSize: 12, cursor: "pointer",
                        }}>📂 New Upload</button>
                </div>
            </div>

            {/* ── KPI Cards ── */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                gap: 14, marginBottom: 20,
            }}>
                {[
                    { icon: "📋", label: "Total Analyzed", value: total, color: "#003C64" },
                    { icon: "😊", label: "Positive", value: pos, color: "#16a34a" },
                    { icon: "😐", label: "Neutral", value: neu, color: "#0284c7" },
                    { icon: "😔", label: "Negative", value: neg, color: "#e11d48" },
                ].map((k, i) => (
                    <div key={i} style={{
                        backgroundColor: "white", borderRadius: 16, padding: "18px 16px",
                        textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        border: "1px solid #E9EAEC",
                    }}>
                        <div style={{ fontSize: 26, marginBottom: 4 }}>{k.icon}</div>
                        <p style={{
                            fontFamily: "Montserrat,sans-serif", fontSize: 28,
                            fontWeight: 800, color: k.color, margin: "0 0 2px",
                        }}>{k.value}</p>
                        <p style={{
                            fontFamily: "Open Sans,sans-serif",
                            fontSize: 11, color: "#6b7280", margin: 0,
                        }}>{k.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Impact Score + Donut + Bars ── */}
            <div style={{
                display: "grid", gridTemplateColumns: "200px 1fr 1.4fr",
                gap: 16, marginBottom: 20,
            }}>

                {/* Impact Score */}
                <div style={{
                    backgroundColor: "white", borderRadius: 16, padding: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #E9EAEC", textAlign: "center",
                }}>
                    <p style={{
                        fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                        fontSize: 12, color: "#003C64", marginBottom: 12,
                        textTransform: "uppercase", letterSpacing: 1,
                    }}>Impact Score</p>
                    <div style={{
                        width: 100, height: 100, borderRadius: "50%",
                        border: `8px solid ${meta.color}`,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center",
                        margin: "0 auto 12px",
                        boxShadow: `0 0 20px ${meta.color}33`,
                    }}>
                        <span style={{
                            fontFamily: "Montserrat,sans-serif",
                            fontSize: 28, fontWeight: 800, color: meta.color,
                        }}>{score}</span>
                        <span style={{
                            fontFamily: "Open Sans,sans-serif",
                            fontSize: 9, color: "#9ca3af",
                        }}>/100</span>
                    </div>
                    <p style={{
                        fontFamily: "Open Sans,sans-serif", fontSize: 11,
                        color: meta.color, fontWeight: 700, margin: "0 0 4px",
                    }}>{meta.label}</p>
                    <p style={{
                        fontFamily: "Open Sans,sans-serif",
                        fontSize: 10, color: "#9ca3af", margin: 0,
                    }}>Avg confidence: {avgConf}%</p>
                </div>

                {/* Donut */}
                <div style={{
                    backgroundColor: "white", borderRadius: 16, padding: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #E9EAEC",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center",
                }}>
                    <p style={{
                        fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                        fontSize: 12, color: "#003C64", marginBottom: 12,
                        textTransform: "uppercase", letterSpacing: 1,
                    }}>Distribution</p>
                    <DonutChart positive={pos} neutral={neu}
                        negative={neg} total={total} />
                    <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
                        {[
                            { label: "Pos", color: "#22c55e" },
                            { label: "Neu", color: "#38bdf8" },
                            { label: "Neg", color: "#f43f5e" },
                        ].map((l, i) => (
                            <div key={i} style={{
                                display: "flex",
                                alignItems: "center", gap: 4
                            }}>
                                <div style={{
                                    width: 8, height: 8, borderRadius: "50%",
                                    backgroundColor: l.color
                                }} />
                                <span style={{
                                    fontFamily: "Open Sans,sans-serif",
                                    fontSize: 11, color: "#6b7280"
                                }}>
                                    {l.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bars */}
                <div style={{
                    backgroundColor: "white", borderRadius: 16, padding: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    border: "1px solid #E9EAEC",
                }}>
                    <p style={{
                        fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                        fontSize: 12, color: "#003C64", marginBottom: 16,
                        textTransform: "uppercase", letterSpacing: 1,
                    }}>Sentiment Breakdown</p>
                    <Bar label="positive" count={pos} total={total} cfg={CFG.positive} />
                    <Bar label="neutral" count={neu} total={total} cfg={CFG.neutral} />
                    <Bar label="negative" count={neg} total={total} cfg={CFG.negative} />

                    {/* Key insight */}
                    <div style={{
                        marginTop: 16, padding: "10px 14px",
                        backgroundColor: "#fffbeb", borderRadius: 10,
                        borderLeft: "3px solid #F7AC2D",
                    }}>
                        <p style={{
                            fontFamily: "Open Sans,sans-serif", fontSize: 12,
                            color: "#92400e", margin: 0, lineHeight: 1.6,
                        }}>
                            💡 <strong>
                                {pos > neg
                                    ? `${Math.round(pos / total * 100)}% of feedback is positive — community response is encouraging.`
                                    : neg > pos
                                        ? `${Math.round(neg / total * 100)}% of feedback is negative — attention needed.`
                                        : "Feedback is fairly balanced across all sentiments."
                                }
                            </strong>
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Individual Results Table ── */}
            <div style={{
                backgroundColor: "white", borderRadius: 16, padding: 24,
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                border: "1px solid #E9EAEC",
            }}>
                {/* Table header */}
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10,
                }}>
                    <p style={{
                        fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                        fontSize: 14, color: "#003C64", margin: 0,
                    }}>Individual Feedback Results</p>

                    {/* Filter buttons */}
                    <div style={{ display: "flex", gap: 6 }}>
                        {["all", "positive", "neutral", "negative"].map(f => (
                            <button key={f} onClick={() => { setFilter(f); setShowAll(false); }}
                                style={{
                                    padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                                    border: `1.5px solid ${filter === f ? CFG[f]?.border || "#003C64" : "#E9EAEC"}`,
                                    backgroundColor: filter === f ? CFG[f]?.bg || "#f0f4f8" : "white",
                                    color: filter === f ? CFG[f]?.color || "#003C64" : "#6b7280",
                                    fontFamily: "Open Sans,sans-serif", fontSize: 12,
                                    fontWeight: filter === f ? 700 : 400,
                                    textTransform: "capitalize",
                                }}>
                                {f === "all" ? `All (${total})`
                                    : `${f.charAt(0).toUpperCase() + f.slice(1)} (${summary[f] || 0})`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Column headers */}
                <div style={{
                    display: "grid", gridTemplateColumns: "1fr 120px 100px 80px",
                    gap: 8, padding: "8px 12px", marginBottom: 6,
                    backgroundColor: "#f9fafb", borderRadius: 8,
                }}>
                    {["Feedback Text", "Sentiment", "Confidence", "Model"].map((h, i) => (
                        <span key={i} style={{
                            fontFamily: "Montserrat,sans-serif", fontSize: 11,
                            fontWeight: 700, color: "#9ca3af",
                            textTransform: "uppercase", letterSpacing: 0.5,
                        }}>{h}</span>
                    ))}
                </div>

                {/* Rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {displayed.map((r, i) => {
                        const c = CFG[r.label] || CFG.neutral;
                        return (
                            <div key={i} style={{
                                display: "grid",
                                gridTemplateColumns: "1fr 120px 100px 80px",
                                gap: 8, padding: "12px 12px",
                                backgroundColor: i % 2 === 0 ? "#fafafa" : "white",
                                borderRadius: 8, alignItems: "center",
                                border: "1px solid #f3f4f6",
                            }}>
                                {/* Text */}
                                <p style={{
                                    fontFamily: "Open Sans,sans-serif", fontSize: 13,
                                    color: "#374151", margin: 0,
                                    overflow: "hidden", textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}>{r.text}</p>

                                {/* Label badge */}
                                <span style={{
                                    backgroundColor: c.bg, color: c.color,
                                    fontSize: 11, padding: "4px 10px",
                                    borderRadius: 20, fontWeight: 700,
                                    fontFamily: "Open Sans,sans-serif",
                                    textTransform: "uppercase", textAlign: "center",
                                    border: `1px solid ${c.border}`,
                                }}>{r.label}</span>

                                {/* Confidence bar */}
                                <div>
                                    <div style={{
                                        display: "flex", justifyContent: "space-between",
                                        marginBottom: 3,
                                    }}>
                                        <span style={{
                                            fontFamily: "Open Sans,sans-serif",
                                            fontSize: 11, color: "#6b7280",
                                        }}>
                                            {Math.round((r.confidence || 0) * 100)}%
                                        </span>
                                    </div>
                                    <div style={{
                                        height: 5, backgroundColor: "#E9EAEC",
                                        borderRadius: 99, overflow: "hidden"
                                    }}>
                                        <div style={{
                                            height: "100%",
                                            width: `${Math.round((r.confidence || 0) * 100)}%`,
                                            backgroundColor: c.border, borderRadius: 99,
                                        }} />
                                    </div>
                                </div>

                                {/* Model */}
                                <span style={{
                                    fontFamily: "Open Sans,sans-serif",
                                    fontSize: 11, color: "#9ca3af",
                                    textTransform: "uppercase",
                                }}>{r.model}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Show more / less */}
                {filtered.length > 10 && (
                    <button
                        onClick={() => setShowAll(!showAll)}
                        style={{
                            width: "100%", marginTop: 14, padding: "12px",
                            borderRadius: 12, border: "2px solid #E9EAEC",
                            backgroundColor: "white", cursor: "pointer",
                            fontFamily: "Montserrat,sans-serif", fontWeight: 700,
                            fontSize: 13, color: "#003C64",
                        }}>
                        {showAll
                            ? "Show Less ↑"
                            : `Show All ${filtered.length} Results ↓`}
                    </button>
                )}

                {filtered.length === 0 && (
                    <p style={{
                        textAlign: "center", padding: "24px 0",
                        fontFamily: "Open Sans,sans-serif",
                        fontSize: 14, color: "#9ca3af",
                    }}>No {filter} results found.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;