import React from "react";

// REPLACE:
const FEATURES = [
    {
        icon: "📝", title: "Text Analyzer",
        desc: "Paste any feedback text and get instant sentiment analysis with confidence scores.",
        page: "analyzer"
    },
    {
        icon: "📂", title: "File Upload",
        desc: "Upload CSV or Excel files with hundreds of responses and analyze them in bulk.",
        page: "file"
    },
];

const STATS = [
    { value: "89.27%", label: "BERT Accuracy" },
    { value: "3", label: "ML Models" },
    { value: "4,100+", label: "Training Samples" },
    { value: "3", label: "Sentiment Classes" },
];

const HomePage = ({ setActivePage }) => {
    return (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

            {/* ── Hero ── */}
            <div style={{
                background: "linear-gradient(135deg, #003C64 0%, #2D8F91 100%)",
                borderRadius: 24,
                padding: "60px 32px",
                textAlign: "center",
                marginBottom: 32,
                color: "white",
            }}>
                <div style={{ fontSize: 56, marginBottom: 16 }}>🎙️</div>
                <h1 style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 38,
                    fontWeight: 800,
                    margin: "0 0 8px",
                    color: "white",
                }}>VoiceLens</h1>
                <p style={{
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: 18,
                    opacity: 0.9,
                    margin: "0 0 8px",
                }}>UPAY NGO Sentiment & Impact Analyzer</p>
                <p style={{
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: 14,
                    opacity: 0.7,
                    maxWidth: 520,
                    margin: "0 auto 32px",
                }}>
                    Turning community voices into actionable insights —
                    powered by fine-tuned BERT AI.
                </p>
                <button
                    onClick={() => setActivePage("analyzer")}
                    style={{
                        backgroundColor: "#F7AC2D",
                        color: "#003C64",
                        border: "none",
                        borderRadius: 12,
                        padding: "14px 32px",
                        fontFamily: "Montserrat, sans-serif",
                        fontWeight: 700,
                        fontSize: 15,
                        cursor: "pointer",
                    }}>
                    Start Analyzing →
                </button>
            </div>

            {/* ── Stats ── */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 16,
                marginBottom: 40,
            }}>
                {STATS.map((s, i) => (
                    <div key={i} style={{
                        backgroundColor: "white",
                        borderRadius: 16,
                        padding: "20px 16px",
                        textAlign: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        border: "1px solid #E9EAEC",
                    }}>
                        <p style={{
                            fontFamily: "Montserrat, sans-serif",
                            fontSize: 26,
                            fontWeight: 800,
                            color: "#F7AC2D",
                            margin: "0 0 4px",
                        }}>{s.value}</p>
                        <p style={{
                            fontFamily: "Open Sans, sans-serif",
                            fontSize: 12,
                            color: "#6b7280",
                            margin: 0,
                        }}>{s.label}</p>
                    </div>
                ))}
            </div>

            {/* ── Features ── */}
            <h2 style={{
                fontFamily: "Montserrat, sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: "#003C64",
                marginBottom: 20,
            }}>What Can VoiceLens Do?</h2>

            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 20,
                marginBottom: 40,
            }}>
                {FEATURES.map((f, i) => (
                    <div key={i}
                        onClick={() => setActivePage(f.page)}
                        style={{
                            backgroundColor: "white",
                            borderRadius: 20,
                            padding: 24,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                            border: "1px solid #E9EAEC",
                            cursor: "pointer",
                            transition: "transform 0.2s, box-shadow 0.2s",
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.06)";
                        }}>
                        <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                        <h3 style={{
                            fontFamily: "Montserrat, sans-serif",
                            fontSize: 16,
                            fontWeight: 700,
                            color: "#003C64",
                            marginBottom: 8,
                        }}>{f.title}</h3>
                        <p style={{
                            fontFamily: "Open Sans, sans-serif",
                            fontSize: 13,
                            color: "#6b7280",
                            lineHeight: 1.6,
                            marginBottom: 16,
                        }}>{f.desc}</p>
                        <p style={{
                            fontFamily: "Open Sans, sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#2D8F91",
                        }}>Try it →</p>
                    </div>
                ))}
            </div>

            {/* ── About UPAY ── */}
            <div style={{
                backgroundColor: "#fffbeb",
                borderLeft: "4px solid #F7AC2D",
                borderRadius: 16,
                padding: 24,
            }}>
                <h3 style={{
                    fontFamily: "Montserrat, sans-serif",
                    fontWeight: 700,
                    color: "#003C64",
                    marginBottom: 8,
                    fontSize: 16,
                }}>🏢 About UPAY NGO</h3>
                <p style={{
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: 14,
                    color: "#4b5563",
                    lineHeight: 1.7,
                    margin: 0,
                }}>
                    UPAY is a student-driven NGO committed to education, empowerment,
                    and community development. VoiceLens was built to help UPAY understand
                    the emotional pulse of the communities they serve — turning raw feedback
                    into meaningful, data-driven program improvements.
                </p>
            </div>
        </div>
    );
};

export default HomePage;