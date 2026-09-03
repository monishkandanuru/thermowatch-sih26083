# ThermoWatch Project Guide

This file explains the complete ThermoWatch project in simple language. Read it once before presenting the project, changing the code, or answering questions from SIH judges.

---

## 1. Project in one sentence

**ThermoWatch is a heatwave early-warning and response dashboard that converts live weather data into human heat-stress risk, identifies vulnerable groups and high-risk districts, and helps authorities take action.**

## 2. The problem we are solving

Temperature alone does not tell us how dangerous heat feels to a person. The danger also changes with:

- Humidity
- Direct sunlight and solar load
- Wind speed
- UV level
- Time of day
- Age
- Physical activity
- Acclimatization
- Existing health vulnerability

Authorities often receive weather information, public-health information, incident reports, and response information in different places. This can delay action.

ThermoWatch brings these signals into one dashboard and answers four simple questions:

1. **Where is heat risk high?**
2. **When will it become worse?**
3. **Who is most vulnerable?**
4. **What should authorities do now?**

## 3. Main idea

ThermoWatch calculates a **Human Thermal Stress Index (HTSI)** from 0 to 100.

| HTSI score | Risk level | Meaning |
|---|---|---|
| Below 38 | Low | Routine monitoring is enough |
| 38 to 54.9 | Moderate | Increase advisories and check vulnerable people |
| 55 to 69.9 | High | Open cooling support and adjust outdoor work |
| 70 to 84.9 | Extreme | Activate the district heat action plan immediately |
| 85 and above | Emergency | Escalate emergency and medical response |

The score is designed to be easy for a district officer to understand. A higher value means a higher human heat-stress risk.

## 4. Important terms

### HTSI

HTSI means **Human Thermal Stress Index**. It is the main 0–100 score used by ThermoWatch.

### Heat Index

Heat Index estimates how hot the air feels when temperature and humidity are considered together.

### WBGT

WBGT means **Wet Bulb Globe Temperature**. It is commonly used to understand heat stress during outdoor activity.

### PET

PET means **Physiological Equivalent Temperature**. It represents how the surrounding thermal conditions may feel to the human body.

### High+

“High+” means the risk is High, Extreme, or Emergency.

## 5. What is already working

### Command center

The first page gives a fast operational summary:

- Current district temperature and humidity
- Current HTSI and risk level
- WBGT, Heat Index, and PET
- Recommended immediate action
- India risk map
- 24-hour, 48-hour, and 72-hour risk horizon
- Highest-risk locations
- Risk for different vulnerable groups
- Personalized HTSI screening
- Quick response guide

### Forecast horizon

This page shows:

- Five-day weather-based risk forecast
- Three-hour HTSI trend points
- Temperature bars colored by risk
- 24-hour, 48-hour, and 72-hour warning probabilities
- Factors that influence the prediction

### India risk map

The map uses a real India state boundary shape. It shows monitored districts as colored markers.

Users can:

- Select a district from the map
- See the district’s HTSI and risk
- Compare all monitored districts
- Identify hotspots quickly
- Switch between live, +24-hour, +48-hour and +72-hour ML forecast layers
- Compare High+ probability across all monitored locations

The live prototype monitors 30 important Indian city/district locations. The reproducible historical ML dataset remains a fixed 20-location cohort so the original held-out metrics are not silently changed when live map coverage expands.

### Explainable AI page

This page communicates:

- Model version and model description
- Input features
- Accuracy, Macro F1, false alarms, and missed events
- Data-source and proxy-label limitations

Read the “What is truly ML?” section before describing this page to judges.

### Authority dashboard

The authority page provides:

- Total monitored coverage
- Number of High+ zones
- Active alerts
- Open incidents
- Ranked priority locations
- Recommended interventions
- Downloadable CSV authority brief
- Print/PDF option

### Response hub

The response page can:

- Find nearby hospitals, clinics, community centres, and water points
- Open a selected facility in OpenStreetMap
- Accept a community heat-incident report
- Validate that a useful incident description was entered
- Save incidents to the database
- Show recent district incident history

### Validation page

The validation page displays:

- Accuracy
- Precision
- Recall
- Macro F1
- Historical replay graph
- Confusion matrix
- False-alarm count
- Missed-event count
- Number of samples in each risk class

The displayed validation currently uses real historical weather with HTSI-derived proxy labels. It is not official IMD outcome validation.

Because field testing is not available during the hackathon, the page also includes a reproducible tabletop readiness simulation. It refreshes live city coverage, three forecast horizons, national layers, historical evidence and alert-channel readiness. This is technical workflow evidence, not a substitute for real officer or community usability validation.

### Persistent history

ThermoWatch stores data in a Cloudflare D1 database.

It stores:

- Weather observations
- Forecast predictions
- Alerts
- Incident reports

The History page displays recent observations and forecasts for the selected district. Refreshing the dashboard records new observations, and opening a district forecast records new prediction horizons.

### Alert center

One real notification channel is implemented: **browser notifications**.

The forecast warning engine automatically creates a persistent warning when:

- The predicted class is High, Extreme, or Emergency, and
- High+ probability is at least 60%.

Warnings are deduplicated by district, horizon, valid forecast hour and class. If the user has already granted browser-notification permission, new automatic warnings are delivered on that device without another permission prompt.

The alert workflow:

1. User selects the risk level.
2. User selects English, Hindi, Telugu, or Kannada.
3. User selects live browser delivery, SMS demo, or WhatsApp demo.
4. Browser delivery asks for notification permission and sends on that device.
5. SMS and WhatsApp produce clearly labelled previews without contacting anyone.
6. The alert or demo preview is saved in the database and audit trail.
7. The authority can acknowledge real browser alerts.

SMS and WhatsApp options are implemented as hackathon demonstrations only. Real external delivery is deliberately disabled because it requires a provider, credentials, approved sender identity, consent and delivery-status handling.

### Local assistance chatbot

The floating local assistant answers text questions about the selected city’s current risk, forecast, hydration and emergency action in English, Hindi, Telugu and Kannada. It uses the risk information already loaded in the browser and does not need a paid AI API. Optional speech input and read-aloud use the browser’s Web Speech features; language and voice availability depend on the browser and installed device voices. It is decision support, not an emergency service or medical diagnosis.

### Access and accountability

- Public visitors can read the dashboard, maps and warnings.
- A ChatGPT-authenticated visitor remains public unless the account is in the server-side officer allowlist or has an approved `user_roles` entry.
- Only officer/admin roles can send or acknowledge authority alerts or change incident status.
- Alert and incident mutations are written to an audit log.
- Rate limits protect incident and alert endpoints from repeated abuse.
- Initial administrators are configured through the server-only `THERMOWATCH_OFFICER_IDS` allowlist; individual roles can then be represented in the `user_roles` table.

### Offline and installable app support

ThermoWatch includes a web-app manifest and service worker. It can be installed as a PWA. Public dashboard and forecast responses can be viewed from cache during a temporary connection failure. Sensitive history, identity, alert and incident endpoints are deliberately not cached.

### Operational readiness

- `/api/health` checks the database and active model version.
- A public privacy and data-use page explains collection, purpose and limitations.
- Security headers disable camera and location access; microphone access is limited to this site and requested only when the user chooses voice input.
- Automated tests cover HTSI thresholds, model probability integrity, warning thresholds and API smoke checks.
- Application-owned pages and controls pass the scoped static accessibility/lint check; manual VoiceOver/NVDA testing is still recommended before field deployment.

### Personalized screening

The user can adjust:

- Age group
- Activity level
- Whether the person is acclimatized to local heat

ThermoWatch then adjusts HTSI using exposure multipliers. This is a screening tool, **not a medical diagnosis**.

## 6. Real data and fallback data

ThermoWatch is designed to keep working during a demonstration even when an external service is unavailable.

### Real data used

- **Open-Meteo:** current weather and five-day hourly forecasts
- **OpenStreetMap Overpass API:** nearby response facilities
- **Cloudflare D1:** persistent alerts, incidents, observations, and predictions
- **Browser Notification API:** on-device alert delivery

### Fallback data

Every monitored district has safe fallback temperature and humidity values. If Open-Meteo fails, ThermoWatch calculates risk using these fallback values.

This prevents a blank or broken dashboard during an SIH demonstration.

The dashboard identifies its source as either:

- `open-meteo` for live data, or
- `resilient-fallback` for demonstration fallback data.

### API-limit answer

The current weather and facility integrations do not use paid API keys in the code. However, public APIs can still apply fair-use limits, experience downtime, or change their policies.

For an SIH demo, the fallback system protects the core experience. For a government production deployment, the team should obtain a supported data agreement or official data feed instead of depending only on free public endpoints.

## 7. How the HTSI calculation works

The operational website keeps this transparent HTSI calculation as the human-readable stress score. A separately trained model now uses the same weather signals plus time, season and location to predict the live risk class and its probability.

It considers:

- Temperature
- Relative humidity
- Wind speed
- UV index
- Estimated solar load
- Air-quality stress input
- WBGT
- Heat Index
- PET
- Vulnerability/exposure multiplier

Simplified flow:

```text
Weather data
    ↓
Calculate Heat Index, WBGT and PET
    ↓
Combine thermal, humidity, sunlight, UV and air-quality stress
    ↓
Subtract wind relief
    ↓
Apply personal vulnerability multiplier when needed
    ↓
Limit result to 0–100
    ↓
Convert score into Low / Moderate / High / Extreme / Emergency
    ↓
Show recommended action
```

The exact implementation is in `lib/thermowatch.ts`.

## 8. What is truly ML and what is not

This distinction is very important when speaking to judges.

### What exists now

- Real current and forecast weather is used when available.
- HTSI is calculated by a transparent formula and remains visible beside the prediction.
- A genuine class-balanced multinomial logistic-regression model is trained by `ml/train_model.py`.
- The training run uses 233,760 real ERA5-Seamless weather rows from 20 locations.
- Coefficients are fitted on 116,800 rows from 2022–2023.
- Probability calibration uses 58,560 separate rows from 2024.
- Final evaluation uses 58,400 untouched rows from 2025.
- The exported JSON model is loaded by `lib/ml-model.ts` for current and 24/48/72-hour live inference.
- The model returns a risk class, confidence, High+ probability and the six strongest feature contributions.
- The Validation page contains 60 selectable real historical replay cases across all 20 locations.
- The exported model and reports are checksum-linked and can be verified offline with `ml/verify_artifacts.py`.

### Current measured result

- 2025 test accuracy: **93.6%**
- Macro precision: **74.8%**
- Macro recall: **95.0%**
- Macro F1: **81.0%**
- Multiclass Brier score: **0.0846**
- High+ false alarms: **1,115**
- Missed High+ events: **28**

### What is still limited

- Target labels are transparent HTSI-derived proxy classes, not verified IMD heatwave-event or health-outcome labels.
- The 2025 test period has no Emergency-class examples, so no Emergency performance claim is valid.
- The model has not yet been validated against medical outcomes or tested by an official authority.
- Extreme support is much smaller than Low, Moderate and High support.

### Honest judge answer

Use this answer:

> “ThermoWatch now runs a reproducible trained classifier for live and forecast risk. We fitted it on 2022–2023 real historical weather, calibrated probabilities on 2024, and tested once on 58,400 untouched 2025 observations. It achieved 93.6% accuracy and 81.0% macro F1 against transparent HTSI-derived proxy labels. These are engineering-validation results, not official IMD or medical accuracy, and the 2025 test set contains no Emergency examples.”

### What is needed for a complete real ML model

1. Obtain verified district-and-date heatwave labels from an official source.
2. Add health-impact labels where legally and ethically available.
3. Retrain and compare models using those official outcomes.
4. Add an explicit district-held-out generalization test.
5. Collect more Extreme and Emergency examples.
6. Validate probability thresholds with IMD, NDMA and public-health experts.
7. Monitor drift and retrain using the documented pipeline.

Call the current result a **reproducible live ML classifier evaluated on real weather with proxy labels**. Do not call it officially validated or medically accurate.

## 9. Complete feature-status checklist

| Feature | Status | What it means |
|---|---|---|
| Live current weather | Complete | Open-Meteo is connected with fallback protection |
| Five-day forecast | Complete | Hourly forecast converted into three-hour risk points |
| 24/48/72-hour warning | Complete | Risk and probability are shown for each horizon |
| HTSI calculation | Complete | Transparent 0–100 scoring engine |
| WBGT, Heat Index and PET | Complete | Calculated and displayed |
| India-shaped risk map | Complete | State boundaries and district markers |
| Vulnerability profiles | Complete | Six exposure profiles are compared |
| Personalized screening | Complete | Age, activity and acclimatization inputs |
| Authority dashboard | Complete | Priority queue, actions, CSV and print/PDF |
| Real response facilities | Complete | OpenStreetMap facilities when available |
| Incident reporting | Complete | Validated reports stored in D1 |
| Persistent history | Complete | Observations and predictions stored in D1 |
| Browser notification | Complete | Real browser notification and alert audit trail |
| Automatic ML warnings | Complete | High+ forecasts generate deduplicated persistent warning events |
| 24/48/72-hour map layers | Complete | National monitored-location layers use live model inference |
| Four-language alert text | Complete | English, Hindi, Telugu and Kannada templates are available |
| Alert acknowledgement | Complete | Status is updated and stored |
| Validation dashboard | Complete for engineering stage | Real chronological 2025 replay, metrics, matrix and selectable cases; labels remain proxy labels |
| Reproducible trained ML artifact | Complete | Versioned JSON coefficients, scaler and calibration are loaded for live inference |
| Live ML risk prediction | Complete | Current and forecast weather produce class, confidence, High+ probability and explanations |
| Official IMD outcome labels | Not complete | Must be obtained and verified by the team |
| SMS/WhatsApp options | Complete for hackathon demo | Preview messages are generated and audited but deliberately not delivered externally |
| Multilingual interface | Partial | Navigation and operational shell support English, Hindi, Telugu and Kannada; specialist content needs human language review |
| Local assistance chatbot | Complete for prototype | Text works locally in four languages; browser-supported regional speech input and read-aloud are available |
| Tabletop readiness simulation | Complete | Repeatable live pipeline, forecast, map, evidence and channel checks replace unavailable field testing without claiming usability validation |
| Login and role permissions | Complete for hosted prototype | Platform identity gives public/officer/admin server-side roles |
| Offline/PWA mode | Complete | Installable shell and privacy-safe cached public intelligence |
| Automated test suite | Complete for core paths | Unit, ML integrity, runtime parity and API smoke tests are included; full browser E2E remains a production improvement |
| Production monitoring | Partial | Health endpoint and audit logs are active; external uptime paging needs a monitoring provider |
| Formal accessibility audit | Complete for static application review | Labels, keyboard map markers, reduced motion and semantics checked; assistive-technology field testing remains |
| Privacy and retention policy | Complete for prototype | Public policy and collection limits are documented; authority-approved retention is needed for field use |

## 10. System architecture

```text
User's browser
    ↓
ThermoWatch React dashboard
    ↓
Next/Vinext API routes
    ├── Open-Meteo → weather and forecast
    ├── OpenStreetMap → nearby facilities
    ├── HTSI engine → human thermal-stress score
    └── Cloudflare D1 → history, alerts and incidents
    ↓
Dashboard, CSV export, browser notification and authority actions
```

### Main technology

- React 19
- TypeScript
- Tailwind CSS
- shadcn-style UI components
- Recharts
- Vinext/Vite
- Cloudflare Workers runtime
- Cloudflare D1 database
- Drizzle schema definitions
- ChatGPT Sites hosting

## 11. Main files and what they do

| File or folder | Purpose |
|---|---|
| `components/thermowatch-dashboard.tsx` | Main dashboard UI, navigation, forms, maps and charts |
| `lib/thermowatch.ts` | District list, live weather calls, fallback data, HTSI formula and facility search |
| `lib/database.ts` | Creates database tables and generates record IDs |
| `db/schema.ts` | Database table definitions |
| `app/api/dashboard/route.ts` | Loads all district data and authority summary |
| `app/api/district/route.ts` | Loads one district forecast and nearby facilities |
| `app/api/htsi/route.ts` | Calculates personalized HTSI |
| `app/api/alerts/route.ts` | Sends, stores, lists and acknowledges alerts |
| `app/api/incidents/route.ts` | Stores and lists incident reports |
| `app/api/history/route.ts` | Returns stored observations and predictions |
| `app/api/forecast-map/route.ts` | Builds cached 24/48/72-hour national forecast layers and evaluates warnings |
| `app/api/warnings/route.ts` | Returns active automatic ML warning events |
| `app/api/session/route.ts` | Returns the signed-in user’s server-side role |
| `app/api/audit/route.ts` | Returns the protected authority mutation trail |
| `app/api/health/route.ts` | Reports database and model health |
| `app/api/export/route.ts` | Downloads a CSV authority brief |
| `app/globals.css` | Design colors, theme and accessibility-related motion settings |
| `.openai/hosting.json` | Sites project and D1 binding configuration |

## 12. Database tables

### `observations`

Stores district temperature, humidity, HTSI, risk, source and observation time.

### `predictions`

Stores district warning horizon, probability, predicted class, source and prediction time.

### `alerts`

Stores alert ID, district, risk, channel, language, message, status and acknowledgement time.

### `incidents`

Stores district, incident type, severity, description, reporter, status and creation time.

### `warning_events`

Stores deduplicated automatic forecast warnings, model version, horizon, valid time and status.

### `audit_logs`

Stores authority and community mutations with actor role, action, entity and timestamp.

### `rate_limits`

Stores privacy-preserving request buckets used to control repeated submissions.

### `user_roles`

Stores optional role overrides for platform-authenticated users.

The API automatically creates these tables if they do not already exist.

## 13. API reference

| Method and endpoint | Purpose |
|---|---|
| `GET /api/dashboard` | Get all districts, authority summary, model information and validation data |
| `GET /api/district?district=Delhi` | Get one district's current data and forecast |
| `GET /api/district?district=Delhi&facilities=true` | Also find nearby response facilities |
| `POST /api/htsi` | Calculate personalized HTSI |
| `GET /api/alerts?district=Delhi` | List stored district alerts |
| `POST /api/alerts` | Create a browser alert record and message |
| `PATCH /api/alerts` | Acknowledge an alert |
| `GET /api/incidents?district=Delhi` | List district incident reports |
| `POST /api/incidents` | Store a new incident report |
| `GET /api/history?district=Delhi` | Get stored observations and predictions |
| `GET /api/forecast-map` | Get cached 24/48/72-hour map layers and run the automatic warning engine |
| `GET /api/warnings?district=Delhi` | List active automatic warning events |
| `GET /api/session` | Read current public/officer/admin access state |
| `GET /api/audit` | Read the protected authority audit log |
| `GET /api/health` | Check database and model status |
| `GET /api/export` | Download current district data as CSV |

### Personalized HTSI request example

```json
{
  "temperature_c": 40,
  "humidity_pct": 55,
  "wind_speed_ms": 1.5,
  "uv_index": 8,
  "age_group": "elderly",
  "activity": "moderate",
  "acclimatized": false
}
```

### Incident request rules

An incident requires:

- District
- Incident type
- Severity
- Description of at least 10 characters

Reporter name or organization is optional and defaults to `anonymous`.

## 14. How to run the project locally

### Requirements

- Node.js 22.13 or newer
- npm
- Project dependencies installed

### First-time setup

```bash
cd thermowatch-site
npm install
npm run dev
```

Open the local URL printed in the terminal, normally `http://127.0.0.1:5173`.

### Verify a production build

```bash
npm run build
```

The build should finish without TypeScript or compilation errors.

### Useful commands

```bash
npm run dev       # Start local development
npm run build     # Create and verify the production build
npm run lint      # Check code quality
npm run format    # Format the code
```

## 15. Five-minute SIH demonstration plan

### Minute 1 — Explain the problem

Say:

> “Temperature alone is not enough to measure human heat danger. ThermoWatch combines weather, thermal-stress indicators, vulnerability and response actions in one district command center.”

Show the current district HTSI, risk badge and immediate recommended action.

### Minute 2 — Show spatial and future risk

Open the India risk map and select another district. Then show the 24-hour, 48-hour and 72-hour forecast.

Say:

> “The system helps authorities act before the heat peak instead of reacting after incidents occur.”

### Minute 3 — Show human vulnerability

Use personalized screening. Compare an adult at rest with an older adult doing heavier activity.

Say:

> “The same weather does not create the same risk for every person.”

### Minute 4 — Show action and persistence

Open the Response hub, show nearby facilities, and submit a demonstration incident. Then open History.

Say:

> “Observations, predictions and field reports are stored, creating an audit trail for later review.”

### Minute 5 — Show notification and honesty

Send a browser alert and acknowledge it. Open Validation and explain the limitation honestly.

Say:

> “The operational baseline is transparent and usable now. Official production calibration will use verified IMD and health outcomes, which is our next validation milestone.”

## 16. Answers to likely judge questions

### What is the innovation?

ThermoWatch does not stop at weather forecasting. It connects live weather, human thermal stress, personal vulnerability, district prioritization, response facilities, field incidents, persistent history and notifications in one operational workflow.

### Is the data real?

Current weather and forecasts come from Open-Meteo when available. Nearby facilities come from OpenStreetMap. The project clearly identifies fallback data when an external API is unavailable.

### Is the ML model real?

Yes. The live risk class is produced by a trained, versioned multinomial logistic-regression artifact. The model was fitted on 2022–2023 real weather, probability-calibrated on 2024 and tested on untouched 2025 data. HTSI remains a transparent supporting score. The important limitation is that training targets are HTSI-derived proxy labels, not verified official events or medical outcomes.

### Why not use temperature alone?

Humidity, sunlight, wind and human vulnerability can greatly change heat stress even when air temperature is similar.

### Are alerts real?

Browser notifications are real and alerts are stored and acknowledged in the database. SMS and WhatsApp are visible, auditable demo previews only; real delivery still needs provider credentials, consent and sender approval.

### Is history persistent?

Yes. Observations, predictions, alerts and incidents are stored in Cloudflare D1.

### What happens if the weather API fails?

The dashboard switches to clearly identified resilient fallback data so the interface and decision workflow remain available.

### Can this be used as medical advice?

No. It is an early-warning and decision-support system, not a medical diagnostic tool.

### Can it scale across India?

The architecture can add more district coordinates and official feeds. Nationwide production would also need API capacity planning, official data partnerships, district-level validation, monitoring and role-based access.

## 17. What the team must do next

These activities require team ownership, official access, credentials, or field participation:

### Highest priority

- Obtain verified IMD district/date heatwave outcomes.
- Validate HTSI thresholds with public-health and disaster-management experts.
- Replace proxy labels with verified IMD and, where appropriate, public-health outcomes, then retrain the versioned artifact.
- Run the included tabletop readiness simulation before judging and preserve screenshots of its evidence.
- After the hackathon, test the system with district officers and community users and collect evidence that the workflow improves response time or decision quality.

### Notification readiness

- If moving beyond the demo, select an SMS or WhatsApp provider.
- Obtain credentials and approved sender identity/templates.
- Add consent, unsubscribe and delivery-status handling.
- Define who is authorized to send public alerts.

### Production safety

- Periodically review the implemented officer/admin permissions and audit logs.
- Approve the prototype privacy/retention policy for the target authority and jurisdiction.
- Configure platform backups and a tested disaster-recovery procedure.
- Complete an independent security review before field deployment.

### Reliability

- Add full browser end-to-end tests to the existing unit and API smoke suite.
- Connect the health endpoint to an external uptime and paging provider.
- Add caching so external APIs are not called unnecessarily.
- Load-test the system for district and national usage.

### Product readiness

- Translate the full dashboard into required Indian languages.
- Improve low-bandwidth and mobile support.
- Have native Hindi, Telugu and Kannada reviewers approve the translated operational shell, assistant prompts and specialist wording.
- Add an official source and last-updated timestamp to every major data panel.
- Add state/district filtering for nationwide expansion.

## 18. What not to claim

Do not tell judges or users that:

- The system is officially approved by IMD, NDMA, or a health authority.
- The HTSI score itself is produced by ML; HTSI remains a transparent formula while the displayed risk class and probability use the model.
- The current validation proves medical accuracy.
- SMS or WhatsApp messages are delivered to real recipients; these are demo previews only.
- The current 30-city live prototype is complete nationwide district coverage.
- ThermoWatch can replace official emergency alerts or medical advice.

Correct wording builds trust and makes the project stronger.

## 19. Presentation checklist

Before the SIH demonstration:

- [ ] Open the website on the presentation laptop.
- [ ] Allow browser notifications before the main demo.
- [ ] Confirm live weather is connected or understand the fallback label.
- [ ] Refresh the dashboard once to create observation history.
- [ ] Open two districts so prediction history exists.
- [ ] Submit one clearly marked demonstration incident.
- [ ] Send and acknowledge one demonstration alert.
- [ ] Test the India map and district selector.
- [ ] Test the CSV download.
- [ ] Test Print/PDF.
- [ ] Keep a screen recording or screenshots as backup.
- [ ] Prepare the honest ML explanation.
- [ ] Prepare the architecture diagram.
- [ ] Assign one team member to operate and one to speak.
- [ ] Keep the complete demo below five minutes.

## 20. Short final pitch

> “ThermoWatch converts live and forecast weather into human-centered heat-risk intelligence. Its reproducible classifier estimates risk and High+ probability, while transparent HTSI explains the conditions behind each result. Authorities can see where danger is rising, identify exposed groups, review forecast-map layers, record incidents and send auditable warnings. The prototype is validated on real historical weather with proxy labels and clearly separates engineering evidence from the official validation still required for field deployment.”

---

## 21. Current release note

The current source includes the trained ML model, historical replay, automatic warnings, 30-city forecast layers, hardened authority permissions, a four-language operational shell and local assistant, regional browser voice support, live browser alerts, SMS/WhatsApp demo previews, a tabletop readiness simulation, PWA support, health/privacy safeguards and automated core tests. It is ready to push to GitHub and publish through the existing Sites/Cloudflare runtime after validation.

Important deployment note: the current persistent database and identity integration use Cloudflare D1 and Sites authentication. A direct Vercel deployment would need a separate database adapter (for example, a managed PostgreSQL service), matching environment variables and replacement authentication. Uploading the repository to Vercel without that migration would lose or break persistent history, roles, incidents and alerts. Keep the existing Sites deployment for the hackathon unless the team schedules that migration.
