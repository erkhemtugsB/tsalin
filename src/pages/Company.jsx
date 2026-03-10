import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 50;

function normalizeText(value) {
  return (value || "").toString().trim();
}

function deriveSalaryAvg(min, max) {
  if (Number.isFinite(min) && Number.isFinite(max)) {
    return (min + max) / 2;
  }
  if (Number.isFinite(min)) {
    return min;
  }
  if (Number.isFinite(max)) {
    return max;
  }
  return null;
}

function formatSalary(value) {
  if (!Number.isFinite(value)) {
    return "–";
  }
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function parseSalaryText(raw) {
  const text = normalizeText(raw).toLowerCase();
  if (!text) {
    return { min: null, max: null, avg: null };
  }

  if (/(тохиролцоно|negotiable|ярилцана|as per)/.test(text)) {
    return { min: null, max: null, avg: null };
  }

  const multiplier = text.includes("сая") ? 1_000_000 : 1;
  const tokens = text.match(/\\d[\\d\\s.,]*/g) || [];
  const values = [];

  for (const token of tokens) {
    const cleaned = token.replace(/[^\\d.,]/g, "").trim();
    if (!cleaned) continue;
    let compact = cleaned.replace(/\\s+/g, "");
    if (compact.includes(",") && compact.includes(".")) {
      compact = compact.replace(/,/g, "");
    } else if (compact.includes(",") && !compact.includes(".")) {
      const parts = compact.split(",");
      if (parts[1]?.length <= 2) {
        compact = `${parts[0]}.${parts[1]}`;
      } else {
        compact = compact.replace(/,/g, "");
      }
    } else {
      compact = compact.replace(/,/g, "");
    }
    const num = Number(compact);
    if (Number.isFinite(num)) {
      values.push(num * multiplier);
    }
  }

  if (!values.length) {
    return { min: null, max: null, avg: null };
  }

  const min = values.length >= 2 ? Math.min(values[0], values[1]) : values[0];
  const max = values.length >= 2 ? Math.max(values[0], values[1]) : values[0];
  return { min, max, avg: deriveSalaryAvg(min, max) };
}

export default function Company() {
  const { companyName } = useParams();
  const decodedCompany = companyName ? decodeURIComponent(companyName) : "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!supabase) {
      setError("Supabase тохируулаагүй байна. .env дээр VITE_SUPABASE_URL болон VITE_SUPABASE_ANON_KEY шаардлагатай.");
      return;
    }
    if (!decodedCompany) {
      setRows([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError("");
    setPage(1);

    supabase
      .from("jobs")
      .select("job_title, company_name, salary, location, source, job_url, scraped_at", { count: "exact" })
      .ilike("company_name", decodedCompany)
      .order("scraped_at", { ascending: false })
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          throw fetchError;
        }
        setRows(data || []);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Мэдээлэл татахад алдаа гарлаа.");
        setRows([]);
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [decodedCompany]);

  const listings = useMemo(() => {
    return rows.map((row) => {
      const parsed = parseSalaryText(row.salary);
      return {
        ...row,
        salaryMin: parsed.min,
        salaryMax: parsed.max,
        salaryAvg: parsed.avg,
        salaryLabel: normalizeText(row.salary),
        titleLabel: normalizeText(row.job_title) || "Тодорхойгүй зар",
      };
    });
  }, [rows]);

  const summary = useMemo(() => {
    const salaryValues = listings
      .map((row) => row.salaryAvg)
      .filter((value) => Number.isFinite(value));
    const avg = salaryValues.length
      ? salaryValues.reduce((acc, val) => acc + val, 0) / salaryValues.length
      : null;
    const min = salaryValues.length ? Math.min(...salaryValues) : null;
    const max = salaryValues.length ? Math.max(...salaryValues) : null;
    return {
      jobCount: listings.length,
      avgSalary: avg,
      minSalary: min,
      maxSalary: max,
    };
  }, [listings]);

  const roleStats = useMemo(() => {
    const map = new Map();
    for (const row of listings) {
      const role = row.titleLabel;
      if (!map.has(role)) {
        map.set(role, { role, count: 0, salaryValues: [] });
      }
      const entry = map.get(role);
      entry.count += 1;
      if (Number.isFinite(row.salaryAvg)) {
        entry.salaryValues.push(row.salaryAvg);
      }
    }
    const stats = Array.from(map.values()).map((entry) => {
      const avgSalary = entry.salaryValues.length
        ? entry.salaryValues.reduce((acc, val) => acc + val, 0) / entry.salaryValues.length
        : null;
      return {
        role: entry.role,
        count: entry.count,
        avgSalary,
      };
    });
    stats.sort((a, b) => (b.avgSalary ?? -Infinity) - (a.avgSalary ?? -Infinity));
    return stats.slice(0, 6);
  }, [listings]);

  const maxRoleAvg = useMemo(() => {
    const values = roleStats.map((item) => item.avgSalary).filter((val) => Number.isFinite(val));
    return values.length ? Math.max(...values) : 0;
  }, [roleStats]);

  const visibleListings = useMemo(() => {
    return listings.slice(0, page * PAGE_SIZE);
  }, [listings, page]);

  const hasMore = visibleListings.length < listings.length;

  return (
    <section className="space-y-6">
      <header className="relative overflow-hidden rounded-3xl border border-white/50 bg-gradient-to-br from-white via-slate-50 to-amber-50 p-6 shadow-lg">
        <div className="pointer-events-none absolute -right-24 -top-24 h-48 w-48 rounded-full bg-amber-200/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-navy-700/10 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Компанийн хуудас</p>
            <h1 className="mt-2 text-2xl font-bold text-navy-900">{decodedCompany || "Компанийн нэр"}</h1>
          </div>
          <Link to="/info" className="text-sm font-semibold text-navy-700 hover:text-navy-900">
            Буцах
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500">Мэдээлэл татаж байна...</div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Нийт зар</p>
              <p className="mt-2 text-2xl font-bold text-navy-900">{summary.jobCount}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Дундаж цалин</p>
              <p className="mt-2 text-2xl font-bold text-navy-900">
                {summary.avgSalary ? `${formatSalary(summary.avgSalary)} ₮` : "–"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Цалингийн хүрээ</p>
              <p className="mt-2 text-lg font-semibold text-navy-900">
                {summary.minSalary != null && summary.maxSalary != null
                  ? `${formatSalary(summary.minSalary)} - ${formatSalary(summary.maxSalary)} ₮`
                  : "–"}
              </p>
            </div>
          </div>

          {roleStats.length > 0 && (
            <div className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Тэргүүлэх албан тушаалууд
                </h2>
                <span className="text-xs text-slate-400">Дундаж цалингаар</span>
              </div>
              <div className="mt-4 space-y-3">
                {roleStats.map((item) => {
                  const width = maxRoleAvg ? Math.round((item.avgSalary || 0) / maxRoleAvg * 100) : 0;
                  return (
                    <div key={item.role} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-navy-900">{item.role}</span>
                        <span className="text-slate-600">
                          {item.avgSalary ? `${formatSalary(item.avgSalary)} ₮` : "–"}
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-navy-700/80"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{item.count} зар</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {listings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
              Энэ компанид бүртгэлтэй зар олдсонгүй.
            </div>
          ) : (
            <div className="grid gap-4">
              {visibleListings.map((item) => (
                <article
                  key={`${item.job_url}-${item.titleLabel}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-navy-900">{item.titleLabel}</h3>
                      <p className="mt-2 text-xs text-slate-500">{item.location || "Байршил тодорхойгүй"}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Цалин</p>
                      <p className="mt-1 text-base font-semibold text-navy-900">
                        {item.salaryMin || item.salaryMax
                          ? `${formatSalary(item.salaryMin ?? item.salaryAvg)} - ${formatSalary(item.salaryMax ?? item.salaryAvg)} ₮`
                          : item.salaryLabel || "Мэдээлэлгүй"}
                      </p>
                      <p className="text-xs text-slate-500">Дундаж: {formatSalary(item.salaryAvg)} ₮</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setPage((prev) => prev + 1)}
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-navy-900 shadow-sm hover:bg-slate-50"
              >
                Илүү харах
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
