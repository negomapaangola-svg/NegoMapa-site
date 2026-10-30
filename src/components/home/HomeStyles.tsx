/**
 * Estilo da página inicial, derivado de negomapa-prototipo.html (B.6.16).
 * Âmbito restrito a `.nm-home`: não altera o design system global (globals.css, Card, Button, Layout).
 * Cores, tipografia, raios, sombras e breakpoints seguem o protótipo.
 */
const css = `
.nm-home{--bg:#ffffff;--text:#111111;--muted:#6b6b6b;--line:#e8e8e8;--card:#ffffff;--soft:#fff4ec;--accent:#ff6a00;--accent-d:#e65c00;--ok:#15803d;--bad:#dc2626;--warn:#b45309;background:var(--bg);color:var(--text);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color-scheme:light}
@media (prefers-color-scheme:dark){.nm-home{--bg:#0c0c0c;--text:#f2f2f2;--muted:#9a9a9a;--line:#262626;--card:#151515;--soft:#2a1606;color-scheme:dark}}
.nm-home *{box-sizing:border-box}
.nm-home a{color:inherit}
.nm-home h1,.nm-home h2,.nm-home h3{margin:0 0 .4em;line-height:1.2;text-wrap:balance}
.nm-home h1{font-size:clamp(1.9rem,4.5vw,2.9rem);letter-spacing:-.02em;font-weight:800}
.nm-home h2{font-size:clamp(1.35rem,3vw,1.75rem);letter-spacing:-.01em;font-weight:800}
.nm-home h3{font-size:1.05rem;font-weight:700}
.nm-home p{margin:0 0 .8em}
.nm-wrap{max-width:1080px;margin:0 auto;padding:8px 16px 48px}
.nm-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:32px;align-items:center;padding:36px 0 24px}
.nm-eyebrow{display:inline-block;font-size:.78rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin-bottom:10px}
.nm-lead{color:var(--muted);font-size:1.05rem;max-width:32em}
.nm-art{position:relative;aspect-ratio:4/3;border-radius:16px;border:1px solid var(--line);background:var(--soft);display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:16px;align-content:center}
.nm-art-tile{display:flex;flex-direction:column;justify-content:center;gap:4px;padding:14px;border-radius:12px;background:var(--card);border:1px solid var(--line);font-weight:700}
.nm-art-tile span{font-size:.8rem;font-weight:500;color:var(--muted)}
.nm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid transparent;border-radius:10px;padding:11px 18px;font:inherit;font-weight:600;cursor:pointer;text-decoration:none;transition:background .15s,border-color .15s;white-space:nowrap}
.nm-btn-p{background:var(--accent);color:#fff}
.nm-btn-p:hover{background:var(--accent-d)}
.nm-btn-g{background:var(--card);border-color:var(--line);color:var(--text)}
.nm-btn-g:hover{border-color:var(--accent)}
.nm-btn-sm{padding:8px 14px;font-size:.88rem}
.nm-search{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:20px;padding:6px;border:1px solid var(--line);border-radius:12px;background:var(--card);max-width:620px}
.nm-search:focus-within{border-color:var(--accent)}
.nm-search input,.nm-search select{border:0;background:none;outline:none;padding:10px 8px;color:var(--text);font:inherit;min-width:0}
.nm-search input{flex:1 1 200px}
.nm-search select{flex:0 1 180px;border-left:1px solid var(--line)}
.nm-search .nm-btn{padding:10px 18px}
.nm-caminhos{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;max-width:620px}
.nm-sec{padding:24px 0}
.nm-sec-head{margin-bottom:14px}
.nm-sec-head p{color:var(--muted);margin:0}
.nm-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.nm-card{display:flex;flex-direction:column;gap:10px;padding:18px;border:1px solid var(--line);border-radius:14px;background:var(--card);color:inherit;text-decoration:none;transition:border-color .15s;height:100%}
a.nm-card:hover,a.nm-card:focus-visible{border-color:var(--accent)}
.nm-card p{margin:0;color:var(--muted);font-size:.92rem}
.nm-card .nm-go{margin-top:auto;color:var(--accent);font-weight:600;font-size:.9rem}
.nm-card h3{margin:0}
.nm-avatar{width:56px;height:56px;border-radius:50%;display:grid;place-items:center;background:var(--soft);color:var(--accent);font-weight:800;font-size:1.25rem;flex:none;overflow:hidden}
.nm-avatar img{width:100%;height:100%;object-fit:cover;display:block}
.nm-head{display:flex;gap:12px;align-items:center}
.nm-chips{display:flex;flex-wrap:wrap;gap:8px}
.nm-chip{display:inline-block;padding:8px 14px;border:1px solid var(--line);border-radius:999px;background:var(--card);color:var(--text);text-decoration:none;font-size:.92rem}
.nm-chip:hover{border-color:var(--accent)}
.nm-price{font-weight:700;color:var(--accent)}
.nm-pill{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border-radius:999px;font-size:.78rem;font-weight:600;border:1px solid var(--line);background:var(--card);color:var(--muted)}
.nm-pill.warn{color:var(--warn);border-color:#fde68a}
.nm-empty{padding:32px;text-align:center;border:1px dashed var(--line);border-radius:14px;color:var(--muted);background:var(--card)}
.nm-empty strong{display:block;color:var(--text);margin-bottom:6px;font-size:1rem}
.nm-empty p{margin:0 0 14px}
.nm-empty .nm-acoes{justify-content:center}
.nm-notice{padding:12px 14px;border-radius:10px;background:var(--soft);border:1px solid #fed7aa;font-size:.9rem;margin:16px 0 0;color:var(--text)}
.nm-cta{padding:24px;border:1px solid var(--line);border-radius:14px;background:var(--soft);display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center}
.nm-cta h2{margin:0 0 6px}
.nm-cta p{margin:0;color:var(--muted)}
.nm-acoes{display:flex;gap:8px;flex-wrap:wrap}
.nm-foot-note{margin-top:14px;color:var(--muted);font-size:.9rem}

/* Responsivo (breakpoints do protótipo: 1000px, 820px, 560px) */
@media (max-width:1000px){.nm-grid3{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:820px){
  .nm-hero{grid-template-columns:minmax(0,2fr) minmax(0,3fr);gap:12px;padding-top:28px}
  .nm-hero h1{font-size:1.15rem}
  .nm-lead{font-size:.95rem}
  .nm-art{aspect-ratio:3/4;grid-template-columns:1fr;align-content:center}
  .nm-search{padding:4px}
  .nm-search input{flex-basis:100%}
  .nm-search select{flex:1 1 100%;border-left:0;border-top:1px solid var(--line)}
  .nm-search .nm-btn{width:100%}
  .nm-caminhos{grid-template-columns:minmax(0,1fr);gap:6px}
  .nm-caminhos .nm-btn{padding:9px 10px;font-size:.85rem}
}
@media (max-width:560px){
  .nm-wrap{padding-inline:12px}
  .nm-grid3{grid-template-columns:minmax(0,1fr)}
  .nm-cta{padding:20px}
  .nm-art-tile{padding:10px}
}
`;

export function HomeStyles() {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
