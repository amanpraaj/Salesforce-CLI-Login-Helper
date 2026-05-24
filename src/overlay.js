(() => {
  const ROOT_ID = "sf-cli-command-overlay-root";
  const SHELL_OPTIONS = [
    { value: "powershell", label: "PowerShell" },
    { value: "cmd", label: "CMD" },
    { value: "bash", label: "Bash" }
  ];

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "sf:openOverlay") {
      openOverlay(message.payload);
    }
  });

  function openOverlay(state) {
    const existing = document.getElementById(ROOT_ID);
    if (existing) {
      existing.remove();
    }

    const root = document.createElement("div");
    root.id = ROOT_ID;
    root.innerHTML = `
      <div class="sf-cli-backdrop"></div>
      <div class="sf-cli-toast-region" aria-live="polite" aria-atomic="true"></div>
      <section class="sf-cli-modal" role="dialog" aria-modal="true" aria-label="Generate Salesforce CLI command">
        <div class="sf-cli-container">
          <button class="sf-cli-close" type="button" aria-label="Close">x</button>

          <header class="sf-cli-header">
            <p class="sf-cli-eyebrow">Salesforce CLI</p>
            <h2>Copy access token command</h2>
            <p class="sf-cli-summary"></p>
          </header>

          <div class="sf-cli-body">
            <section class="sf-cli-panel">
              <div class="sf-cli-panel-head">
                <h3>Basic setup</h3>
                <p>Pick an alias, choose your shell, and add a project path only if you need one.</p>
              </div>

              <div class="sf-cli-grid">
                <div class="sf-cli-field">
                  <label for="sf-cli-alias">Alias</label>
                  <input id="sf-cli-alias" class="sf-cli-alias" type="text" />
                </div>

                <div class="sf-cli-field">
                  <label for="sf-cli-shell-trigger">Shell</label>
                  <div class="sf-cli-combobox">
                    <button id="sf-cli-shell-trigger" class="sf-cli-combobox-trigger" type="button" aria-haspopup="listbox" aria-expanded="false"></button>
                    <div class="sf-cli-combobox-dropdown" hidden>
                      <ul class="sf-cli-combobox-list" role="listbox"></ul>
                    </div>
                  </div>
                </div>
              </div>

              <div class="sf-cli-field">
                <label for="sf-cli-project">Optional Project Path</label>
                <input id="sf-cli-project" class="sf-cli-project" type="text" placeholder="C:\\path\\to\\your\\project" />
                <div class="sf-cli-hint">Leave this blank unless you want the command to set a default org in that folder.</div>
              </div>
            </section>

            <section class="sf-cli-panel">
              <div class="sf-cli-panel-head">
                <h3>Command</h3>
                <p>Copy and paste this into your terminal.</p>
              </div>

              <div class="sf-cli-output-head">
                <button class="sf-cli-inline-action sf-cli-copy" type="button">Copy Command</button>
                <button class="sf-cli-inline-action sf-cli-copy-frontdoor" type="button">Copy Frontdoor URL</button>
              </div>

              <div class="sf-cli-codecard">
                <pre id="sf-cli-output" class="sf-cli-codeblock"></pre>
              </div>
            </section>

            <div class="sf-cli-status" aria-live="polite"></div>
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
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        font-family: "Salesforce Sans", "Segoe UI", Arial, sans-serif;
        color: #181818;
        color-scheme: light dark;
      }
      #${ROOT_ID} .sf-cli-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(24, 24, 24, 0.52);
      }
      #${ROOT_ID} .sf-cli-modal {
        position: relative;
        width: min(40rem, calc(100vw - 1.25rem));
        margin: 1.25rem auto;
      }
      #${ROOT_ID} .sf-cli-toast-region {
        position: fixed;
        top: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2147483648;
        display: grid;
        gap: 0.75rem;
        width: min(36rem, calc(100vw - 2rem));
      }
      #${ROOT_ID} .sf-cli-toast {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 0.875rem;
        padding: 0.95rem 1rem;
        border-radius: 0.625rem;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
        border: 1px solid transparent;
      }
      #${ROOT_ID} .sf-cli-toast-light {
        background: #a7f3eb;
        border-color: #7fe3d8;
        color: #06444b;
      }
      #${ROOT_ID} .sf-cli-toast-dark {
        background: #055b63;
        border-color: #0b727a;
        color: #ddfffb;
      }
      #${ROOT_ID} .sf-cli-toast-iconwrap {
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 999px;
        display: grid;
        place-items: center;
        font-size: 1rem;
        font-weight: 700;
      }
      #${ROOT_ID} .sf-cli-toast-light .sf-cli-toast-iconwrap {
        background: #0b6b73;
        color: #ffffff;
      }
      #${ROOT_ID} .sf-cli-toast-dark .sf-cli-toast-iconwrap {
        background: #d7fffb;
        color: #055b63;
      }
      #${ROOT_ID} .sf-cli-toast-title {
        margin: 0;
        font-size: 0.875rem;
        line-height: 1.25rem;
        font-weight: 700;
      }
      #${ROOT_ID} .sf-cli-toast-message {
        margin: 0.125rem 0 0;
        font-size: 0.8125rem;
        line-height: 1.125rem;
      }
      #${ROOT_ID} .sf-cli-toast-close {
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        padding: 0;
        font-size: 1.125rem;
        line-height: 1rem;
        opacity: 0.92;
      }
      #${ROOT_ID} .sf-cli-container {
        position: relative;
        background: #ffffff;
        border-radius: 0.625rem;
        box-shadow: 0 2px 24px rgba(0, 0, 0, 0.24);
        overflow: visible;
      }
      #${ROOT_ID} .sf-cli-header {
        padding: 0.875rem 1rem 0.75rem;
        border-bottom: 1px solid #e5e5e5;
      }
      #${ROOT_ID} .sf-cli-eyebrow {
        margin: 0 0 0.25rem;
        font-size: 0.75rem;
        line-height: 1rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #0176d3;
      }
      #${ROOT_ID} h2 {
        margin: 0;
        font-size: 1rem;
        line-height: 1.25rem;
        font-weight: 700;
        color: #080707;
      }
      #${ROOT_ID} h3 {
        margin: 0;
        font-size: 0.8125rem;
        line-height: 1.0625rem;
        font-weight: 700;
        color: #080707;
      }
      #${ROOT_ID} p,
      #${ROOT_ID} label,
      #${ROOT_ID} div,
      #${ROOT_ID} button,
      #${ROOT_ID} input,
      #${ROOT_ID} pre,
      #${ROOT_ID} span,
      #${ROOT_ID} li,
      #${ROOT_ID} ul {
        font: inherit;
      }
      #${ROOT_ID} .sf-cli-summary,
      #${ROOT_ID} .sf-cli-hint,
      #${ROOT_ID} .sf-cli-status {
        color: #444444;
      }
      #${ROOT_ID} .sf-cli-summary {
        margin: 0.25rem 0 0;
        font-size: 0.8125rem;
        line-height: 1.125rem;
      }
      #${ROOT_ID} .sf-cli-body {
        padding: 0.875rem 1rem 0.875rem;
      }
      #${ROOT_ID} .sf-cli-panel {
        border: 1px solid #e5e5e5;
        border-radius: 0.625rem;
        background: #ffffff;
        padding: 0.6875rem;
      }
      #${ROOT_ID} .sf-cli-panel + .sf-cli-panel {
        margin-top: 0.625rem;
      }
      #${ROOT_ID} .sf-cli-panel-head {
        margin-bottom: 0.5rem;
      }
      #${ROOT_ID} .sf-cli-panel-head p {
        margin: 0.2rem 0 0;
        font-size: 0.625rem;
        line-height: 0.9rem;
        color: #5c5c5c;
      }
      #${ROOT_ID} .sf-cli-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 0.86fr);
        gap: 0.625rem;
        align-items: start;
      }
      #${ROOT_ID} .sf-cli-grid > .sf-cli-field {
        margin-top: 0;
        display: flex;
        flex-direction: column;
      }
      #${ROOT_ID} .sf-cli-field + .sf-cli-field,
      #${ROOT_ID} .sf-cli-grid + .sf-cli-field {
        margin-top: 0.5rem;
      }
      #${ROOT_ID} .sf-cli-grid > .sf-cli-field + .sf-cli-field {
        margin-top: 0;
      }
      #${ROOT_ID} label {
        display: block;
        margin-bottom: 0.2rem;
        font-size: 0.625rem;
        line-height: 0.9rem;
        font-weight: 700;
        color: #3e3e3c;
      }
      #${ROOT_ID} input,
      #${ROOT_ID} .sf-cli-combobox-trigger {
        width: 100%;
        box-sizing: border-box;
        min-height: 2.125rem;
        height: 2.125rem;
        padding: 0.3125rem 0.5625rem;
        border: 1px solid #c9c9c9;
        border-radius: 0.25rem;
        background: #ffffff;
        color: #181818;
        outline: none;
        box-shadow: inset 0 2px 2px rgba(0, 0, 0, 0.02);
        font-size: 0.875rem;
      }
      #${ROOT_ID} input::placeholder {
        color: #706e6b;
      }
      #${ROOT_ID} input:focus,
      #${ROOT_ID} .sf-cli-combobox-trigger:focus {
        border-color: #0176d3;
        box-shadow: 0 0 3px #0176d3;
      }
      #${ROOT_ID} .sf-cli-combobox {
        position: relative;
        display: flex;
        flex-direction: column;
      }
      #${ROOT_ID} .sf-cli-combobox-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        cursor: pointer;
        text-align: left;
      }
      #${ROOT_ID} .sf-cli-combobox-trigger::after {
        content: "";
        width: 0;
        height: 0;
        border-left: 0.3125rem solid transparent;
        border-right: 0.3125rem solid transparent;
        border-top: 0.375rem solid #706e6b;
        flex: 0 0 auto;
      }
      #${ROOT_ID} .sf-cli-combobox.is-open .sf-cli-combobox-trigger {
        border-color: #0176d3;
        box-shadow: 0 0 0 2px rgba(1, 118, 211, 0.22);
      }
      #${ROOT_ID} .sf-cli-combobox-dropdown {
        position: absolute;
        top: calc(100% + 0.125rem);
        left: 0;
        right: 0;
        z-index: 3;
        background: #ffffff;
        border: 1px solid #0176d3;
        border-radius: 0.25rem;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
        overflow: hidden;
      }
      #${ROOT_ID} .sf-cli-combobox-list {
        list-style: none;
        margin: 0;
        padding: 0.25rem 0;
        max-height: 13rem;
        overflow: auto;
      }
      #${ROOT_ID} .sf-cli-combobox-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        border: 0;
        background: #ffffff;
        color: #181818;
        text-align: left;
        cursor: pointer;
      }
      #${ROOT_ID} .sf-cli-combobox-item:hover,
      #${ROOT_ID} .sf-cli-combobox-item.is-selected {
        background: #f3f3f3;
      }
      #${ROOT_ID} .sf-cli-check {
        width: 1rem;
        color: #0176d3;
        font-weight: 700;
        visibility: hidden;
      }
      #${ROOT_ID} .sf-cli-combobox-item.is-selected .sf-cli-check {
        visibility: visible;
      }
      #${ROOT_ID} .sf-cli-hint {
        margin-top: 0.25rem;
        font-size: 0.6875rem;
        line-height: 0.95rem;
      }
      #${ROOT_ID} .sf-cli-output-head {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-bottom: 0.375rem;
      }
      #${ROOT_ID} .sf-cli-inline-action {
        border: 1px solid #c9c9c9;
        background: #ffffff;
        color: #0176d3;
        border-radius: 0.25rem;
        min-height: 1.75rem;
        padding: 0 0.625rem;
        font-size: 0.6875rem;
        font-weight: 700;
        cursor: pointer;
        white-space: nowrap;
      }
      #${ROOT_ID} .sf-cli-codecard {
        border: 1px solid #dddbda;
        border-radius: 0.625rem;
        background: #f3f2f2;
        padding: 0.5625rem 0.625rem;
      }
      #${ROOT_ID} .sf-cli-codeblock {
        margin: 0;
        min-height: 1.5rem;
        overflow: visible;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: anywhere;
        font-family: Consolas, "Courier New", monospace;
        font-size: 0.75rem;
        line-height: 1.3;
        color: #181818;
      }
      #${ROOT_ID} .sf-cli-status {
        margin-top: 0.5rem;
        min-height: 1rem;
        font-size: 0.6875rem;
        line-height: 1rem;
      }
      #${ROOT_ID} .sf-cli-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        padding: 0.625rem 1rem 0.875rem;
        border-top: 1px solid #e5e5e5;
      }
      #${ROOT_ID} .sf-cli-button {
        min-height: 1.875rem;
        padding: 0 0.875rem;
        border-radius: 0.25rem;
        border: 1px solid transparent;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
      }
      #${ROOT_ID} .sf-cli-button-neutral {
        border-color: #c9c9c9;
        background: #ffffff;
        color: #0176d3;
      }
      #${ROOT_ID} .sf-cli-button:hover,
      #${ROOT_ID} .sf-cli-inline-action:hover,
      #${ROOT_ID} .sf-cli-close:hover {
        filter: brightness(0.98);
      }
      #${ROOT_ID} .sf-cli-close {
        position: absolute;
        top: 0.625rem;
        right: 0.625rem;
        width: 1.75rem;
        height: 1.75rem;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: #444444;
        font-size: 0.875rem;
        cursor: pointer;
      }
      @media (max-width: 640px) {
        #${ROOT_ID} .sf-cli-modal {
          width: calc(100vw - 0.75rem);
          margin: 0.5rem auto;
        }
        #${ROOT_ID} .sf-cli-toast-region {
          width: calc(100vw - 1rem);
          top: 0.75rem;
        }
        #${ROOT_ID} .sf-cli-header,
        #${ROOT_ID} .sf-cli-body,
        #${ROOT_ID} .sf-cli-footer {
          padding-left: 1rem;
          padding-right: 1rem;
        }
        #${ROOT_ID} .sf-cli-panel {
          padding: 0.625rem;
        }
        #${ROOT_ID} .sf-cli-grid {
          grid-template-columns: 1fr;
        }
        #${ROOT_ID} .sf-cli-inline-action,
        #${ROOT_ID} .sf-cli-button {
          width: 100%;
        }
      }
      @media (prefers-color-scheme: dark) {
        #${ROOT_ID} {
          color: #f3f3f3;
        }
        #${ROOT_ID} .sf-cli-backdrop {
          background: rgba(8, 7, 7, 0.66);
        }
        #${ROOT_ID} .sf-cli-container {
          background: #181818;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.48);
        }
        #${ROOT_ID} .sf-cli-header,
        #${ROOT_ID} .sf-cli-footer {
          border-color: #3e3e3c;
        }
        #${ROOT_ID} .sf-cli-panel {
          background: #1e1e1e;
          border-color: #3e3e3c;
        }
        #${ROOT_ID} .sf-cli-eyebrow {
          color: #78c3ff;
        }
        #${ROOT_ID} h2,
        #${ROOT_ID} h3 {
          color: #ffffff;
        }
        #${ROOT_ID} .sf-cli-panel-head p {
          color: #b0adab;
        }
        #${ROOT_ID} .sf-cli-summary,
        #${ROOT_ID} .sf-cli-hint,
        #${ROOT_ID} .sf-cli-status {
          color: #dddbda;
        }
        #${ROOT_ID} label {
          color: #f3f3f3;
        }
        #${ROOT_ID} input,
        #${ROOT_ID} .sf-cli-combobox-trigger {
          background: #2b2826;
          border-color: #5c5c5c;
          color: #f3f3f3;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.36);
        }
        #${ROOT_ID} input::placeholder {
          color: #b0adab;
        }
        #${ROOT_ID} input:focus,
        #${ROOT_ID} .sf-cli-combobox-trigger:focus {
          border-color: #1b96ff;
          box-shadow: 0 0 3px #1b96ff;
        }
        #${ROOT_ID} .sf-cli-combobox-trigger::after {
          border-top-color: #dddbda;
        }
        #${ROOT_ID} .sf-cli-combobox-dropdown {
          background: #2b2826;
          border-color: #1b96ff;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.42);
        }
        #${ROOT_ID} .sf-cli-combobox-item {
          background: #2b2826;
          color: #f3f3f3;
        }
        #${ROOT_ID} .sf-cli-combobox-item:hover,
        #${ROOT_ID} .sf-cli-combobox-item.is-selected {
          background: #3e3e3c;
        }
        #${ROOT_ID} .sf-cli-check {
          color: #78c3ff;
        }
        #${ROOT_ID} .sf-cli-inline-action {
          border-color: #5c5c5c;
          background: #2b2826;
          color: #78c3ff;
        }
        #${ROOT_ID} .sf-cli-codecard {
          background: #2b2826;
          border-color: #5c5c5c;
        }
        #${ROOT_ID} .sf-cli-codeblock {
          color: #f3f3f3;
        }
        #${ROOT_ID} .sf-cli-button-neutral {
          border-color: #5c5c5c;
          background: #2b2826;
          color: #78c3ff;
        }
        #${ROOT_ID} .sf-cli-close {
          color: #dddbda;
        }
      }
    `;
    root.appendChild(style);
    document.documentElement.appendChild(root);

    const summaryEl = requireElement(root, ".sf-cli-summary");
    const aliasEl = requireElement(root, ".sf-cli-alias");
    const projectEl = requireElement(root, ".sf-cli-project");
    const outputEl = requireElement(root, "#sf-cli-output");
    const statusEl = requireElement(root, ".sf-cli-status");
    const toastRegionEl = requireElement(root, ".sf-cli-toast-region");
    const comboboxEl = requireElement(root, ".sf-cli-combobox");
    const triggerEl = requireElement(root, ".sf-cli-combobox-trigger");
    const dropdownEl = requireElement(root, ".sf-cli-combobox-dropdown");
    const listEl = requireElement(root, ".sf-cli-combobox-list");

    let selectedShell = "powershell";
    let currentFrontdoorUrl = "";

    summaryEl.textContent = state.requestPayload.hostname;
    aliasEl.value = state.suggestedAlias || "";

    renderCombobox();

    const renderCommand = () => {
      const alias = aliasEl.value.trim();
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
        terminalType: selectedShell,
        projectPath: projectEl.value.trim()
      });
      currentFrontdoorUrl = buildFrontdoorUrl({
        instanceUrl: state.requestPayload.instanceUrl,
        sid: state.requestPayload.sid,
        sourceUrl: state.requestPayload.sourceUrl
      });
      statusEl.textContent = "";
    };

    function renderCombobox() {
      const current = SHELL_OPTIONS.find(option => option.value === selectedShell) || SHELL_OPTIONS[0];
      triggerEl.textContent = current.label;
      triggerEl.setAttribute("aria-expanded", String(!dropdownEl.hidden));

      listEl.replaceChildren();
      SHELL_OPTIONS.forEach(option => {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = `sf-cli-combobox-item${option.value === selectedShell ? " is-selected" : ""}`;
        button.innerHTML = `<span class="sf-cli-check">&#10003;</span><span>${escapeHtml(option.label)}</span>`;
        button.addEventListener("click", () => {
          selectedShell = option.value;
          closeDropdown();
          renderCombobox();
          renderCommand();
        });
        li.appendChild(button);
        listEl.appendChild(li);
      });
    }

    function openDropdown() {
      comboboxEl.classList.add("is-open");
      dropdownEl.hidden = false;
      triggerEl.setAttribute("aria-expanded", "true");
    }

    function closeDropdown() {
      comboboxEl.classList.remove("is-open");
      dropdownEl.hidden = true;
      triggerEl.setAttribute("aria-expanded", "false");
    }

    triggerEl.addEventListener("click", () => {
      if (dropdownEl.hidden) {
        openDropdown();
      } else {
        closeDropdown();
      }
    });

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target)) {
        return;
      }
      if (!comboboxEl.contains(event.target)) {
        closeDropdown();
      }
    });

    requireElement(root, ".sf-cli-copy").addEventListener("click", async () => {
      renderCommand();
      if (!outputEl.textContent) {
        return;
      }

      try {
        await navigator.clipboard.writeText(outputEl.textContent);
        await chrome.runtime.sendMessage({ type: "sf:clearPendingConnection" });
        await chrome.runtime.sendMessage({ type: "sf:copiedCommand" });
        statusEl.textContent = "";
        showToast("success", "Command copied", "Paste it into your terminal.");
      } catch (error) {
        statusEl.textContent = "";
        showToast("error", "Copy failed", "Copy the command manually.");
        await chrome.runtime.sendMessage({
          type: "sf:copyFailed",
          error: error?.message || "Clipboard write failed."
        });
      }
    });

    requireElement(root, ".sf-cli-copy-frontdoor").addEventListener("click", async () => {
      renderCommand();
      if (!currentFrontdoorUrl) {
        return;
      }

      try {
        await navigator.clipboard.writeText(currentFrontdoorUrl);
        await chrome.runtime.sendMessage({ type: "sf:copiedCommand" });
        statusEl.textContent = "";
        showToast("success", "Frontdoor copied", "Use it for a direct browser login.");
      } catch (error) {
        statusEl.textContent = "";
        showToast("error", "Frontdoor copy failed", "Copy the URL manually.");
        await chrome.runtime.sendMessage({
          type: "sf:copyFailed",
          error: error?.message || "Clipboard write failed."
        });
      }
    });

    requireElement(root, ".sf-cli-close").addEventListener("click", () => root.remove());
    requireElement(root, ".sf-cli-close-action").addEventListener("click", () => root.remove());
    requireElement(root, ".sf-cli-backdrop").addEventListener("click", () => root.remove());
    aliasEl.addEventListener("input", renderCommand);
    projectEl.addEventListener("input", renderCommand);

    renderCommand();
    aliasEl.focus();
    aliasEl.select();

    function showToast(variant, title, message) {
      const theme = detectToastTheme();
      const toast = document.createElement("section");
      toast.className = `sf-cli-toast ${theme === "dark" ? "sf-cli-toast-dark" : "sf-cli-toast-light"}`;
      toast.setAttribute("role", "status");
      toast.innerHTML = `
        <div class="sf-cli-toast-iconwrap" aria-hidden="true">${variant === "error" ? "!" : "✓"}</div>
        <div>
          <p class="sf-cli-toast-title">${escapeHtml(title)}</p>
          <p class="sf-cli-toast-message">${escapeHtml(message)}</p>
        </div>
        <button class="sf-cli-toast-close" type="button" aria-label="Close">×</button>
      `;

      const closeButton = toast.querySelector(".sf-cli-toast-close");
      if (closeButton) {
        closeButton.addEventListener("click", () => toast.remove());
      }
      toastRegionEl.appendChild(toast);

      window.setTimeout(() => {
        toast.remove();
      }, 3200);
    }
  }

  function buildCommand({ instanceUrl, sid, alias, terminalType, projectPath }) {
    const setDefault = Boolean(projectPath);
    const sfCommand = [
      "sf org login access-token",
      `--instance-url ${quoteForShell(instanceUrl, terminalType)}`,
      `--alias ${quoteForShell(alias, terminalType)}`,
      setDefault ? "--set-default" : "",
      "--no-prompt"
    ].filter(Boolean).join(" ");

    if (terminalType === "cmd") {
      const envPart = `set "SF_ACCESS_TOKEN=${escapeCmdValue(sid)}"`;
      const core = `${envPart} && ${sfCommand}`;
      return projectPath ? `cd /d ${quoteForCmd(projectPath)} && ${core}` : core;
    }

    if (terminalType === "bash") {
      const core = `SF_ACCESS_TOKEN=${quoteForBash(sid)} ${sfCommand}`;
      return projectPath ? `cd ${quoteForBash(projectPath)} && ${core}` : core;
    }

    const core = `$env:SF_ACCESS_TOKEN=${quoteForPowerShell(sid)}; ${sfCommand}`;
    return projectPath ? `Set-Location ${quoteForPowerShell(projectPath)}; ${core}` : core;
  }

  function buildFrontdoorUrl({ instanceUrl, sid, sourceUrl }) {
    const base = instanceUrl.replace(/\/$/, "");
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

  function quoteForShell(value, terminalType) {
    if (terminalType === "cmd") {
      return quoteForCmd(value);
    }
    if (terminalType === "bash") {
      return quoteForBash(value);
    }
    return quoteForPowerShell(value);
  }

  function quoteForPowerShell(value) {
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  function quoteForBash(value) {
    return `'${String(value).replace(/'/g, `'\\''`)}'`;
  }

  function quoteForCmd(value) {
    return `"${String(value).replace(/"/g, '""')}"`;
  }

  function escapeCmdValue(value) {
    return String(value).replace(/"/g, '""');
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function requireElement(root, selector) {
    const element = root.querySelector(selector);
    if (!element) {
      throw new Error(`Overlay element not found: ${selector}`);
    }
    return element;
  }

  function detectToastTheme() {
    const bg = window.getComputedStyle(document.body).backgroundColor || "rgb(255, 255, 255)";
    const match = bg.match(/\d+/g);
    if (!match || match.length < 3) {
      return "light";
    }

    const [r, g, b] = match.slice(0, 3).map(Number);
    const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return luminance < 0.45 ? "dark" : "light";
  }
})();
