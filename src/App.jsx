import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Share from "./pages/Share";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-navy-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="group inline-flex items-center gap-3">
            <span className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-300/30 via-sky-300/20 to-white/10 ring-1 ring-cyan-200/35">
              <span className="pointer-events-none absolute -right-3 -top-3 h-6 w-6 rounded-full bg-cyan-200/35 blur-md" />
              <span className="text-sm font-black tracking-tight text-cyan-100">₮</span>
            </span>
            <span className="leading-tight">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100/75">
                Wealth Map
              </span>
              <span className="block bg-gradient-to-r from-white via-cyan-100 to-slate-200 bg-clip-text text-[1.02rem] font-black tracking-tight text-transparent transition group-hover:from-cyan-100 group-hover:to-white">
                Монгол Хөрөнгө
              </span>
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
