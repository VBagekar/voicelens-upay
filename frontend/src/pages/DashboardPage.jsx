import React, { useState, useEffect } from "react";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { analyzeText } from "../services/api";

// ── Colours ───────────────────────────────────────────────────────────────────
const COLORS = {
    positive: "#22c55e",
    neutral: "#38bdf8",
    negative: "#f43f5e",
    navy: "#003C64",
    gold: "#F7AC2D",
    teal: "#2D8F91",
};

// ── Demo seed data (shown before user runs any analysis) ─────────────────────
const DEMO_HISTORY = [
    { text: "The tutoring sessions helped my child improve significantly.", label: "positive", model: "bert", confidence: 0.97 },
    { text: "Volunteers were extremely caring and dedicated.", label: "positive", model: "bert", confidence: 0.95 },
    { text: "Sessions were too infrequent and poorly organized.", label: "negative", model: "bert", confidence: 0.91 },
    { text: "The program session took place at the community hall.", label: "neutral", model: "bert", confidence: 0.88 },
    { text: "I feel hopeful after attending the skill development program.", label: "positive", model: "bert", confidence: 0.94 },
    { text: "Promised resources were never delivered to our school.", label: "negative", model: "bert", confidence: 0.89 },
    { text: "UPAY has been operating in this district for five years.", label: "neutral", model: "bert", confidence: 0.82 },
    { text: "The free health camp was a blessing for our entire village.", label: "positive", model: "bert", confidence: 0.96 },
];

const MODEL_ACCURACY = [
    { model: "VADER", accuracy: 29.46, fill: "#94a3b8" },
    { model: "TextBlob", accuracy: 26.63, fill: "#64748b" },
    { model: "BERT", accuracy: 89.27, fill: "#003C64" },
];

// ── Small reusable components ─────────────────────────────────────────────────
const Card = ({ children, style = {} }) => (
    <div style={{
        backgroundColor: "white", borderRadius: 20,
        padding: 24, boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
        border: "1px solid #E9EAEC", ...style,
    }}>
        {children}
    </div>
);

const SectionTitle = ({ children }) => (
    <p style={{
        fontFamily: "Montserrat, sans-serif", fontWeight: 700,
        fontSize: 15, color: "#003C64", marginBottom: 16,
    }}>{children}</p>
);

const Badge = ({ label }) => {
    const cfg = {
        positive: { bg: "#f0fdf4", color: "#16a34a" },
        neutral: { bg: "#f0f9ff", color: "#0284c7" },
        negative: { bg: "#fff1f2", color: "#e11d48" },
    }[label] || { bg: "#f3f4f6", color: "#6b7280" };
    return (
        <span style={{
            backgroundColor: cfg.bg, color: cfg.color,
            fontSize: 11, fontWeight: 700, padding: "3px 10px",
            borderRadius: 20, fontFamily: "Open Sans, sans-serif",
            textTransform: "uppercase",
        }}>{label}</span>
    );
};

// ── Custom tooltip for pie chart ──────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
        <div style={{
            backgroundColor: "white", border: "1px solid #E9EAEC",
            borderRadius: 10, padding: "8px 14px",
            fontFamily: "Open Sans, sans-serif", fontSize: 13,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
            <strong style={{ color: "#003C64" }}>{payload[0].name}</strong>
            <br />
            {payload[0].value} texts ({payload[0].payload.pct}%)
        </div>
    );
};

// ── Impact Score calculator ───────────────────────────────────────────────────
const calcImpactScore = (history) => {
    if (!history.length) return 0;
    const pos = history.filter(h => h.label === "positive").length;
    const neg = history.filter(h => h.label === "negative").length;
    const score = Math.round(((pos - neg * 0.5) / history.length) * 100);
    return Math.max(0, Math.min(100, score));
};

const impactLabel = (score) => {
    if (score >= 70) return { text: "Strong Positive Impact 🌟", color: "#16a34a" };
    if (score >= 50) return { text: "Moderate Positive Impact 😊", color: "#2D8F91" };
    if (score >= 30) return { text: "Mixed Sentiment ⚖️", color: "#f59e0b" };
    return { text: "Needs Attention ⚠️", color: "#e11d48" };
};

// ── Quick Analyze bar (inside Dashboard) ────────────────────────────────────
const QuickAnalyze = ({ onResult }) => {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);

    const handle = async () => {
        if (!text.trim()) return;
        setLoading(true);
        try {
            const res = await analyzeText(text, "bert");
            onResult({ ...res.data, text });
            setText("");
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    return (
        <Card style={{ marginBottom: 24 }}>
            <SectionTitle>⚡ Quick Analyze — Add to Dashboard</SectionTitle>
            <div style={{ display: "flex", gap: 12 }}>
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handle()}
                    placeholder="Type a feedback sentence and press Analyze..."
                    style={{
                        flex: 1, padding: "12px 16px", borderRadius: 12,
                        border: "2px solid #E9EAEC", fontFamily: "Open Sans, sans-serif",
                        fontSize: 14, color: "#003C64", outline: "none",
                    }}
                />
                <button
                    onClick={handle}
                    disabled={loading || !text.trim()}
                    style={{
                        padding: "12px 20px", borderRadius: 12, border: "none",
                        backgroundColor: loading || !text.trim() ? "#9ca3af" : "#003C64",
                        color: "white", fontFamily: "Montserrat, sans-serif",
                        fontWeight: 700, fontSize: 13, cursor: "pointer",
                        whiteSpace: "nowrap",
                    }}>
                    {loading ? "⏳" : "Analyze →"}
                </button>
            </div>
        </Card>
    );
};

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
const DashboardPage = () => {
    const [history, setHistory] = useState(DEMO_HISTORY);
    const [isDemo, setIsDemo] = useState(true);

    // Build pie data from history
    const counts = history.reduce((acc, h) => {
        acc[h.label] = (acc[h.label] || 0) + 1;
        return acc;
    }, {});
    const total = history.length;
    const pieData = ["positive", "neutral", "negative"]
        .filter(k => counts[k])
        .map(k => ({
            name: k.charAt(0).toUpperCase() + k.slice(1),
            value: counts[k],
            pct: Math.round((counts[k] / total) * 100),
            fill: COLORS[k],
        }));

    const impactScore = calcImpactScore(history);
    const impact = impactLabel(impactScore);

    const handleNewResult = (result) => {
        if (isDemo) { setHistory([result]); setIsDemo(false); }
        else { setHistory(prev => [result, ...prev].slice(0, 50)); }
    };

    const resetToDemo = () => { setHistory(DEMO_HISTORY); setIsDemo(true); };

    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

            {/* Header */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 28
            }}>
                <div>
                    <h1 style={{
                        fontFamily: "Montserrat, sans-serif", fontSize: 28,
                        fontWeight: 800, color: "#003C64", margin: "0 0 6px",
                    }}>📊 Impact Dashboard</h1>
                    <p style={{
                        fontFamily: "Open Sans, sans-serif", fontSize: 14,
                        color: "#6b7280", margin: 0,
                    }}>
                        Real-time sentiment insights from UPAY community feedback.
                    </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {isDemo && (
                        <span style={{
                            backgroundColor: "#fffbeb", color: "#92400e",
                            fontSize: 11, padding: "4px 10px", borderRadius: 20,
                            fontFamily: "Open Sans, sans-serif", fontWeight: 600,
                            border: "1px solid #F7AC2D",
                        }}>📌 Demo Data</span>
                    )}
                    {!isDemo && (
                        <button onClick={resetToDemo} style={{
                            padding: "8px 16px", borderRadius: 10,
                            border: "1px solid #E9EAEC", backgroundColor: "white",
                            fontFamily: "Open Sans, sans-serif", fontSize: 12,
                            color: "#6b7280", cursor: "pointer",
                        }}>Reset to Demo</button>
                    )}
                </div>
            </div>

            {/* Quick Analyze */}
            <QuickAnalyze onResult={handleNewResult} />

            {/* ── Top KPI Row ── */}
            <div style={{
                display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                gap: 16, marginBottom: 24,
            }}>
                {[
                    { label: "Total Analyzed", value: total, icon: "📋" },
                    { label: "Positive", value: `${counts.positive || 0}`, icon: "😊" },
                    { label: "Neutral", value: `${counts.neutral || 0}`, icon: "😐" },
                    { label: "Negative", value: `${counts.negative || 0}`, icon: "😔" },
                ].map((kpi, i) => (
                    <Card key={i} style={{ textAlign: "center", padding: 20 }}>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>{kpi.icon}</div>
                        <p style={{
                            fontFamily: "Montserrat, sans-serif", fontSize: 26,
                            fontWeight: 800, color: "#003C64", margin: "0 0 4px",
                        }}>{kpi.value}</p>
                        <p style={{
                            fontFamily: "Open Sans, sans-serif",
                            fontSize: 12, color: "#6b7280", margin: 0,
                        }}>{kpi.label}</p>
                    </Card>
                ))}
            </div>

            {/* ── Impact Score + Pie ── */}
            <div style={{
                display: "grid", gridTemplateColumns: "1fr 1.6fr",
                gap: 20, marginBottom: 24,
            }}>
                {/* Impact Score */}
                <Card>
                    <SectionTitle>🎯 NGO Impact Score</SectionTitle>
                    <div style={{ textAlign: "center", padding: "16px 0" }}>
                        {/* Circular score */}
                        <div style={{
                            width: 130, height: 130, borderRadius: "50%",
                            border: `10px solid ${impact.color}`,
                            display: "flex", flexDirection: "column",
                            alignItems: "center", justifyContent: "center",
                            margin: "0 auto 16px",
                            boxShadow: `0 0 24px ${impact.color}33`,
                        }}>
                            <span style={{
                                fontFamily: "Montserrat, sans-serif",
                                fontSize: 32, fontWeight: 800, color: impact.color,
                            }}>{impactScore}</span>
                            <span style={{
                                fontFamily: "Open Sans, sans-serif",
                                fontSize: 11, color: "#6b7280",
                            }}>/ 100</span>
                        </div>
                        <p style={{
                            fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                            fontSize: 14, color: impact.color, margin: "0 0 8px",
                        }}>{impact.text}</p>
                        <p style={{
                            fontFamily: "Open Sans, sans-serif",
                            fontSize: 12, color: "#9ca3af", margin: 0,
                        }}>Based on {total} feedback entries</p>
                    </div>
                </Card>

                {/* Pie Chart */}
                <Card>
                    <SectionTitle>🍩 Sentiment Distribution</SectionTitle>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%" cy="50%"
                                innerRadius={55} outerRadius={85}
                                paddingAngle={3} dataKey="value"
                            >
                                {pieData.map((entry, i) => (
                                    <Cell key={i} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip content={<PieTooltip />} />
                            <Legend
                                formatter={(value, entry) => (
                                    <span style={{
                                        fontFamily: "Open Sans, sans-serif",
                                        fontSize: 13, color: "#374151",
                                    }}>
                                        {value} ({entry.payload.pct}%)
                                    </span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* ── Model Accuracy Bar Chart ── */}
            <Card style={{ marginBottom: 24 }}>
                <SectionTitle>🧠 Model Accuracy Comparison</SectionTitle>
                <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={MODEL_ACCURACY}
                        margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="model"
                            tick={{
                                fontFamily: "Montserrat, sans-serif",
                                fontSize: 13, fontWeight: 700
                            }} />
                        <YAxis domain={[0, 100]}
                            tick={{ fontFamily: "Open Sans, sans-serif", fontSize: 12 }}
                            tickFormatter={v => `${v}%`} />
                        <Tooltip
                            formatter={(v) => [`${v}%`, "Accuracy"]}
                            contentStyle={{
                                fontFamily: "Open Sans, sans-serif", fontSize: 13,
                                borderRadius: 10, border: "1px solid #E9EAEC",
                            }}
                        />
                        <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                            {MODEL_ACCURACY.map((entry, i) => (
                                <Cell key={i} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <p style={{
                    fontFamily: "Open Sans, sans-serif", fontSize: 12,
                    color: "#9ca3af", margin: "8px 0 0", textAlign: "center",
                }}>
                    BERT outperforms rule-based models by +59.8% on NGO feedback data
                </p>
            </Card>

            {/* ── Recent Analysis History ── */}
            <Card>
                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 16
                }}>
                    <SectionTitle style={{ margin: 0 }}>🕐 Recent Analysis History</SectionTitle>
                    <span style={{
                        fontFamily: "Open Sans, sans-serif", fontSize: 12, color: "#9ca3af",
                    }}>Last {Math.min(history.length, 10)} entries</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {history.slice(0, 10).map((item, i) => (
                        <div key={i} style={{
                            display: "flex", alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px", borderRadius: 12,
                            backgroundColor: "#f9fafb",
                            border: "1px solid #E9EAEC",
                        }}>
                            <p style={{
                                fontFamily: "Open Sans, sans-serif", fontSize: 13,
                                color: "#374151", margin: 0, flex: 1,
                                overflow: "hidden", textOverflow: "ellipsis",
                                whiteSpace: "nowrap", marginRight: 16,
                            }}>
                                {item.text}
                            </p>
                            <div style={{
                                display: "flex", gap: 6, alignItems: "center",
                                flexShrink: 0
                            }}>
                                <Badge label={item.label} />
                                <span style={{
                                    fontFamily: "Open Sans, sans-serif", fontSize: 11,
                                    color: "#9ca3af",
                                }}>
                                    {Math.round((item.confidence || 0) * 100)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {history.length === 0 && (
                    <p style={{
                        fontFamily: "Open Sans, sans-serif", fontSize: 14,
                        color: "#9ca3af", textAlign: "center", padding: "24px 0",
                    }}>
                        No analysis yet. Use Quick Analyze above or visit the Analyzer page.
                    </p>
                )}
            </Card>
        </div>
    );
};

export default DashboardPage;