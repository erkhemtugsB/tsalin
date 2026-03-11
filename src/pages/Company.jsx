import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const PAGE_SIZE = 50;

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

function ReviewStars({ value }) {
  const fullStars = Math.round(value);
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, idx) => (
        <svg
          key={idx}
          aria-hidden="true"
          className={`h-3.5 w-3.5 ${idx < fullStars ? "opacity-100" : "opacity-25"}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 17.3l-6.18 3.73 1.64-7.19L2 9.24l7.27-.62L12 2l2.73 6.62 7.27.62-5.46 4.6 1.64 7.19z" />
        </svg>
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 text-amber-500">
      {Array.from({ length: 5 }).map((_, idx) => {
        const base = idx + 1;
        const fill = value >= base ? 100 : 0;
        return (
          <div key={base} className="relative h-7 w-7">
            <svg
              aria-hidden="true"
              className="h-7 w-7 opacity-30"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 17.3l-6.18 3.73 1.64-7.19L2 9.24l7.27-.62L12 2l2.73 6.62 7.27.62-5.46 4.6 1.64 7.19z" />
            </svg>
            <div className="absolute inset-0 flex">
              <button
                type="button"
                className="h-full w-full"
                onClick={() => onChange(base)}
                aria-label={`${base} stars`}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
              <svg
                aria-hidden="true"
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 17.3l-6.18 3.73 1.64-7.19L2 9.24l7.27-.62L12 2l2.73 6.62 7.27.62-5.46 4.6 1.64 7.19z" />
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Company() {
  const { companyName } = useParams();
  const decodedCompany = companyName ? decodeURIComponent(companyName) : "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [debugCount, setDebugCount] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitError, setReviewSubmitError] = useState("");

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
      .from("job")
      .select("id, job_title, company_name, salary, created_at", { count: "exact" })
      .ilike("company_name", decodedCompany)
      .order("created_at", { ascending: false })
      .then(({ data, error: fetchError, count }) => {
        if (!active) return;
        if (fetchError) {
          throw fetchError;
        }
        setRows(data || []);
        setDebugCount(Number.isFinite(count) ? count : null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || "Мэдээлэл татахад алдаа гарлаа.");
        setRows([]);
        setDebugCount(null);
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

  useEffect(() => {
    if (!supabase || !decodedCompany) {
      setReviews([]);
      return;
    }
    let active = true;
    setReviewsLoading(true);
    setReviewsError("");

    supabase
      .from("review")
      .select("id, name, message, rating, created_at")
      .ilike("company_name", `%${decodedCompany}%`)
      .order("created_at", { ascending: false })
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
  }, [decodedCompany]);

  const listings = useMemo(() => {
    return rows.map((row) => {
      const salaryValue = parseSalaryValue(row.salary);
      return {
        ...row,
        salaryMin: salaryValue,
        salaryMax: salaryValue,
        salaryAvg: salaryValue,
        salaryLabel: Number.isFinite(salaryValue) ? formatSalary(salaryValue) : "Мэдээлэлгүй",
        titleLabel: normalizeText(row.job_title) || "Тодорхойгүй зар",
        created_at: row.created_at
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

  const reviewStats = useMemo(() => {
    const ratings = reviews
      .map((r) => Number(r.rating))
      .filter((v) => Number.isFinite(v) && v > 0);
    const avg = ratings.length ? ratings.reduce((acc, val) => acc + val, 0) / ratings.length : 0;
    return {
      avgRating: avg,
      count: reviews.length
    };
  }, [reviews]);

  const handleSubmitReview = async (event) => {
    event.preventDefault();
    if (!supabase) {
      setReviewSubmitError("Supabase тохируулаагүй байна.");
      return;
    }
    if (!decodedCompany) {
      setReviewSubmitError("Компанийн нэр олдсонгүй.");
      return;
    }
    if (!reviewMessage.trim()) {
      setReviewSubmitError("Сэтгэгдэл бичнэ үү.");
      return;
    }
    if (!reviewRating) {
      setReviewSubmitError("Үнэлгээ сонгоно уу.");
      return;
    }
    if (reviewName.trim().length > 15) {
      setReviewSubmitError("Нэр 15 тэмдэгтээс ихгүй байна.");
      return;
    }
    if (reviewMessage.trim().length > 150) {
      setReviewSubmitError("Сэтгэгдэл 150 тэмдэгтээс ихгүй байна.");
      return;
    }

    setReviewSubmitting(true);
    setReviewSubmitError("");

    const payload = {
      name: reviewName.trim() || "Anonymous",
      message: reviewMessage.trim(),
      rating: reviewRating,
      company_name: decodedCompany,
    };

    const { data, error: insertError } = await supabase
      .from("review")
      .insert(payload)
      .select("id, name, message, rating, created_at");

    if (insertError) {
      setReviewSubmitError(insertError.message || "Сэтгэгдэл илгээхэд алдаа гарлаа.");
      setReviewSubmitting(false);
      return;
    }

    if (data && data[0]) {
      setReviews((prev) => [data[0], ...prev]);
    }
    setReviewName("");
    setReviewMessage("");
    setReviewRating(0);
    setReviewSubmitting(false);
    setReviewModalOpen(false);
  };

  const salaryBins = useMemo(() => {
    const values = listings
      .map((row) => row.salaryAvg)
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);
    if (!values.length) {
      return [];
    }
    const min = values[0];
    const max = values[values.length - 1];
    const binCount = 6;
    const step = (max - min) / binCount || 1;
    const bins = Array.from({ length: binCount }, (_, i) => ({
      label: `${formatSalary(Math.round(min + step * i))}`,
      count: 0,
    }));
    for (const value of values) {
      const idx = Math.min(Math.floor((value - min) / step), binCount - 1);
      bins[idx].count += 1;
    }
    return bins;
  }, [listings]);

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

          {debugCount !== null && (
            <p className="text-xs text-slate-400">Debug: {debugCount} бичлэг олдлоо.</p>
          )}

          <div className="grid gap-3 md:grid-cols-[1fr,2fr]">
            <div className="rounded-2xl border border-white/60 bg-gradient-to-br from-white via-amber-50 to-amber-100/70 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Үнэлгээ</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-bold text-navy-900 shadow-sm">
                  {reviewStats.avgRating.toFixed(1)}
                </div>
                <div>
                  <StarRating value={reviewStats.avgRating} label={`${reviewStats.count} review`} />
                  <p className="mt-1 text-xs text-slate-500">Дундаж үнэлгээ</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Сэтгэгдэл</p>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                    {reviewStats.count} нийт
                  </span>
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(true)}
                    className="rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-navy-800"
                  >
                    Сэтгэгдэл нэмэх
                  </button>
                </div>
              </div>
              {reviewsLoading ? (
                <p className="mt-3 text-sm text-slate-500">Сэтгэгдэл татаж байна...</p>
              ) : reviewsError ? (
                <p className="mt-3 text-sm text-rose-600">{reviewsError}</p>
              ) : reviews.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Одоогоор сэтгэгдэл алга.</p>
              ) : (
                <div className="mt-4 space-y-3">
                  {reviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {(review.name || "A")[0]}
                          </span>
                          <span className="font-semibold text-slate-700">{review.name || "Anonymous"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ReviewStars value={Number(review.rating) || 0} />
                          <span>{new Date(review.created_at).toLocaleDateString("en-CA")}</span>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{review.message || "—"}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>


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
                    {item.created_at && (
                      <p className="mt-1 text-xs text-slate-500">
                        {new Date(item.created_at).toLocaleDateString("en-CA")}
                      </p>
                    )}
                  </div>
                    <div className="flex h-24 w-56 flex-col justify-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Цалин</p>
                      <p className="mt-1 text-base font-semibold text-navy-900">
                        {Number.isFinite(item.salaryAvg) ? `${formatSalary(item.salaryAvg)} ₮` : "Мэдээлэлгүй"}
                      </p>
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

      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="w-full max-w-lg rounded-2xl border border-white/30 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Сэтгэгдэл нэмэх</p>
                <h2 className="mt-2 text-xl font-bold text-navy-900">{decodedCompany}</h2>
              </div>
              <button
                type="button"
                onClick={() => setReviewModalOpen(false)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50"
              >
                Хаах
              </button>
            </div>
            <form className="mt-5 space-y-4" onSubmit={handleSubmitReview}>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Нэр
                <input
                  value={reviewName}
                  onChange={(event) => setReviewName(event.target.value)}
                  maxLength={15}
                  placeholder="Нэр (заавал биш)"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-400"
                />
                <span className="mt-1 block text-[11px] text-slate-400">{reviewName.length}/15</span>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Үнэлгээ
                <div className="mt-2 flex items-center gap-3">
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                  <span className="text-sm font-semibold text-navy-900">{reviewRating.toFixed(1)}</span>
                </div>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Сэтгэгдэл
                <textarea
                  value={reviewMessage}
                  onChange={(event) => setReviewMessage(event.target.value)}
                  placeholder="Сэтгэгдлээ бичнэ үү"
                  rows={4}
                  maxLength={150}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-400"
                />
                <span className="mt-1 block text-[11px] text-slate-400">{reviewMessage.length}/150</span>
              </label>
              {reviewSubmitError && (
                <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  {reviewSubmitError}
                </p>
              )}
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="rounded-full bg-navy-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-navy-800 disabled:opacity-60"
                >
                  {reviewSubmitting ? "Илгээж байна..." : "Илгээх"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
