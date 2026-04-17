import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brain,
  Loader2,
  Play,
  Square,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DAMLiveDataPoint,
  DAMLiveDataResponse,
  LiveDataPoint,
  LiveDataResponse,
  SimulationControlPayload,
} from "../types/predictions";
import {
  getDamLiveData,
  getLiveData,
  startDamSimulation,
  startSimulation,
  stopDamSimulation,
  stopSimulation,
} from "../services/predictionsApi";
import { formatCurrency, formatNumber } from "../utils/dataHelpers";

const POLL_INTERVAL_MS = 2500;
const CHART_WINDOW = 36;

const parseSimulationPayload = (
  speedInput: string,
  limitInput: string,
): { payload: SimulationControlPayload | null; error: string | null } => {
  const speed = Number.parseFloat(speedInput);
  if (!Number.isFinite(speed) || speed <= 0) {
    return { payload: null, error: "Speed must be a positive number." };
  }

  const trimmedLimit = limitInput.trim();
  let limit: number | null = null;
  if (trimmedLimit.length > 0) {
    const parsedLimit = Number.parseInt(trimmedLimit, 10);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      return { payload: null, error: "Limit must be empty or a positive integer." };
    }
    limit = parsedLimit;
  }

  return {
    payload: { speed, limit },
    error: null,
  };
};

const formatTimeLabel = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getDecisionTone = (decision: string): { accent: string; icon: JSX.Element } => {
  const normalized = decision.toUpperCase();
  if (normalized.includes("BUY")) {
    return {
      accent: "text-[var(--pastel-green)]",
      icon: <TrendingUp className="h-5 w-5 text-[var(--pastel-green)]" aria-hidden="true" />,
    };
  }

  if (normalized.includes("SELL")) {
    return {
      accent: "text-[var(--pastel-yellow)]",
      icon: <TrendingDown className="h-5 w-5 text-[var(--pastel-yellow)]" aria-hidden="true" />,
    };
  }

  return {
    accent: "text-[var(--pastel-blue)]",
    icon: <Activity className="h-5 w-5 text-[var(--pastel-blue)]" aria-hidden="true" />,
  };
};

function Predictions(): JSX.Element {
  const [liveData, setLiveData] = useState<LiveDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [speedInput, setSpeedInput] = useState<string>("6");
  const [limitInput, setLimitInput] = useState<string>("288");

  const [damLiveData, setDamLiveData] = useState<DAMLiveDataResponse | null>(null);
  const [damError, setDamError] = useState<string | null>(null);
  const [isDamLoading, setIsDamLoading] = useState<boolean>(true);
  const [isDamSubmitting, setIsDamSubmitting] = useState<boolean>(false);
  const [damSpeedInput, setDamSpeedInput] = useState<string>("4");
  const [damLimitInput, setDamLimitInput] = useState<string>("288");

  const fetchLiveData = useCallback(async (isBackgroundPoll = false): Promise<void> => {
    if (!isBackgroundPoll) {
      setIsLoading(true);
    }

    try {
      const response = await getLiveData();
      setLiveData(response);
      setError(null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch live predictions.");
    } finally {
      if (!isBackgroundPoll) {
        setIsLoading(false);
      }
    }
  }, []);

  const fetchDamLiveData = useCallback(async (isBackgroundPoll = false): Promise<void> => {
    if (!isBackgroundPoll) {
      setIsDamLoading(true);
    }

    try {
      const response = await getDamLiveData();
      setDamLiveData(response);
      setDamError(null);
    } catch (fetchError) {
      setDamError(fetchError instanceof Error ? fetchError.message : "Failed to fetch DAM live data.");
    } finally {
      if (!isBackgroundPoll) {
        setIsDamLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchLiveData();
    void fetchDamLiveData();

    const intervalId = window.setInterval(() => {
      void fetchLiveData(true);
      void fetchDamLiveData(true);
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchDamLiveData, fetchLiveData]);

  const rows = liveData?.data ?? [];
  const latest = rows.length ? rows[rows.length - 1] : null;
  const recentRows = useMemo(() => rows.slice(-8).reverse(), [rows]);

  const trendData = useMemo(
    () =>
      rows.slice(-CHART_WINDOW).map((row: LiveDataPoint, index: number) => ({
        id: index + 1,
        timestamp: row.datetime,
        currentMcp: row.current_mcp,
        pred15: row["pred_t+15min"],
        pred1h: row["pred_t+1hr"],
        pred2h: row["pred_t+2hr"],
      })),
    [rows],
  );

  const decisionTone = getDecisionTone(latest?.decision ?? "HOLD");

  const projectedMovePct = latest
    ? ((latest["pred_t+15min"] - latest.current_mcp) / Math.max(latest.current_mcp, 1)) * 100
    : 0;

  const topDrivers = latest?.explanation?.top_features ?? [];

  const damRows = damLiveData?.data ?? [];
  const damLatest = damRows.length ? damRows[damRows.length - 1] : null;

  const damTrendData = useMemo(
    () =>
      damRows.slice(-CHART_WINDOW).map((row: DAMLiveDataPoint, index: number) => ({
        id: index + 1,
        timestamp: row.datetime,
        currentMcp: row.current_mcp,
        predictedDamPrice: row.predicted_dam_price,
        actualDamPrice: row.actual_dam_price,
      })),
    [damRows],
  );

  const damRecentRows = useMemo(() => damRows.slice(-8).reverse(), [damRows]);

  const damEvaluatedRows = useMemo(
    () => damRows.filter((row) => row.actual_dam_price !== null),
    [damRows],
  );

  const damHitRatePct = damEvaluatedRows.length
    ? (damEvaluatedRows.filter((row) => row.correct_prediction).length / damEvaluatedRows.length) * 100
    : 0;

  const damMovePct = damLatest
    ? ((damLatest.predicted_dam_price - damLatest.current_mcp) / Math.max(damLatest.current_mcp, 1)) * 100
    : 0;

  const handleStartSimulation = async (): Promise<void> => {
    const parsed = parseSimulationPayload(speedInput, limitInput);
    if (!parsed.payload) {
      setError(parsed.error ?? "Invalid simulation inputs.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await startSimulation(parsed.payload);
      await fetchLiveData(true);
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : "Unable to start simulation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStopSimulation = async (): Promise<void> => {
    setIsSubmitting(true);
    setError(null);

    try {
      await stopSimulation();
      await fetchLiveData(true);
    } catch (stopError) {
      setError(stopError instanceof Error ? stopError.message : "Unable to stop simulation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDamSimulation = async (): Promise<void> => {
    const parsed = parseSimulationPayload(damSpeedInput, damLimitInput);
    if (!parsed.payload) {
      setDamError(parsed.error ?? "Invalid DAM simulation inputs.");
      return;
    }

    setIsDamSubmitting(true);
    setDamError(null);

    try {
      await startDamSimulation(parsed.payload);
      await fetchDamLiveData(true);
    } catch (startError) {
      setDamError(startError instanceof Error ? startError.message : "Unable to start DAM simulation.");
    } finally {
      setIsDamSubmitting(false);
    }
  };

  const handleStopDamSimulation = async (): Promise<void> => {
    setIsDamSubmitting(true);
    setDamError(null);

    try {
      await stopDamSimulation();
      await fetchDamLiveData(true);
    } catch (stopError) {
      setDamError(stopError instanceof Error ? stopError.message : "Unable to stop DAM simulation.");
    } finally {
      setIsDamSubmitting(false);
    }
  };

  return (
    <div className="fade-in space-y-5">
      <section className="card overflow-hidden">
        <div className="bg-gradient-to-r from-[rgba(132,165,157,0.18)] via-[rgba(123,158,175,0.18)] to-[rgba(181,166,201,0.18)] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Live model stream</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                Intraday Predictions Console
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
                Streaming from <span className="data-mono">/live-data</span> with model outputs for
                t+15min, t+1hr, t+2hr and decision recommendations.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Pipeline status</p>
              <p className="mt-1 font-semibold text-[var(--text-primary)]">
                {liveData?.is_running ? "Running" : "Idle"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Speed
              <input
                value={speedInput}
                onChange={(event) => setSpeedInput(event.target.value)}
                className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--pastel-blue)]"
                placeholder="6"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Limit
              <input
                value={limitInput}
                onChange={(event) => setLimitInput(event.target.value)}
                className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--pastel-blue)]"
                placeholder="288"
              />
            </label>
            <button
              type="button"
              onClick={handleStartSimulation}
              disabled={isSubmitting || liveData?.is_running}
              className="interactive-lift inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Start simulation
            </button>
            <button
              type="button"
              onClick={handleStopSimulation}
              disabled={isSubmitting || !liveData?.is_running}
              className="interactive-lift inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Square className="h-4 w-4" />}
              Stop simulation
            </button>
          </div>
        </div>
      </section>

      {error ? (
        <section className="card flex items-center gap-3 border-[rgba(226,192,68,0.55)] bg-[rgba(226,192,68,0.12)] px-4 py-3 text-sm text-[var(--text-primary)]">
          <AlertTriangle className="h-4 w-4 text-[var(--pastel-yellow)]" aria-hidden="true" />
          <p>{error}</p>
        </section>
      ) : null}

      {isLoading && rows.length === 0 ? (
        <section className="card flex items-center gap-3 p-6 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <p>Loading live model stream...</p>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="card interactive-lift p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Decision</p>
          <div className="mt-3 flex items-center gap-2">
            {decisionTone.icon}
            <p className={`text-2xl font-semibold tracking-tight ${decisionTone.accent}`}>
              {latest?.decision ?? "HOLD"}
            </p>
          </div>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Confidence {latest ? `${(latest.confidence * 100).toFixed(1)}%` : "0.0%"}
          </p>
        </article>

        <article className="card interactive-lift p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Price signal</p>
          <p className="data-mono mt-3 text-xl font-semibold text-[var(--text-primary)]">
            {latest ? `${formatCurrency(latest.current_mcp)} Rs/MWh` : "No data"}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            t+15 projection {latest ? `${formatCurrency(latest["pred_t+15min"])} Rs/MWh` : "-"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Move {latest ? `${projectedMovePct > 0 ? "+" : ""}${projectedMovePct.toFixed(2)}%` : "0.00%"}
          </p>
        </article>

        <article className="card interactive-lift p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Stream metrics</p>
          <p className="mt-3 text-sm text-[var(--text-primary)]">
            Processed: <span className="data-mono">{formatNumber(liveData?.total_processed ?? 0)}</span>
          </p>
          <p className="mt-2 text-sm text-[var(--text-primary)]">
            Buffer size: <span className="data-mono">{formatNumber(rows.length)}</span>
          </p>
          <p className="mt-2 text-sm text-[var(--text-primary)]">
            Cursor index: <span className="data-mono">{formatNumber(liveData?.current_index ?? 0)}</span>
          </p>
        </article>
      </section>

      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Multi-horizon trend</h2>
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Last {CHART_WINDOW} points</p>
        </div>
        <div className="chart-shell">
          <div className="h-[340px] min-w-[860px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                <CartesianGrid stroke="var(--border-soft)" vertical={false} strokeDasharray="2 2" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimeLabel}
                  minTickGap={56}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip
                  contentStyle={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: 8,
                    backgroundColor: "var(--bg-card)",
                  }}
                  formatter={(value: number | string, name: string) => {
                    const labelMap: Record<string, string> = {
                      currentMcp: "Current MCP",
                      pred15: "Pred t+15min",
                      pred1h: "Pred t+1hr",
                      pred2h: "Pred t+2hr",
                    };
                    return [`${formatCurrency(Number(value))} Rs/MWh`, labelMap[name] ?? name];
                  }}
                  labelFormatter={(value: string) => `Time: ${value}`}
                />
                <Line type="monotone" dataKey="currentMcp" stroke="var(--pastel-blue)" strokeWidth={1.8} dot={false} />
                <Line type="monotone" dataKey="pred15" stroke="var(--pastel-green)" strokeWidth={1.8} dot={false} />
                <Line type="monotone" dataKey="pred1h" stroke="var(--pastel-yellow)" strokeWidth={1.6} dot={false} />
                <Line type="monotone" dataKey="pred2h" stroke="var(--pastel-lavender)" strokeWidth={1.6} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <article className="card p-6 xl:col-span-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[var(--pastel-lavender)]" aria-hidden="true" />
            <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Top feature drivers</h2>
          </div>
          {topDrivers.length ? (
            <ul className="mt-4 space-y-2 text-sm text-[var(--text-primary)]">
              {topDrivers.map((feature) => (
                <li key={feature} className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-light)] px-3 py-2">
                  {feature}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              SHAP feature highlights appear after the simulation starts streaming.
            </p>
          )}
        </article>

        <article className="card xl:col-span-3">
          <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-6 py-4">
            <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Recent predictions</h2>
            <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Latest 8 rows</p>
          </div>

          {recentRows.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-soft)] text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    <th className="px-6 py-3 font-medium">Time</th>
                    <th className="px-6 py-3 font-medium">Current</th>
                    <th className="px-6 py-3 font-medium">t+15</th>
                    <th className="px-6 py-3 font-medium">t+1hr</th>
                    <th className="px-6 py-3 font-medium">Decision</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRows.map((row) => (
                    <tr key={`${row.datetime}-${row.current_mcp}`} className="border-b border-[var(--border-soft)]/70">
                      <td className="px-6 py-3 text-[var(--text-primary)]">{formatTimeLabel(row.datetime)}</td>
                      <td className="data-mono px-6 py-3 text-[var(--text-primary)]">{formatCurrency(row.current_mcp)}</td>
                      <td className="data-mono px-6 py-3 text-[var(--text-primary)]">{formatCurrency(row["pred_t+15min"])}</td>
                      <td className="data-mono px-6 py-3 text-[var(--text-primary)]">{formatCurrency(row["pred_t+1hr"])}</td>
                      <td className="px-6 py-3 text-[var(--text-primary)]">{row.decision}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-8 text-sm text-[var(--text-muted)]">No live rows yet. Start simulation to populate this stream.</div>
          )}
        </article>
      </section>

      <section className="card overflow-hidden">
        <div className="bg-gradient-to-r from-[rgba(123,158,175,0.18)] via-[rgba(181,166,201,0.16)] to-[rgba(132,165,157,0.14)] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">Day-ahead stream</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                DAM Predictions Console
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-[var(--text-muted)]">
                Streaming from <span className="data-mono">/dam-live-data</span> with 24hr-ahead
                DAM price predictions and real-time error tracking.
              </p>
            </div>

            <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] px-4 py-3 text-sm">
              <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Pipeline status</p>
              <p className="mt-1 font-semibold text-[var(--text-primary)]">
                {damLiveData?.is_running ? "Running" : "Idle"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Speed
              <input
                value={damSpeedInput}
                onChange={(event) => setDamSpeedInput(event.target.value)}
                className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--pastel-blue)]"
                placeholder="4"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Limit
              <input
                value={damLimitInput}
                onChange={(event) => setDamLimitInput(event.target.value)}
                className="rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--pastel-blue)]"
                placeholder="288"
              />
            </label>
            <button
              type="button"
              onClick={handleStartDamSimulation}
              disabled={isDamSubmitting || damLiveData?.is_running}
              className="interactive-lift inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDamSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Start DAM simulation
            </button>
            <button
              type="button"
              onClick={handleStopDamSimulation}
              disabled={isDamSubmitting || !damLiveData?.is_running}
              className="interactive-lift inline-flex items-center justify-center gap-2 rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDamSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              Stop DAM simulation
            </button>
          </div>
        </div>
      </section>

      {damError ? (
        <section className="card flex items-center gap-3 border-[rgba(226,192,68,0.55)] bg-[rgba(226,192,68,0.12)] px-4 py-3 text-sm text-[var(--text-primary)]">
          <AlertTriangle className="h-4 w-4 text-[var(--pastel-yellow)]" aria-hidden="true" />
          <p>{damError}</p>
        </section>
      ) : null}

      {isDamLoading && damRows.length === 0 ? (
        <section className="card flex items-center gap-3 p-6 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <p>Loading DAM model stream...</p>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="card interactive-lift p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">DAM forecast</p>
          <p className="data-mono mt-3 text-2xl font-semibold text-[var(--pastel-lavender)]">
            {damLatest ? `${formatCurrency(damLatest.predicted_dam_price)} Rs/MWh` : "No data"}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Current MCP {damLatest ? `${formatCurrency(damLatest.current_mcp)} Rs/MWh` : "-"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Move {damLatest ? `${damMovePct > 0 ? "+" : ""}${damMovePct.toFixed(2)}%` : "0.00%"}
          </p>
        </article>

        <article className="card interactive-lift p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Error tracking</p>
          <p className="data-mono mt-3 text-xl font-semibold text-[var(--text-primary)]">
            {damLatest?.abs_error !== null && damLatest?.abs_error !== undefined
              ? `${formatCurrency(damLatest.abs_error)} Rs/MWh`
              : "N/A"}
          </p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Signed error{" "}
            {damLatest?.error !== null && damLatest?.error !== undefined
              ? `${damLatest.error > 0 ? "+" : ""}${formatCurrency(damLatest.error)} Rs/MWh`
              : "N/A"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Actual DAM {damLatest?.actual_dam_price !== null ? formatCurrency(damLatest?.actual_dam_price ?? 0) : "N/A"}
          </p>
        </article>

        <article className="card interactive-lift p-6">
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Evaluation metrics</p>
          <p className="mt-3 text-sm text-[var(--text-primary)]">
            Hit rate: <span className="data-mono">{damHitRatePct.toFixed(1)}%</span>
          </p>
          <p className="mt-2 text-sm text-[var(--text-primary)]">
            Processed: <span className="data-mono">{formatNumber(damLiveData?.total_processed ?? 0)}</span>
          </p>
          <p className="mt-2 text-sm text-[var(--text-primary)]">
            Evaluated: <span className="data-mono">{formatNumber(damEvaluatedRows.length)}</span>
          </p>
        </article>
      </section>

      <section className="card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">DAM 24hr trend</h2>
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">
            Last {CHART_WINDOW} points
          </p>
        </div>
        <div className="chart-shell">
          <div className="h-[340px] min-w-[860px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={damTrendData} margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                <CartesianGrid stroke="var(--border-soft)" vertical={false} strokeDasharray="2 2" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTimeLabel}
                  minTickGap={56}
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                />
                <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                <Tooltip
                  contentStyle={{
                    border: "1px solid var(--border-soft)",
                    borderRadius: 8,
                    backgroundColor: "var(--bg-card)",
                  }}
                  formatter={(value: number | string, name: string) => {
                    const labelMap: Record<string, string> = {
                      currentMcp: "Current MCP",
                      predictedDamPrice: "Predicted DAM (24hr)",
                      actualDamPrice: "Actual DAM",
                    };
                    return [`${formatCurrency(Number(value))} Rs/MWh`, labelMap[name] ?? name];
                  }}
                  labelFormatter={(value: string) => `Time: ${value}`}
                />
                <Line type="monotone" dataKey="currentMcp" stroke="var(--pastel-blue)" strokeWidth={1.7} dot={false} />
                <Line
                  type="monotone"
                  dataKey="predictedDamPrice"
                  stroke="var(--pastel-lavender)"
                  strokeWidth={1.8}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="actualDamPrice"
                  stroke="var(--pastel-green)"
                  strokeWidth={1.7}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between border-b border-[var(--border-soft)] px-6 py-4">
          <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">Recent DAM predictions</h2>
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-muted)]">Latest 8 rows</p>
        </div>

        {damRecentRows.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-soft)] text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  <th className="px-6 py-3 font-medium">Time</th>
                  <th className="px-6 py-3 font-medium">Current</th>
                  <th className="px-6 py-3 font-medium">Predicted DAM</th>
                  <th className="px-6 py-3 font-medium">Actual DAM</th>
                  <th className="px-6 py-3 font-medium">Abs Error</th>
                  <th className="px-6 py-3 font-medium">Direction Match</th>
                </tr>
              </thead>
              <tbody>
                {damRecentRows.map((row) => (
                  <tr
                    key={`${row.datetime}-${row.current_mcp}-${row.predicted_dam_price}`}
                    className="border-b border-[var(--border-soft)]/70"
                  >
                    <td className="px-6 py-3 text-[var(--text-primary)]">{formatTimeLabel(row.datetime)}</td>
                    <td className="data-mono px-6 py-3 text-[var(--text-primary)]">
                      {formatCurrency(row.current_mcp)}
                    </td>
                    <td className="data-mono px-6 py-3 text-[var(--text-primary)]">
                      {formatCurrency(row.predicted_dam_price)}
                    </td>
                    <td className="data-mono px-6 py-3 text-[var(--text-primary)]">
                      {row.actual_dam_price !== null ? formatCurrency(row.actual_dam_price) : "N/A"}
                    </td>
                    <td className="data-mono px-6 py-3 text-[var(--text-primary)]">
                      {row.abs_error !== null ? formatCurrency(row.abs_error) : "N/A"}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          row.correct_prediction
                            ? "bg-[rgba(132,165,157,0.18)] text-[var(--pastel-green)]"
                            : "bg-[rgba(226,192,68,0.18)] text-[var(--pastel-yellow)]"
                        }`}
                      >
                        {row.correct_prediction ? "Yes" : "No"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-8 text-sm text-[var(--text-muted)]">
            No DAM rows yet. Start DAM simulation to populate this stream.
          </div>
        )}
      </section>
    </div>
  );
}

export default Predictions;
