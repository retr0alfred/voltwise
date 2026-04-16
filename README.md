# VoltWise

AI-Driven Energy Trading Intelligence for Indian Power Markets (IEX).

VoltWise is a frontend-first analytics platform built for Cognizant Technoverse Hackathon 2026 by Team Luminaries. It visualizes large-scale market, demand, weather, and engineered feature datasets to support energy trading decisions.

## Highlights

- React + TypeScript dashboard for Indian power market analytics
- Full CSV ingestion in-browser using PapaParse (worker-first strategy)
- Historical IEX pricing, demand, weather, and market signal visualizations
- Sophisticated pastel design system with minimal, professional interactions
- Predictions page scaffolded and ready for backend model integration

## Team Luminaries

- J Navaneetha Krishnaa - Team Lead
- Alfred Mathew - Systems Architect, Frontend & Visualization
- Pathmajam Suresh - Data Engineering and Machine Learning
- Sushree Sonali Patra - Backend and Model Integration

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router v6
- Recharts
- PapaParse
- Tailwind CSS
- Lucide React

## Project Structure

```text
voltwise/
├── backend/
│   └── .gitkeep
├── frontend/
│   ├── public/
│   │   └── data/
│   │       ├── demand.csv
│   │       ├── IEX.csv
│   │       ├── voltwise_final.csv
│   │       └── weather.csv
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── VOLTWISE_DEV_LOG.md
└── README.md
```

## Datasets

The frontend currently reads all data directly from `frontend/public/data/`:

- `demand.csv` - national and regional hourly demand
- `IEX.csv` - IEX bids, volumes, MCP, weighted MCP
- `voltwise_final.csv` - merged and engineered feature dataset
- `weather.csv` - multi-city weather history (Delhi, Mumbai, Kolkata, Chennai, Guwahati)

## Getting Started

### 1. Install dependencies

From the workspace root:

```bash
cd frontend
npm install
```

### 2. Run in development

```bash
npm run dev
```

Vite will print the local URL (typically `http://localhost:5173` or next available port).

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

## Current Status

- Frontend: implemented and build-verified
- Backend: scaffolded placeholder (not implemented)
- Predictions engine: UI placeholder ready for model/API wiring

## Notes for Developers

- CSV loading is implemented with a worker-first parse path and fallback handling in `frontend/src/hooks/useCSVData.ts`.
- Chart components intentionally avoid heavy animations to keep rendering stable with large datasets.
- Shared parsing/types live in `frontend/src/utils/dataHelpers.ts`.

## License

See `LICENSE`.
