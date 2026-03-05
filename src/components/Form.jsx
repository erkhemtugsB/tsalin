import { useState } from "react";
import { supabase } from "../lib/supabase";
import { calculateNetWorth, calculatePercentile } from "../utils/calculator";

const AGE_MIN = 15;
const AGE_MAX = 100;
const SALARY_MIN = 0;
const SALARY_MAX = 50000000;
const CAR_MIN = 0;
const CAR_MAX = 300000000;
const HOME_MIN = 0;
const HOME_MAX = 1000000000;
const SAVINGS_MIN = 0;
const RATE_LIMIT_MS = 30000;

const initialForm = {
  nas: "",
  alban: "",
  company: "",
  salary: "",
  savings: "",
  mashin: "",
  bair: "",
  extraMashins: [],
  extraBairs: [],
  website: "" // honeypot: real user бөглөх ёсгүй далд талбар
};

function sanitizeMoneyInput(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatMoneyDisplay(value) {
  if (!value) return "";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value));
}

function parseMoney(value) {
  return Number(sanitizeMoneyInput(value) || 0);
}

function isInRange(value, min, max) {
  return Number.isFinite(value) && value >= min && value <= max;
}

async function getClientMeta() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return { ip: "unknown-client", geo: null };
    const data = await res.json();
    const ip = data.ip || "unknown-client";

    // Боломжтой үед IP-д суурилсан geolocation авна (best-effort)
    try {
      const geoController = new AbortController();
      const geoTimeout = setTimeout(() => geoController.abort(), 2500);
      const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: geoController.signal });
      clearTimeout(geoTimeout);
      if (!geoRes.ok) return { ip, geo: null };
      const geo = await geoRes.json();
      return {
        ip,
        geo: {
          country: geo.country_name || null,
          region: geo.region || null,
          city: geo.city || null,
          latitude: geo.latitude ?? null,
          longitude: geo.longitude ?? null
        }
      };
    } catch {
      return { ip, geo: null };
    }
  } catch {
    return { ip: "unknown-client", geo: null };
  }
}

function createSubmissionSignature(payload) {
  // Duplicate submission шалгахын тулд canonical бүтэц үүсгэнэ
  const canonical = {
    nas: payload.nas,
    alban: (payload.alban || "").trim().toLowerCase(),
    company: (payload.company || "").trim().toLowerCase(),
    salary: payload.salary,
    savings: payload.savings,
    cars: [...payload.assets.cars].sort((a, b) => a - b),
    homes: [...payload.assets.homes].sort((a, b) => a - b)
  };
  return JSON.stringify(canonical);
}

function validatePayload(payload) {
  const errors = {};

  if (!Number.isInteger(payload.nas) || !isInRange(payload.nas, AGE_MIN, AGE_MAX)) {
    errors.nas = `Нас ${AGE_MIN}-${AGE_MAX} хооронд бүхэл тоо байна.`;
  }

  if (!isInRange(payload.salary, SALARY_MIN, SALARY_MAX)) {
    errors.salary = `Сарын цалин ${formatMoneyDisplay(SALARY_MIN)}-${formatMoneyDisplay(SALARY_MAX)}₮ хооронд байна.`;
  }

  if (!(payload.savings >= SAVINGS_MIN)) {
    errors.savings = "Хуримтлал 0 буюу түүнээс их байна.";
  }

  if (!payload.assets.cars.every((v) => isInRange(v, CAR_MIN, CAR_MAX))) {
    errors.mashin = `Машин бүрийн үнэ ${formatMoneyDisplay(CAR_MIN)}-${formatMoneyDisplay(CAR_MAX)}₮ хооронд байна.`;
  }

  if (!payload.assets.homes.every((v) => isInRange(v, HOME_MIN, HOME_MAX))) {
    errors.bair = `Байр бүрийн үнэ ${formatMoneyDisplay(HOME_MIN)}-${formatMoneyDisplay(HOME_MAX)}₮ хооронд байна.`;
  }

  return errors;
}

const salaryQuickValues = ["1200000", "2000000", "3500000", "5000000"];

export default function Form({ onCalculated, compact = false }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitInfo, setSubmitInfo] = useState("");

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleMoneyChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: sanitizeMoneyInput(value) }));
  };

  const handleExtraMoneyChange = (listKey, index, value) => {
    setForm((prev) => ({
      ...prev,
      [listKey]: prev[listKey].map((item, i) => (i === index ? sanitizeMoneyInput(value) : item))
    }));
  };

  const addExtra = (listKey) => {
    setForm((prev) => ({ ...prev, [listKey]: [...prev[listKey], ""] }));
  };

  const removeExtra = (listKey, index) => {
    setForm((prev) => ({
      ...prev,
      [listKey]: prev[listKey].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitInfo("");
    setErrors({});

    // Honeypot anti-spam: бот далд талбарыг бөглөсөн бол шууд зогсооно
    if ((form.website || "").trim()) {
      setLoading(false);
      return;
    }

    const salaryValue = parseMoney(form.salary);
    const savingsValue = parseMoney(form.savings);
    const carValues = [form.mashin, ...form.extraMashins].map(parseMoney).filter((v) => v > 0);
    const homeValues = [form.bair, ...form.extraBairs].map(parseMoney).filter((v) => v > 0);
    const totalCarValue = carValues.reduce((sum, v) => sum + v, 0);
    const totalHomeValue = homeValues.reduce((sum, v) => sum + v, 0);

    const payload = {
      nas: Number(form.nas),
      alban: form.alban,
      company: form.company,
      salary: salaryValue,
      savings: savingsValue,
      mashin: totalCarValue,
      bair: totalHomeValue,
      assets: {
        cars: carValues,
        homes: homeValues
      }
    };

    const validationErrors = validatePayload(payload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    // Basic rate limit by IP (client-side): ойр ойрхон submit-ийг сааруулна
    const clientMeta = await getClientMeta();
    const ip = clientMeta.ip || "unknown-client";
    const now = Date.now();
    const rateKey = `wealth_rate_${ip}`;
    const previousSubmitAt = Number(localStorage.getItem(rateKey) || 0);
    if (now - previousSubmitAt < RATE_LIMIT_MS) {
      setSubmitInfo("Хэт ойрхон илгээж байна. 30 секунд хүлээгээд дахин оролдоно уу.");
      setLoading(false);
      return;
    }

    // Exact duplicate anti-spam: өмнөхтэй яг ижил өгөгдлийг блоклоно
    const signature = createSubmissionSignature(payload);
    const duplicateKey = `wealth_last_signature_${ip}`;
    const prevSignature = localStorage.getItem(duplicateKey);
    if (prevSignature && prevSignature === signature) {
      setSubmitInfo("Яг ижил өгөгдөл аль хэдийн илгээгдсэн байна.");
      setLoading(false);
      return;
    }

    let infoMessage = "";
    if (supabase) {
      const baseInsertData = {
        nas: payload.nas,
        alban: payload.alban,
        company: payload.company,
        salary: payload.salary,
        mashin: payload.mashin,
        bair: payload.bair
      };

      // Хэрэв schema-д meta баганууд байвал IP/geo-г хамт хадгална.
      const enrichedInsertData = {
        ...baseInsertData,
        client_ip: ip,
        geo_country: clientMeta.geo?.country,
        geo_region: clientMeta.geo?.region,
        geo_city: clientMeta.geo?.city,
        geo_lat: clientMeta.geo?.latitude,
        geo_lon: clientMeta.geo?.longitude
      };

      let insertError = null;
      const { error: firstError } = await supabase.from("salary_data").insert(enrichedInsertData);

      if (firstError) {
        // Legacy schema (meta баганагүй) үед үндсэн өгөгдлөөр дахин оролдоно.
        const missingColumn = /column .* does not exist|schema cache/i.test(firstError.message || "");
        if (missingColumn) {
          const { error: fallbackError } = await supabase.from("salary_data").insert(baseInsertData);
          insertError = fallbackError;
        } else {
          insertError = firstError;
        }
      }

      if (insertError) {
        console.error("Supabase insert алдаа:", insertError);
        infoMessage = `Өгөгдөл хадгалагдсангүй: ${insertError.message}`;
      }
    } else {
      infoMessage = "Supabase тохируулаагүй байна. Тооцооллын үр дүнг шууд харууллаа.";
    }

    localStorage.setItem(rateKey, String(now));
    localStorage.setItem(duplicateKey, signature);

    const netWorth = calculateNetWorth(payload);
    const { combinedPercentile, netWorthPercentile, salaryPercentile } = calculatePercentile(
      netWorth,
      payload.salary
    );

    onCalculated({
      netWorth,
      percentile: Math.round(combinedPercentile),
      netWorthPercentile: Math.round(netWorthPercentile),
      salaryPercentile: Math.round(salaryPercentile),
      payload,
      infoMessage
    });

    setLoading(false);
  };

  const hintClass = "mt-1 text-xs text-slate-500";
  const errorClass = "mt-1 text-xs text-red-600";

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-4 rounded-2xl text-navy-900 ${
        compact
          ? "bg-white p-4 md:p-5"
          : "mt-8 border border-slate-200 bg-white p-6 shadow-sm"
      }`}
    >
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={handleTextChange}
        autoComplete="off"
        tabIndex={-1}
        className="hidden"
        aria-hidden="true"
      />

      <div>
        <p className="text-sm font-semibold">Таны үндсэн мэдээлэл</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Нас</label>
          <input
            type="number"
            name="nas"
            value={form.nas}
            onChange={handleTextChange}
            required
            min={AGE_MIN}
            max={AGE_MAX}
            placeholder="Жишээ: 29"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none placeholder:text-slate-400 focus:border-navy-800"
          />
          <p className={hintClass}>Хязгаар: {AGE_MIN}-{AGE_MAX}, бүхэл тоо</p>
          {errors.nas && <p className={errorClass}>{errors.nas}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Албан тушаал</label>
          <input
            type="text"
            name="alban"
            value={form.alban}
            onChange={handleTextChange}
            required
            placeholder="Жишээ: Ахлах инженер"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none placeholder:text-slate-400 focus:border-navy-800"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Компани</label>
        <input
          type="text"
          name="company"
          value={form.company}
          onChange={handleTextChange}
          required
          placeholder="Жишээ: Tech LLC"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none placeholder:text-slate-400 focus:border-navy-800"
        />
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <label className="mb-1 block text-sm font-medium">Сарын цалин (₮)</label>
        <input
          type="text"
          inputMode="numeric"
          value={formatMoneyDisplay(form.salary)}
          onChange={(e) => handleMoneyChange("salary", e.target.value)}
          required
          placeholder="2,000,000"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-800"
        />
        <p className={hintClass}>
          Хязгаар: {formatMoneyDisplay(SALARY_MIN)}-{formatMoneyDisplay(SALARY_MAX)}₮
        </p>
        {errors.salary && <p className={errorClass}>{errors.salary}</p>}

        <div className="mt-2 flex flex-wrap gap-2">
          {salaryQuickValues.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => handleMoneyChange("salary", value)}
              className="rounded-full border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50"
            >
              {formatMoneyDisplay(value)}₮
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <label className="mb-1 block text-sm font-medium">Хуримтлал (₮)</label>
        <input
          type="text"
          inputMode="numeric"
          value={formatMoneyDisplay(form.savings)}
          onChange={(e) => handleMoneyChange("savings", e.target.value)}
          required
          placeholder="10,000,000"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-800"
        />
        <p className={hintClass}>Хязгаар: {formatMoneyDisplay(SAVINGS_MIN)}₮ ба түүнээс дээш</p>
        {errors.savings && <p className={errorClass}>{errors.savings}</p>}
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <label className="mb-1 block text-sm font-medium">Машины үнэ (₮)</label>
        <input
          type="text"
          inputMode="numeric"
          value={formatMoneyDisplay(form.mashin)}
          onChange={(e) => handleMoneyChange("mashin", e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-800"
          placeholder="45,000,000"
        />
        <p className={hintClass}>
          Машин тус бүр: {formatMoneyDisplay(CAR_MIN)}-{formatMoneyDisplay(CAR_MAX)}₮
        </p>
        {errors.mashin && <p className={errorClass}>{errors.mashin}</p>}

        {form.extraMashins.map((item, index) => (
          <div key={`car-${index}`} className="mt-3 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={formatMoneyDisplay(item)}
              onChange={(e) => handleExtraMoneyChange("extraMashins", index, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-800"
              placeholder={`Нэмэлт машин ${index + 2}`}
            />
            <button
              type="button"
              onClick={() => removeExtra("extraMashins", index)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              aria-label="Нэмэлт машиныг устгах"
              title="Устгах"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addExtra("extraMashins")}
          className="mt-3 text-sm font-medium text-navy-900 hover:underline"
        >
          [+] Дахин машин нэмэх
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 p-3">
        <label className="mb-1 block text-sm font-medium">Байрны үнэ (₮)</label>
        <input
          type="text"
          inputMode="numeric"
          value={formatMoneyDisplay(form.bair)}
          onChange={(e) => handleMoneyChange("bair", e.target.value)}
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-800"
          placeholder="180,000,000"
        />
        <p className={hintClass}>
          Байр тус бүр: {formatMoneyDisplay(HOME_MIN)}-{formatMoneyDisplay(HOME_MAX)}₮
        </p>
        {errors.bair && <p className={errorClass}>{errors.bair}</p>}

        {form.extraBairs.map((item, index) => (
          <div key={`home-${index}`} className="mt-3 flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={formatMoneyDisplay(item)}
              onChange={(e) => handleExtraMoneyChange("extraBairs", index, e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-navy-800"
              placeholder={`Нэмэлт байр ${index + 2}`}
            />
            <button
              type="button"
              onClick={() => removeExtra("extraBairs", index)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
              aria-label="Нэмэлт байрыг устгах"
              title="Устгах"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M8 6V4h8v2" />
                <path d="M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => addExtra("extraBairs")}
          className="mt-3 text-sm font-medium text-navy-900 hover:underline"
        >
          [+] Дахин байр нэмэх
        </button>
      </div>

      {submitInfo && <p className="text-sm text-amber-700">{submitInfo}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-navy-900 px-4 py-2.5 font-medium text-white hover:bg-navy-800 disabled:opacity-60"
      >
        {loading ? "Илгээж байна..." : "Тооцоолох"}
      </button>
    </form>
  );
}
