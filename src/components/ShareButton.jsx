import { useMemo, useState } from "react";

export default function ShareButton({ score, ageBracket }) {
  const [nickname, setNickname] = useState("");
  const [copied, setCopied] = useState(false);

  // URL үүсгэх логик: score-ийг заавал оруулж, age болон nickname байгаа үед query-д нэмнэ.
  const shareUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://yourapp.com";
    const params = new URLSearchParams();
    params.set("score", String(Math.round(score || 0)));
    if (ageBracket) params.set("age", ageBracket);
    if (nickname.trim()) params.set("nick", nickname.trim());
    return `${origin}/share?${params.toString()}`;
  }, [score, ageBracket, nickname]);

  // Nickname байхгүй бол мессежэнд автоматаар алгасна.
  const shareMessage = useMemo(() => {
    const nickPrefix = nickname.trim() ? `${nickname.trim()}, ` : "";
    return `${nickPrefix}та Монголчуудын ${Math.round(score || 0)}% –иас баян байна 🇲🇳`;
  }, [nickname, score]);

  const handleCopy = async () => {
    // Clipboard API ашиглан share URL-г copy хийнэ.
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareMessage);
  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
  const telegramShareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareMessage} ${shareUrl}`)}`;
  const isLocalhost = typeof window !== "undefined" && window.location.hostname.includes("localhost");

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-navy-900">Хуваалцах</h3>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-slate-600">Нэр хоч (заавал биш)</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Жишээ: Бат"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-800"
        />
      </div>

      <div className="mt-3">
        <label className="mb-1 block text-xs text-slate-600">Share link</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-700"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg bg-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-navy-800"
          >
            {copied ? "Хуулсан" : "Copy"}
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={facebookShareUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy-900 hover:bg-slate-50"
        >
          Facebook
        </a>
        <a
          href={telegramShareUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy-900 hover:bg-slate-50"
        >
          Telegram
        </a>
        <a
          href={twitterShareUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy-900 hover:bg-slate-50"
        >
          Twitter/X
        </a>
        <a
          href={whatsappShareUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-navy-900 hover:bg-slate-50"
        >
          WhatsApp
        </a>
      </div>

      {isLocalhost && (
        <p className="mt-3 text-xs text-amber-700">
          Анхаар: localhost холбоосыг Facebook/Twitter гаднаас нээж чаддаггүй. Deploy хийсэн домэйн дээр
          share хамгийн зөв ажиллана.
        </p>
      )}
    </section>
  );
}
