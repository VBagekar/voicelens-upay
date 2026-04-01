import React, { useState } from "react";
import Navbar from "./components/common/Navbar";
import HomePage from "./pages/HomePage";
import AnalyzerPage from "./pages/AnalyzerPage";
import DashboardPage from "./pages/DashboardPage";

function App() {
  const [activePage, setActivePage] = useState("home");

  const renderPage = () => {
    switch (activePage) {
      case "home": return <HomePage setActivePage={setActivePage} />;
      case "analyzer": return <AnalyzerPage />;
      case "dashboard": return <DashboardPage />;
      default: return <HomePage setActivePage={setActivePage} />;
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#E9EAEC" }}>
      <Navbar activePage={activePage} setActivePage={setActivePage} />
      <main>{renderPage()}</main>
    </div>
  );
}

export default App;