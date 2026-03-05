import { Link, useSearchParams } from "react-router-dom";

export default function Share() {
  const [params] = useSearchParams();
  const score = params.get("score") || "0";
  const age = params.get("age");
  const nick = params.get("nick");

  const prefix = nick ? `${nick}, ` : "";
  const message = `${prefix}таны санхүүгийн үзүүлэлт Монголын статистик дундажийн ${score}% –иас дээгүүр байна 🇲🇳`;

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h1 className="text-2xl font-bold text-navy-900">Хуваалцсан санхүүгийн тайлан</h1>
      <p className="mt-4 rounded-xl bg-white p-4 text-lg font-medium text-navy-900">{message}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-white p-3">
          <p className="text-xs text-slate-500">Статистик хувь (score)</p>
          <p className="text-base font-semibold text-navy-900">{score}%</p>
        </div>
        {age && (
          <div className="rounded-lg bg-white p-3">
            <p className="text-xs text-slate-500">Насны бүлэг</p>
            <p className="text-base font-semibold text-navy-900">{age}</p>
          </div>
        )}
      </div>

      <Link
        to="/"
        className="mt-5 inline-block rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
      >
        Тооцоолуур руу буцах
      </Link>
    </section>
  );
}
