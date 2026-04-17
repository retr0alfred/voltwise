# VoltWise

AI-Driven Energy Trading Intelligence for Indian Power Markets (IEX).

VoltWise is a full-stack analytics platform built for Cognizant Technoverse Hackathon 2026 by Team Luminaries. It combines dashboard analytics with live backend model outputs to support energy trading decisions.

## Highlights

- React + TypeScript dashboard for Indian power market analytics
- Full CSV ingestion in-browser using PapaParse (worker-first strategy)
- Historical IEX pricing, demand, weather, and market signal visualizations
- Sophisticated pastel design system with minimal, professional interactions
- Predictions page integrated with backend live stream endpoint (`/live-data`)
- Simulation controls to start and stop backend streaming from the UI

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
- FastAPI
- Uvicorn
- Pandas / NumPy / XGBoost / SHAP

## Project Structure

```text
voltwise/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── simulator.py
│   │   ├── decision_engine.py
│   │   └── ...
│   ├── data/
│   ├── models/
│   └── requirements.txt
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
│   │   ├── services/
│   │   ├── styles/
│   │   ├── types/
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

### 1. Backend setup

From the workspace root:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

If your team uses a workspace-level virtual environment, activate that environment instead.

Run backend API:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Install frontend dependencies

From the workspace root:

```bash
cd frontend
npm install
```

### 3. Run in development

```bash
npm run dev
```

Vite will print the local URL (typically `http://localhost:5173` or next available port). Frontend API calls use `/api` and proxy to `http://127.0.0.1:8000` by default.

Run backend and frontend in separate terminals:

1. Terminal A (backend): `uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`
2. Terminal B (frontend): `npm run dev`

Optional override:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 4. Build frontend for production

```bash
npm run build
```

### 5. Preview production build

```bash
npm run preview
```

## Current Status

- Frontend: implemented and build-verified
- Backend: implemented FastAPI endpoints with simulation + live stream
- Predictions engine: integrated UI with `/live-data`, `/simulate`, and `/stop-simulation`

## Notes for Developers

- CSV loading is implemented with a worker-first parse path and fallback handling in `frontend/src/hooks/useCSVData.ts`.
- Chart components intentionally avoid heavy animations to keep rendering stable with large datasets.
- Shared parsing/types live in `frontend/src/utils/dataHelpers.ts`.
- Frontend-to-backend API wrappers live in `frontend/src/services/predictionsApi.ts`.

## Repository Hygiene

- Generated Python cache files (`__pycache__`, `*.pyc`) are ignored.
- Simulation runtime export `backend/data/simulation_output.csv` is ignored.
- If a generated file is already tracked from older commits, run `git rm --cached <file>` once to untrack it.

## License

See `LICENSE`.
