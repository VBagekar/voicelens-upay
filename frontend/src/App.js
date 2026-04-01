import React, { useState } from "react";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import HomePage from "./pages/HomePage";
import AnalyzerPage from "./pages/AnalyzerPage";
import FileUploadPage from "./pages/FileUploadPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const [activePage, setActivePage] = useState("home");
  // Shared state — FileUpload results flow into Dashboard
  const [uploadResults, setUploadResults] = useState(null);

  const renderPage = () => {
    switch (activePage) {
      case "home":
        return <HomePage setActivePage={setActivePage} />;
      case "analyzer":
        return <AnalyzerPage />;
      case "file":
        return (
          <FileUploadPage
            onAnalysisComplete={(results) => {
              setUploadResults(results);
              setActivePage("dashboard");  // Auto-navigate to dashboard!
            }}
          />
        );
      case "dashboard":
        return (
          <DashboardPage
            uploadResults={uploadResults}
            setActivePage={setActivePage}
          />
        );
      default:
        return <HomePage setActivePage={setActivePage} />;
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#E9EAEC",
      display: "flex",
      flexDirection: "column",
    }}>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main style={{ flex: 1 }}>{renderPage()}</main>
      <Footer />
    </div>
  );
}

export default App;