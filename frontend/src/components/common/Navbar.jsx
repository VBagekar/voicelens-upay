import React, { useState } from "react";

// REPLACE:
const LINKS = [
    { id: "home", label: "Home" },
    { id: "analyzer", label: "Analyzer" },
    { id: "file", label: "File Upload" },
];

const Navbar = ({ activePage, setActivePage }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const styles = {
        nav: {
            backgroundColor: "#003C64",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            position: "sticky",
            top: 0,
            zIndex: 100,
        },
        inner: {
            maxWidth: 1100,
            margin: "0 auto",
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
        },
        logoWrap: {
            display: "flex",
            alignItems: "center",
            gap: 12,
            cursor: "pointer",
        },
        logoCircle: {
            backgroundColor: "#F7AC2D",
            width: 40,
            height: 40,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            color: "#003C64",
            fontSize: 18,
            fontFamily: "Montserrat, sans-serif",
        },
        logoTitle: {
            color: "#F7AC2D",
            fontFamily: "Montserrat, sans-serif",
            fontWeight: "700",
            fontSize: 18,
            lineHeight: 1,
            margin: 0,
        },
        logoSub: {
            color: "#a0b8c8",
            fontFamily: "Open Sans, sans-serif",
            fontSize: 11,
            margin: 0,
            marginTop: 2,
        },
        desktopLinks: {
            display: isMobile ? "none" : "flex",
            alignItems: "center",
            gap: 4,
        },
        hamburger: {
            display: isMobile ? "block" : "none",
            background: "none",
            border: "none",
            color: "white",
            fontSize: 24,
            cursor: "pointer",
        },
        mobileMenu: {
            backgroundColor: "#002a47",
            padding: "8px 16px 16px",
        },
    };

    const linkStyle = (id) => ({
        padding: "8px 16px",
        borderRadius: 8,
        fontFamily: "Open Sans, sans-serif",
        fontSize: 14,
        fontWeight: activePage === id ? "700" : "400",
        backgroundColor: activePage === id ? "#F7AC2D" : "transparent",
        color: activePage === id ? "#003C64" : "#E9EAEC",
        border: "none",
        cursor: "pointer",
        transition: "all 0.2s",
    });

    const mobileLinkStyle = (id) => ({
        display: "block",
        width: "100%",
        textAlign: "left",
        padding: "12px 16px",
        borderRadius: 8,
        marginBottom: 4,
        fontFamily: "Open Sans, sans-serif",
        fontSize: 14,
        fontWeight: activePage === id ? "700" : "400",
        backgroundColor: activePage === id ? "#F7AC2D" : "transparent",
        color: activePage === id ? "#003C64" : "#E9EAEC",
        border: "none",
        cursor: "pointer",
    });

    return (
        <nav style={styles.nav}>
            <div style={styles.inner}>
                {/* Logo */}
                <div style={styles.logoWrap} onClick={() => setActivePage("home")}>
                    <div style={styles.logoCircle}>V</div>
                    <div>
                        <p style={styles.logoTitle}>VoiceLens</p>
                        <p style={styles.logoSub}>UPAY NGO Impact Analyzer</p>
                    </div>
                </div>

                {/* Desktop Nav */}
                <div style={styles.desktopLinks}>
                    {LINKS.map(l => (
                        <button key={l.id} style={linkStyle(l.id)}
                            onClick={() => setActivePage(l.id)}>
                            {l.label}
                        </button>
                    ))}
                </div>

                {/* Hamburger */}
                <button style={styles.hamburger}
                    onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? "✕" : "☰"}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobile && menuOpen && (
                <div style={styles.mobileMenu}>
                    {LINKS.map(l => (
                        <button key={l.id} style={mobileLinkStyle(l.id)}
                            onClick={() => { setActivePage(l.id); setMenuOpen(false); }}>
                            {l.label}
                        </button>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;