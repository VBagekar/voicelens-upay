import React from "react";

const Footer = () => (
    <footer style={{
        backgroundColor: "#003C64",
        color: "white",
        padding: "32px 24px",
        marginTop: 48,
    }}>
        <div style={{
            maxWidth: 1100, margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.5fr 1fr 1fr",
            gap: 32,
        }}>

            {/* Brand */}
            <div>
                <div style={{
                    display: "flex", alignItems: "center",
                    gap: 10, marginBottom: 12
                }}>
                    <div style={{
                        backgroundColor: "#F7AC2D", width: 36, height: 36,
                        borderRadius: "50%", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontWeight: 800, color: "#003C64", fontSize: 16,
                        fontFamily: "Montserrat, sans-serif",
                    }}>V</div>
                    <span style={{
                        fontFamily: "Montserrat, sans-serif",
                        fontWeight: 700, fontSize: 18, color: "#F7AC2D",
                    }}>VoiceLens</span>
                </div>
                <p style={{
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: 13, color: "#a0b8c8",
                    lineHeight: 1.7, margin: "0 0 12px",
                }}>
                    AI-powered sentiment analysis tool built for UPAY NGO —
                    turning community voices into actionable insights.
                </p>
                <p style={{
                    fontFamily: "Open Sans, sans-serif",
                    fontSize: 12, color: "#64849a", margin: 0,
                }}>
                    © 2025 VoiceLens · Built for UPAY NGO
                </p>
            </div>

            {/* Features */}
            <div>
                <p style={{
                    fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                    fontSize: 13, color: "#F7AC2D",
                    marginBottom: 14, letterSpacing: 1,
                    textTransform: "uppercase",
                }}>Features</p>
                {[
                    "Text Sentiment Analyzer",
                    "Bulk File Analysis",
                    "3-Model Comparison",
                    "CSV Export",
                ].map((item, i) => (
                    <p key={i} style={{
                        fontFamily: "Open Sans, sans-serif",
                        fontSize: 13, color: "#a0b8c8",
                        marginBottom: 8,
                    }}>→ {item}</p>
                ))}
            </div>

            {/* Tech Stack */}
            <div>
                <p style={{
                    fontFamily: "Montserrat, sans-serif", fontWeight: 700,
                    fontSize: 13, color: "#F7AC2D",
                    marginBottom: 14, letterSpacing: 1,
                    textTransform: "uppercase",
                }}>Tech Stack</p>
                {[
                    { label: "Frontend", value: "React + Tailwind" },
                    { label: "Backend", value: "Python + Flask" },
                    { label: "ML Models", value: "BERT + VADER + TextBlob" },
                    { label: "Accuracy", value: "89.27% (BERT)" },
                    { label: "GPU", value: "RTX 3050 · CUDA 12.1" },
                ].map((item, i) => (
                    <p key={i} style={{
                        fontFamily: "Open Sans, sans-serif",
                        fontSize: 12, color: "#a0b8c8", marginBottom: 6,
                    }}>
                        <span style={{ color: "#64849a" }}>{item.label}: </span>
                        {item.value}
                    </p>
                ))}
            </div>
        </div>

        {/* Bottom bar */}
        <div style={{
            maxWidth: 1100, margin: "24px auto 0",
            paddingTop: 20,
            borderTop: "1px solid #1a4a6e",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
        }}>
            <p style={{
                fontFamily: "Open Sans, sans-serif",
                fontSize: 12, color: "#64849a", margin: 0,
            }}>
                Fine-tuned BERT · 4,100 training samples · Local ML only
            </p>
            <div style={{ display: "flex", gap: 16 }}>
                {["VADER", "TextBlob", "BERT"].map((m, i) => (
                    <span key={i} style={{
                        fontFamily: "Open Sans, sans-serif",
                        fontSize: 11, color: "#64849a",
                        backgroundColor: "#1a4a6e",
                        padding: "3px 10px", borderRadius: 20,
                    }}>{m}</span>
                ))}
            </div>
        </div>
    </footer>
);

export default Footer;