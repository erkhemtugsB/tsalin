import { useEffect, useMemo, useState } from "react";
import ShareButton from "./ShareButton";

function formatMnt(num) {
  return new Intl.NumberFormat("mn-MN", { maximumFractionDigits: 0 }).format(num);
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function MongoliaPercentMap({ percent }) {
  const safePercent = Math.max(0, Math.min(100, percent));
  const mapImageUrl = "https://commons.wikimedia.org/wiki/Special:FilePath/Flag-map%20of%20Mongolia.svg";
  // Loading bar шиг ялгарах цэвэр accent өнгө (cyan-blue)
  const loadingFillFilter =
    "brightness(0) saturate(100%) invert(65%) sepia(66%) saturate(1808%) hue-rotate(165deg) brightness(101%) contrast(98%)";
  // Source map файл доторх хоосон зайг нөхөж fill-г бодит map-с эхлүүлнэ.
  // Хэрэв дахин tweak хийх бол зөвхөн энэ 2 утгыг өөрчилнө.
  const mapVisibleStart = 5; // %
  const mapVisibleEnd = 82; // %
  const visibleWidth = mapVisibleEnd - mapVisibleStart;
  const dynamicRightInset = Math.max(
    100 - mapVisibleEnd,
    100 - (mapVisibleStart + (safePercent / 100) * visibleWidth)
  );

  return (
    <div className="rounded-xl bg-white/10 p-2 sm:p-3">
      <div className="relative mt-2 w-full overflow-hidden rounded-lg border border-white/20 bg-white/5 p-1 sm:p-1.5 md:p-2">
        <div className="relative h-28 w-full sm:h-36 md:h-52">
          <img
            src={mapImageUrl}
            alt="Монгол газрын зураг"
            className="absolute inset-0 h-full w-full select-none object-contain object-center opacity-30 grayscale brightness-0 invert"
            draggable="false"
          />
          <img
            src={mapImageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full select-none object-contain object-center transition-all duration-700"
            style={{
              clipPath: `inset(0 ${dynamicRightInset}% 0 ${mapVisibleStart}%)`,
              filter: loadingFillFilter
            }}
            draggable="false"
          />
        </div>
      </div>
    </div>
  );
}

function PieBreakdown({ items, total }) {
  const colors = ["#22d3ee", "#60a5fa", "#34d399", "#a78bfa"];
  let currentAngle = 0;
  const radius = 52;
  const cx = 64;
  const cy = 64;

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-navy-900">Хөрөнгийн бүтэц (дугуй диаграм)</p>
      <div className="mt-3 grid items-center gap-4 md:grid-cols-[auto_1fr]">
        <svg viewBox="0 0 128 128" className="h-36 w-36">
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#e2e8f0" strokeWidth="20" />
          {items.map((item, idx) => {
            const portion = total > 0 ? item.value / total : 0;
            const sweep = portion * 360;
            const start = currentAngle;
            const end = currentAngle + sweep;
            currentAngle = end;
            if (sweep <= 0) return null;

            return (
              <path
                key={item.key}
                d={describeArc(cx, cy, radius, start, end)}
                fill="none"
                stroke={colors[idx % colors.length]}
                strokeWidth="20"
                strokeLinecap="butt"
              />
            );
          })}
          <circle cx={cx} cy={cy} r="28" fill="white" />
          <text x="64" y="60" textAnchor="middle" className="fill-slate-500 text-[8px]">
            Нийт
          </text>
          <text x="64" y="72" textAnchor="middle" className="fill-navy-900 text-[9px] font-bold">
            {formatMnt(total)}₮
          </text>
        </svg>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={item.key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                <span className="text-sm text-navy-900">{item.label}</span>
              </div>
              <span className="text-xs text-slate-600">
                {item.percent}% • {formatMnt(item.value)}₮
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComparisonSection({ percentile }) {
  const richerThan = Math.round(percentile);
  const iconCount = 10;
  const filledIcons = Math.round((richerThan / 100) * iconCount);

  return (
    <section className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-navy-900">Статистик харьцуулалт</h3>
      <div className="mt-3">
        <p className="text-xs text-slate-500">10 нэгжийн загварчилсан харьцуулалт ({richerThan}%)</p>
        <div className="mt-2 flex flex-wrap items-center gap-0.5">
          {Array.from({ length: iconCount }).map((_, i) => (
            <svg
              key={i}
              viewBox="0 0 24 24"
              className={`h-10 w-10 ${i < filledIcons ? "text-cyan-500" : "text-slate-400"}`}
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4Zm-3.2 7.1c0-.9.7-1.6 1.6-1.6h3.2c.9 0 1.6.7 1.6 1.6v3.2c0 .6-.4 1-1 1h-.8V21h-1.7v-3.8h-.8V21H9.2v-6.9h-.8c-.6 0-1-.4-1-1V9.9c0-.9.7-1.6 1.6-1.6Z" />
            </svg>
          ))}
        </div>
      </div>
    </section>
  );
}

function getAgeBracket(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a <= 0) return "";
  if (a < 25) return "18-24";
  if (a < 35) return "25-34";
  if (a < 45) return "35-44";
  if (a < 55) return "45-54";
  return "55+";
}

export default function Result({
  compact = false,
  netWorth,
  percentile,
  netWorthPercentile,
  salaryPercentile,
  payload,
  infoMessage,
  onReset
}) {
  const [animatedPercent, setAnimatedPercent] = useState(0);
  const [selectedKey, setSelectedKey] = useState("savings");

  useEffect(() => {
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      if (current >= percentile) {
        setAnimatedPercent(percentile);
        clearInterval(timer);
        return;
      }
      setAnimatedPercent(current);
    }, 12);

    return () => clearInterval(timer);
  }, [percentile]);

  const breakdown = useMemo(() => {
    const salary = Number(payload?.salary || 0);
    const savings = Number(payload?.savings || 0);
    const mashin = Number(payload?.mashin || 0);
    const bair = Number(payload?.bair || 0);
    const carCount = payload?.assets?.cars?.length || (mashin > 0 ? 1 : 0);
    const homeCount = payload?.assets?.homes?.length || (bair > 0 ? 1 : 0);
    const total = Math.max(netWorth, 1);

    return [
      {
        key: "savings",
        label: "Хуримтлал",
        value: savings,
        percent: Math.round((savings / total) * 100),
        meta: "Мөнгөн хадгаламж, бэлэн хөрөнгө"
      },
      {
        key: "salary",
        label: "Сарын цалин",
        value: salary,
        percent: Math.round((salary / total) * 100),
        meta: "Орлогын үндсэн үзүүлэлт"
      },
      {
        key: "mashin",
        label: `Машин (${carCount})`,
        value: mashin,
        percent: Math.round((mashin / total) * 100),
        meta: "Нийт автомашины үнэлгээ"
      },
      {
        key: "bair",
        label: `Байр (${homeCount})`,
        value: bair,
        percent: Math.round((bair / total) * 100),
        meta: "Нийт үл хөдлөх хөрөнгө"
      }
    ];
  }, [payload, netWorth]);

  const selected = breakdown.find((item) => item.key === selectedKey) || breakdown[0];
  const pieItems = breakdown.filter((item) => item.key !== "salary");
  const ageBracket = getAgeBracket(payload?.nas);

  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-sm ${
        compact ? "p-4 md:p-5" : "mt-8 p-6"
      }`}
    >
      <h2 className="text-xl font-semibold text-navy-900">Таны санхүүгийн дүн шинжилгээ</h2>
      <p className="mt-2 text-sm text-slate-600">
        Доорх тайлан нь таны оруулсан мэдээлэлд тулгуурласан статистик үнэлгээ болно.
      </p>

      {infoMessage && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{infoMessage}</p>
      )}

      <div className="mt-5 rounded-xl bg-navy-900 p-5 text-white">
        <p className="text-sm text-slate-200">Статистик байрлал (хөрөнгийн дүнгээр)</p>
        <p className="mt-1 text-3xl font-bold md:text-4xl">
          Та Монголын статистик дундажийн {animatedPercent}% –иас дээгүүр түвшинд байна
        </p>
        <div className="mt-4">
          <MongoliaPercentMap percent={animatedPercent} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-3 py-1">Хөрөнгийн хувь: {netWorthPercentile}%</span>
          <span className="rounded-full bg-white/15 px-3 py-1">Цалингийн хувь: {salaryPercentile}%</span>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-500">Таны тооцоолсон нийт хөрөнгө</p>
        <p className="mt-1 text-2xl font-bold text-navy-900">{formatMnt(netWorth)}₮</p>
      </div>

      <PieBreakdown items={pieItems} total={netWorth} />
      <ComparisonSection percentile={percentile} />

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {breakdown.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSelectedKey(item.key)}
            className={`rounded-xl border p-4 text-left transition ${
              selectedKey === item.key
                ? "border-navy-800 bg-navy-900 text-white"
                : "border-slate-200 bg-white text-navy-900 hover:border-navy-700"
            }`}
          >
            <p className="text-sm">{item.label}</p>
            <p className="mt-1 text-lg font-semibold">{formatMnt(item.value)}₮</p>
            <p className={`mt-1 text-xs ${selectedKey === item.key ? "text-slate-200" : "text-slate-500"}`}>
              Нийт бүтцийн {item.percent}%
            </p>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-600">Сонгосон санхүүгийн үзүүлэлт</p>
        <p className="mt-1 text-base font-semibold text-navy-900">
          {selected.label}: {formatMnt(selected.value)}₮ ({selected.percent}%)
        </p>
        <p className="mt-1 text-sm text-slate-600">{selected.meta}</p>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <ShareButton score={percentile} ageBracket={ageBracket} />
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-navy-900 px-4 py-2 text-sm font-medium text-navy-900 hover:bg-slate-100"
        >
          Дахин тооцоолох
        </button>
      </div>
    </section>
  );
}
