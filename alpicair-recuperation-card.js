/*!
 * Alpicair Recuperation Card
 * https://github.com/keziksdmitrijs-byte/Alpicair-Recuperation
 *
 * Three custom elements are registered from this single file so HACS only
 * needs to load one resource:
 *   - alpicair-recuperation-card            (ring gauge + mode control, square)
 *   - alpicair-recuperation-sensors-card    (temperatures + target-temp slider, square)
 *   - alpicair-recuperation-card-settings   (dedicated settings screen)
 *
 * No build step, no external dependencies. Uses <ha-icon> which is already
 * available globally inside Home Assistant's frontend.
 */

/* ----------------------------------------------------------------------- */
/*  Shared: design tokens, translations, small helpers                     */
/* ----------------------------------------------------------------------- */

const RC_STORAGE_LANG = "alpicair-recuperation-card-language";
const RC_STORAGE_THEME = "alpicair-recuperation-card-theme";
const RC_EVENT_SETTINGS_CHANGED = "alpicair-recuperation-card-settings-changed";

const RC_MODES = ["off", "building_protection", "economy", "comfort", "boost"];
const RC_ACTIVE_MODES = ["building_protection", "economy", "comfort", "boost"];

const RC_MODE_META = {
  off: { icon: "mdi:power", accent: "var(--rc-muted)" },
  building_protection: { icon: "mdi:shield-home-outline", accent: "#5B8DEF" },
  economy: { icon: "mdi:leaf", accent: "#4FD1C5" },
  comfort: { icon: "mdi:sofa-outline", accent: "#F6AD55" },
  boost: { icon: "mdi:rocket-launch-outline", accent: "#F4587E" },
};

const RC_I18N = {
  en: {
    title: "Alpicair Recuperation",
    settings: "Settings",
    back: "Back",
    fan_speed: "Fan speed",
    recuperation: "Recuperation",
    indoor: "Indoor",
    outdoor: "Outdoor",
    supply: "Supply air",
    off: "Off",
    building_protection: "Building protection",
    economy: "Economy",
    comfort: "Comfort",
    boost: "Boost",
    running: "Running",
    stopped: "Stopped",
    tap_hint: "Tap to change",
    target_temp: "Target temperature",
    language: "Language",
    theme: "Appearance",
    theme_light: "Light",
    theme_dark: "Dark",
    theme_auto: "Match Home Assistant",
    button_actions: "Button behaviour",
    tap: "Tap",
    hold: "Hold",
    entities: "Entities",
    not_configured: "Not configured",
    saved: "Saved",
  },
  ru: {
    title: "Alpicair Рекуператор",
    settings: "Настройки",
    back: "Назад",
    fan_speed: "Скорость вентилятора",
    recuperation: "Рекуперация",
    indoor: "В доме",
    outdoor: "На улице",
    supply: "Приточный воздух",
    off: "Выключено",
    building_protection: "Защита здания",
    economy: "Экономия",
    comfort: "Комфорт",
    boost: "Ускоренный",
    running: "Работает",
    stopped: "Остановлен",
    tap_hint: "Нажмите, чтобы сменить",
    target_temp: "Целевая температура",
    language: "Язык",
    theme: "Оформление",
    theme_light: "Светлая",
    theme_dark: "Тёмная",
    theme_auto: "Как в Home Assistant",
    button_actions: "Действия кнопок",
    tap: "Короткое нажатие",
    hold: "Долгое нажатие",
    entities: "Сущности",
    not_configured: "Не настроено",
    saved: "Сохранено",
  },
  lv: {
    title: "Alpicair Rekuperators",
    settings: "Iestatījumi",
    back: "Atpakaļ",
    fan_speed: "Ventilatora ātrums",
    recuperation: "Rekuperācija",
    indoor: "Telpā",
    outdoor: "Ārā",
    supply: "Pievadītais gaiss",
    off: "Izslēgts",
    building_protection: "Ēkas aizsardzība",
    economy: "Ekonomija",
    comfort: "Komforts",
    boost: "Paātrināts",
    running: "Darbojas",
    stopped: "Apturēts",
    tap_hint: "Pieskaries, lai mainītu",
    target_temp: "Mērķa temperatūra",
    language: "Valoda",
    theme: "Izskats",
    theme_light: "Gaišs",
    theme_dark: "Tumšs",
    theme_auto: "Kā Home Assistant",
    button_actions: "Pogu darbības",
    tap: "Īss pieskāriens",
    hold: "Ilgs pieskāriens",
    entities: "Entītijas",
    not_configured: "Nav konfigurēts",
    saved: "Saglabāts",
  },
};

function rcGetLang(configLang) {
  if (configLang && configLang !== "auto") return configLang;
  const stored = window.localStorage.getItem(RC_STORAGE_LANG);
  if (stored && RC_I18N[stored]) return stored;
  return "en";
}

function rcGetTheme(configTheme) {
  if (configTheme && configTheme !== "auto") return configTheme;
  const stored = window.localStorage.getItem(RC_STORAGE_THEME);
  if (stored === "light" || stored === "dark") return stored;
  return "auto";
}

function rcT(lang, key) {
  return (RC_I18N[lang] && RC_I18N[lang][key]) || RC_I18N.en[key] || key;
}

function rcFireEvent(el, type, detail) {
  const event = new CustomEvent(type, {
    detail,
    bubbles: true,
    composed: true,
  });
  el.dispatchEvent(event);
}

function rcClampPercent(value) {
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.min(100, n));
}

const RC_STYLES = `
  :host {
    --rc-radius: 20px;
    --rc-accent-cool: #4FD1C5;
    --rc-accent-warm: #F6AD55;
    --rc-transition: 220ms cubic-bezier(.4,0,.2,1);
  }
  :host([data-rc-theme="dark"]) {
    --rc-bg: #131B29;
    --rc-surface: #1C2740;
    --rc-surface-2: #223154;
    --rc-text: #E8EEF5;
    --rc-muted: #8CA0B3;
    --rc-border: rgba(255,255,255,0.06);
    --rc-shadow: 0 10px 30px rgba(3, 8, 20, 0.45);
  }
  :host([data-rc-theme="light"]) {
    --rc-bg: #F5F7FA;
    --rc-surface: #FFFFFF;
    --rc-surface-2: #EEF2F7;
    --rc-text: #1A2332;
    --rc-muted: #64748B;
    --rc-border: rgba(20,30,50,0.08);
    --rc-shadow: 0 10px 30px rgba(20, 30, 50, 0.10);
  }
  .rc-card {
    background: var(--rc-bg);
    color: var(--rc-text);
    border-radius: var(--rc-radius);
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 16px;
    box-shadow: var(--rc-shadow);
    box-sizing: border-box;
    overflow: hidden;
  }
`;

/* ----------------------------------------------------------------------- */
/*  Action handling shared by all cards (tap / hold)                       */
/* ----------------------------------------------------------------------- */

function rcHandleAction(el, hass, actionConfig) {
  if (!actionConfig || actionConfig.action === "none") return;
  switch (actionConfig.action) {
    case "navigate": {
      if (actionConfig.navigation_path) {
        window.history.pushState(null, "", actionConfig.navigation_path);
        window.dispatchEvent(new CustomEvent("location-changed", {
          bubbles: true, composed: true,
        }));
      }
      break;
    }
    case "url": {
      if (actionConfig.url_path) window.open(actionConfig.url_path, "_blank");
      break;
    }
    case "call-service":
    case "perform-action": {
      const serviceStr = actionConfig.service || actionConfig.perform_action;
      if (!serviceStr || !hass) break;
      const [domain, service] = serviceStr.split(".");
      hass.callService(
        domain,
        service,
        actionConfig.service_data || actionConfig.data || {},
        actionConfig.target
      );
      break;
    }
    case "more-info": {
      const entityId = actionConfig.entity;
      if (entityId) {
        window.dispatchEvent(new CustomEvent("hass-more-info", {
          detail: { entityId }, bubbles: true, composed: true,
        }));
      }
      break;
    }
    default:
      break;
  }
}

/**
 * Attach tap/hold handling to an element. Calls onTap()/onHold() callbacks.
 * Hold threshold ~500ms. Works with mouse + touch via pointer events.
 */
function rcBindPressActions(el, { onTap, onHold, holdTimeMs = 500 }) {
  let pressTimer = null;
  let didHold = false;

  const clear = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  el.addEventListener("pointerdown", () => {
    didHold = false;
    clear();
    pressTimer = setTimeout(() => {
      didHold = true;
      onHold && onHold();
    }, holdTimeMs);
  });

  const finish = () => {
    clear();
    if (!didHold) {
      onTap && onTap();
    }
  };

  el.addEventListener("pointerup", finish);
  el.addEventListener("pointerleave", clear);
  el.addEventListener("pointercancel", clear);

  el.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" || ev.key === " ") {
      ev.preventDefault();
      onTap && onTap();
    }
  });
}

/* ----------------------------------------------------------------------- */
/*  Visual editor helpers                                                  */
/*  Home Assistant's own <ha-form> (with its selector types: entity,       */
/*  select, ui_action, text…) is reused here instead of hand-rolling a     */
/*  form, so the editor looks and behaves exactly like HA's built-in ones. */
/* ----------------------------------------------------------------------- */

let _rcHaFormLoading = null;

function rcEnsureHaForm() {
  if (customElements.get("ha-form")) return Promise.resolve();
  if (_rcHaFormLoading) return _rcHaFormLoading;
  _rcHaFormLoading = (async () => {
    try {
      if (typeof window.loadCardHelpers === "function") {
        const helpers = await window.loadCardHelpers();
        if (helpers && helpers.createCardElement) {
          const el = await helpers.createCardElement({ type: "entities", entities: [] });
          if (el && el.constructor && el.constructor.getConfigElement) {
            await el.constructor.getConfigElement();
          }
        }
      }
    } catch (err) {
      console.warn("[alpicair-recuperation-card] could not preload ha-form", err);
    }
  })();
  return _rcHaFormLoading;
}

class RcEditorBase extends HTMLElement {
  setConfig(config) {
    this._config = config || {};
    this._renderWhenReady();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._form) this._form.hass = hass;
  }

  connectedCallback() {
    this._renderWhenReady();
  }

  _renderWhenReady() {
    if (!this._config) return;
    if (!customElements.get("ha-form")) {
      this.innerHTML = `<div style="padding:12px;font-size:13px;opacity:.7;">Loading editor…</div>`;
      rcEnsureHaForm().then(() => this._renderWhenReady());
      return;
    }
    this._renderForm();
  }

  _renderForm() {
    this.innerHTML = "";
    const form = document.createElement("ha-form");
    form.hass = this._hass;
    form.data = this.formData();
    form.schema = this.formSchema();
    form.computeLabel = (schema) => this.computeLabel(schema);
    form.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      this._config = { ...this._config, ...ev.detail.value };
      rcFireEvent(this, "config-changed", { config: this._config });
    });
    this._form = form;
    this.appendChild(form);
  }
}

const RC_LAYOUT_SELECTOR = {
  select: {
    mode: "dropdown",
    options: [
      { value: "square", label: "Square (NSPanel Pro)" },
      { value: "wide", label: "Portrait 9:16 (NSPanel Pro 120)" },
    ],
  },
};

const RC_LANGUAGE_SELECTOR = {
  select: {
    mode: "dropdown",
    options: [
      { value: "auto", label: "Auto (from settings card)" },
      { value: "en", label: "English" },
      { value: "ru", label: "Русский" },
      { value: "lv", label: "Latviešu" },
    ],
  },
};

const RC_THEME_SELECTOR = {
  select: {
    mode: "dropdown",
    options: [
      { value: "auto", label: "Match Home Assistant" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
  },
};

/* ---------------------- editor: ring / mode card ------------------------ */

class AlpicairRecuperationCardEditor extends RcEditorBase {
  formData() {
    return {
      title: this._config.title || "",
      mode_entity: this._config.mode_entity || "",
      fan_speed_entity: this._config.fan_speed_entity || "",
      recuperation_entity: this._config.recuperation_entity || "",
      mode_service: this._config.mode_service || "select.select_option",
      mode_service_data_key: this._config.mode_service_data_key || "option",
      mode_map: {
        off: "Off",
        building_protection: "Building protection",
        economy: "Economy",
        comfort: "Comfort",
        boost: "Boost",
        ...(this._config.mode_map || {}),
      },
      settings_tap_action: this._config.settings_tap_action || { action: "none" },
      settings_hold_action: this._config.settings_hold_action || { action: "none" },
      language: this._config.language || "auto",
      theme: this._config.theme || "auto",
      layout: this._config.layout || "square",
    };
  }

  formSchema() {
    return [
      { name: "title", selector: { text: {} } },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "mode_entity", selector: { entity: {} } },
          { name: "fan_speed_entity", selector: { entity: { domain: "sensor" } } },
          { name: "recuperation_entity", selector: { entity: { domain: "sensor" } } },
        ],
      },
      {
        type: "expandable",
        name: "mode_service_group",
        title: "Mode switching",
        flatten: true,
        schema: [
          { name: "mode_service", selector: { text: {} } },
          { name: "mode_service_data_key", selector: { text: {} } },
          {
            type: "expandable",
            name: "mode_map",
            title: "Raw option values per mode",
            schema: [
              { name: "off", selector: { text: {} } },
              { name: "building_protection", selector: { text: {} } },
              { name: "economy", selector: { text: {} } },
              { name: "comfort", selector: { text: {} } },
              { name: "boost", selector: { text: {} } },
            ],
          },
        ],
      },
      {
        type: "expandable",
        name: "settings_button_group",
        title: "Settings button behaviour",
        flatten: true,
        schema: [
          { name: "settings_tap_action", selector: { ui_action: {} } },
          { name: "settings_hold_action", selector: { ui_action: {} } },
        ],
      },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "language", selector: RC_LANGUAGE_SELECTOR },
          { name: "theme", selector: RC_THEME_SELECTOR },
          { name: "layout", selector: RC_LAYOUT_SELECTOR },
        ],
      },
    ];
  }

  computeLabel(schema) {
    const labels = {
      title: "Card title",
      mode_entity: "Mode entity",
      fan_speed_entity: "Fan speed sensor (%)",
      recuperation_entity: "Recuperation sensor (%)",
      mode_service: "Service to call (domain.service)",
      mode_service_data_key: "Service data key for the option",
      mode_map: "Raw option values per mode",
      off: "Off",
      building_protection: "Building protection",
      economy: "Economy",
      comfort: "Comfort",
      boost: "Boost",
      settings_tap_action: "Tap",
      settings_hold_action: "Hold",
      language: "Language",
      theme: "Appearance",
      layout: "Card layout (panel shape)",
    };
    return labels[schema.name] || schema.name;
  }
}

/* --------------------------- editor: sensors card ------------------------ */

class AlpicairRecuperationSensorsCardEditor extends RcEditorBase {
  formData() {
    return {
      temp_indoor_entity: this._config.temp_indoor_entity || "",
      temp_outdoor_entity: this._config.temp_outdoor_entity || "",
      temp_supply_entity: this._config.temp_supply_entity || "",
      target_temp_entity: this._config.target_temp_entity || "",
      target_temp_min: this._config.target_temp_min ?? 15,
      target_temp_max: this._config.target_temp_max ?? 24,
      target_temp_step: this._config.target_temp_step ?? 1,
      language: this._config.language || "auto",
      theme: this._config.theme || "auto",
      layout: this._config.layout || "square",
    };
  }

  formSchema() {
    return [
      {
        type: "grid",
        name: "",
        schema: [
          { name: "temp_indoor_entity", selector: { entity: { domain: "sensor" } } },
          { name: "temp_outdoor_entity", selector: { entity: { domain: "sensor" } } },
          { name: "temp_supply_entity", selector: { entity: { domain: "sensor" } } },
        ],
      },
      {
        type: "expandable",
        name: "target_temp_group",
        title: "Target temperature slider",
        flatten: true,
        schema: [
          { name: "target_temp_entity", selector: { entity: { domain: ["climate", "input_number", "number"] } } },
          {
            type: "grid",
            name: "",
            schema: [
              { name: "target_temp_min", selector: { number: { mode: "box", step: 0.5 } } },
              { name: "target_temp_max", selector: { number: { mode: "box", step: 0.5 } } },
              { name: "target_temp_step", selector: { number: { mode: "box", step: 0.5, min: 0.5 } } },
            ],
          },
        ],
      },
      {
        type: "grid",
        name: "",
        schema: [
          { name: "language", selector: RC_LANGUAGE_SELECTOR },
          { name: "theme", selector: RC_THEME_SELECTOR },
          { name: "layout", selector: RC_LAYOUT_SELECTOR },
        ],
      },
    ];
  }

  computeLabel(schema) {
    const labels = {
      temp_indoor_entity: "Indoor temperature sensor",
      temp_outdoor_entity: "Outdoor temperature sensor",
      temp_supply_entity: "Supply air temperature sensor",
      target_temp_entity: "Target temperature entity (climate / input_number / number)",
      target_temp_min: "Min °C",
      target_temp_max: "Max °C",
      target_temp_step: "Step °C",
      language: "Language",
      theme: "Appearance",
      layout: "Card layout (panel shape)",
    };
    return labels[schema.name] || schema.name;
  }
}

/* --------------------------- editor: settings card ----------------------- */

class AlpicairRecuperationCardSettingsEditor extends RcEditorBase {
  formData() {
    return {
      back_tap_action: this._config.back_tap_action || { action: "none" },
      back_hold_action: this._config.back_hold_action || { action: "none" },
      layout: this._config.layout || "square",
    };
  }

  formSchema() {
    return [
      {
        type: "expandable",
        name: "back_button_group",
        title: "Back button behaviour",
        flatten: true,
        schema: [
          { name: "back_tap_action", selector: { ui_action: {} } },
          { name: "back_hold_action", selector: { ui_action: {} } },
        ],
      },
      { name: "layout", selector: RC_LAYOUT_SELECTOR },
    ];
  }

  computeLabel(schema) {
    const labels = {
      back_tap_action: "Tap",
      back_hold_action: "Hold",
      layout: "Card layout (panel shape)",
    };
    return labels[schema.name] || schema.name;
  }
}

customElements.define("alpicair-recuperation-card-editor", AlpicairRecuperationCardEditor);
customElements.define("alpicair-recuperation-sensors-card-editor", AlpicairRecuperationSensorsCardEditor);
customElements.define("alpicair-recuperation-card-settings-editor", AlpicairRecuperationCardSettingsEditor);

/* ----------------------------------------------------------------------- */
/*  <alpicair-recuperation-card>  — ring gauge + mode control (square)      */
/* ----------------------------------------------------------------------- */

class AlpicairRecuperationCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alpicair-recuperation-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:alpicair-recuperation-card",
      mode_entity: "",
      fan_speed_entity: "",
      recuperation_entity: "",
      settings_tap_action: { action: "navigate", navigation_path: "/recuperator-settings" },
      settings_hold_action: { action: "none" },
      language: "auto",
      theme: "auto",
      layout: "square",
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = {
      mode_service: "select.select_option",
      mode_service_data_key: "option",
      mode_map: {
        off: "Off",
        building_protection: "Building protection",
        economy: "Economy",
        comfort: "Comfort",
        boost: "Boost",
      },
      language: "auto",
      theme: "auto",
      layout: "square",
      ...config,
    };
    this._built = false;
    this._lastActiveMode = null;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._render();
    this._update();
  }

  getCardSize() {
    return 4;
  }

  connectedCallback() {
    this._onSettingsChanged = () => this._update();
    window.addEventListener(RC_EVENT_SETTINGS_CHANGED, this._onSettingsChanged);
  }

  disconnectedCallback() {
    window.removeEventListener(RC_EVENT_SETTINGS_CHANGED, this._onSettingsChanged);
  }

  _lang() {
    return rcGetLang(this._config && this._config.language);
  }

  _t(key) {
    return rcT(this._lang(), key);
  }

  _themeMode() {
    const t = rcGetTheme(this._config && this._config.theme);
    if (t === "auto") {
      return this._hass && this._hass.themes && this._hass.themes.darkMode ? "dark" : "light";
    }
    return t;
  }

  _render() {
    if (!this._config) return;
    this._built = true;

    this.innerHTML = "";
    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = RC_STYLES + `
      .rc-card { aspect-ratio: 1 / 1; display: flex; flex-direction: column; }
      .rc-header {
        display: flex; align-items: center; justify-content: space-between;
        flex: 0 0 auto; margin-bottom: 12px;
      }
      .rc-icon-btn {
        width: 42px; height: 42px; border-radius: 13px;
        display: flex; align-items: center; justify-content: center;
        background: var(--rc-surface-2); cursor: pointer;
        transition: transform var(--rc-transition), background var(--rc-transition);
        outline: none; flex: 0 0 auto;
      }
      .rc-icon-btn:active { transform: scale(0.92); }
      .rc-icon-btn ha-icon { --mdc-icon-size: 21px; color: var(--rc-muted); }
      .rc-icon-btn.rc-power-on ha-icon { color: #4ADE80; }
      .rc-gear:hover { transform: rotate(20deg); }
      .rc-title { font-size: 17px; font-weight: 700; letter-spacing: -0.01em; text-align: center; flex: 1 1 auto; }

      .rc-ring-area { flex: 1 1 auto; display: flex; align-items: center; justify-content: center; min-height: 0; }
      .rc-ring-wrap { position: relative; width: 100%; height: 100%; max-width: 220px; max-height: 220px; }
      .rc-ring-wrap svg { width: 100%; height: 100%; display: block; }
      .rc-ring-center {
        position: absolute; border-radius: 50%; background: var(--rc-surface);
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        text-align: center; cursor: pointer; outline: none;
        transition: background var(--rc-transition);
      }
      .rc-ring-center.rc-breathing { animation: rc-breathe 3.6s ease-in-out infinite; }
      @keyframes rc-breathe {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .rc-ring-center ha-icon { --mdc-icon-size: 28px; margin-bottom: 5px; transition: color var(--rc-transition); }
      .rc-mode-name { font-size: 17px; font-weight: 700; }
      .rc-tap-hint {
        display: flex; align-items: center; gap: 3px; font-size: 10.5px; color: var(--rc-muted);
        margin-top: 4px;
      }
      .rc-tap-hint ha-icon { --mdc-icon-size: 12px; margin: 0; color: var(--rc-muted); }

      .rc-legend {
        flex: 0 0 auto; display: flex; justify-content: center; gap: 20px; margin-top: 12px; flex-wrap: wrap;
      }
      .rc-legend-item { display: flex; align-items: center; gap: 7px; font-size: 13px; color: var(--rc-muted); white-space: nowrap; }
      .rc-legend-dot { width: 9px; height: 9px; border-radius: 50%; flex: 0 0 auto; }
      .rc-legend-value { font-weight: 700; font-variant-numeric: tabular-nums; color: var(--rc-text); }

      /* --- Layout: wide (Sonoff NSPanel Pro 120, portrait 9:16 screen) ---- */
      :host([data-rc-layout="wide"]) .rc-card {
        aspect-ratio: 9 / 16; max-width: 340px; width: 100%; box-sizing: border-box; padding: 18px 16px;
      }
      :host([data-rc-layout="wide"]) .rc-ring-wrap { max-width: 190px; max-height: 190px; }
      :host([data-rc-layout="wide"]) .rc-mode-name { font-size: 16px; }
    `;

    const card = document.createElement("div");
    card.className = "rc-card";
    card.innerHTML = `
      <div class="rc-header">
        <div class="rc-icon-btn" id="rc-power" tabindex="0" role="button" aria-label="power">
          <ha-icon icon="mdi:power"></ha-icon>
        </div>
        <div class="rc-title" id="rc-title"></div>
        <div class="rc-icon-btn rc-gear" id="rc-gear" tabindex="0" role="button" aria-label="settings">
          <ha-icon icon="mdi:cog-outline"></ha-icon>
        </div>
      </div>

      <div class="rc-ring-area">
        <div class="rc-ring-wrap" id="rc-ring-wrap">
          <svg viewBox="0 0 190 190">
            <circle cx="95" cy="95" r="82" fill="none" stroke="var(--rc-surface-2)" stroke-width="12" />
            <circle id="rc-ring-recup" cx="95" cy="95" r="82" fill="none" stroke="var(--rc-accent-warm)"
                    stroke-width="12" stroke-linecap="round" transform="rotate(-90 95 95)" />
            <circle cx="95" cy="95" r="63" fill="none" stroke="var(--rc-surface-2)" stroke-width="12" />
            <circle id="rc-ring-fan" cx="95" cy="95" r="63" fill="none" stroke="var(--rc-accent-cool)"
                    stroke-width="12" stroke-linecap="round" transform="rotate(-90 95 95)" />
          </svg>
          <div class="rc-ring-center" id="rc-ring-center" style="inset: 44px;" tabindex="0" role="button" aria-label="change mode">
            <ha-icon id="rc-mode-icon" icon="mdi:power"></ha-icon>
            <div class="rc-mode-name" id="rc-mode-name"></div>
            <div class="rc-tap-hint"><ha-icon icon="mdi:gesture-tap"></ha-icon><span id="rc-tap-hint-text"></span></div>
          </div>
        </div>
      </div>

      <div class="rc-legend">
        <div class="rc-legend-item">
          <span class="rc-legend-dot" style="background: var(--rc-accent-warm)"></span>
          <span id="rc-recup-label"></span>
          <span class="rc-legend-value" id="rc-recup-value">–</span>
        </div>
        <div class="rc-legend-item">
          <span class="rc-legend-dot" style="background: var(--rc-accent-cool)"></span>
          <span id="rc-fan-label"></span>
          <span class="rc-legend-value" id="rc-fan-value">–</span>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(card);

    this._els = {
      title: card.querySelector("#rc-title"),
      power: card.querySelector("#rc-power"),
      gear: card.querySelector("#rc-gear"),
      ringWrap: card.querySelector("#rc-ring-wrap"),
      ringRecup: card.querySelector("#rc-ring-recup"),
      ringFan: card.querySelector("#rc-ring-fan"),
      ringCenter: card.querySelector("#rc-ring-center"),
      modeIcon: card.querySelector("#rc-mode-icon"),
      modeName: card.querySelector("#rc-mode-name"),
      tapHintText: card.querySelector("#rc-tap-hint-text"),
      recupLabel: card.querySelector("#rc-recup-label"),
      recupValue: card.querySelector("#rc-recup-value"),
      fanLabel: card.querySelector("#rc-fan-label"),
      fanValue: card.querySelector("#rc-fan-value"),
    };

    rcBindPressActions(this._els.gear, {
      onTap: () => rcHandleAction(this, this._hass, this._config.settings_tap_action),
      onHold: () => rcHandleAction(this, this._hass, this._config.settings_hold_action),
    });

    this._els.power.addEventListener("click", () => this._toggleOff());
    this._els.power.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        this._toggleOff();
      }
    });

    this._els.ringCenter.addEventListener("click", () => this._cycleMode());
    this._els.ringCenter.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        this._cycleMode();
      }
    });

    this._circRecup = 2 * Math.PI * 82;
    this._circFan = 2 * Math.PI * 63;
  }

  _currentModeKey() {
    if (!this._hass || !this._config.mode_entity) return null;
    const stateObj = this._hass.states[this._config.mode_entity];
    if (!stateObj) return null;
    const raw = stateObj.state;
    const map = this._config.mode_map;
    for (const key of RC_MODES) {
      if (map[key] === raw) return key;
    }
    return null;
  }

  _setModeKey(key) {
    if (!this._hass || !this._config.mode_entity) return;
    const raw = this._config.mode_map[key];
    if (raw === undefined) return;
    const [domain, service] = this._config.mode_service.split(".");
    const dataKey = this._config.mode_service_data_key;
    this._hass.callService(domain, service, {
      entity_id: this._config.mode_entity,
      [dataKey]: raw,
    });
  }

  /** Header power icon: dedicated off / restore-last-mode toggle. */
  _toggleOff() {
    const current = this._currentModeKey();
    if (current && current !== "off") {
      this._lastActiveMode = current;
      this._setModeKey("off");
    } else {
      this._setModeKey(this._lastActiveMode || RC_ACTIVE_MODES[0]);
    }
  }

  /** Ring center: cycles through the four running modes (off excluded). */
  _cycleMode() {
    const current = this._currentModeKey();
    if (!current || current === "off") {
      this._setModeKey(RC_ACTIVE_MODES[0]);
      return;
    }
    const idx = RC_ACTIVE_MODES.indexOf(current);
    const next = RC_ACTIVE_MODES[(idx + 1) % RC_ACTIVE_MODES.length];
    this._setModeKey(next);
  }

  _readNumberState(entityId) {
    if (!this._hass || !entityId) return null;
    const stateObj = this._hass.states[entityId];
    if (!stateObj) return null;
    return { value: rcClampPercent(stateObj.state) };
  }

  _update() {
    if (!this._hass || !this._els) return;
    const themeMode = this._themeMode();
    this.setAttribute("data-rc-theme", themeMode);
    this.setAttribute("data-rc-layout", this._config.layout === "wide" ? "wide" : "square");

    const modeKey = this._currentModeKey() || "off";
    const meta = RC_MODE_META[modeKey];
    const running = modeKey !== "off";
    if (running) this._lastActiveMode = modeKey;

    this._els.title.textContent = this._config.title || this._t("title");

    this._els.power.classList.toggle("rc-power-on", running);

    this._els.modeIcon.setAttribute("icon", meta.icon);
    this._els.modeIcon.style.color = meta.accent;
    this._els.modeName.textContent = this._t(modeKey);
    this._els.modeName.style.color = meta.accent;
    this._els.tapHintText.textContent = this._t("tap_hint");
    this._els.ringCenter.classList.toggle("rc-breathing", running);

    const fan = this._readNumberState(this._config.fan_speed_entity);
    const recup = this._readNumberState(this._config.recuperation_entity);

    this._els.recupLabel.textContent = this._t("recuperation");
    this._els.fanLabel.textContent = this._t("fan_speed");
    this._els.recupValue.textContent = recup && recup.value !== null ? `${Math.round(recup.value)}%` : "–";
    this._els.fanValue.textContent = fan && fan.value !== null ? `${Math.round(fan.value)}%` : "–";

    const recupPct = recup && recup.value !== null ? recup.value : 0;
    const fanPct = fan && fan.value !== null ? fan.value : 0;
    this._els.ringRecup.setAttribute(
      "stroke-dasharray",
      `${(recupPct / 100) * this._circRecup} ${this._circRecup}`
    );
    this._els.ringFan.setAttribute(
      "stroke-dasharray",
      `${(fanPct / 100) * this._circFan} ${this._circFan}`
    );
  }
}

/* ----------------------------------------------------------------------- */
/*  <alpicair-recuperation-sensors-card> — temperatures + target temp       */
/*  (square, no header, no mode buttons — mode is controlled on the ring   */
/*  card)                                                                   */
/* ----------------------------------------------------------------------- */

class AlpicairRecuperationSensorsCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alpicair-recuperation-sensors-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:alpicair-recuperation-sensors-card",
      temp_indoor_entity: "",
      temp_outdoor_entity: "",
      temp_supply_entity: "",
      target_temp_entity: "",
      target_temp_min: 15,
      target_temp_max: 24,
      target_temp_step: 1,
      language: "auto",
      theme: "auto",
      layout: "square",
    };
  }

  setConfig(config) {
    if (!config) throw new Error("Invalid configuration");
    this._config = {
      language: "auto",
      theme: "auto",
      layout: "square",
      target_temp_min: 15,
      target_temp_max: 24,
      target_temp_step: 1,
      ...config,
    };
    this._built = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._render();
    this._update();
  }

  getCardSize() {
    return 4;
  }

  connectedCallback() {
    this._onSettingsChanged = () => this._update();
    window.addEventListener(RC_EVENT_SETTINGS_CHANGED, this._onSettingsChanged);
  }

  disconnectedCallback() {
    window.removeEventListener(RC_EVENT_SETTINGS_CHANGED, this._onSettingsChanged);
  }

  _lang() {
    return rcGetLang(this._config && this._config.language);
  }

  _t(key) {
    return rcT(this._lang(), key);
  }

  _themeMode() {
    const t = rcGetTheme(this._config && this._config.theme);
    if (t === "auto") {
      return this._hass && this._hass.themes && this._hass.themes.darkMode ? "dark" : "light";
    }
    return t;
  }

  _render() {
    if (!this._config) return;
    this._built = true;

    this.innerHTML = "";
    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = RC_STYLES + `
      .rc-card { aspect-ratio: 1 / 1; display: flex; flex-direction: column; justify-content: center; gap: 16px; }

      .rc-stats { display: flex; flex-direction: column; gap: 8px; }
      .rc-stat {
        background: var(--rc-surface); border-radius: 14px; padding: 12px 16px;
        display: flex; align-items: center; justify-content: space-between;
        border: 1px solid var(--rc-border);
      }
      .rc-stat-label { font-size: 13px; color: var(--rc-muted); font-weight: 600; text-transform: uppercase; letter-spacing: .03em; }
      .rc-stat-value { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }

      .rc-temp-top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
      .rc-temp-label { font-size: 13px; color: var(--rc-muted); font-weight: 600; }
      .rc-temp-value { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--rc-text); }
      .rc-temp-slider {
        -webkit-appearance: none; appearance: none; width: 100%; height: 32px;
        background: transparent; margin: 0; cursor: pointer;
      }
      .rc-temp-slider::-webkit-slider-runnable-track {
        height: 12px; border-radius: 999px;
        background: linear-gradient(90deg, var(--rc-accent-cool), var(--rc-accent-warm));
      }
      .rc-temp-slider::-webkit-slider-thumb {
        -webkit-appearance: none; width: 30px; height: 30px; border-radius: 50%;
        background: #ffffff; border: 3px solid var(--rc-accent-warm);
        box-shadow: 0 2px 10px rgba(0,0,0,0.28); margin-top: -9px; cursor: pointer;
      }
      .rc-temp-slider::-moz-range-track {
        height: 12px; border-radius: 999px;
        background: linear-gradient(90deg, var(--rc-accent-cool), var(--rc-accent-warm));
      }
      .rc-temp-slider::-moz-range-thumb {
        width: 30px; height: 30px; border-radius: 50%;
        background: #ffffff; border: 3px solid var(--rc-accent-warm);
        box-shadow: 0 2px 10px rgba(0,0,0,0.28); cursor: pointer;
      }
      .rc-temp-minmax { display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px; color: var(--rc-muted); }

      /* --- Layout: wide (Sonoff NSPanel Pro 120, portrait 9:16 screen) ---- */
      :host([data-rc-layout="wide"]) .rc-card {
        aspect-ratio: 9 / 16; max-width: 340px; width: 100%; box-sizing: border-box; padding: 18px 16px;
      }
    `;

    const card = document.createElement("div");
    card.className = "rc-card";
    card.innerHTML = `
      <div class="rc-stats" id="rc-stats"></div>

      <div class="rc-temp-row" id="rc-temp-row" style="display:none;">
        <div class="rc-temp-top">
          <span class="rc-temp-label" id="rc-temp-label"></span>
          <span class="rc-temp-value" id="rc-temp-value">–</span>
        </div>
        <input type="range" class="rc-temp-slider" id="rc-temp-slider" min="15" max="24" step="1" />
        <div class="rc-temp-minmax">
          <span id="rc-temp-min-label"></span>
          <span id="rc-temp-max-label"></span>
        </div>
      </div>
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(card);

    this._els = {
      stats: card.querySelector("#rc-stats"),
      tempRow: card.querySelector("#rc-temp-row"),
      tempLabel: card.querySelector("#rc-temp-label"),
      tempValue: card.querySelector("#rc-temp-value"),
      tempSlider: card.querySelector("#rc-temp-slider"),
      tempMinLabel: card.querySelector("#rc-temp-min-label"),
      tempMaxLabel: card.querySelector("#rc-temp-max-label"),
    };

    this._els.tempSlider.addEventListener("input", () => {
      this._els.tempValue.textContent = `${this._els.tempSlider.value}°`;
    });
    this._els.tempSlider.addEventListener("change", () => {
      this._setTargetTemp(Number(this._els.tempSlider.value));
    });
  }

  _readTargetTemp() {
    const entityId = this._config.target_temp_entity;
    if (!this._hass || !entityId) return null;
    const stateObj = this._hass.states[entityId];
    if (!stateObj) return null;
    const domain = entityId.split(".")[0];
    if (domain === "climate") {
      const t = stateObj.attributes && stateObj.attributes.temperature;
      return t === undefined || t === null ? null : Number(t);
    }
    const n = Number(stateObj.state);
    return Number.isNaN(n) ? null : n;
  }

  _setTargetTemp(value) {
    const entityId = this._config.target_temp_entity;
    if (!this._hass || !entityId) return;
    const domain = entityId.split(".")[0];
    if (this._config.target_temp_service) {
      const [svcDomain, svcService] = this._config.target_temp_service.split(".");
      const dataKey = this._config.target_temp_service_data_key || "value";
      this._hass.callService(svcDomain, svcService, {
        entity_id: entityId,
        [dataKey]: value,
      });
      return;
    }
    if (domain === "climate") {
      this._hass.callService("climate", "set_temperature", {
        entity_id: entityId,
        temperature: value,
      });
    } else if (domain === "number") {
      this._hass.callService("number", "set_value", {
        entity_id: entityId,
        value,
      });
    } else {
      this._hass.callService("input_number", "set_value", {
        entity_id: entityId,
        value,
      });
    }
  }

  _update() {
    if (!this._hass || !this._els) return;
    const themeMode = this._themeMode();
    this.setAttribute("data-rc-theme", themeMode);
    this.setAttribute("data-rc-layout", this._config.layout === "wide" ? "wide" : "square");

    const statDefs = [
      { key: "indoor", entity: this._config.temp_indoor_entity },
      { key: "outdoor", entity: this._config.temp_outdoor_entity },
      { key: "supply", entity: this._config.temp_supply_entity },
    ];
    this._els.stats.innerHTML = "";
    statDefs.forEach((def) => {
      const stateObj = def.entity && this._hass.states[def.entity];
      const value = stateObj ? stateObj.state : null;
      const unit = stateObj && stateObj.attributes ? stateObj.attributes.unit_of_measurement || "°C" : "°C";
      const el = document.createElement("div");
      el.className = "rc-stat";
      el.innerHTML = `
        <span class="rc-stat-label">${this._t(def.key)}</span>
        <span class="rc-stat-value">${value !== null && value !== undefined ? `${value}${unit}` : "–"}</span>
      `;
      this._els.stats.appendChild(el);
    });

    if (this._config.target_temp_entity) {
      this._els.tempRow.style.display = "";
      this._els.tempLabel.textContent = this._config.target_temp_label || this._t("target_temp");
      this._els.tempSlider.min = this._config.target_temp_min;
      this._els.tempSlider.max = this._config.target_temp_max;
      this._els.tempSlider.step = this._config.target_temp_step;
      this._els.tempMinLabel.textContent = `${this._config.target_temp_min}°`;
      this._els.tempMaxLabel.textContent = `${this._config.target_temp_max}°`;
      const current = this._readTargetTemp();
      if (
        this.shadowRoot.activeElement !== this._els.tempSlider &&
        current !== null &&
        Number(this._els.tempSlider.value) !== current
      ) {
        this._els.tempSlider.value = current;
      }
      this._els.tempValue.textContent = current !== null ? `${this._els.tempSlider.value}°` : "–";
    } else {
      this._els.tempRow.style.display = "none";
    }
  }
}

/* ----------------------------------------------------------------------- */
/*  <alpicair-recuperation-card-settings>                                   */
/* ----------------------------------------------------------------------- */

class AlpicairRecuperationCardSettings extends HTMLElement {
  static getConfigElement() {
    return document.createElement("alpicair-recuperation-card-settings-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:alpicair-recuperation-card-settings",
      back_tap_action: { action: "navigate", navigation_path: "/lovelace/0" },
      back_hold_action: { action: "none" },
      layout: "square",
    };
  }

  setConfig(config) {
    this._config = { layout: "square", ...config };
    this._built = false;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) this._render();
    this._update();
  }

  getCardSize() {
    return this._config && this._config.layout === "wide" ? 3 : 4;
  }

  _lang() {
    return rcGetLang();
  }

  _t(key) {
    return rcT(this._lang(), key);
  }

  _themeMode() {
    const t = rcGetTheme();
    if (t === "auto") {
      return this._hass && this._hass.themes && this._hass.themes.darkMode ? "dark" : "light";
    }
    return t;
  }

  _render() {
    if (!this._config) return;
    this._built = true;
    this.innerHTML = "";
    this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = RC_STYLES + `
      .rc-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
      .rc-back {
        width: 46px; height: 46px; border-radius: 14px; display: flex;
        align-items: center; justify-content: center; background: var(--rc-surface-2);
        cursor: pointer; outline: none; transition: transform 120ms;
      }
      .rc-back:active { transform: scale(0.92); }
      .rc-back ha-icon { --mdc-icon-size: 24px; color: var(--rc-muted); }
      .rc-title { font-size: 19px; font-weight: 700; }

      .rc-sections { display: flex; flex-direction: column; gap: 18px; }
      .rc-section-label {
        font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em;
        color: var(--rc-muted); margin-bottom: 9px;
      }
      .rc-pill-row { display: flex; gap: 9px; flex-wrap: wrap; }
      .rc-pill {
        padding: 12px 18px; border-radius: 999px; background: var(--rc-surface);
        border: 1px solid var(--rc-border); font-size: 15px; font-weight: 600;
        color: var(--rc-muted); cursor: pointer; transition: all var(--rc-transition);
        outline: none;
      }
      .rc-pill.active {
        color: white; background: linear-gradient(135deg, var(--rc-accent-cool), var(--rc-accent-warm));
        border-color: transparent;
      }
      .rc-note { font-size: 12px; color: var(--rc-muted); margin-top: 12px; line-height: 1.55; }

      :host([data-rc-layout="wide"]) .rc-card { padding: 14px 20px; }
      :host([data-rc-layout="wide"]) .rc-header { margin-bottom: 12px; }
      :host([data-rc-layout="wide"]) .rc-note { margin-top: 10px; }
    `;

    const card = document.createElement("div");
    card.className = "rc-card";
    card.innerHTML = `
      <div class="rc-header">
        <div class="rc-back" id="rc-back" tabindex="0" role="button" aria-label="back">
          <ha-icon icon="mdi:arrow-left"></ha-icon>
        </div>
        <div class="rc-title" id="rc-title"></div>
      </div>

      <div class="rc-sections">
        <div class="rc-section">
          <div class="rc-section-label" id="rc-lang-label"></div>
          <div class="rc-pill-row" id="rc-lang-row"></div>
        </div>

        <div class="rc-section">
          <div class="rc-section-label" id="rc-theme-label"></div>
          <div class="rc-pill-row" id="rc-theme-row"></div>
        </div>
      </div>

      <div class="rc-note" id="rc-note"></div>
    `;

    this.shadowRoot.innerHTML = "";
    this.shadowRoot.appendChild(style);
    this.shadowRoot.appendChild(card);

    this._els = {
      back: card.querySelector("#rc-back"),
      title: card.querySelector("#rc-title"),
      langLabel: card.querySelector("#rc-lang-label"),
      langRow: card.querySelector("#rc-lang-row"),
      themeLabel: card.querySelector("#rc-theme-label"),
      themeRow: card.querySelector("#rc-theme-row"),
      note: card.querySelector("#rc-note"),
    };

    rcBindPressActions(this._els.back, {
      onTap: () => rcHandleAction(this, this._hass, this._config.back_tap_action),
      onHold: () => rcHandleAction(this, this._hass, this._config.back_hold_action),
    });
  }

  _setLanguage(code) {
    window.localStorage.setItem(RC_STORAGE_LANG, code);
    window.dispatchEvent(new CustomEvent(RC_EVENT_SETTINGS_CHANGED));
    this._update();
  }

  _setTheme(mode) {
    window.localStorage.setItem(RC_STORAGE_THEME, mode);
    window.dispatchEvent(new CustomEvent(RC_EVENT_SETTINGS_CHANGED));
    this._update();
  }

  _update() {
    if (!this._els) return;
    const lang = this._lang();
    const themeMode = this._themeMode();
    this.setAttribute("data-rc-theme", themeMode);
    this.setAttribute("data-rc-layout", this._config.layout === "wide" ? "wide" : "square");

    this._els.title.textContent = this._t("settings");
    this._els.langLabel.textContent = this._t("language");
    this._els.themeLabel.textContent = this._t("theme");
    this._els.note.textContent =
      lang === "ru"
        ? "Язык и тема сохраняются в этом браузере и применяются ко всем карточкам рекуператора на панели."
        : lang === "lv"
        ? "Valoda un izskats tiek saglabāti šajā pārlūkā un attiecas uz visām rekuperatora kartītēm panelī."
        : "Language and theme are saved in this browser and apply to every recuperator card on the dashboard.";

    const currentLang = rcGetLang();
    const langs = [
      { code: "lv", label: "Latviešu" },
      { code: "ru", label: "Русский" },
      { code: "en", label: "English" },
    ];
    this._els.langRow.innerHTML = "";
    langs.forEach((l) => {
      const pill = document.createElement("div");
      pill.className = "rc-pill" + (l.code === currentLang ? " active" : "");
      pill.textContent = l.label;
      pill.tabIndex = 0;
      pill.addEventListener("click", () => this._setLanguage(l.code));
      pill.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") this._setLanguage(l.code);
      });
      this._els.langRow.appendChild(pill);
    });

    const currentTheme = rcGetTheme();
    const themes = [
      { code: "light", label: this._t("theme_light") },
      { code: "dark", label: this._t("theme_dark") },
      { code: "auto", label: this._t("theme_auto") },
    ];
    this._els.themeRow.innerHTML = "";
    themes.forEach((t) => {
      const pill = document.createElement("div");
      pill.className = "rc-pill" + (t.code === currentTheme ? " active" : "");
      pill.textContent = t.label;
      pill.tabIndex = 0;
      pill.addEventListener("click", () => this._setTheme(t.code));
      pill.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter" || ev.key === " ") this._setTheme(t.code);
      });
      this._els.themeRow.appendChild(pill);
    });
  }
}

customElements.define("alpicair-recuperation-card", AlpicairRecuperationCard);
customElements.define("alpicair-recuperation-sensors-card", AlpicairRecuperationSensorsCard);
customElements.define("alpicair-recuperation-card-settings", AlpicairRecuperationCardSettings);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "alpicair-recuperation-card",
  name: "Alpicair Recuperation — Ring",
  description: "Square ring gauge for an Alpicair recuperator: recuperation %, fan speed %, tap-to-change mode.",
  preview: false,
});
window.customCards.push({
  type: "alpicair-recuperation-sensors-card",
  name: "Alpicair Recuperation — Sensors",
  description: "Square card with temperatures and a 15-24°C target temperature slider.",
  preview: false,
});
window.customCards.push({
  type: "alpicair-recuperation-card-settings",
  name: "Alpicair Recuperation — Settings",
  description: "Dedicated settings screen for the Alpicair Recuperation cards: language, theme, back button behaviour.",
  preview: false,
});

console.info(
  "%c ALPICAIR-RECUPERATION-CARD %c registered ",
  "background:#131B29;color:#4FD1C5;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;",
  "background:#223154;color:#E8EEF5;padding:2px 6px;border-radius:0 4px 4px 0;"
);
