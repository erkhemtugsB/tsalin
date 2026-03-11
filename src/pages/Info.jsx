import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 50;
const DEFAULT_LIMIT = 500;

function normalizeText(value) {
  return (value || "").toString().trim();
}

function formatSalary(value) {
  if (!Number.isFinite(value)) {
    return "–";
  }
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function parseSalaryValue(raw) {
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function StarRating({ value, label }) {
  const fullStars = Math.round(value);
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-amber-500">
        {Array.from({ length: 5 }).map((_, idx) => (
          <svg
            key={idx}
            aria-hidden="true"
            className={`h-4 w-4 ${idx < fullStars ? "opacity-100" : "opacity-30"}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 17.3l-6.18 3.73 1.64-7.19L2 9.24l7.27-.62L12 2l2.73 6.62 7.27.62-5.46 4.6 1.64 7.19z" />
          </svg>
        ))}
      </div>
      <span className="text-sm font-semibold text-navy-900">{value.toFixed(1)}</span>
      {label && <span className="text-xs text-slate-500">{label}</span>}
    </div>
  );
}

export default function Info() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("company");
  const [sort, setSort] = useState("avg_desc");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState({ total: null, filtered: null });
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");

  const requestId = useRef(0);
  const suggestRequestId = useRef(0);
  const trimmedQuery = query.trim();

  useEffect(() => {
    if (!supabase) {
      setError("Supabase тохируулаагүй байна. .env дээр VITE_SUPABASE_URL болон VITE_SUPABASE_ANON_KEY шаардлагатай.");
      return;
    }

    let active = true;
    const currentRequest = ++requestId.current;

    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const queryLimit = trimmedQuery ? DEFAULT_LIMIT : DEFAULT_LIMIT;
        const base = supabase.from("job");
        let builder = base
          .select("id, job_title, company_name, salary, created_at", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(queryLimit);

        if (trimmedQuery) {
          if (mode === "company") {
            builder = builder.ilike("company_name", `%${trimmedQuery}%`);
          } else {
            builder = builder.ilike("job_title", `%${trimmedQuery}%`);
          }
        }

        const { data, error: fetchError, count } = await builder;

        if (!active || currentRequest !== requestId.current) {
          return;
        }

        if (fetchError) {
          throw fetchError;
        }

        setRows(() => {
          const merged = data || [];
          const seen = new Set();
          return merged.filter((item) => {
            const key = item.id || `${item.company_name}-${item.job_title}-${item.created_at}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        });
        if (trimmedQuery) {
          const { count: totalCount, error: totalError } = await base.select("id", {
            count: "exact",
            head: true,
          });
          setMeta({
            filtered: Number.isFinite(count) ? count : null,
            total: totalError ? null : totalCount ?? null,
          });
        } else {
          setMeta({
            filtered: Number.isFinite(count) ? count : null,
            total: Number.isFinite(count) ? count : null,
          });
        }
      } catch (err) {
        if (!active || currentRequest !== requestId.current) {
          return;
        }
        setError(err?.message || "Мэдээлэл татахад алдаа гарлаа.");
        setRows([]);
        setMeta({ total: null, filtered: null });
      } finally {
        if (active && currentRequest === requestId.current) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [trimmedQuery, mode]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let active = true;
    setReviewsLoading(true);
    setReviewsError("");

    supabase
      .from("review")
      .select("id, name, message, rating, company_name, created_at")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data, error: fetchError }) => {
        if (!active) return;
        if (fetchError) {
          throw fetchError;
        }
        setReviews(data || []);
      })
      .catch((err) => {
        if (!active) return;
        setReviewsError(err?.message || "Сэтгэгдэл татахад алдаа гарлаа.");
        setReviews([]);
      })
      .finally(() => {
        if (active) {
          setReviewsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    const keyword = trimmedQuery;
    if (!keyword) {
      setSuggestions([]);
      return;
    }

    let active = true;
    const currentRequest = ++suggestRequestId.current;
    const timer = setTimeout(async () => {
      try {
        const field = mode === "company" ? "company_name" : "job_title";
        const source = mode === "company" ? "company" : "job";
        const { data, error: fetchError } = await supabase
          .from(source)
          .select(field)
          .ilike(field, `%${keyword}%`)
          .limit(25);

        if (!active || currentRequest !== suggestRequestId.current) {
          return;
        }
        if (fetchError) {
          throw fetchError;
        }
        const unique = Array.from(
          new Set((data || []).map((row) => normalizeText(row[field])).filter(Boolean))
        ).slice(0, 12);
        setSuggestions(unique);
      } catch {
        if (active && currentRequest === suggestRequestId.current) {
          setSuggestions([]);
        }
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [trimmedQuery, mode]);

  useEffect(() => {
    setSort("avg_desc");
    setVisibleCount(PAGE_SIZE);
  }, [mode]);

  const listings = useMemo(() => {
    return rows.map((row) => {
      const salaryValue = parseSalaryValue(row.salary);
      return {
        ...row,
        salaryMin: salaryValue,
        salaryMax: salaryValue,
        salaryAvg: salaryValue,
        salaryLabel: Number.isFinite(salaryValue) ? formatSalary(salaryValue) : "Мэдээлэлгүй",
        companyLabel: normalizeText(row.company_name) || "Тодорхойгүй компани",
        titleLabel: normalizeText(row.job_title) || "Тодорхойгүй зар",
      };
    });
  }, [rows]);

  const companies = useMemo(() => {
    const map = new Map();
    for (const row of listings) {
      if (mode !== "company") {
        continue;
      }
      const key = row.companyLabel;
      if (!map.has(key)) {
        map.set(key, {
          company: key,
          count: 0,
          salaryMin: null,
          salaryMax: null,
          salaryAvg: null,
          salaries: [],
          roles: [],
        });
      }
      const entry = map.get(key);
      entry.count += 1;
      entry.roles.push(row.titleLabel);
      if (Number.isFinite(row.salaryMin)) {
        entry.salaryMin = entry.salaryMin == null ? row.salaryMin : Math.min(entry.salaryMin, row.salaryMin);
      }
      if (Number.isFinite(row.salaryMax)) {
        entry.salaryMax = entry.salaryMax == null ? row.salaryMax : Math.max(entry.salaryMax, row.salaryMax);
      }
      if (Number.isFinite(row.salaryAvg)) {
        entry.salaries.push(row.salaryAvg);
      }
    }
    for (const entry of map.values()) {
      if (entry.salaries.length) {
        const sum = entry.salaries.reduce((acc, val) => acc + val, 0);
        entry.salaryAvg = sum / entry.salaries.length;
      }
      entry.roles = Array.from(new Set(entry.roles)).slice(0, 5);
    }
    return Array.from(map.values());
  }, [listings, mode]);

  const sortedListings = useMemo(() => {
    const cloned = [...listings];
    const compareText = (a, b) => a.localeCompare(b, "mn", { sensitivity: "base" });

    switch (sort) {
      case "avg_asc":
        cloned.sort((a, b) => (a.salaryAvg ?? Infinity) - (b.salaryAvg ?? Infinity));
        break;
      case "avg_desc":
        cloned.sort((a, b) => (b.salaryAvg ?? -Infinity) - (a.salaryAvg ?? -Infinity));
        break;
      case "min_desc":
        cloned.sort((a, b) => (b.salaryMin ?? -Infinity) - (a.salaryMin ?? -Infinity));
        break;
      case "max_desc":
        cloned.sort((a, b) => (b.salaryMax ?? -Infinity) - (a.salaryMax ?? -Infinity));
        break;
      case "company_asc":
        cloned.sort((a, b) => compareText(a.companyLabel, b.companyLabel));
        break;
      case "title_asc":
        cloned.sort((a, b) => compareText(a.titleLabel, b.titleLabel));
        break;
      default:
        break;
    }

    return cloned;
  }, [listings, sort]);

  const sortedCompanies = useMemo(() => {
    const cloned = [...companies];
    const compareText = (a, b) => a.localeCompare(b, "mn", { sensitivity: "base" });

    switch (sort) {
      case "avg_asc":
        cloned.sort((a, b) => (a.salaryAvg ?? Infinity) - (b.salaryAvg ?? Infinity));
        break;
      case "avg_desc":
        cloned.sort((a, b) => (b.salaryAvg ?? -Infinity) - (a.salaryAvg ?? -Infinity));
        break;
      case "count_desc":
        cloned.sort((a, b) => b.count - a.count);
        break;
      case "company_asc":
        cloned.sort((a, b) => compareText(a.company, b.company));
        break;
      default:
        break;
    }

    return cloned;
  }, [companies, sort]);

  const visibleListings = useMemo(() => {
    return sortedListings.slice(0, visibleCount);
  }, [sortedListings, visibleCount]);

  const visibleCompanies = useMemo(() => {
    return sortedCompanies.slice(0, visibleCount);
  }, [sortedCompanies, visibleCount]);

  const hasMore = useMemo(() => {
    return mode === "company" ? visibleCompanies.length < sortedCompanies.length : visibleListings.length < sortedListings.length;
  }, [mode, visibleCompanies.length, visibleListings.length, sortedCompanies.length, sortedListings.length]);

  const summary = useMemo(() => {
    const salaryValues = listings
      .map((row) => row.salaryAvg)
      .filter((value) => Number.isFinite(value));
    const avg = salaryValues.length
      ? salaryValues.reduce((acc, val) => acc + val, 0) / salaryValues.length
      : null;
    return {
      listings: meta.filtered ?? listings.length,
      companies: companies.length,
      averageSalary: avg,
    };
  }, [listings, companies, meta.filtered]);

  const reviewStats = useMemo(() => {
    const ratings = reviews.map((r) => Number(r.rating)).filter((v) => Number.isFinite(v));
    const avg = ratings.length ? ratings.reduce((acc, val) => acc + val, 0) / ratings.length : 0;
    return { avgRating: avg, count: reviews.length };
  }, [reviews]);

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-xl">
      <div className="pointer-events-none absolute -left-24 -top-32 h-64 w-64 rounded-full bg-navy-700/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

      <header className="relative z-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm">
          Job intelligence
        </div>
        <h1 className="mt-4 text-3xl font-black text-navy-900 md:text-4xl">Ажлын байрны мэдээллийн төв</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-600">
          Компанийн нэр эсвэл ажлын байрны нэрээр хайж, цалин, дундаж болон эрэмбэлсэн жагсаалтыг
          хараарай.
        </p>
        <div className="mt-5 overflow-hidden rounded-2xl border border-white/60 bg-gradient-to-r from-amber-100/60 via-white to-slate-100/60 shadow-sm">
          <img
            src="/info-hero.png"
            alt="Job intelligence"
            className="h-36 w-full object-cover object-center opacity-90 md:h-48"
          />
        </div>
        <p className="mt-3 text-xs text-slate-500">Сүүлийн зарууд дээр тулгуурласан дундаж үзүүлэлт.</p>
        {mode === "company" && (
          <div className="mt-4 rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Сэтгэгдэл</p>
            {reviewsLoading ? (
              <p className="mt-2 text-sm text-slate-500">Сэтгэгдэл татаж байна...</p>
            ) : reviewsError ? (
              <p className="mt-2 text-sm text-rose-600">{reviewsError}</p>
            ) : reviews.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Одоогоор сэтгэгдэл алга.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {reviews.map((review) => (
                  <div key={review.id} className="rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{review.name || "Anonymous"}</span>
                      <span>{new Date(review.created_at).toLocaleDateString("en-CA")}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-700">{review.message || "—"}</p>
                    <p className="mt-1 text-xs text-slate-500">{review.company_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      <div className="relative z-30 mt-6 grid gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 shadow-sm backdrop-blur-md md:grid-cols-[2fr,1fr]">
        <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Хайлт
          <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm md:flex-row">
            <div className="relative flex-1">
              <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => {
                window.setTimeout(() => setShowSuggestions(false), 120);
              }}
              placeholder={mode === "company" ? "Компанийн нэрээр хайх" : "Ажлын байрны нэрээр хайх"}
              className="w-full bg-transparent text-sm text-navy-900 outline-none"
            />
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 top-full z-40 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-lg">
                  {suggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => {
                        setQuery(item);
                setVisibleCount(PAGE_SIZE);
                        setShowSuggestions(false);
                      }}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <span>{item}</span>
                      <span className="text-xs text-slate-400">Enter</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </label>

        <div className="grid gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold text-slate-600">
            <button
              type="button"
                onClick={() => {
                  setMode("company");
                  setQuery("");
                  setPage(1);
                }}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                mode === "company"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 21h18" />
                <path d="M4 21V7l8-4 8 4v14" />
                <path d="M9 21v-6h6v6" />
              </svg>
              <span>Компанийн нэр</span>
            </button>
            <button
              type="button"
                onClick={() => {
                  setMode("job");
                  setQuery("");
                  setPage(1);
                }}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                mode === "job"
                  ? "bg-navy-900 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="7" width="18" height="13" rx="2" />
                <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M3 13h18" />
              </svg>
              <span>Ажлын байр</span>
            </button>
          </div>
          <div className="relative">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-9 py-2 text-xs font-semibold text-slate-600"
            >
              {mode === "company" ? (
                <>
                  <option value="avg_desc">Дундаж цалин (өндөрөөс)</option>
                  <option value="avg_asc">Дундаж цалин (багаас)</option>
                  <option value="count_desc">Ажлын тоо (компани)</option>
                  <option value="company_asc">Компанийн нэр</option>
                </>
              ) : (
                <>
                  <option value="avg_desc">Дундаж цалин (өндөрөөс)</option>
                  <option value="avg_asc">Дундаж цалин (багаас)</option>
                  <option value="max_desc">Макс цалин</option>
                  <option value="min_desc">Мин цалин</option>
                  <option value="title_asc">Ажлын байрны нэр</option>
                </>
              )}
            </select>
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 5h18" />
                <path d="M7 12h10" />
                <path d="M10 19h4" />
              </svg>
            </span>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Зар</p>
          <p className="mt-2 text-2xl font-bold text-navy-900">{summary.listings}</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Компани</p>
          <p className="mt-2 text-2xl font-bold text-navy-900">{summary.companies}</p>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Дундаж цалин</p>
          <p className="mt-2 text-2xl font-bold text-navy-900">
            {summary.averageSalary ? `${formatSalary(summary.averageSalary)} ₮` : "–"}
          </p>
        </div>
      </div>

      {error && (
        <div className="relative z-10 mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="relative z-10 mt-4 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500">
          Мэдээлэл татаж байна...
        </div>
      )}

      {!loading && !error && mode === "job" && (
        <div className="relative z-10 mt-6 grid gap-4">
          {sortedListings.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
              Илэрц олдсонгүй. Хүснэгт хоосон эсвэл RLS зөвшөөрөлгүй байж болно.
              <div className="mt-3 text-xs text-slate-400">
                {meta.total === 0
                  ? "Нийт бичлэг: 0 (эсвэл RLS блоклосон байж болно)."
                  : meta.total == null
                    ? "RLS эсвэл permission зөвшөөрөл шалгана уу."
                    : `Нийт бичлэг: ${meta.total}`}
              </div>
            </div>
          ) : (
            visibleListings.map((item) => (
              <article
                key={`${item.job_url}-${item.companyLabel}`}
                className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900">{item.titleLabel}</h3>
                    <p className="mt-1 text-sm text-slate-600">{item.companyLabel}</p>
                    {item.created_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleDateString("en-CA")}
                      </p>
                    )}
                  </div>
                  <div className="flex h-24 w-56 flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Цалин</p>
                    <p className="mt-1 text-base font-semibold text-navy-900">
                      {Number.isFinite(item.salaryAvg) ? `${formatSalary(item.salaryAvg)} ₮` : "Мэдээлэлгүй"}
                    </p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {!loading && !error && mode === "company" && (
        <div className="relative z-10 mt-6 grid gap-4">
          {sortedCompanies.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-sm text-slate-500">
              Компанийн мэдээлэл олдсонгүй. Хүснэгт хоосон эсвэл RLS зөвшөөрөлгүй байж болно.
              <div className="mt-3 text-xs text-slate-400">
                {meta.total === 0
                  ? "Нийт бичлэг: 0 (эсвэл RLS блоклосон байж болно)."
                  : meta.total == null
                    ? "RLS эсвэл permission зөвшөөрөл шалгана уу."
                    : `Нийт бичлэг: ${meta.total}`}
              </div>
            </div>
          ) : (
            visibleCompanies.map((company) => (
              <Link
                key={company.company}
                to={`/company/${encodeURIComponent(company.company)}`}
                className="rounded-3xl border border-white/60 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900">{company.company}</h3>
                    <p className="mt-1 text-sm text-slate-600">{company.count} ажлын байр</p>
                    {company.roles.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Онцлох албан тушаал: <span className="font-semibold text-slate-700">{company.roles[0]}</span>
                      </p>
                    )}
                  </div>
                  <div className="flex h-24 w-56 flex-col justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Дундаж цалин</p>
                    <p className="mt-1 text-base font-semibold text-navy-900">
                      {Number.isFinite(company.salaryAvg) ? `${formatSalary(company.salaryAvg)} ₮` : "Мэдээлэлгүй"}
                    </p>
                    <p className="text-xs text-slate-500">{company.count} зар</p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {!loading && !error && hasMore && (
        <div className="relative z-10 mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="rounded-full border border-slate-200 bg-white/80 px-5 py-2 text-sm font-semibold text-navy-900 shadow-sm hover:bg-white"
          >
            Илүү харах
          </button>
        </div>
      )}

      <footer className="relative z-10 mt-8 text-xs text-slate-500">
        {`Эхний таталт: ${DEFAULT_LIMIT} зар. Илүү харах товчоор ${PAGE_SIZE}-аар нэмэгдэнэ.`}
      </footer>
    </section>
  );
}
