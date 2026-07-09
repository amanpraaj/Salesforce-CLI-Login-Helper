(() => {
  const ROOT_ID = "sf-cli-command-overlay-root";

  const SUN_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const MOON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "sf:openOverlay") {
      openOverlay(message.payload);
    }
  });

  function resolveTheme() {
    const saved = localStorage.getItem("sf-cli-theme");
    if (saved === "dark" || saved === "light") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.documentElement.classList.toggle("sf-cli-dark", isDark);
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("sf-cli-theme", theme);
  }

  function toggleTheme() {
    const isDark = !document.documentElement.classList.contains("sf-cli-dark");
    applyTheme(isDark ? "dark" : "light");
    return isDark;
  }

  applyTheme(resolveTheme());

  function quoteForShell(value, shell) {
    const str = String(value);
    switch (shell) {
      case "bash": return `'${str.replace(/'/g, "'\\''")}'`;
      case "cmd": return `"${str.replace(/"/g, '""')}"`;
      default: return `'${str.replace(/'/g, "''")}'`;
    }
  }

  function openOverlay(state) {
    const existing = document.getElementById(ROOT_ID);
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = `
      <div class="sf-cli-backdrop"></div>
      <div class="sf-cli-toast-region" aria-live="polite" aria-atomic="true"></div>
      <section class="sf-cli-modal" role="dialog" aria-modal="true" aria-label="Generate Salesforce CLI command">
        <div class="sf-cli-container">
          <button class="sf-cli-close" type="button" aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <header class="sf-cli-header">
            <div class="sf-cli-drag-handle" aria-hidden="true"><span></span></div>
            <div class="sf-cli-header-row">
              <p class="sf-cli-eyebrow">Salesforce CLI</p>
              <button class="sf-cli-theme-btn" type="button" aria-label="Toggle theme"></button>
            </div>
            <h2>Copy access token command</h2>
            <p class="sf-cli-summary"></p>
          </header>
          <div class="sf-cli-body">
            <section class="sf-cli-panel">
              <div class="sf-cli-panel-head">
                <h3>Basic setup</h3>
                <p>Choose your terminal and enter an alias.</p>
              </div>
              <div class="sf-cli-shell-group" role="radiogroup" aria-label="Terminal type">
                <label class="sf-cli-shell-btn"><input type="radio" name="sf-cli-shell" value="powershell" checked /><span>PowerShell</span></label>
                <label class="sf-cli-shell-btn"><input type="radio" name="sf-cli-shell" value="bash" /><span>Bash</span></label>
                <label class="sf-cli-shell-btn"><input type="radio" name="sf-cli-shell" value="cmd" /><span>CMD</span></label>
              </div>
              <div class="sf-cli-field">
                <label for="sf-cli-alias">Alias</label>
                <input id="sf-cli-alias" class="sf-cli-alias" type="text" placeholder="e.g. my-sandbox" />
              </div>
            </section>
            <section class="sf-cli-panel">
              <div class="sf-cli-panel-head">
                <h3>Options</h3>
                <p>Additional settings for the command.</p>
              </div>
              <label class="sf-cli-checkbox-row" for="sf-cli-include-redirect">
                <input id="sf-cli-include-redirect" class="sf-cli-checkbox" type="checkbox" />
                <span class="sf-cli-toggle-track"></span>
                <span>Include current page in frontdoor redirect</span>
              </label>
              <label class="sf-cli-checkbox-row" for="sf-cli-set-default-org">
                <input id="sf-cli-set-default-org" class="sf-cli-checkbox" type="checkbox" />
                <span class="sf-cli-toggle-track"></span>
                <span>Set this org as default (<code>--set-default</code>)</span>
              </label>
              <label class="sf-cli-checkbox-row" for="sf-cli-set-target-org">
                <input id="sf-cli-set-target-org" class="sf-cli-checkbox" type="checkbox" />
                <span class="sf-cli-toggle-track"></span>
                <span>Set this org as target (<code>--set-target-org</code>)</span>
              </label>
            </section>
            <section class="sf-cli-panel sf-cli-output-section">
              <div class="sf-cli-panel-head">
                <h3>Command</h3>
                <p>Copy and paste this into your terminal.</p>
              </div>
              <div class="sf-cli-codecard">
                <div class="sf-cli-codecard-header">
                  <button class="sf-cli-inline-action sf-cli-copy" type="button">Copy Command</button>
                  <button class="sf-cli-inline-action sf-cli-copy-frontdoor" type="button">Copy Frontdoor URL</button>
                </div>
                <pre id="sf-cli-output" class="sf-cli-codeblock"></pre>
              </div>
              <div class="sf-cli-status" aria-live="polite"></div>
            </section>
          </div>
          <footer class="sf-cli-footer">
            <button class="sf-cli-button sf-cli-button-neutral sf-cli-close-action" type="button">Close</button>
          </footer>
        </div>
      </section>
    `;

    const style = document.createElement("style");
    style.textContent = `
#${ROOT_ID} {
  --bg:#fff; --fg:#1a1a1a; --fg2:#5c5c5c; --fg3:#706e6b; --heading:#080707;
  --border:#e1e1e1; --border-s:#c9c9c9; --panel-bg:#fafafa; --panel-border:#e5e5e5;
  --accent:#0176d3; --accent-h:#016fc2; --accent-subtle:#eef8ff; --accent-text:#0176d3;
  --input-bg:#fff; --input-border:#c9c9c9; --code-bg:#f4f4f4; --code-fg:#1a1a1a;
  --backdrop:rgba(24,24,24,0.48); --shadow:0 4px 32px rgba(0,0,0,0.18);
  --r:0.625rem; --r-sm:0.375rem;
  --toast-bg:#a7f3eb; --toast-border:#7fe3d8; --toast-fg:#06444b; --toast-icon-bg:#0b6b73; --toast-icon-fg:#fff;
  --toast-err-bg:#fecaca; --toast-err-border:#fca5a5; --toast-err-fg:#991b1b; --toast-err-icon-bg:#b91c1c; --toast-err-icon-fg:#fff;
  --modal-w:min(40rem,calc(100vw - 1.25rem)); --modal-m:1.25rem auto;
  --sat:env(safe-area-inset-top,0px); --sab:env(safe-area-inset-bottom,0px);
  --sal:env(safe-area-inset-left,0px); --sar:env(safe-area-inset-right,0px);
  color-scheme:light;
}
.sf-cli-dark #${ROOT_ID} {
  --bg:#181818; --fg:#e8e8e8; --fg2:#b0adab; --fg3:#9e9e9e; --heading:#fff;
  --border:#3e3e3c; --border-s:#5c5c5c; --panel-bg:#1e1e1e; --panel-border:#3e3e3c;
  --accent:#1b96ff; --accent-h:#3ba3ff; --accent-subtle:#1a2a38; --accent-text:#78c3ff;
  --input-bg:#2b2826; --input-border:#5c5c5c; --code-bg:#252525; --code-fg:#e8e8e8;
  --backdrop:rgba(8,7,7,0.66); --shadow:0 8px 32px rgba(0,0,0,0.48);
  --toast-bg:#055b63; --toast-border:#0b727a; --toast-fg:#ddfffb; --toast-icon-bg:#d7fffb; --toast-icon-fg:#055b63;
  --toast-err-bg:#7f1d1d; --toast-err-border:#991b1b; --toast-err-fg:#fecaca; --toast-err-icon-bg:#fecaca; --toast-err-icon-fg:#7f1d1d;
  color-scheme:dark;
}
#${ROOT_ID} {
  position:fixed; inset:0; z-index:2147483647;
  font-family:"Salesforce Sans","Segoe UI",system-ui,-apple-system,sans-serif; color:var(--fg);
}
#${ROOT_ID} *,#${ROOT_ID} *::before,#${ROOT_ID} *::after { box-sizing:border-box; }
#${ROOT_ID} p,#${ROOT_ID} label,#${ROOT_ID} div,#${ROOT_ID} button,#${ROOT_ID} input,#${ROOT_ID} pre,#${ROOT_ID} span { font:inherit; }
#${ROOT_ID} code { font-family:Consolas,"Courier New",monospace; font-size:.7em; background:var(--code-bg); padding:.1em .3em; border-radius:.2rem; color:var(--accent-text); }
#${ROOT_ID} .sf-cli-backdrop { position:absolute; inset:0; background:var(--backdrop); animation:sf-fade-in .18s ease-out; }
#${ROOT_ID} .sf-cli-modal { position:relative; width:var(--modal-w); margin:var(--modal-m); animation:sf-slide-up .22s ease-out; }
#${ROOT_ID} .sf-cli-toast-region { position:fixed; top:1rem; left:50%; transform:translateX(-50%); z-index:2147483648; display:grid; gap:.75rem; width:min(36rem,calc(100vw - 2rem)); pointer-events:none; }
#${ROOT_ID} .sf-cli-toast { display:grid; grid-template-columns:auto 1fr auto; align-items:center; gap:.75rem; padding:.875rem 1rem; border-radius:var(--r); border:1px solid var(--toast-border); pointer-events:auto; animation:sf-toast-in .28s ease-out; background:var(--toast-bg); color:var(--toast-fg); }
#${ROOT_ID} .sf-cli-toast-error { background:var(--toast-err-bg); border-color:var(--toast-err-border); color:var(--toast-err-fg); }
#${ROOT_ID} .sf-cli-toast-iconwrap { width:1.75rem; height:1.75rem; border-radius:999px; display:grid; place-items:center; font-size:1rem; font-weight:700; flex:0 0 auto; background:var(--toast-icon-bg); color:var(--toast-icon-fg); }
#${ROOT_ID} .sf-cli-toast-error .sf-cli-toast-iconwrap { background:var(--toast-err-icon-bg); color:var(--toast-err-icon-fg); }
#${ROOT_ID} .sf-cli-toast-title { margin:0; font-size:.875rem; line-height:1.25rem; font-weight:700; }
#${ROOT_ID} .sf-cli-toast-message { margin:.125rem 0 0; font-size:.8125rem; line-height:1.125rem; }
#${ROOT_ID} .sf-cli-toast-close { border:0; background:transparent; color:inherit; cursor:pointer; padding:0; font-size:1.125rem; line-height:1rem; opacity:.75; transition:opacity .15s; }
#${ROOT_ID} .sf-cli-toast-close:hover { opacity:1; }
#${ROOT_ID} .sf-cli-container { position:relative; background:var(--bg); border-radius:var(--r); box-shadow:var(--shadow); overflow:visible; }
#${ROOT_ID} .sf-cli-header { padding:1rem 1.125rem .75rem; border-bottom:1px solid var(--border); }
#${ROOT_ID} .sf-cli-header-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:.5rem; }
#${ROOT_ID} .sf-cli-eyebrow { margin:0; font-size:.6875rem; line-height:1rem; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:var(--accent-text); }
#${ROOT_ID} .sf-cli-theme-btn { display:grid; place-items:center; width:1.75rem; height:1.75rem; border:0; border-radius:999px; background:transparent; color:var(--fg2); cursor:pointer; transition:background .15s,color .15s; }
#${ROOT_ID} .sf-cli-theme-btn:hover { background:var(--accent-subtle); color:var(--accent-text); }
#${ROOT_ID} .sf-cli-theme-btn:focus-visible,#${ROOT_ID} .sf-cli-close:focus-visible,#${ROOT_ID} .sf-cli-inline-action:focus-visible,#${ROOT_ID} .sf-cli-button:focus-visible,#${ROOT_ID} .sf-cli-shell-group input:focus-visible + span { outline:2px solid var(--accent); outline-offset:1px; }
#${ROOT_ID} h2 { margin:0; font-size:1rem; line-height:1.35; font-weight:700; color:var(--heading); }
#${ROOT_ID} .sf-cli-summary { margin:.25rem 0 0; font-size:.8125rem; line-height:1.25rem; color:var(--fg2); }
#${ROOT_ID} .sf-cli-body { padding:1rem 1.125rem .875rem; display:flex; flex-direction:column; gap:.75rem; }
#${ROOT_ID} .sf-cli-panel { border:1px solid var(--panel-border); border-radius:var(--r); background:var(--panel-bg); padding:.875rem 1rem; }
#${ROOT_ID} .sf-cli-panel-head { margin-bottom:.625rem; }
#${ROOT_ID} h3 { margin:0; font-size:.8125rem; line-height:1.25rem; font-weight:700; color:var(--heading); }
#${ROOT_ID} .sf-cli-panel-head p { margin:.15rem 0 0; font-size:.6875rem; line-height:.9375rem; color:var(--fg3); }
#${ROOT_ID} .sf-cli-shell-group { display:flex; margin-bottom:.75rem; border-radius:var(--r-sm); overflow:hidden; }
#${ROOT_ID} .sf-cli-shell-group input { position:absolute; opacity:0; width:0; height:0; }
#${ROOT_ID} .sf-cli-shell-btn { flex:1; margin:0; }
#${ROOT_ID} .sf-cli-shell-btn span { display:block; text-align:center; padding:.4rem .5rem; border:1px solid var(--border-s); cursor:pointer; font-size:.75rem; font-weight:600; color:var(--fg2); background:var(--input-bg); transition:background .15s,color .15s,border-color .15s; user-select:none; line-height:1.25; }
#${ROOT_ID} .sf-cli-shell-btn:first-child span { border-radius:var(--r-sm) 0 0 var(--r-sm); }
#${ROOT_ID} .sf-cli-shell-btn:last-child span { border-radius:0 var(--r-sm) var(--r-sm) 0; }
#${ROOT_ID} .sf-cli-shell-btn:not(:first-child) span { margin-left:-1px; }
#${ROOT_ID} .sf-cli-shell-btn span:hover { background:var(--accent-subtle); }
#${ROOT_ID} .sf-cli-shell-group input:checked + span { background:var(--accent); border-color:var(--accent); color:#fff; z-index:1; position:relative; }
#${ROOT_ID} .sf-cli-shell-group input:focus-visible + span { z-index:2; position:relative; }
#${ROOT_ID} .sf-cli-drag-handle { display:none; }
#${ROOT_ID} .sf-cli-drag-handle span { display:block; width:2rem; height:.25rem; border-radius:999px; background:var(--border-s); margin:0 auto; }
#${ROOT_ID} .sf-cli-field label { display:block; margin-bottom:.25rem; font-size:.6875rem; line-height:1rem; font-weight:700; color:var(--fg2); }
#${ROOT_ID} .sf-cli-field input { width:100%; min-height:2.25rem; padding:.375rem .625rem; border:1px solid var(--input-border); border-radius:var(--r-sm); background:var(--input-bg); color:var(--fg); outline:none; box-shadow:inset 0 1px 2px rgba(0,0,0,0.04); font-size:.875rem; transition:border-color .15s,box-shadow .15s; }
#${ROOT_ID} .sf-cli-field input::placeholder { color:var(--fg3); }
#${ROOT_ID} .sf-cli-field input:focus { border-color:var(--accent); box-shadow:0 0 0 2px color-mix(in srgb,var(--accent) 25%,transparent); }
#${ROOT_ID} .sf-cli-checkbox-row { display:flex; align-items:center; gap:.625rem; margin:.3rem 0; font-size:.75rem; line-height:1.25rem; color:var(--fg); cursor:pointer; user-select:none; }
#${ROOT_ID} .sf-cli-checkbox { position:absolute; opacity:0; width:0; height:0; margin:0; }
#${ROOT_ID} .sf-cli-toggle-track { position:relative; width:2rem; height:1.125rem; flex:0 0 auto; background:var(--border-s); border-radius:999px; transition:background .2s; cursor:pointer; }
#${ROOT_ID} .sf-cli-toggle-track::after { content:""; position:absolute; top:.125rem; left:.125rem; width:.875rem; height:.875rem; background:#fff; border-radius:999px; transition:transform .2s cubic-bezier(.34,1.56,.64,1); box-shadow:0 1px 3px rgba(0,0,0,0.25); }
#${ROOT_ID} .sf-cli-checkbox:checked + .sf-cli-toggle-track { background:var(--accent); }
#${ROOT_ID} .sf-cli-checkbox:checked + .sf-cli-toggle-track::after { transform:translateX(.875rem); }
#${ROOT_ID} .sf-cli-checkbox:focus-visible + .sf-cli-toggle-track { outline:2px solid var(--accent); outline-offset:2px; }
#${ROOT_ID} .sf-cli-codecard { border:1px solid var(--border); border-radius:var(--r); background:var(--code-bg); overflow:hidden; }
#${ROOT_ID} .sf-cli-codecard-header { display:flex; justify-content:flex-end; gap:.375rem; padding:.5rem .625rem; border-bottom:1px solid var(--border); background:var(--panel-bg); }
#${ROOT_ID} .sf-cli-inline-action { border:1px solid var(--border-s); background:var(--input-bg); color:var(--accent-text); border-radius:var(--r-sm); min-height:1.75rem; padding:0 .625rem; font-size:.6875rem; font-weight:700; cursor:pointer; white-space:nowrap; transition:background .15s,border-color .15s; }
#${ROOT_ID} .sf-cli-inline-action:hover { background:var(--accent-subtle); border-color:var(--accent); }
#${ROOT_ID} .sf-cli-codeblock { margin:0; padding:.75rem; min-height:2.25rem; overflow:auto; white-space:pre-wrap; word-break:break-word; overflow-wrap:anywhere; font-family:Consolas,"Courier New",monospace; font-size:.75rem; line-height:1.45; color:var(--code-fg); }
#${ROOT_ID} .sf-cli-status { margin-top:.375rem; min-height:1rem; font-size:.6875rem; line-height:1rem; color:var(--fg2); }
#${ROOT_ID} .sf-cli-footer { display:flex; justify-content:flex-end; gap:.75rem; padding:.75rem 1.125rem 1rem; border-top:1px solid var(--border); }
#${ROOT_ID} .sf-cli-button { min-height:2rem; padding:0 1rem; border-radius:var(--r-sm); border:1px solid transparent; font-size:.75rem; font-weight:700; cursor:pointer; transition:background .15s; }
#${ROOT_ID} .sf-cli-button-neutral { border-color:var(--border-s); background:var(--input-bg); color:var(--accent-text); }
#${ROOT_ID} .sf-cli-button-neutral:hover { background:var(--accent-subtle); border-color:var(--accent); }
#${ROOT_ID} .sf-cli-close { position:absolute; top:.5rem; right:.5rem; width:1.75rem; height:1.75rem; border:0; border-radius:999px; background:transparent; color:var(--fg2); font-size:1rem; cursor:pointer; display:grid; place-items:center; transition:background .15s,color .15s; }
#${ROOT_ID} .sf-cli-close:hover { background:var(--accent-subtle); color:var(--accent-text); }
@keyframes sf-fade-in { from{opacity:0} to{opacity:1} }
@keyframes sf-slide-up { from{opacity:0;transform:translateY(-.75rem) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes sf-slide-up-sheet { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes sf-toast-in { from{opacity:0;transform:translateY(-.5rem)} to{opacity:1;transform:translateY(0)} }
/* --- Tablet (641-900px) --- */
@media(max-width:900px) {
  #${ROOT_ID} { --modal-w:min(36rem,calc(100vw - 1.5rem)); --modal-m:1rem auto; }
}
/* --- Phone (481-640px) --- */
@media(max-width:640px) {
  #${ROOT_ID} {
    --modal-w:calc(100vw - .75rem); --modal-m:.5rem auto;
  }
  #${ROOT_ID} .sf-cli-header { padding:.75rem .875rem .625rem; }
  #${ROOT_ID} .sf-cli-body { padding:.75rem .875rem; gap:.625rem; }
  #${ROOT_ID} .sf-cli-footer { padding:.625rem .875rem .75rem; gap:.5rem; flex-direction:column; }
  #${ROOT_ID} .sf-cli-footer .sf-cli-button { width:100%; min-height:2.25rem; }
  #${ROOT_ID} .sf-cli-panel { padding:.625rem .75rem; }
  #${ROOT_ID} .sf-cli-shell-btn span { font-size:.6875rem; padding:.375rem .4rem; }
  #${ROOT_ID} .sf-cli-inline-action { width:100%; min-height:2.25rem; }
  #${ROOT_ID} .sf-cli-codecard-header { flex-direction:column; }
  #${ROOT_ID} .sf-cli-codeblock { font-size:.6875rem; padding:.5rem .625rem; }
  #${ROOT_ID} .sf-cli-checkbox-row { font-size:.6875rem; gap:.5rem; min-height:2.25rem; margin:.15rem 0; }
  #${ROOT_ID} .sf-cli-toast-region { width:calc(100vw - 1rem); top:.75rem; }
}
/* --- Small phone / bottom sheet (≤480px) --- */
@media(max-width:480px) {
  #${ROOT_ID} {
    --modal-w:100vw; --modal-m:0;
  }
  #${ROOT_ID} .sf-cli-backdrop {
    background:rgba(24,24,24,0.55);
    -webkit-backdrop-filter:blur(2px); backdrop-filter:blur(2px);
  }
  .sf-cli-dark #${ROOT_ID} .sf-cli-backdrop { background:rgba(8,7,7,0.7); }
  #${ROOT_ID} .sf-cli-modal {
    display:flex; align-items:flex-end;
    animation:sf-slide-up-sheet .3s cubic-bezier(.32,.72,0,1);
  }
  #${ROOT_ID} .sf-cli-container {
    width:100%; border-radius:var(--r) var(--r) 0 0;
    max-height:85vh; overflow-y:auto; -webkit-overflow-scrolling:touch;
    padding-bottom:var(--sab);
  }
  #${ROOT_ID} .sf-cli-drag-handle { display:block; padding:.375rem 0 .5rem; }
  #${ROOT_ID} .sf-cli-header { padding:.25rem .875rem .625rem; }
  #${ROOT_ID} .sf-cli-close { top:.375rem; right:.5rem; width:2rem; height:2rem; font-size:1.125rem; }
  #${ROOT_ID} .sf-cli-body { padding:.625rem .875rem; gap:.5rem; }
  #${ROOT_ID} .sf-cli-footer { padding:.5rem .875rem calc(.75rem + var(--sab)); gap:.5rem; flex-direction:column; }
  #${ROOT_ID} .sf-cli-footer .sf-cli-button { width:100%; min-height:2.5rem; font-size:.8125rem; }
  #${ROOT_ID} .sf-cli-panel { padding:.5rem .6875rem; }
  #${ROOT_ID} .sf-cli-panel-head { margin-bottom:.375rem; }
  #${ROOT_ID} .sf-cli-panel-head p { font-size:.625rem; }
  #${ROOT_ID} h2 { font-size:.875rem; }
  #${ROOT_ID} .sf-cli-shell-group { margin-bottom:.5rem; }
  #${ROOT_ID} .sf-cli-shell-btn span { font-size:.625rem; padding:.4rem .25rem; }
  #${ROOT_ID} .sf-cli-field input { min-height:2.5rem; font-size:.9375rem; }
  #${ROOT_ID} .sf-cli-checkbox-row { font-size:.6875rem; margin:.2rem 0; gap:.5rem; min-height:2.5rem; }
  #${ROOT_ID} .sf-cli-toggle-track { width:1.75rem; height:1rem; }
  #${ROOT_ID} .sf-cli-toggle-track::after { width:.75rem; height:.75rem; top:.125rem; left:.125rem; }
  #${ROOT_ID} .sf-cli-checkbox:checked + .sf-cli-toggle-track::after { transform:translateX(.75rem); }
  #${ROOT_ID} .sf-cli-codecard-header { padding:.375rem .5rem; gap:.375rem; }
  #${ROOT_ID} .sf-cli-codecard-header .sf-cli-inline-action { width:100%; min-height:2.5rem; font-size:.6875rem; }
  #${ROOT_ID} .sf-cli-codeblock { font-size:.6875rem; padding:.5rem; }
  #${ROOT_ID} .sf-cli-toast-region { top:.5rem; width:calc(100vw - 1rem); }
  #${ROOT_ID} .sf-cli-toast { padding:.75rem; gap:.5rem; border-radius:var(--r-sm); }
  #${ROOT_ID} .sf-cli-toast-title { font-size:.8125rem; }
  #${ROOT_ID} .sf-cli-toast-message { font-size:.75rem; }
  #${ROOT_ID} .sf-cli-status { font-size:.625rem; }
}
/* --- Landscape phone (<640px height) --- */
@media(max-height:520px) and (orientation:landscape) {
  #${ROOT_ID} {
    --modal-w:min(36rem,calc(100vw - 1rem)); --modal-m:.25rem auto;
  }
  #${ROOT_ID} .sf-cli-modal {
    display:block; align-items:initial;
    animation:sf-slide-up .2s ease-out;
  }
  #${ROOT_ID} .sf-cli-container {
    max-height:90vh; border-radius:var(--r);
    padding-bottom:0;
  }
  #${ROOT_ID} .sf-cli-drag-handle { display:none; }
  #${ROOT_ID} .sf-cli-backdrop {
    -webkit-backdrop-filter:none; backdrop-filter:none;
  }
  #${ROOT_ID} .sf-cli-header { padding:.5rem .75rem .375rem; }
  #${ROOT_ID} .sf-cli-header-row { margin-bottom:.25rem; }
  #${ROOT_ID} .sf-cli-body { padding:.5rem .75rem; gap:.375rem; }
  #${ROOT_ID} .sf-cli-footer { padding:.375rem .75rem .5rem; flex-direction:row; gap:.5rem; }
  #${ROOT_ID} .sf-cli-footer .sf-cli-button { width:auto; min-height:2rem; }
  #${ROOT_ID} .sf-cli-panel { padding:.375rem .5rem; }
  #${ROOT_ID} .sf-cli-panel-head { margin-bottom:.25rem; }
  #${ROOT_ID} h2 { font-size:.8125rem; }
  #${ROOT_ID} .sf-cli-summary { font-size:.6875rem; margin:.1rem 0 0; }
  #${ROOT_ID} .sf-cli-shell-group { margin-bottom:.375rem; }
  #${ROOT_ID} .sf-cli-shell-btn span { font-size:.625rem; padding:.25rem .375rem; }
  #${ROOT_ID} .sf-cli-field input { min-height:1.75rem; font-size:.75rem; }
  #${ROOT_ID} .sf-cli-checkbox-row { min-height:1.75rem; font-size:.625rem; margin:.1rem 0; }
  #${ROOT_ID} .sf-cli-toggle-track { width:1.5rem; height:.875rem; }
  #${ROOT_ID} .sf-cli-toggle-track::after { width:.625rem; height:.625rem; top:.125rem; left:.125rem; }
  #${ROOT_ID} .sf-cli-checkbox:checked + .sf-cli-toggle-track::after { transform:translateX(.625rem); }
  #${ROOT_ID} .sf-cli-codecard-header { padding:.25rem .375rem; flex-direction:row; }
  #${ROOT_ID} .sf-cli-codecard-header .sf-cli-inline-action { width:auto; min-height:1.5rem; font-size:.5625rem; }
  #${ROOT_ID} .sf-cli-codeblock { font-size:.625rem; padding:.375rem; min-height:1.5rem; }
  #${ROOT_ID} .sf-cli-close { top:.25rem; right:.375rem; width:1.5rem; height:1.5rem; font-size:.875rem; }
  #${ROOT_ID} .sf-cli-toast-region { top:.25rem; }
  #${ROOT_ID} .sf-cli-toast { padding:.5rem .625rem; }
}
`;
    root.appendChild(style);
    document.documentElement.appendChild(root);

    const summaryEl = requireElement(root, ".sf-cli-summary");
    const aliasEl = requireElement(root, ".sf-cli-alias");
    const outputEl = requireElement(root, "#sf-cli-output");
    const includeRedirectEl = requireElement(root, "#sf-cli-include-redirect");
    const setDefaultOrgEl = requireElement(root, "#sf-cli-set-default-org");
    const setTargetOrgEl = requireElement(root, "#sf-cli-set-target-org");
    const statusEl = requireElement(root, ".sf-cli-status");
    const toastRegionEl = requireElement(root, ".sf-cli-toast-region");
    const themeBtn = requireElement(root, ".sf-cli-theme-btn");

    const isDark = document.documentElement.classList.contains("sf-cli-dark");
    themeBtn.innerHTML = isDark ? SUN_SVG : MOON_SVG;
    themeBtn.addEventListener("click", () => {
      themeBtn.innerHTML = toggleTheme() ? SUN_SVG : MOON_SVG;
    });

    let currentFrontdoorUrl = "";
    summaryEl.textContent = state.requestPayload.hostname;
    aliasEl.value = state.suggestedAlias || "";

    const renderCommand = () => {
      const alias = aliasEl.value.trim();
      const terminalType = (root.querySelector('input[name="sf-cli-shell"]:checked') || {}).value || "powershell";
      if (!alias) {
        outputEl.textContent = "";
        currentFrontdoorUrl = "";
        statusEl.textContent = "Enter an alias.";
        return;
      }
      outputEl.textContent = buildCommand({
        instanceUrl: state.requestPayload.instanceUrl,
        sid: state.requestPayload.sid,
        alias,
        setDefaultOrg: setDefaultOrgEl.checked,
        setTargetOrg: setTargetOrgEl.checked,
        terminalType
      });
      currentFrontdoorUrl = buildFrontdoorUrl({
        instanceUrl: state.requestPayload.instanceUrl,
        sid: state.requestPayload.sid,
        sourceUrl: state.requestPayload.sourceUrl,
        includeRetUrl: includeRedirectEl.checked
      });
      statusEl.textContent = "";
    };

    requireElement(root, ".sf-cli-copy").addEventListener("click", async () => {
      renderCommand();
      if (!outputEl.textContent) return;
      try {
        await navigator.clipboard.writeText(outputEl.textContent);
        await chrome.runtime.sendMessage({ type: "sf:clearPendingConnection" });
        await chrome.runtime.sendMessage({ type: "sf:copiedCommand" });
        statusEl.textContent = "";
        showToast("success", "Command copied", "Paste it into your terminal.");
      } catch (error) {
        statusEl.textContent = "";
        showToast("error", "Copy failed", "Copy the command manually.");
        await chrome.runtime.sendMessage({ type: "sf:copyFailed", error: error?.message || "Clipboard write failed." });
      }
    });

    requireElement(root, ".sf-cli-copy-frontdoor").addEventListener("click", async () => {
      renderCommand();
      if (!currentFrontdoorUrl) return;
      try {
        await navigator.clipboard.writeText(currentFrontdoorUrl);
        await chrome.runtime.sendMessage({ type: "sf:copiedCommand" });
        statusEl.textContent = "";
        showToast("success", "Frontdoor copied", "Use it for a direct browser login.");
      } catch (error) {
        statusEl.textContent = "";
        showToast("error", "Frontdoor copy failed", "Copy the URL manually.");
        await chrome.runtime.sendMessage({ type: "sf:copyFailed", error: error?.message || "Clipboard write failed." });
      }
    });

    requireElement(root, ".sf-cli-close").addEventListener("click", () => root.remove());
    requireElement(root, ".sf-cli-close-action").addEventListener("click", () => root.remove());
    requireElement(root, ".sf-cli-backdrop").addEventListener("click", () => root.remove());
    aliasEl.addEventListener("input", renderCommand);
    includeRedirectEl.addEventListener("change", renderCommand);
    setDefaultOrgEl.addEventListener("change", renderCommand);
    setTargetOrgEl.addEventListener("change", renderCommand);
    root.querySelectorAll('input[name="sf-cli-shell"]').forEach((input) => {
      input.addEventListener("change", renderCommand);
    });

    renderCommand();
    aliasEl.focus();
    aliasEl.select();

    function showToast(variant, title, message) {
      const toast = document.createElement("section");
      toast.className = `sf-cli-toast${variant === "error" ? " sf-cli-toast-error" : ""}`;
      toast.setAttribute("role", "status");
      toast.innerHTML = `
        <div class="sf-cli-toast-iconwrap" aria-hidden="true">${variant === "error" ? "!" : "✓"}</div>
        <div>
          <p class="sf-cli-toast-title">${escapeHtml(title)}</p>
          <p class="sf-cli-toast-message">${escapeHtml(message)}</p>
        </div>
        <button class="sf-cli-toast-close" type="button" aria-label="Close">×</button>`;
      const closeBtn = toast.querySelector(".sf-cli-toast-close");
      if (closeBtn) closeBtn.addEventListener("click", () => toast.remove());
      toastRegionEl.appendChild(toast);
      setTimeout(() => toast.remove(), 3200);
    }
  }

  function buildCommand({ instanceUrl, sid, alias, setDefaultOrg, setTargetOrg, terminalType = "powershell" }) {
    const sfFlags = [
      `--instance-url ${quoteForShell(instanceUrl, terminalType)}`,
      `--alias ${quoteForShell(alias, terminalType)}`,
      "--no-prompt",
      setDefaultOrg ? "--set-default" : "",
      setTargetOrg ? "--set-target-org" : ""
    ].filter(Boolean).join(" ");

    const sidQuoted = quoteForShell(sid, terminalType);
    switch (terminalType) {
      case "bash": return `export SF_ACCESS_TOKEN=${sidQuoted} && sf org login access-token ${sfFlags}`;
      case "cmd": return `set "SF_ACCESS_TOKEN=${String(sid).replace(/"/g, '""')}" && sf org login access-token ${sfFlags}`;
      default: return `$env:SF_ACCESS_TOKEN=${sidQuoted}; sf org login access-token ${sfFlags}`;
    }
  }

  function singleQuote(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  function buildFrontdoorUrl({ instanceUrl, sid, sourceUrl, includeRetUrl }) {
    const base = instanceUrl.replace(/\/$/, "");
    if (!includeRetUrl) {
      return `${base}/secur/frontdoor.jsp?sid=${encodeURIComponent(sid)}`;
    }
    let retUrl = "/lightning/page/home";
    if (sourceUrl) {
      try {
        const source = new URL(sourceUrl);
        retUrl = `${source.pathname || ""}${source.search || ""}${source.hash || ""}` || retUrl;
      } catch {
        retUrl = "/lightning/page/home";
      }
    }
    return `${base}/secur/frontdoor.jsp?sid=${encodeURIComponent(sid)}&retURL=${encodeURIComponent(retUrl)}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function requireElement(root, selector) {
    const el = root.querySelector(selector);
    if (!el) throw new Error(`Overlay element not found: ${selector}`);
    return el;
  }

  function detectToastTheme() {
    if (document.documentElement.classList.contains("sf-cli-dark")) return "dark";
    const bg = window.getComputedStyle(document.body).backgroundColor || "rgb(255,255,255)";
    const m = bg.match(/\d+/g);
    if (!m || m.length < 3) return "light";
    const [r, g, b] = m.slice(0, 3).map(Number);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.45 ? "dark" : "light";
  }
})();
