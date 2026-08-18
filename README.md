# Alpicair Recuperation Card

Two modern, friendly square Lovelace cards for controlling an Alpicair
home ventilation recuperator (HRV/ERV) in Home Assistant, plus a matching
settings card.

- **Ring card** (`alpicair-recuperation-card`) — a dual ring gauge showing
  **recuperation %** (outer, amber) and **fan speed %** (inner, teal).
  The mode icon and name sit in the middle of the ring — **tap it to
  cycle through Building protection → Economy → Comfort → Boost**. A
  power icon in the header is a dedicated **off / restore last mode**
  toggle, and a settings icon opens the settings card (short and long
  press are both configurable).
- **Sensors card** (`alpicair-recuperation-sensors-card`) — indoor /
  outdoor / supply air temperatures, plus an optional **target
  temperature slider (15–24 °C by default)** that writes straight to a
  `climate`, `input_number`, or `number` entity. No mode buttons here —
  mode is controlled entirely from the ring card.
- **Settings card** (`alpicair-recuperation-card-settings`) — its own
  back button (short/long press configurable), where the user picks:
  - **Language:** Latviešu / Русский / English
  - **Appearance:** Light / Dark / Match Home Assistant
- A **visual (UI) editor** for all three cards — add them from the
  dashboard's "Add card" dialog. YAML is still fully supported.

No build step, no dependencies — a single JS file.

## Installation

### HACS (custom repository)

1. In Home Assistant, open **HACS → ⋮ → Custom repositories**.
2. Add `https://github.com/keziksdmitrijs-byte/Alpicair-Recuperation`
   with category **Dashboard**.
3. Install **Alpicair Recuperation Card**, then reload your browser
   (HACS adds the resource automatically).

> **Important:** HACS needs at least one published **Release** on this
> repository to validate its structure — otherwise you'll see an error
> like `Repository structure for 0.0.1 is not compliant`. After pushing
> the files, go to **Releases → Create a new release**, tag it e.g.
> `v2.0.0`, and publish it before adding the repo in HACS.

### Manual

1. Copy `alpicair-recuperation-card.js` to
   `/config/www/alpicair-recuperation-card.js`.
2. In **Settings → Dashboards → Resources**, add:
   - URL: `/local/alpicair-recuperation-card.js`
   - Type: JavaScript module

## Using the visual editor

1. Open a dashboard in edit mode → **Add card** → search for "Alpicair
   Recuperation" — you'll see the ring card, the sensors card, and the
   settings card.
2. On the ring card, pick the mode entity, the mode-switching service,
   the raw per-mode values, and the fan speed / recuperation sensors.
3. On the sensors card, pick the three temperature sensors and (if you
   want the slider) a target-temperature entity plus its min/max/step.
4. On the settings card, set the back button's tap/hold actions.

You can switch to **Edit in YAML** at any point — both editors write the
same config keys documented below, so YAML and UI editing are fully
interchangeable.

## Setting up your entities

The cards are generic on purpose so they work with whatever integration
exposes your recuperator (`select`, `input_select`, MQTT, Modbus,
ESPHome…). You need:

| What | Typical entity domain |
|---|---|
| Mode | `select.xxx` (or `input_select.xxx`) |
| Fan speed, 0–100 | `sensor.xxx` |
| Recuperation efficiency, 0–100 | `sensor.xxx` |
| Indoor / outdoor / supply temperature | `sensor.xxx` |
| Target temperature (optional) | `climate.xxx`, `input_number.xxx`, or `number.xxx` |

## Ring card configuration

```yaml
type: custom:alpicair-recuperation-card
title: Alpicair Recuperation           # optional, defaults to translated title

mode_entity: select.recuperator_mode
mode_service: select.select_option      # domain.service called on mode change
mode_service_data_key: option           # key holding the chosen value in service data
mode_map:                               # your entity's raw option text for each mode
  off: "Off"
  building_protection: "Building protection"
  economy: "Economy"
  comfort: "Comfort"
  boost: "Boost"

fan_speed_entity: sensor.recuperator_fan_speed
recuperation_entity: sensor.recuperator_recuperation_efficiency

settings_tap_action:
  action: navigate
  navigation_path: /lovelace/recuperator-settings
settings_hold_action:
  action: navigate
  navigation_path: /lovelace/recuperator-advanced   # e.g. a raw entity/more-info page

language: auto     # auto | en | ru | lv  — "auto" follows what was chosen in the settings card
theme: auto         # auto | light | dark — "auto" follows Home Assistant's own dark mode
layout: square       # square (NSPanel Pro) | wide (portrait 9:16, NSPanel Pro 120)
```

**Mode control:**
- Tapping the **ring center** cycles Building protection → Economy →
  Comfort → Boost → Building protection… (skips Off).
- Tapping the **power icon** in the header is a dedicated shortcut: if
  the unit is running it switches to Off and remembers the mode you were
  on; tapping it again restores that mode (or defaults to Building
  protection if nothing was remembered yet).
- `mode_map` must contain the **exact raw state text** of your entity —
  case and spelling included. If your entity is a `select`/`input_select`
  and exposes an `options` attribute, the card automatically skips any
  configured mode that isn't in that list (e.g. a 4-state device with no
  "Boost" tier), so you don't need to remove or fake an entry for it.

**Example** for a device with only 4 states, in Latvian:

```yaml
mode_entity: select.ventilacijas_rezims
mode_service: select.select_option
mode_service_data_key: option
mode_map:
  off: "Izslēgts"
  building_protection: "Ēkas aizsardzība"
  economy: "Ekonomiskais"
  comfort: "Normālais"
  boost: "Boost"     # doesn't exist on this device — automatically skipped when cycling
```

`mode_service` also works for an `input_select`
(`input_select.select_option` / key `option`), or you can point it at
whatever service your integration provides — for example a `climate`
entity's preset:

```yaml
mode_entity: climate.recuperator
mode_service: climate.set_preset_mode
mode_service_data_key: preset_mode
mode_map:
  off: "off"
  building_protection: "building_protection"
  economy: "eco"
  comfort: "comfort"
  boost: "boost"
```

### Action types available for `settings_tap_action` / `settings_hold_action`

```yaml
action: navigate
navigation_path: /lovelace/settings-page
```
```yaml
action: url
url_path: https://example.com
```
```yaml
action: call-service
service: script.my_script
service_data: {}
```
```yaml
action: more-info
entity: sensor.recuperator_fan_speed
```
```yaml
action: none
```

## Sensors card configuration

```yaml
type: custom:alpicair-recuperation-sensors-card

temp_indoor_entity: sensor.recuperator_room_temperature
temp_outdoor_entity: sensor.recuperator_outdoor_temperature
temp_supply_entity: sensor.recuperator_supply_temperature

target_temp_entity: climate.recuperator     # or an input_number / number entity — omit to hide the slider
target_temp_min: 15
target_temp_max: 24
target_temp_step: 1

language: auto
theme: auto
layout: square       # square (NSPanel Pro) | wide (portrait 9:16, NSPanel Pro 120)
```

## Settings card configuration

Put this on its own dashboard view (e.g. `/lovelace/recuperator-settings`)
so the ring card's settings button can navigate to it:

```yaml
type: custom:alpicair-recuperation-card-settings

back_tap_action:
  action: navigate
  navigation_path: /lovelace/0        # your main dashboard view

back_hold_action:
  action: navigate
  navigation_path: /lovelace/recuperator-advanced

layout: square       # square (NSPanel Pro) | wide (portrait 9:16, NSPanel Pro 120)
```

Language and theme choices are saved in the browser's local storage and
are shared by every Alpicair Recuperation card the same browser sees —
no helper entities required.

## Layouts for NSPanel

All three cards support a `layout` option:

- **`square`** (default) — a 1:1 aspect ratio for panels closer to
  square, like **Sonoff NSPanel Pro**.
- **`wide`** — a fixed **portrait 9:16** aspect ratio for tall, narrow
  panels like **Sonoff NSPanel Pro 120**.

Put the ring card and the sensors card next to each other on the same
dashboard row (they're both square) so they read as one control panel.

## Full screen on the panel itself

If the card looks small and centered with empty space around it, that's
Home Assistant's default "Masonry" dashboard view — it always centers
content. To make a dashboard truly fill an NSPanel's screen:

1. Create a dashboard **view** of type **Panel** and put your card(s) on
   it (Panel view stretches a single card edge-to-edge — for the two
   square cards side by side, use a small grid/horizontal-stack card as
   that one child instead).
2. Point the panel's browser (NSPanel app, Fully Kiosk, etc.) at that
   view's specific URL, e.g. `http://ha.local:8123/lovelace/panel-view`,
   not the generic `/lovelace/0`.
3. Optionally install the community **kiosk-mode** plugin via HACS to
   hide Home Assistant's header and sidebar entirely for a true kiosk
   look.

## Roadmap

- Optional sync of language/theme via `input_select` / `input_boolean`
  helpers for multi-device consistency
- HACS default store submission (see below)

## Publishing this repository & submitting to HACS

```bash
cd Alpicair-Recuperation
git init
git add .
git commit -m "Two-card redesign: ring + sensors"
git branch -M main
git remote add origin https://github.com/keziksdmitrijs-byte/Alpicair-Recuperation.git
git push -u origin main
```

Then, on GitHub:
1. Add a repository **description** (e.g. "Modern Lovelace cards for an
   Alpicair home ventilation recuperator") — HACS validation can fail on
   an empty description.
2. Add repo **topics**: `home-assistant`, `hacs`, `lovelace`, `dashboard`.
3. Create a **Release** (tag e.g. `v2.0.0`) — HACS reads structure from
   releases/tags, and without one it falls back to a placeholder version
   (`0.0.1`) and the "structure is not compliant" error.
4. Anyone can now add it in HACS as a **custom repository** (see
   Installation above).

To get it into the **default HACS store** (so people don't need to add it
manually), open a pull request against `hacs/default` on GitHub following
their [publishing guide](https://hacs.xyz/docs/publish/start) — this
requires the repository to be public, have a README, a release, and pass
their automated checks.

## License

MIT
