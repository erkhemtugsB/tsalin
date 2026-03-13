import { Link, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Company from "./pages/Company";
import Info from "./pages/Info";
import Privacy from "./pages/Privacy";
import Share from "./pages/Share";
import Survey from "./pages/Survey";

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className="min-h-screen overflow-x-hidden bg-white">
      <header className="border-b border-slate-200 bg-navy-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="group flex items-center gap-3">
            <img src="/logo.png" alt="Sankhuu" className="h-10 w-10 rounded-full object-cover" />
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:opacity-80">
              Нүүр
            </Link>
            <Link to="/survey" className="hover:opacity-80">
              Судалгаа
            </Link>
            <Link to="/info" className="hover:opacity-80">
              Ажлын мэдээлэл
            </Link>
            <Link to="/privacy" className="hover:opacity-80">
              Нууцлал
            </Link>
          </nav>
        </div>
      </header>

      <main className={isHome ? "w-full px-0" : "mx-auto max-w-5xl px-4 py-8"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="/info" element={<Info />} />
          <Route path="/company/:companyName" element={<Company />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/share" element={<Share />} />
        </Routes>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-slate-500">
          <span>© 2026 Sankhuu</span>
          <span>Мэдээлэл нь зөвхөн танин мэдэх зориулалттай.</span>
        </div>
      </footer>
    </div>
  );
}
