import React from "react";

const CFG = {
    positive: { bg: "#f0fdf4", border: "#22c55e", badge: "#16a34a", emoji: "😊", label: "Positive" },
    neutral: { bg: "#f0f9ff", border: "#38bdf8", badge: "#0284c7", emoji: "😐", label: "Neutral" },
    negative: { bg: "#fff1f2", border: "#f43f5e", badge: "#e11d48", emoji: "😔", label: "Negative" },
};

const ResultCard = ({ result, showText = true }) => {
    if (!result) return null;
    const cfg = CFG[result.label] || CFG.neutral;
    const conf = Math.round((result.confidence || 0) * 100);
    const scores = result.scores || {};

    return (
        <div style={{
            backgroundColor: cfg.bg,
            borderLeft: `4px solid ${cfg.border}`,
            borderRadius: 16, padding: 20,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            marginBottom: 12,
        }}>
            {/* Header row */}
            <div style={{
                display: "flex", alignItems: "center",
                justifyContent: "space-between", marginBottom: 12
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 24 }}>{cfg.emoji}</span>
                    <span style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontSize: 18, fontWeight: 700, color: cfg.badge,
                    }}>{cfg.label}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                    <span style={{
                        backgroundColor: "#003C64", color: "white",
                        fontSize: 11, padding: "4px 10px", borderRadius: 20,
                        fontFamily: "Open Sans, sans-serif", fontWeight: 600,
                    }}>{result.model?.toUpperCase()}</span>
                    <span style={{
                        backgroundColor: cfg.badge, color: "white",
                        fontSize: 11, padding: "4px 10px", borderRadius: 20,
                        fontFamily: "Open Sans, sans-serif", fontWeight: 600,
                    }}>{conf}% confident</span>
                </div>
            </div>

            {/* Text snippet */}
            {showText && result.text && (
                <p style={{
                    fontFamily: "Open Sans, sans-serif", fontSize: 13,
                    color: "#4b5563", fontStyle: "italic",
                    backgroundColor: "rgba(255,255,255,0.6)",
                    padding: "10px 14px", borderRadius: 10, marginBottom: 14,
                }}>"{result.text}"</p>
            )}

            {/* Score bars */}
            {["positive", "neutral", "negative"].map(key => {
                const val = scores[key];
                if (val === undefined) return null;
                const pct = Math.round(val * 100);
                return (
                    <div key={key} style={{
                        display: "flex", alignItems: "center", gap: 8, marginBottom: 6,
                    }}>
                        <span style={{
                            fontFamily: "Open Sans, sans-serif", fontSize: 12,
                            color: "#6b7280", width: 56, textTransform: "capitalize",
                        }}>{key}</span>
                        <div style={{
                            flex: 1, backgroundColor: "#e5e7eb",
                            borderRadius: 99, height: 7, overflow: "hidden",
                        }}>
                            <div style={{
                                width: `${pct}%`, height: "100%",
                                backgroundColor: CFG[key].border,
                                borderRadius: 99, transition: "width 0.5s",
                            }} />
                        </div>
                        <span style={{
                            fontFamily: "Open Sans, sans-serif",
                            fontSize: 12, color: "#6b7280", width: 32,
                        }}>{pct}%</span>
                    </div>
                );
            })}
        </div>
    );
};

export const ComparisonCard = ({ result }) => {
    if (!result?.results) return null;
    return (
        <div style={{
            backgroundColor: "white", borderRadius: 20,
            padding: 24, boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            border: "1px solid #E9EAEC",
        }}>
            {/* Consensus */}
            <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 16
            }}>
                <h3 style={{
                    fontFamily: "Montserrat, sans-serif", fontSize: 16,
                    fontWeight: 700, color: "#003C64", margin: 0,
                }}>All Models Comparison</h3>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#6b7280" }}>Consensus:</span>
                    <span style={{
                        backgroundColor: CFG[result.consensus]?.badge || "#003C64",
                        color: "white", fontSize: 11, padding: "4px 12px",
                        borderRadius: 20, fontWeight: 700,
                        fontFamily: "Open Sans, sans-serif",
                    }}>{result.consensus?.toUpperCase()}</span>
                    {result.agreement && (
                        <span style={{
                            backgroundColor: "#f0fdf4", color: "#16a34a",
                            fontSize: 11, padding: "4px 10px", borderRadius: 20,
                            fontFamily: "Open Sans, sans-serif", fontWeight: 600,
                        }}>All agree ✅</span>
                    )}
                </div>
            </div>

            {result.text && (
                <p style={{
                    fontFamily: "Open Sans, sans-serif", fontSize: 13,
                    color: "#6b7280", fontStyle: "italic",
                    backgroundColor: "#f9fafb", padding: "10px 14px",
                    borderRadius: 10, marginBottom: 16,
                }}>"{result.text}"</p>
            )}

            {Object.entries(result.results).map(([name, r]) => (
                <ResultCard key={name} result={r} showText={false} />
            ))}
        </div>
    );
};

export default ResultCard;
