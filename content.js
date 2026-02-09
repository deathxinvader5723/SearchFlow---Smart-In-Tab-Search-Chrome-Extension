class u {
    constructor() {
        this.selectionTimeout = null;
        this.NAMESPACE = "select-to-search";
        this.PROVIDER_URLS = {
            google: t => `https://www.google.com/search?igu=1&q=${encodeURIComponent(t)}`,
            chatgpt: t => `https://chatgpt.com/?q=${encodeURIComponent(t)}`,
            gemini: t => `https://gemini.google.com/app?prompt=${encodeURIComponent(t)}`
        };
        this.settings = this.getDefaultSettings();
        this.floatingUI = {
            container: null,
            buttons: [],
            isVisible: !1
        };
        this.searchPanel = null;
        this.searchIframe = null;
        this.panelHandle = null;
        this.handleTopPercent = 50; // Default vertical position
        this.shadowHost = this.createShadowHost();
        this.shadowRoot = this.shadowHost.attachShadow({
            mode: "open"
        });
        this.injectStyles();
        this.injectIframeFixes();
        this.init()
    }
    hasRuntime() {
        var t;
        return !!(typeof chrome < "u" && ((t = chrome == null ? void 0 : chrome.runtime) != null && t.id))
    }
    createShadowHost() {
        const t = document.createElement("div");
        return t.id = `${this.NAMESPACE}-shadow-host`, t.style.cssText = `
      position: fixed !important;
      width: 0 !important;
      height: 0 !important;
      overflow: visible !important;
      pointer-events: none !important;
      z-index: 10000 !important;
      top: 0 !important;
      left: 0 !important;
    `, document.body.appendChild(t), t
    }
    injectIframeFixes() {
        // User requested removal of per-site hacks.
        // The panel should overlay safely without modifying Google's internal layout.
    }
    injectStyles() {
        const t = document.createElement("style");
        t.textContent = `
      /* Shadow DOM scoped styles - isolated from host page */
      :host {
        /* Spacing tokens */
        --space-xxs: 2px;
        --space-xs: 4px;
        --space-sm: 8px;
        --space-md: 12px;
        --space-lg: 16px;
        --space-xl: 24px;
        --space-xxl: 32px;
        --space-icon-gap: 8px;

        /* Font size tokens */
        --font-size-xs: 11px;
        --font-size-sm: 12px;
        --font-size-base: 14px;
        --font-size-lg: 16px;
        --font-size-xl: 18px;

        /* Border radius tokens */
        --radius-sm: 4px;
        --radius-md: 6px;
        --radius-lg: 8px;
        --radius-full: 9999px;

        /* Color tokens - light theme */
        --color-bg-primary: #ffffff;
        --color-bg-secondary: #f8f9fa;
        --color-bg-hover: #e9ecef;
        --color-bg-active: #dee2e6;
        --color-border: #dee2e6;
        --color-text-primary: #212529;
        --color-text-secondary: #6c757d;
        --color-text-inverse: #ffffff;
        --color-shadow: rgba(0, 0, 0, 0.15);
        --color-tray-border: #eeeeec;
        --color-tray-hover: #eeeeec;
        --color-tray-focus: #d3d3cf;

        /* Provider colors */
        --color-google: #4285f4;
        --color-chatgpt: #10a37f;
        --color-gemini: #1a73e8;

        /* Z-index tokens */
        --z-dropdown: 9999;
        --z-modal: 10000;

        /* Animation tokens */
        --transition-fast: 100ms ease-out;
        --transition-normal: 200ms ease-out;
        --transition-bounce: 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      /* Dark theme color tokens */
      :host([data-theme="dark"]) {
        --color-bg-primary: #212121;
        --color-bg-secondary: #2d2d2d;
        --color-bg-hover: #393939;
        --color-bg-active: #404040;
        --color-border: #404040;
        --color-text-primary: #ffffff;
        --color-text-secondary: #cccccc;
        --color-text-inverse: #000000;
        --color-shadow: rgba(0, 0, 0, 0.4);
        --color-tray-border: #303030;
        --color-tray-hover: #393939;
        --color-tray-focus: #555555;
      }

      .select-to-search-container {
        position: fixed;
        display: inline-flex;
        align-items: center;
        gap: var(--space-icon-gap);
        padding: 6px 10px;
        height: 44px;
        
        /* Glassmorphism Capsule Design - Dark Reader Proofing */
        /* Diagonal gradient for contrast and depth */
        background-image: linear-gradient(145deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.1)) !important;
        background-color: transparent !important;
        
        backdrop-filter: blur(16px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
        
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        border-radius: 9999px !important;
        box-shadow: 
          /* Bevel Highlight (Top-Left) */
          inset 1px 1px 0 rgba(255, 255, 255, 0.6),
          /* Bevel Shadow (Bottom-Right) */
          inset -1px -1px 0 rgba(0, 0, 0, 0.05),
          /* Ambient Shadow (All around) */
          0 0 20px rgba(0, 0, 0, 0.1),
          /* Directional Shadow (Bottom-Right prominent) */
          5px 10px 20px rgba(0, 0, 0, 0.15) !important;
        
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        font-size: var(--font-size-xs);
        line-height: 1.2;
        box-sizing: border-box;
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
        
        /* Force Text/Icon Color to Dark (since bg is forced white) */
        color: #212529 !important;
        
        /* Ensure Dark Reader doesn't mess this up */
        color-scheme: light !important;
        isolation: isolate !important;
      }

      .select-to-search-button {
        all: unset;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0 !important;
        background: transparent;
        appearance: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        color: var(--color-text-primary);
        font-size: var(--font-size-xs);
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        outline: none;
        box-sizing: border-box;
      }

      .select-to-search-icon-button {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        transition: transform var(--transition-bounce), background-color 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .select-to-search-icon-button:hover,
      .select-to-search-icon-button:focus-visible {
        background-color: rgba(0, 0, 0, 0.05) !important;
        transform: scale(1.15) translateY(-1px);
      }

      .select-to-search-icon-button:active {
        transform: scale(0.95);
      }

      .select-to-search-icon-button:focus-visible {
        outline: 2px solid var(--color-tray-focus);
        outline-offset: 2px;
      }

      .select-to-search-button-gemini {
        background-color: transparent;
        font-weight: 700;
        font-size: 12px;
        letter-spacing: -0.2px;
      }

      .select-to-search-icon {
        display: block;
        width: 20px;
        height: 20px;
        object-fit: contain;
        pointer-events: none;
        filter: none !important; /* Protect icons from inversion */
        /* Force icons to maintain their natural colors or dark fallback */
        /* Boost Contrast/Saturation for Google/Gemini + Strong Black Drop Shadow */
        filter: saturate(1.2) contrast(1.1) drop-shadow(0 2px 3px rgba(0,0,0,0.6)) !important;
      }

      .select-to-search-icon-google {
        width: 22px;
        height: 22px;
      }

      .select-to-search-icon-gemini {
        width: 20px;
        height: 20px;
      }
      
      /* Ensure ChatGPT icon (usually black) is visible on light glass */
      .select-to-search-icon-chatgpt {
        opacity: 0.8;
      }

      :host([data-theme="dark"]) .select-to-search-icon-chatgpt {
        /* If we ever support dark mode in the glass UI explicitly, we might invert this. 
           But since we force light glass, keep it dark. */
        filter: none; 
      }

      .select-to-search-picker {
        min-width: 120px;
        height: auto;
        padding: var(--space-xs) var(--space-md);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-full);
        background: var(--color-bg-primary);
        color: var(--color-text-secondary);
        line-height: 1.4;
      }

      .select-to-search-picker:hover {
        color: var(--color-text-primary);
        background: var(--color-bg-hover);
      }

      .select-to-search-picker:focus-visible {
        outline: 2px solid var(--color-google);
        outline-offset: 2px;
      }

      .select-to-search-picker-menu {
        position: fixed;
        display: flex;
        flex-direction: column;
        min-width: 140px;
        background: var(--color-bg-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        box-shadow: 0 4px 12px var(--color-shadow);
        z-index: var(--z-modal);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        font-size: var(--font-size-sm);
        overflow: hidden;
      }

      .select-to-search-picker-item {
        display: flex;
        align-items: center;
        padding: var(--space-sm) var(--space-md);
        background: var(--color-bg-primary);
        border: none;
        color: var(--color-text-primary);
        font-size: var(--font-size-sm);
        font-weight: 500;
        cursor: pointer;
        transition: background-color var(--transition-fast);
        text-align: left;
        outline: none;
      }

      .select-to-search-picker-item:hover {
        background: var(--color-bg-hover);
      }

      .select-to-search-picker-item:focus-visible {
        outline: 2px solid var(--color-google);
        outline-offset: -2px;
      }

      .select-to-search-picker-item:not(:last-child) {
        border-bottom: 1px solid var(--color-border);
      }

      @media (prefers-reduced-motion: reduce) {
        .select-to-search-container,
        .select-to-search-button,
        .select-to-search-icon-button,
        .select-to-search-picker-item {
          transition: none;
        }
      }
    `, this.shadowRoot.appendChild(t)
    }
    getDefaultSettings() {
        return {
            enabled: !0,
            providers: {
                chatgpt: !0,
                google: !0,
                gemini: !0
            },
            affordanceMode: "quick-actions",
            theme: "light"
        }
    }
    init() {
        this.loadSettings(), document.addEventListener("mouseup", this.handleMouseUp.bind(this)), document.addEventListener("keyup", this.handleKeyUp.bind(this)), document.addEventListener("click", this.handleDocumentClick.bind(this)), document.addEventListener("keydown", this.handleKeyDown.bind(this)), document.addEventListener("scroll", this.handleScroll.bind(this), !0), document.addEventListener("selectionchange", this.handleSelectionChange.bind(this)), this.hasRuntime() && chrome.runtime.onMessage.addListener(t => {
            if (t.type === "SETTINGS_UPDATED") {
                const e = this.settings.enabled;
                this.settings = t.settings, this.applyTheme(this.settings.theme || "light"), this.hideFloatingUI(), e && !this.settings.enabled ? this.detachShadowHost() : !e && this.settings.enabled && this.attachShadowHost()
            }
        }), window.addEventListener("beforeunload", this.cleanup.bind(this));
        this.createPanelHandle()
    }

    createPanelHandle() {
        if (window.self !== window.top) return;
        if (this.panelHandle) return;

        // Restore vertical position
        const savedTop = localStorage.getItem("searchflow_handle_top");
        if (savedTop) {
            this.handleTopPercent = Number(savedTop);
        }

        const handle = document.createElement("div");
        handle.style.cssText = `
            position: fixed;
            top: ${this.handleTopPercent}%;
            right: 0;
            width: 24px;
            height: 140px;
            background: rgba(255, 255, 255, 0.5);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.4);
            border-right: none;
            box-shadow: 0 4px 16px rgba(0,0,0,0.2), inset 1px 1px 0 rgba(255,255,255,0.4), inset 0 0 15px rgba(66, 133, 244, 0.4);
            border-radius: 16px 0 0 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 2147483647;
            transform: translateY(-50%);
            transition: right 0.3s cubic-bezier(0.2, 0.0, 0, 1), background-color 0.2s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        `;

        const arrow = document.createElement("span");
        arrow.textContent = "‹";
        arrow.style.cssText = `
            font-size: 24px;
            font-weight: 700;
            color: rgba(0,0,0,0.6);
            user-select: none;
            pointer-events: none;
            transition: color 0.2s ease;
        `;

        handle.appendChild(arrow);
        handle._arrow = arrow;

        // Hover feedback (subtle)
        handle.addEventListener("mouseenter", () => {
            handle.style.backgroundColor = "rgba(255, 255, 255, 0.85)";
            handle.style.transform = "translateY(-50%) scale(1.15)";
            arrow.style.color = "rgba(0,0,0,0.9)";
        });
        handle.addEventListener("mouseleave", () => {
            handle.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
            handle.style.transform = "translateY(-50%)";
            arrow.style.color = "rgba(0,0,0,0.6)";
        });

        // Drag Logic
        let isDragging = false;
        let startY = 0;
        let hasMoved = false;

        handle.addEventListener("mousedown", e => {
            if (e.button !== 0) return; // left click only
            isDragging = true;
            startY = e.clientY;
            hasMoved = false;
            handle.style.cursor = "grabbing";
            e.preventDefault();
        });

        document.addEventListener("mousemove", e => {
            if (!isDragging) return;

            if (!hasMoved && Math.abs(e.clientY - startY) > 5) {
                hasMoved = true;
            }

            const percent = (e.clientY / window.innerHeight) * 100;

            // clamp movement
            this.handleTopPercent = Math.min(85, Math.max(15, percent));

            handle.style.top = this.handleTopPercent + "%";
        });

        document.addEventListener("mouseup", () => {
            if (!isDragging) return;
            isDragging = false;
            handle.style.cursor = "pointer";
            
            if (hasMoved) {
                localStorage.setItem("searchflow_handle_top", this.handleTopPercent);
            } else {
                // Treat as click if didn't move significantly
                this.togglePanelFromHandle();
            }
        });

        document.body.appendChild(handle);
        this.panelHandle = handle;
    }

    togglePanelFromHandle() {
        if (!this.searchPanel) {
            // If panel doesn't exist yet, create it implicitly by opening default search
            // But we should follow the spec: "If panel doesn't exist, treat as CLOSED"
            // If text selected -> run search. If nothing -> blank Google search.
             const selectedText = window.getSelection()?.toString().trim();

            if (selectedText) {
                // If text is selected, the floating UI logic usually handles this, 
                // but if we use the handle, we should open Google with that text.
                this.openProvider("google", selectedText);
            } else {
                this.openSearchPanel("https://www.google.com/search?igu=1&q=");
            }
            return;
        }

        const isOpen = !this.searchPanel.style.transform.includes("100%");

        if (isOpen) {
            // CLOSE panel
            this.closeSearchPanel();
        } else {
            // OPEN panel
            const selectedText = window.getSelection()?.toString().trim();

            if (selectedText) {
                // If text is selected, run search
                 this.openProvider("google", selectedText);
            } else {
                // If nothing selected, just RE-OPEN the panel to preserve history/state
                requestAnimationFrame(() => {
                    this.searchPanel.style.transform = "translateX(0)";
                    if (this.panelHandle) {
                        this.panelHandle.style.right = this.searchPanel.getBoundingClientRect().width + "px";
                        if (this.panelHandle._arrow) this.panelHandle._arrow.textContent = "›";
                    }
                });
            }
        }
    }

    expandSearchPanel() {
        // Deprecated by new handle logic, but might be called by other things?
        // Let's redirect to openSearchPanel if needed or just remove usage.
        // It was used by the old handle click listener.
        // We can remove this method if we replace the handle creation.
    }
    loadSettings() {
        this.hasRuntime() && chrome.runtime.sendMessage({
            type: "GET_SETTINGS"
        }, t => {
            if (chrome.runtime.lastError) {
                console.error("Failed to load settings:", chrome.runtime.lastError);
                return
            }
            t && (this.settings = t, this.applyTheme(this.settings.theme || "light"), this.settings.enabled || this.detachShadowHost())
        })
    }
    applyTheme(t) {
        this.shadowHost.dataset.theme = t
    }
    attachShadowHost() {
        this.shadowHost.parentNode || document.body.appendChild(this.shadowHost)
    }
    detachShadowHost() {
        this.shadowHost.parentNode && this.shadowHost.remove()
    }
    handleMouseUp(t) {
        this.settings.enabled && (this.selectionTimeout = window.setTimeout(() => {
            this.checkSelection()
        }, 10))
    }
    handleKeyUp(t) {
        this.settings.enabled && t.key !== "Escape" && (this.selectionTimeout = window.setTimeout(() => {
            this.checkSelection()
        }, 10))
    }
    handleSelectionChange() {
        const t = window.getSelection();
        (!t || t.isCollapsed) && this.hideFloatingUI()
    }
    checkSelection() {
        const t = window.getSelection();
        if (!t || t.isCollapsed) {
            this.hideFloatingUI();
            return
        }
        const e = t.toString().trim();
        if (!e) {
            this.hideFloatingUI();
            return
        }
        const i = t.getRangeAt(0),
            o = i.startContainer;
        if (this.isInEditableElement(o)) {
            this.hideFloatingUI();
            return
        }
        this.showFloatingUI(e, i, t)
    }
    isInEditableElement(t) {
        t.nodeType === Node.TEXT_NODE && (t = t.parentElement);
        const e = t,
            i = e;
        return e.tagName === "INPUT" || e.tagName === "TEXTAREA" || i.isContentEditable || e.closest('input, textarea, [contenteditable="true"]') !== null
    }
    showFloatingUI(t, e, i) {
        if (!this.settings.enabled) return;
        this.hideFloatingUI();
        const o = document.createElement("div");
        o.className = `${this.NAMESPACE}-container`, o.setAttribute("role", "toolbar"), o.setAttribute("aria-label", "Search providers"), o.style.visibility = "hidden";
        
        // Force pointer events and z-index (PART E.1)
        o.style.pointerEvents = "auto";
        o.style.zIndex = "2147483647";

        // Prevent hostile sites from cancelling clicks (PART E.2)
        o.addEventListener("mousedown", e => {
            e.stopPropagation();
        });
        o.addEventListener("click", e => {
            e.stopPropagation();
        });

        const s = [];
        this.settings.providers.chatgpt && s.push(this.createButton("ChatGPT", "chatgpt", t)), this.settings.providers.google && s.push(this.createButton("Google Search", "google", t)), this.settings.providers.gemini && s.push(this.createButton("Gemini", "gemini", t)), s.forEach(r => {
            o.appendChild(r)
        }), this.shadowRoot.appendChild(o);
        const n = this.getSelectionEndRect(i, e);
        this.positionContainer(o, n), o.style.visibility = "", this.floatingUI.container = o, this.floatingUI.buttons = s, this.floatingUI.isVisible = !0, requestAnimationFrame(() => {
            o.classList.add("visible")
        })
    }
    createButton(t, e, i) {
        const o = document.createElement("button");
        if (o.className = `${this.NAMESPACE}-button ${this.NAMESPACE}-button-${e} ${this.NAMESPACE}-icon-button`, o.type = "button", o.title = t, o.setAttribute("aria-label", t), o.setAttribute("data-provider", e), (e === "chatgpt" || e === "google" || e === "gemini") && this.hasRuntime()) {
            const n = document.createElement("img");
            n.className = `${this.NAMESPACE}-icon ${this.NAMESPACE}-icon-${e}`, n.alt = t, n.src = chrome.runtime.getURL(`icons/${e}.svg`), o.appendChild(n)
        } else {
            const n = e === "google" ? "G" : (e === "gemini" ? "Ge" : "C");
            o.textContent = n
        }
        return o.addEventListener("click", n => {
            n.stopPropagation(), this.openProvider(e, i)
        }), o
    }
    positionContainer(t, e) {
        const i = t.style;
        i.position = "fixed", i.zIndex = "9999";
        const o = t.getBoundingClientRect(),
            s = o.height || 30,
            n = o.width || 60,
            r = 6,
            c = window.innerHeight,
            a = window.innerWidth,
            l = this.getCandidatePositions(e, n, s, r, a, c),
            h = this.getBestPosition(t, l, n, s);
        i.top = `${h.top}px`, i.left = `${h.left}px`
    }
    getSelectionEndRect(t, e) {
        const i = t.focusNode,
            o = t.focusOffset;
        if (i) try {
            const n = e.cloneRange();
            n.setStart(i, o), n.collapse(!0);
            const r = n.getBoundingClientRect();
            if (r && (r.width || r.height)) return r;
            const c = n.getClientRects();
            if (c.length) return c[c.length - 1]
        } catch {}
        const s = e.getClientRects();
        return s.length ? s[s.length - 1] : e.getBoundingClientRect()
    }
    openProvider(t, e) {
        const i = this.PROVIDER_URLS[t](e);
        
        // List of domains that block iframe embedding (CSP frame-src)
        const strictCspHosts = [
            "chatgpt.com",
            "openai.com",
            "github.com",
            "gitlab.com",
            "twitter.com",
            "x.com",
            "facebook.com",
            "instagram.com",
            "linkedin.com"
        ];
        
        const isStrictCsp = strictCspHosts.some(host => window.location.hostname.endsWith(host));

        if (t === "google" && !isStrictCsp && window.self === window.top) {
            this.lastSearchUrl = i;
            this.openSearchPanel(i);
            this.hideFloatingUI();
        } else {
            chrome.runtime.sendMessage({
                type: "OPEN_TAB",
                url: i
            });
        }
    }
    hideFloatingUI() {
        this.floatingUI.container && this.floatingUI.isVisible && (this.floatingUI.container.remove(), this.floatingUI.container = null, this.floatingUI.buttons = [], this.floatingUI.isVisible = !1), this.selectionTimeout && (clearTimeout(this.selectionTimeout), this.selectionTimeout = null)
    }
    handleDocumentClick(t) {
        this.floatingUI.container && !this.floatingUI.container.contains(t.target) && this.hideFloatingUI()
    }
    handleKeyDown(t) {
        if (t.key === "Escape") {
            this.floatingUI.isVisible && this.hideFloatingUI();
            this.closeSearchPanel();
        }
    }
    handleScroll() {
        this.hideFloatingUI()
    }
    cleanup() {
        this.hideFloatingUI(), this.shadowHost && this.shadowHost.parentNode && this.shadowHost.remove(), document.removeEventListener("mouseup", this.handleMouseUp.bind(this)), document.removeEventListener("keyup", this.handleKeyUp.bind(this)), document.removeEventListener("click", this.handleDocumentClick.bind(this)), document.removeEventListener("keydown", this.handleKeyDown.bind(this)), document.removeEventListener("scroll", this.handleScroll.bind(this), !0), document.removeEventListener("selectionchange", this.handleSelectionChange.bind(this)), window.removeEventListener("beforeunload", this.cleanup.bind(this))
    }
    getCandidatePositions(t, e, i, o, s, n) {
        const c = this.clamp(t.left + t.width / 2 - e / 2, 4, s - e - 4),
            a = this.clamp(t.bottom + o, 4, n - i - 4),
            l = this.clamp(t.top - i - o, 4, n - i - 4),
            h = this.clamp(t.right + o, 4, s - e - 4),
            m = this.clamp(t.left - e - o, 4, s - e - 4),
            g = this.clamp(t.top + t.height / 2 - i / 2, 4, n - i - 4);
        return [{
            top: a,
            left: c
        }, {
            top: l,
            left: c
        }, {
            top: g,
            left: h
        }, {
            top: g,
            left: m
        }]
    }
    getBestPosition(t, e, i, o) {
        let s = e[0],
            n = Number.POSITIVE_INFINITY;
        for (const r of e) {
            const c = new DOMRect(r.left, r.top, i, o),
                a = this.getOverlapScore(c, t);
            a < n && (s = r, n = a);
            if (a === 0) break
        }
        return s
    }
    getOverlapScore(t, e) {
        const i = this.getOverlappingRects(t, e);
        return i.length ? i.reduce((o, s) => o + this.getIntersectionArea(t, s), 0) : 0
    }
    getOverlappingRects(t, e) {
        const i = this.getSamplePoints(t),
            o = new Set;
        i.forEach(n => {
            document.elementsFromPoint(n.x, n.y).forEach(r => o.add(r))
        });
        const s = [];
        return o.forEach(n => {
            if (!n || n === document.body || n === document.documentElement || e.contains(n) || n.contains(e)) return;
            const r = window.getComputedStyle(n);
            if (r.visibility === "hidden" || r.display === "none" || r.pointerEvents === "none") return;
            const c = r.position;
            if (c !== "fixed" && c !== "absolute" && c !== "sticky") return;
            const a = n.getBoundingClientRect();
            !a || a.width === 0 || a.height === 0 || !(a.left < t.right && a.right > t.left && a.top < t.bottom && a.bottom > t.top) || s.push(a)
        }), s
    }
    getSamplePoints(t) {
        return [{
            x: t.left + 1,
            y: t.top + 1
        }, {
            x: t.right - 1,
            y: t.top + 1
        }, {
            x: t.left + 1,
            y: t.bottom - 1
        }, {
            x: t.right - 1,
            y: t.bottom - 1
        }, {
            x: t.left + t.width / 2,
            y: t.top + t.height / 2
        }].map(o => ({
            x: this.clamp(o.x, 0, window.innerWidth - 1),
            y: this.clamp(o.y, 0, window.innerHeight - 1)
        }))
    }
    getIntersectionArea(t, e) {
        const i = Math.max(0, Math.min(t.right, e.right) - Math.max(t.left, e.left)),
            o = Math.max(0, Math.min(t.bottom, e.bottom) - Math.max(t.top, e.top));
        return i * o
    }
    clamp(t, e, i) {
        return Number.isNaN(t) ? e : Math.max(e, Math.min(t, i))
    }

    createSearchPanel() {
        if (this.searchPanel) return;

        // Inject global styles for theme-aware header
        if (!document.getElementById("sts-global-styles")) {
            const style = document.createElement("style");
            style.id = "sts-global-styles";
            style.textContent = `
                #sts-panel-header {
                    background-color: #ffffff;
                    border-bottom: 1px solid rgba(0,0,0,0.08);
                }
                @media (prefers-color-scheme: dark) {
                    #sts-panel-header {
                        background-color: #202124;
                        border-bottom: 1px solid rgba(255,255,255,0.08);
                    }
                }
                .sts-header-btn {
                    opacity: 0.65;
                    transition: opacity 0.2s ease;
                    cursor: pointer;
                    width: 48px;
                    height: 48px;
                    padding: 8px;
                    border-radius: 6px;
                }
                .sts-header-btn:hover {
                    opacity: 1.0;
                    background-color: rgba(0,0,0,0.04);
                }

                #sts-search-panel {
                    position: fixed;
                    top: 0;
                    right: 0;
                    width: 420px;
                    height: 100vh;
                    background: #fff;
                    z-index: 2147483647;
                    box-shadow: -8px 0 24px rgba(0,0,0,0.15); /* Prominent shadow */
                    transform: translateX(100%);
                    transition: transform 0.3s cubic-bezier(0.2, 0.0, 0, 1);
                    display: flex;
                    flex-direction: column;
                    padding-left: 8px;
                    box-sizing: border-box;
                }
            `;
            document.head.appendChild(style);
        }

        const panel = document.createElement("div");
        panel.id = "sts-search-panel";
        // Styles are now in sts-global-styles to support pseudo-elements


        // PART 2: Extension Header (Toolbar)
        const header = document.createElement("div");
        header.id = "sts-panel-header";
        header.style.cssText = `
         height: 64px;
         flex-shrink: 0;
         display: flex;
         align-items: center;
         justify-content: space-between;
         padding: 0 16px;
         box-sizing: border-box;
       `;

        // Left: Navigation Buttons
        const leftControls = document.createElement("div");
        leftControls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 16px;
        `;

        const createBtn = (iconName, title, onClick) => {
            const btn = document.createElement("img");
            btn.className = "sts-header-btn";
            if (this.hasRuntime()) {
                btn.src = chrome.runtime.getURL(`icons/${iconName}`);
            }
            btn.title = title;
            btn.onclick = (e) => { e.stopPropagation(); onClick(); };
            return btn;
        };

        if (this.hasRuntime()) {
            leftControls.appendChild(createBtn("back_button.png", "Back", () => this.goBackInPanel()));
            leftControls.appendChild(createBtn("home_button.png", "Home", () => this.goHomeInPanel()));
            leftControls.appendChild(createBtn("open_in_new_tab_button.png", "Search in New Tab", () => this.openCurrentPageInNewTab()));
        }

        header.appendChild(leftControls);

        // Right: Brand (Banner Style)
        const brandContainer = document.createElement("div");
        brandContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            user-select: none;
            height: 90%;
            margin: auto 0;
        `;

        const brandText = document.createElement("span");
        brandText.textContent = "SearchFlow";
        brandText.style.cssText = `
            font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            font-size: 18px;
            font-weight: 600;
            color: #202124; /* Solid color */
            letter-spacing: 1px; /* Spacious */
            text-shadow: 0 1px 3px rgba(0,0,0,0.1); /* Subtle shadow */
        `;
        // Dark mode adjustment for text
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
             brandText.style.color = "#ffffff";
        }
        
        brandContainer.appendChild(brandText);

        if (this.hasRuntime()) {
            const brandIcon = document.createElement("img");
            brandIcon.src = chrome.runtime.getURL("icons/icon128.png");
            brandIcon.alt = "";
            brandIcon.style.cssText = `
                height: 80%;
                width: auto;
                object-fit: contain;
                display: block;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); /* Subtle shadow */
            `;
            brandContainer.appendChild(brandIcon);
        }

        header.appendChild(brandContainer);
        
        const iframe = document.createElement("iframe");
        iframe.style.cssText = `
         width: 100%;
         flex: 1;
         border: none;
         display: block;
         overflow: auto;
       `;

        panel.appendChild(header);
        panel.appendChild(iframe);
        document.body.appendChild(panel);

        this.searchPanel = panel;
        this.searchIframe = iframe;
    }

    openSearchPanel(url) {
        // ALLOW ALL URLs (User handles refused connections manually via ↗ button)
        this.createSearchPanel();
        
        // Store search URL properly (PART A)
        if (url.includes("google.com/search")) {
            this.lastSearchUrl = url;
        }

        this.searchIframe.src = url;
        requestAnimationFrame(() => {
            this.searchPanel.style.transform = "translateX(0)";
            
            // Handlebar Logic: Attach to panel
            if (this.panelHandle) {
                this.panelHandle.style.right = this.searchPanel.getBoundingClientRect().width + "px"; // match panel width
                if (this.panelHandle._arrow) this.panelHandle._arrow.textContent = "›";
            }
        });
    }

    goBackInPanel() {
        if (!this.searchIframe) return;

        const iframe = this.searchIframe;
        const beforeUrl = iframe.src;

        try {
            iframe.contentWindow.history.back();
        } catch {
            // ignore
        }

        setTimeout(() => {
            const afterUrl = iframe.src;

            // If back failed, fallback to original search
            if (afterUrl === beforeUrl && this.lastSearchUrl) {
                iframe.src = this.lastSearchUrl;
            }
        }, 300);
    }

    goHomeInPanel() {
        if (!this.searchIframe) return;
        this.searchIframe.src = "https://www.google.com/search?igu=1&q=";
        this.searchPanel.style.transform = "translateX(0)";
    }

    openCurrentPageInNewTab() {
        if (!this.searchIframe) return;

        let url = this.searchIframe.src;
        
        // Try to get the real current URL (works if same-origin)
        try {
            const currentUrl = this.searchIframe.contentWindow.location.href;
            if (currentUrl && currentUrl !== "about:blank") {
                url = currentUrl;
            }
        } catch (e) {
            // Cross-origin access blocked: fallback to iframe.src
        }

        if (!url || url === "about:blank") return;

        window.open(url, "_blank");
    }

    openSearchInNewTab() {
        if (this.lastSearchUrl) {
            window.open(this.lastSearchUrl, "_blank");
        }
    }

    closeSearchPanel() {
        if (!this.searchPanel) return;
        this.searchPanel.style.transform = "translateX(100%)";
        
        // Handlebar Logic: Reset to right edge
        if (this.panelHandle) {
             this.panelHandle.style.right = "0";
             if (this.panelHandle._arrow) this.panelHandle._arrow.textContent = "‹";
        }
        
        // IMPORTANT: do NOT reset iframe src
    }
}

function p() {
    if (!document.body) return;
    document.querySelectorAll('[id^="select-to-search-shadow-host"]').forEach(e => e.remove()), location.hostname === "gemini.google.com" ? setTimeout(() => {
        new u
    }, 500) : new u
}
window.addEventListener("pageshow", d => {
    d.persisted && setTimeout(() => {
        p()
    }, 100)
});
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", p) : p();
