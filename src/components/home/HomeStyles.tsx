/**
 * Estilos da home: identidade liquid glass, com âmbito restrito a .nm-home.
 * Não altera o design system global nem o tema da aplicação.
 * As fotografias mantêm as cores naturais: nenhum filtro ou escurecimento sobre elas.
 */
const css = `
.nm-home{--shadow-soft:0 12px 36px -24px rgb(0 0 0/.28);--bg:#fffaf6;--text:#171717;--muted:#626262;--line:rgba(120,100,85,.2);--card:rgba(255,255,255,.78);--soft:rgba(255,239,226,.72);--accent:#f36b21;--accent-d:#d95712;background:var(--bg);color:var(--text);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color-scheme:light}
.dark .nm-home{--bg:#101820;--text:#f5f1ed;--muted:#c0c8cf;--line:rgba(220,230,240,.17);--card:rgba(28,39,49,.82);--soft:rgba(89,55,34,.34);--accent:#ff914d;--accent-d:#f47731;color-scheme:dark}
@media(prefers-color-scheme:dark){:root:not(.light) .nm-home{--bg:#101820;--text:#f5f1ed;--muted:#c0c8cf;--line:rgba(220,230,240,.17);--card:rgba(28,39,49,.82);--soft:rgba(89,55,34,.34);--accent:#ff914d;--accent-d:#f47731;color-scheme:dark}}
.nm-home *{box-sizing:border-box}
.nm-home a{color:inherit}
.nm-home h1,.nm-home h2,.nm-home h3{margin:0;line-height:1.2;text-wrap:balance}
.nm-home h1{font-size:clamp(2.15rem,4.4vw,3.6rem);letter-spacing:-.045em;font-weight:800;max-width:16ch}
.nm-home h2{font-size:clamp(1.45rem,3vw,2rem);letter-spacing:-.025em;font-weight:750}
.nm-home h3{font-size:1.12rem;font-weight:700}
.nm-home p{margin:0}
.nm-wrap{max-width:1160px;margin:0 auto;padding:clamp(28px,5vw,64px) 18px 64px}
@media(min-width:640px){.nm-wrap{padding-inline:28px}}
.nm-hero{display:flex;flex-direction:column;align-items:center;gap:clamp(26px,4vw,44px);text-align:center;padding:clamp(28px,5vw,56px) 0 clamp(40px,6vw,72px)}
.nm-hero-art{width:100%;max-width:860px;min-width:0}
.nm-hero-content{display:flex;flex-direction:column;align-items:center;width:100%;max-width:860px;min-width:0}
.nm-hero-img{display:block;width:100%;height:auto}
.nm-eyebrow{display:inline-block;font-size:.78rem;font-weight:750;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);margin-bottom:18px}
.nm-hero h1{margin:0 auto;max-width:18ch}
.nm-lead{color:var(--muted);font-size:clamp(1rem,1.6vw,1.15rem);max-width:600px;margin:18px auto 0}
.nm-search-section{width:100%;max-width:720px;margin-top:26px}
.nm-search{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.8fr);gap:8px;align-items:center;padding:8px;border:1px solid var(--line);border-radius:22px;background:var(--card);box-shadow:var(--shadow-soft);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.nm-search input,.nm-search select{width:100%;min-width:0;min-height:52px;border:0;border-radius:13px;background:transparent;outline:none;padding:12px 14px;color:var(--text);font:inherit}
.nm-search input::placeholder{color:var(--muted);opacity:1}
.nm-search select{border-left:1px solid var(--line);border-radius:0}
.nm-search input:focus-visible,.nm-search select:focus-visible{outline:2px solid var(--accent);outline-offset:1px}
.nm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;border:1px solid transparent;border-radius:13px;padding:12px 22px;font:inherit;font-weight:700;cursor:pointer;text-decoration:none;transition:background .15s,border-color .15s,transform .15s;white-space:nowrap}
.nm-home .nm-btn-p{background:var(--accent);color:#fff}
.nm-home .nm-btn-p:hover{background:var(--accent-d);color:#fff;transform:translateY(-1px)}
.nm-home .nm-btn-g{background:var(--card);color:var(--text);border-color:var(--line)}
.nm-home .nm-btn-g:hover{border-color:var(--accent);background:var(--soft)}
.nm-hero-secondary{display:inline-flex;align-items:center;gap:8px;min-height:44px;margin-top:20px;color:var(--text)!important;font-weight:650;text-decoration:none}
.nm-hero-secondary span{color:var(--accent);font-size:1.2rem}
.nm-hero-secondary:hover{text-decoration:underline;text-underline-offset:4px}
.nm-sec{padding:clamp(34px,5vw,58px) 0}
.nm-sec-head{margin-bottom:22px}
.nm-sec-head p{color:var(--muted);margin-top:8px}
.nm-card-img{display:block;width:100%;height:auto}
.nm-card-body{display:flex;flex-direction:column;align-items:flex-start;gap:10px;flex:1;padding:18px 20px 20px;min-width:0}
.nm-path-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.nm-path-card{display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:var(--shadow-soft);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);text-decoration:none;transition:border-color .2s,transform .2s,background .2s}
.nm-path-card:hover,.nm-path-card:focus-visible{border-color:var(--accent);transform:translateY(-2px);outline:none}
.nm-path-card p{color:var(--muted);font-size:.93rem}
.nm-path-link{margin-top:auto;padding-top:4px;color:var(--accent);font-size:.9rem;font-weight:700}
.nm-steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.nm-step{display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:var(--shadow-soft)}
.nm-step-number{color:var(--accent);font-size:.8rem;font-weight:800;letter-spacing:.08em}
.nm-step p{color:var(--muted);font-size:.94rem}
.nm-trust{display:flex;align-items:center;justify-content:center;gap:12px;padding:20px;border-block:1px solid var(--line);color:var(--muted);text-align:center}
.nm-trust svg{flex:none;color:var(--accent)}
.nm-cta-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.nm-cta{display:flex;flex-direction:column;min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:var(--shadow-soft);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
.nm-cta p{color:var(--muted)}
.nm-cta .nm-btn{margin-top:6px}
.nm-home .sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.nm-search input{grid-column:1/-1}
.nm-search .nm-btn{width:100%}
.nm-home a:focus-visible,.nm-home button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
@media(max-width:900px){.nm-path-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:640px){.nm-wrap{padding-inline:16px}.nm-hero{padding:24px 0 40px}.nm-hero h1{font-size:clamp(2rem,9vw,2.6rem)}.nm-search{grid-template-columns:minmax(0,1fr);padding:7px;border-radius:18px}.nm-search select{border-left:0;border-top:1px solid var(--line)}.nm-path-grid{grid-template-columns:minmax(0,1fr);gap:12px}.nm-steps{grid-template-columns:minmax(0,1fr);gap:12px}.nm-cta-grid{grid-template-columns:minmax(0,1fr);gap:12px}.nm-card-body{padding:16px 18px 18px}}
`;

export function HomeStyles() {
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
