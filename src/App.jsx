import { Link, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Company from "./pages/Company";
import Info from "./pages/Info";
import Privacy from "./pages/Privacy";
import Share from "./pages/Share";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-navy-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="group">
            <span className="block text-xl font-black tracking-tight text-white transition group-hover:text-slate-100 md:text-2xl">
              Монголын хөрөнгийн тооцоолуур
            </span>
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link to="/" className="hover:opacity-80">
              Нүүр
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

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/info" element={<Info />} />
          <Route path="/company/:companyName" element={<Company />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/share" element={<Share />} />
        </Routes>
      </main>
    </div>
  );
}
