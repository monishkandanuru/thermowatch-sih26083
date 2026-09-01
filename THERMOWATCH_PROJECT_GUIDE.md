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

The current prototype monitors 20 important Indian cities/district locations.

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

The alert workflow:

1. User selects the risk level.
2. User selects English, Hindi, or Telugu.
3. Browser asks for notification permission.
4. ThermoWatch sends a notification on that device.
5. The alert is saved in the database.
6. The authority can acknowledge the alert.

SMS and webhook delivery are not active because they require an external provider and credentials.

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

The operational website currently uses a transparent calculation, not a hidden black box.

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
- HTSI risk is calculated by a transparent formula.
- The project contains model metadata and validation results for a class-balanced multinomial heat-risk classifier concept.
- Historical real weather and HTSI-derived proxy labels are used to describe the current validation approach.

### What does not exist in the hosted runtime yet

- There is no separately trained `.pkl`, `.onnx`, TensorFlow, or PyTorch model file loaded by the website.
- The runtime prediction is not currently produced by model inference.
- The validation labels are not official IMD heatwave-event outcomes.
- Emergency-class support is currently insufficient for a strong official ML claim.

### Honest judge answer

Use this answer:

> “The current decision engine is a transparent HTSI baseline built on live weather. We have designed and evaluated the classification layer using historical weather and proxy labels, but official deployment requires training and calibrating the model against verified IMD and public-health outcomes. We intentionally show this limitation instead of claiming unsupported accuracy.”

### What is needed for a complete real ML model

1. Obtain verified district-and-date heatwave labels from an official source.
2. Add health-impact labels where legally and ethically available.
3. Create a versioned training dataset.
4. Split training and testing data chronologically, not randomly.
5. Handle class imbalance, especially Extreme and Emergency events.
6. Train and compare baseline models.
7. Calibrate predicted probabilities.
8. Test district-to-district generalization.
9. Export the selected model as a deployable artifact.
10. Load that artifact in the API and use it for live inference.
11. Monitor drift and retrain it using a documented process.

Until those steps are done, call HTSI a **transparent risk engine** rather than claiming that every live score is generated by ML.

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
| Hindi and Telugu alert text | Complete | Alert message templates are available |
| Alert acknowledgement | Complete | Status is updated and stored |
| Validation dashboard | Partial | Proxy-label results are shown, not official validation |
| Real deployed ML artifact | Not complete | Runtime currently uses the transparent HTSI formula |
| Official IMD outcome labels | Not complete | Must be obtained and verified by the team |
| SMS/WhatsApp alerts | Not complete | Requires a provider, credentials and sender approval |
| Full multilingual interface | Not complete | Only alert messages are multilingual |
| Login and role permissions | Not complete | No citizen/officer/admin authentication yet |
| Offline/PWA mode | Not complete | Website currently needs connectivity |
| Automated test suite | Not complete | Production unit, integration and end-to-end tests are needed |
| Production monitoring | Not complete | Logging, uptime alerts and API monitoring are needed |
| Formal accessibility audit | Not complete | Keyboard and reduced-motion support exist, but a full WCAG audit is still needed |
| Privacy and retention policy | Not complete | Must be written before collecting real citizen data |

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

The live website currently uses a transparent HTSI risk engine. The classifier and validation layer are a prototype based on real historical weather and proxy labels. A deployed trained model requires verified official outcome labels and final calibration.

### Why not use temperature alone?

Humidity, sunlight, wind and human vulnerability can greatly change heat stress even when air temperature is similar.

### Are alerts real?

Browser notifications are real and alerts are stored and acknowledged in the database. SMS and WhatsApp need provider credentials and sender approval.

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
- Train and deploy a real versioned ML artifact.
- Test the system with district officers and community users.
- Collect evidence that the workflow improves response time or decision quality.

### Notification readiness

- Select an SMS or WhatsApp provider.
- Obtain credentials and approved sender identity/templates.
- Add consent, unsubscribe and delivery-status handling.
- Define who is authorized to send public alerts.

### Production safety

- Add officer/admin login and role permissions.
- Add rate limiting and abuse prevention to incident and alert endpoints.
- Write a privacy policy and data-retention policy.
- Avoid collecting unnecessary personal or medical information.
- Add security review, backups and disaster recovery.

### Reliability

- Add automated unit tests for HTSI thresholds.
- Add API integration tests and browser end-to-end tests.
- Add uptime monitoring and provider-failure alerts.
- Add caching so external APIs are not called unnecessarily.
- Load-test the system for district and national usage.

### Product readiness

- Translate the full dashboard into required Indian languages.
- Improve low-bandwidth and mobile support.
- Consider offline/PWA functionality.
- Add an official source and last-updated timestamp to every major data panel.
- Add state/district filtering for nationwide expansion.

## 18. What not to claim

Do not tell judges or users that:

- The system is officially approved by IMD, NDMA, or a health authority.
- Every live score is produced by a deployed ML model.
- The current validation proves medical accuracy.
- SMS or WhatsApp alerts are already active.
- The current 20-location prototype is complete nationwide district coverage.
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

> “ThermoWatch converts live weather into human-centered heat-risk intelligence. It helps authorities see where danger is rising, understand who is most exposed, act before the peak, record field incidents, and send auditable warnings. The current prototype combines real weather, a transparent HTSI engine, persistent history, response facilities and browser notifications, while clearly identifying the official data and ML calibration needed for production.”

---

## 21. Current release note

The refreshed premium dashboard design is saved as **Version 4**. At the time this guide was created, it was prepared but still awaiting approval to replace the existing public version.

