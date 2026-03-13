import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

function formatSalary(value) {
  if (!Number.isFinite(value)) return "–";
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export default function Home() {
  const [stats, setStats] = useState({
    jobCount: null,
    companyCount: null,
    avgSalary: null,
  });

  useEffect(() => {
    let active = true;
    if (!supabase) return;

    const load = async () => {
      const [{ count: jobCount, error: jobErr }, { count: companyCount, error: compErr }] =
        await Promise.all([
          supabase.from("job").select("id", { count: "exact", head: true }),
          supabase.from("company").select("company_name", { count: "exact", head: true }),
        ]);

      let avgSalary = null;
      const { data: salaries, error: salaryErr } = await supabase
        .from("job")
        .select("salary")
        .not("salary", "is", null)
        .limit(5000);

      if (!salaryErr && salaries?.length) {
        const values = salaries.map((row) => Number(row.salary)).filter((v) => Number.isFinite(v));
        if (values.length) {
          avgSalary = values.reduce((acc, val) => acc + val, 0) / values.length;
        }
      }

      if (!active) return;
      if (!jobErr && !compErr) {
        setStats({
          jobCount: Number.isFinite(jobCount) ? jobCount : null,
          companyCount: Number.isFinite(companyCount) ? companyCount : null,
          avgSalary,
        });
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="w-full">
      <section className="relative min-h-[calc(100vh-72px)] w-full overflow-hidden bg-slate-900 text-white">
        <img
          src="https://images.pexels.com/photos/32616068/pexels-photo-32616068.jpeg"
          alt="Санхүүгийн тэнцвэр"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-transparent" />
        <div className="relative z-10 mx-auto grid h-full max-w-6xl items-center gap-6 px-6 py-16 md:grid-cols-[1.3fr_1fr] md:px-10">
          <div>
            <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">
              Санхүүгийн ойлголт
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">
              Монголын санхүүгийн зураглалыг нэг дороос
            </h1>
            <p className="mt-4 max-w-xl text-sm text-slate-200">
              Ажлын байрны мэдээлэл, компанийн дундаж цалин, хувь хүний санхүүгийн байдлыг илүү ойлгомжтойгоор
              харах интерактив төв.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/survey"
                className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-sm hover:bg-amber-300"
              >
                Судалгаанд оролцох
              </Link>
              <Link
                to="/info"
                className="rounded-full border border-white/30 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                Ажлын мэдээлэл харах
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
            <div className="grid gap-3 text-sm text-slate-100">
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Нэг дор</p>
                <p className="mt-2 text-lg font-semibold">Судалгаа + статистик</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Тойм</p>
                <p className="mt-2 text-lg font-semibold">Компанийн цалин, ажлын байр</p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Шинэ</p>
                <p className="mt-2 text-lg font-semibold">Санхүүгийн байдлаа үнэлэх</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10">
          <div className="mx-auto grid max-w-6xl gap-3 border-t border-white/15 px-6 py-6 md:grid-cols-4 md:px-10">
            {[
              {
                label: "Ажлын зар",
                value: stats.jobCount != null ? stats.jobCount.toLocaleString("en-US") : "–",
              },
              {
                label: "Компаниуд",
                value: stats.companyCount != null ? stats.companyCount.toLocaleString("en-US") : "–",
              },
              {
                label: "Дундаж цалин",
                value: stats.avgSalary != null ? `${formatSalary(stats.avgSalary)} ₮` : "–",
              },
              { label: "Судалгааны шинэчлэл", value: "7 хоног тутам" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-10 md:grid-cols-3 md:px-10">
        {[
          {
            title: "Судалгааны төв",
            desc: "Өөрийн санхүүгийн үзүүлэлтийг оруулж, статистик байр сууриа мэд.",
          },
          {
            title: "Ажлын мэдээлэл",
            desc: "Компанийн нэр, албан тушаалаар хайж, цалингийн дундаж харьцуулах.",
          },
          {
            title: "Компанийн хуудас",
            desc: "Бодит ажлын зарын мэдээллээс компанийн цалин, үнэлгээ авах.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-navy-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
