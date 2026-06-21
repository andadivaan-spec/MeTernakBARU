// ─── MeTernak Frontend ───────────────────────────────────────────────────────
// Frontend: React SPA
// Chatbot: Claude API (claude-sonnet-4-6) via Anthropic endpoint
// Backend: pair with meternak-backend/server.js
// Deploy frontend: Vercel (drag-and-drop or GitHub connect)

import { useState, useRef, useEffect } from "react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  brown:  "#7B4F2E",
  mid:    "#A0522D",
  accent: "#C17F5A",
  bg:     "#F5EDD8",
  card:   "#EDE0C4",
  dark:   "#3D1F0A",
  text:   "#4A2C17",
  cream:  "#FAFAF5",
};

// ─── LOGO ICON ────────────────────────────────────────────────────────────────
function LogoIcon({ px = 52 }) {
  const w = px * 1.9;
  return (
    <svg width={w} height={px} viewBox="0 0 190 100" fill="none">
      {/* M strokes */}
      <path d="M12 88 L12 28 L52 64 L92 28 L92 88"
        stroke={C.brown} strokeWidth="9" fill="none"
        strokeLinejoin="round" strokeLinecap="round"/>
      {/* Cow at left peak */}
      <ellipse cx="12" cy="20" rx="11" ry="8" fill={C.brown}/>
      <ellipse cx="4"  cy="13" rx="5" ry="3.5" fill={C.mid} transform="rotate(-22 4 13)"/>
      <ellipse cx="20" cy="13" rx="5" ry="3.5" fill={C.mid} transform="rotate(22 20 13)"/>
      <ellipse cx="12" cy="25" rx="6" ry="3.5"  fill={C.accent}/>
      {/* Farmer at right peak */}
      <rect  x="79" y="12" width="26" height="5" rx="2.5" fill={C.brown}/>
      <rect  x="84" y="5"  width="16" height="9" rx="3.5" fill={C.brown}/>
      <circle cx="92" cy="24" r="8" fill={C.mid}/>
      {/* Text */}
      <text x="110" y="58"  fontFamily="Georgia,serif" fontWeight="bold" fontSize="19">
        <tspan fill={C.accent}>Me</tspan><tspan fill={C.brown}>Ternak</tspan>
      </text>
      <text x="110" y="74"  fontFamily="system-ui,sans-serif" fontSize="8.5" fill={C.accent} letterSpacing="0.4">
        Saya Asisten Terpercaya Ternak Anda
      </text>
    </svg>
  );
}

// ─── SaCo COW FACE ────────────────────────────────────────────────────────────
function SaCoFace({ pet, count }) {
  return (
    <svg viewBox="0 0 100 95" width="72" height="68" style={{ display: "block" }}>
      {/* Ears */}
      <ellipse cx="20" cy="30" rx="14" ry="10" fill={C.mid}   transform="rotate(-15 20 30)"/>
      <ellipse cx="20" cy="30" rx="8"  ry="6"  fill="#F5C6B0" transform="rotate(-15 20 30)"/>
      <ellipse cx="80" cy="30" rx="14" ry="10" fill={C.mid}   transform="rotate(15 80 30)"/>
      <ellipse cx="80" cy="30" rx="8"  ry="6"  fill="#F5C6B0" transform="rotate(15 80 30)"/>
      {/* Head */}
      <ellipse cx="50" cy="52" rx="36" ry="33" fill={C.bg} stroke={C.brown} strokeWidth="2.5"/>
      {/* Spot */}
      <ellipse cx="36" cy="40" rx="10" ry="8" fill={C.accent} opacity="0.28"/>
      {/* Eyes: squint when petting, open otherwise */}
      {pet ? (
        <>
          <path d="M27 47 Q35 41 43 47" stroke={C.dark} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M57 47 Q65 41 73 47" stroke={C.dark} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <path d="M39 76 Q50 84 61 76" stroke={C.brown} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <text x={count % 2 === 0 ? "68" : "9"} y="22" fontSize="14" fill="#E05C7A" opacity="0.9">♥</text>
        </>
      ) : (
        <>
          <ellipse cx="35" cy="47" rx="7" ry="7.5" fill={C.dark}/>
          <circle  cx="38" cy="44" r="2.5" fill="white"/>
          <ellipse cx="65" cy="47" rx="7" ry="7.5" fill={C.dark}/>
          <circle  cx="68" cy="44" r="2.5" fill="white"/>
        </>
      )}
      {/* Snout */}
      <ellipse cx="50" cy="70" rx="17" ry="12" fill="#E8B89A"/>
      <ellipse cx="43" cy="68" rx="4.5" ry="3" fill={C.brown} opacity="0.4"/>
      <ellipse cx="57" cy="68" rx="4.5" ry="3" fill={C.brown} opacity="0.4"/>
    </svg>
  );
}

// ─── SACO CHAT POPUP ──────────────────────────────────────────────────────────
function ChatPopup({ onClose }) {
  const [msgs, setMsgs] = useState([{
    role: "assistant",
    content: "Halo! Saya SaCo 🐄 Asisten kesuburan sapi betina Anda. Ada yang ingin ditanyakan?"
  }]);
  const [inp, setInp]   = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  async function send() {
    if (!inp.trim() || busy) return;
    const next = [...msgs, { role: "user", content: inp }];
    setMsgs(next); setInp(""); setBusy(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1000,
          system: "Kamu adalah SaCo, asisten virtual MeTernak. Kamu ahli tentang masa kesuburan dan reproduksi sapi betina. Jawab dalam Bahasa Indonesia, singkat dan informatif. Topik utama: siklus estrus sapi (rata-rata 21 hari), tanda-tanda birahi, waktu inseminasi buatan (IB), dan pemantauan kesehatan reproduksi sapi betina. Rujuk ilmu peternakan yang valid.",
          messages: next.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const d = await res.json();
      const reply = d.content?.[0]?.text || "Maaf, terjadi kesalahan.";
      setMsgs(p => [...p, { role: "assistant", content: reply }]);
    } catch {
      setMsgs(p => [...p, { role: "assistant", content: "Koneksi gagal. Coba lagi ya." }]);
    }
    setBusy(false);
  }

  return (
    <div style={{
      position: "absolute", bottom: "calc(100% + 10px)", right: 0,
      width: 340, height: 440,
      background: C.cream, borderRadius: 16,
      border: `1.5px solid ${C.accent}`,
      display: "flex", flexDirection: "column",
      boxShadow: "0 8px 32px rgba(61,31,10,.22)",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{ background: C.brown, color: C.cream, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>🐄</span>
          <div>
            <div style={{ fontWeight: "bold", fontFamily: "Georgia,serif", fontSize: 15 }}>SaCo</div>
            <div style={{ fontSize: 10, opacity: 0.75, fontFamily: "system-ui" }}>Asisten Kesuburan Sapi</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: C.cream, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: 4 }}>×</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "85%", padding: "9px 13px",
              borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
              background: m.role === "user" ? C.brown : C.card,
              color: m.role === "user" ? C.cream : C.text,
              fontSize: 13.5, lineHeight: 1.55, fontFamily: "system-ui,sans-serif"
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && <div style={{ color: C.accent, fontSize: 12, fontStyle: "italic", fontFamily: "system-ui" }}>SaCo sedang mengetik...</div>}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${C.card}`, display: "flex", gap: 8, flexShrink: 0 }}>
        <input
          value={inp}
          onChange={e => setInp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Tanya tentang sapi Anda..."
          style={{ flex: 1, padding: "9px 14px", borderRadius: 24, border: `1.5px solid ${C.accent}`, background: C.bg, fontSize: 13, outline: "none", fontFamily: "system-ui", color: C.text }}
        />
        <button
          onClick={send}
          disabled={busy || !inp.trim()}
          style={{ background: inp.trim() && !busy ? C.brown : C.accent, color: C.cream, border: "none", borderRadius: "50%", width: 38, height: 38, fontSize: 17, cursor: inp.trim() && !busy ? "pointer" : "default", flexShrink: 0 }}>
          →
        </button>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [pet, setPet]       = useState(false);
  const [count, setCount]   = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const timer = useRef(null);

  function handlePet(e) {
    e.stopPropagation();
    setPet(true);
    setCount(c => c + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setPet(false), 1100);
  }

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div style={{ fontFamily: "Georgia,serif", background: C.bg, color: C.text }}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        @keyframes wobble  { 0%,100%{transform:rotate(0)scale(1)} 30%{transform:rotate(-10deg)scale(1.08)} 70%{transform:rotate(10deg)scale(1.08)} }
        @keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-30px)} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.accent}; border-radius: 4px; }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        background: C.brown, position: "sticky", top: 0, zIndex: 50,
        height: 64, padding: "0 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        boxShadow: "0 2px 14px rgba(0,0,0,.22)"
      }}>
        <LogoIcon px={46}/>
        <div style={{ display: "flex", gap: 4 }}>
          {[["home","Beranda"],["layanan","Layanan"],["cara-kerja","Cara Kerja"]].map(([id, lbl]) => (
            <button key={id} onClick={() => scrollTo(id)}
              style={{ background: "none", border: "none", color: C.bg, cursor: "pointer", fontSize: 14, fontFamily: "Georgia,serif", padding: "8px 14px", borderRadius: 6, transition: "background .15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,.13)"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>{lbl}</button>
          ))}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section id="home" style={{ minHeight: "88vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "72px 24px 56px", textAlign: "center" }}>
        <LogoIcon px={96}/>
        <h1 style={{ marginTop: 22, fontSize: "clamp(2.4rem,6vw,4rem)", color: C.brown, lineHeight: 1.1 }}>
          <span style={{ color: C.mid }}>Me</span>Ternak
        </h1>
        <p style={{ color: C.accent, fontSize: 11.5, letterSpacing: 2.8, margin: "9px 0 22px", fontFamily: "system-ui" }}>
          SAYA ASISTEN TERPERCAYA TERNAK ANDA
        </p>
        <p style={{ maxWidth: 500, fontSize: 16, lineHeight: 1.8, color: C.text, fontFamily: "system-ui", marginBottom: 38 }}>
          Monitor masa kesuburan sapi betina hanya dalam satu genggaman — tracking akurat dan prediksi waktu Inseminasi Buatan yang tepat.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => scrollTo("layanan")}
            style={{ background: C.brown, color: C.cream, border: "none", padding: "13px 32px", borderRadius: 10, fontSize: 15, cursor: "pointer", fontFamily: "Georgia,serif", boxShadow: "0 4px 16px rgba(123,79,46,.3)", transition: "transform .15s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
            Jelajahi Fitur →
          </button>
          <button
            onClick={() => setChatOpen(true)}
            style={{ background: "transparent", color: C.brown, border: `2px solid ${C.brown}`, padding: "13px 32px", borderRadius: 10, fontSize: 15, cursor: "pointer", fontFamily: "Georgia,serif", transition: "all .15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = C.brown; e.currentTarget.style.color = C.cream; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = C.brown; }}>
            Tanya SaCo 🐄
          </button>
        </div>
        <div style={{ display: "flex", gap: 44, marginTop: 52, flexWrap: "wrap", justifyContent: "center" }}>
          {[["21 Hari","Siklus Estrus"],["3 Parameter","Monitoring Real-time"],["LSTM + RF","Model Prediksi"]].map(([v, l]) => (
            <div key={v} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 26, fontWeight: "bold", color: C.brown }}>{v}</div>
              <div style={{ fontSize: 12, color: C.accent, fontFamily: "system-ui", marginTop: 3 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── LAYANAN ── */}
      <section id="layanan" style={{ background: C.card, padding: "72px 24px" }}>
        <p style={{ textAlign: "center", color: C.accent, fontSize: 11, letterSpacing: 2.8, fontFamily: "system-ui", marginBottom: 8 }}>FITUR UNGGULAN</p>
        <h2 style={{ textAlign: "center", fontSize: 32, color: C.brown, marginBottom: 44 }}>Layanan MeTernak</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 24, maxWidth: 960, margin: "0 auto" }}>
          {[
            { emoji: "💬", title: "ChatBot SaCo", desc: "Asisten interaktif siap menjawab pertanyaan seputar masa kesuburan dan siklus reproduksi sapi betina dengan referensi valid.", btn: "Mulai Chat", action: () => setChatOpen(true) },
            { emoji: "📊", title: "Tracking Masa Kesuburan", desc: "Monitor parameter kesuburan secara real-time: viskositas lendir (YOLO), gambar vulva, resistansi lendir, dan suhu tubuh sapi.", btn: null },
            { emoji: "🎯", title: "Prediksi Inseminasi Buatan", desc: "Notifikasi waktu tepat IB dalam satuan jam — berdasarkan analisis LSTM time series dan keputusan Random Forest.", btn: null },
          ].map((s, i) => (
            <div key={i}
              style={{ background: C.brown, color: C.cream, padding: "30px 26px", borderRadius: 16, boxShadow: "0 4px 20px rgba(61,31,10,.15)", transition: "transform .2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: 38, marginBottom: 14 }}>{s.emoji}</div>
              <h3 style={{ fontSize: 18, marginBottom: 10 }}>{s.title}</h3>
              <p style={{ fontSize: 14, opacity: 0.85, lineHeight: 1.65, fontFamily: "system-ui" }}>{s.desc}</p>
              {s.btn && (
                <button onClick={s.action} style={{ marginTop: 18, background: C.accent, color: C.dark, border: "none", padding: "9px 22px", borderRadius: 24, fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif" }}>{s.btn}</button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── CARA KERJA ── */}
      <section id="cara-kerja" style={{ padding: "72px 24px" }}>
        <p style={{ textAlign: "center", color: C.accent, fontSize: 11, letterSpacing: 2.8, fontFamily: "system-ui", marginBottom: 8 }}>PANDUAN PENGGUNAAN</p>
        <h2 style={{ textAlign: "center", fontSize: 32, color: C.brown, marginBottom: 44 }}>Cara Kerja</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 26, maxWidth: 960, margin: "0 auto" }}>
          {[
            { n: "01", title: "Data Peternak & Sapi",     pts: ["Isi nama, No. HP, dan alamat kandang", "Tambahkan nomor ID tiap sapi betina", "Data diintegrasikan ke backend — hemat storage"] },
            { n: "02", title: "Parameter Sapi Betina",    pts: ["Kamera deteksi viskositas lendir (YOLO)", "Capture gambar lendir & vulva", "Kumpulkan data resistansi dan suhu"] },
            { n: "03", title: "Tracking & Prediksi IB",   pts: ["LSTM memproses time series kesuburan", "Data tersimpan untuk tracking selanjutnya", "Random Forest tentukan jam tepat IB"] },
          ].map(c => (
            <div key={c.n} style={{ border: `2px solid ${C.accent}`, borderRadius: 14, padding: "26px 22px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: 10, right: 14, fontSize: 52, fontWeight: "bold", color: C.accent, opacity: 0.14, lineHeight: 1, userSelect: "none" }}>{c.n}</div>
              <div style={{ fontSize: 21, fontWeight: "bold", color: C.accent, marginBottom: 10 }}>{c.n}</div>
              <h3 style={{ fontSize: 16, color: C.brown, marginBottom: 14 }}>{c.title}</h3>
              <ul style={{ paddingLeft: 17, display: "flex", flexDirection: "column", gap: 7 }}>
                {c.pts.map((p, j) => <li key={j} style={{ fontSize: 13.5, lineHeight: 1.6, color: C.text, fontFamily: "system-ui" }}>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: C.dark, padding: "40px 24px", textAlign: "center" }}>
        <LogoIcon px={44}/>
        <p style={{ marginTop: 14, color: C.bg, fontSize: 15 }}>MeTernak</p>
        <p style={{ color: C.accent, fontSize: 13, fontFamily: "system-ui" }}>Saya Asisten Terpercaya Ternak Anda</p>
        <p style={{ color: C.accent, fontSize: 12, opacity: 0.55, marginTop: 16, fontFamily: "system-ui" }}>© 2025 MeTernak — Surabaya, Jawa Timur</p>
      </footer>

      {/* ── FLOATING SaCo ── */}
      {/* Tap head = PET ONLY (no chat). "Chat SaCo" button opens chat separately. */}
      <div style={{ position: "fixed", bottom: 22, right: 22, zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>

        {/* Chat popup — appears above SaCo */}
        {chatOpen && <ChatPopup onClose={() => setChatOpen(false)}/>}

        {/* SaCo head — pettable, no chat */}
        <div style={{ position: "relative" }}>
          <div
            key={count}
            onClick={handlePet}
            title="Elus SaCo! Ketuk untuk mengelus 🐄"
            style={{
              cursor: "pointer",
              animation: pet ? "wobble 0.5s ease-in-out" : "none",
              filter: "drop-shadow(0 4px 12px rgba(123,79,46,.4))",
              userSelect: "none"
            }}>
            <SaCoFace pet={pet} count={count}/>
          </div>
          {pet && (
            <div style={{ position: "absolute", top: -4, right: -2, fontSize: 18, animation: "floatUp 1s ease-out forwards", pointerEvents: "none" }}>♥</div>
          )}
        </div>

        {/* "Moo" label when petting */}
        {pet && (
          <div style={{ fontSize: 11, color: C.brown, fontFamily: "system-ui", background: C.bg, border: `1px solid ${C.accent}`, padding: "3px 12px", borderRadius: 20, animation: "fadeUp .2s ease-out", whiteSpace: "nowrap" }}>
            Moo~ 🐄
          </div>
        )}

        {/* Chat open button — SEPARATE from pet action */}
        <button
          onClick={() => setChatOpen(o => !o)}
          style={{ background: C.brown, color: C.cream, border: "none", borderRadius: 22, padding: "7px 16px", fontSize: 13, cursor: "pointer", fontFamily: "Georgia,serif", boxShadow: "0 2px 10px rgba(0,0,0,.2)", whiteSpace: "nowrap" }}>
          💬 Chat SaCo
        </button>
      </div>
    </div>
  );
}
