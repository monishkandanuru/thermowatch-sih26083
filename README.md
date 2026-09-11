# ThermoWatch — SIH26083

ThermoWatch is a heatwave early-warning and decision-support platform built for Smart India Hackathon problem statement **SIH26083**. It helps authorities identify heat risk, understand who is exposed, and coordinate an appropriate response.

## Live project

- **Vercel:** https://thermowatch-sih26083.vercel.app/
- **Primary live service:** https://thermowatch-sih26083.monishkandanuru.chatgpt.site/

## What it demonstrates

- Live weather-informed heat-stress assessment for Indian cities
- India risk map with district-level hotspots and forecast layers
- Reproducible ML risk model with historical validation replay
- Explainable risk factors and recommended response actions
- Persistent alerts, history, role-based workflows, and validation records
- Kannada localisation across the application
- Local assistance chatbot with regional-language text and voice support
- SMS and WhatsApp notification demonstrations for hackathon evaluation

## Access levels

- **Public:** command centre, forecasts, India risk map, Explainable AI, validation evidence, public warnings and the local assistant.
- **Officer:** authority overview, response operations, persistent history, alert workflows, audit-controlled actions and CSV export.

Open `/login` to enter the protected officer workspace. The prototype credentials are documented in `START_HERE.md`. For deployment, set `THERMOWATCH_DEMO_USER`, `THERMOWATCH_DEMO_PASSWORD` and a strong `THERMOWATCH_DEMO_SESSION_SECRET` as server-side secrets instead of using the local fallback values.

## Run locally

```bash
npm install
npm run dev
```

Then open the local address printed by the development server.

## Verify the project

```bash
npm test
npx tsc --noEmit
npm run build
npm run test:api
```

## Notes for evaluation

The deployment uses the primary service for the application runtime so that live data, stored history, alert workflows, and role-based features remain available. The Vercel address is a public entry point to that same live application.

For the deeper product, model, architecture, validation, and demonstration guidance, see `THERMOWATCH_PROJECT_GUIDE.md` in this repository.
