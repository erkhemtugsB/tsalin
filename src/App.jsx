import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Share from "./pages/Share";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-navy-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="group">
            <span className="block text-2xl font-black lowercase tracking-tight text-[#0CAA41] transition group-hover:text-[#14b84c]">
              sankhuu
            </span>
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:opacity-80">
              Нүүр
            </Link>
            <Link to="/privacy" className="hover:opacity-80">
              Нууцлал
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/share" element={<Share />} />
        </Routes>
      </main>
    </div>
  );
}
