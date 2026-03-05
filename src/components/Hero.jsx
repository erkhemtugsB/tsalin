export default function Hero({ children }) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-navy-800 bg-gradient-to-br from-navy-900 via-[#0d2d52] to-[#173b70] p-5 text-white shadow-sm md:p-6">
      <div className="grid gap-4 md:grid-cols-[1.05fr_1fr]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-sky-300/10 blur-2xl" />
        <div className="relative">
          <p className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-slate-100">
            Монгол Улсын хөрөнгийн ойролцоо үнэлгээ
          </p>
          <h1 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">
            Хөрөнгөө 30 секундэд тооцоолоод, Монголчуудын дунд хаана яваагаа хараарай
          </h1>
          <p className="mt-3 max-w-xl text-sm text-slate-200">
            Зөвхөн цалин, машин, байрны үнээ оруулна. Таны мэдээллээр шууд хувь тооцоолж харуулна.
          </p>

          <div className="relative mt-4 w-full max-w-xl overflow-hidden rounded-xl border border-white/20 shadow-[0_20px_45px_rgba(0,0,0,0.35)]">
            <img
              src="https://www.youngpioneertours.com/wp-content/uploads/2020/04/About-Ulaanbaatar.jpeg"
              alt="Улаанбаатар хотын зураг"
              className="h-48 w-full object-cover saturate-110 md:h-56"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy-900/75 via-navy-900/20 to-transparent" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.22),transparent_40%)]" />
            <p className="absolute bottom-3 left-3 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-slate-100 backdrop-blur-sm">
              Улаанбаатар хот • Санхүүгийн төв
            </p>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-xs md:max-w-xl">
            <div className="rounded-lg bg-white/10 p-2">
              <p className="text-slate-200">1 алхам</p>
              <p className="mt-1 font-semibold text-white">Өгөгдөл оруулах</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2">
              <p className="text-slate-200">2 алхам</p>
              <p className="mt-1 font-semibold text-white">Хувь тооцоолох</p>
            </div>
            <div className="rounded-lg bg-white/10 p-2">
              <p className="text-slate-200">3 алхам</p>
              <p className="mt-1 font-semibold text-white">Үр дүн хуваалцах</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/20 bg-white/10 p-2 backdrop-blur-[2px] md:p-3">
          <div className="rounded-xl bg-slate-50/85 p-1 text-navy-900">{children}</div>
        </div>
      </div>
    </section>
  );
}
