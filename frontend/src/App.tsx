import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import AboutUs from "./pages/AboutUs";
import Dashboard from "./pages/Dashboard";
import Predictions from "./pages/Predictions";

function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-[var(--bg-light)] text-[var(--text-primary)]">
      <Navbar />
      <main className="mx-auto w-full max-w-[1600px] px-3 pb-8 pt-20 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/predictions" element={<Predictions />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
