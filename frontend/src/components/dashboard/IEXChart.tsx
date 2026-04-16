import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { IEXPoint, formatCurrency, formatDateTick, formatNumber, getAverage } from "../../utils/dataHelpers";

interface IEXChartProps {
  data: IEXPoint[];
  isLoading: boolean;
  error: string | null;
}

function IEXChart({ data, isLoading, error }: IEXChartProps): JSX.Element {
  const averageMcp = getAverage(data.map((row) => row.mcp));

  if (isLoading) {
    return <div className="card p-6 text-sm text-[var(--text-muted)]">Loading datasets...</div>;
  }

  if (error) {
    return <div className="card p-6 text-sm text-red-700">Failed to load IEX data: {error}</div>;
  }

  return (
    <section className="card p-6">
      <h2 className="mb-4 text-base font-semibold tracking-tight text-[var(--text-primary)]">
        IEX Market Clearing Price - Historical
      </h2>
      <div className="chart-shell">
        <div className="h-[360px] min-w-[900px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="mcpFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--pastel-lavender)" stopOpacity={0.55} />
                  <stop offset="95%" stopColor="var(--pastel-lavender)" stopOpacity={0.08} />
                </linearGradient>
                <linearGradient id="weightedFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--pastel-blue)" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="var(--pastel-blue)" stopOpacity={0.08} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="var(--border-soft)" vertical={false} strokeDasharray="2 2" />
              <XAxis
                dataKey="timestamp"
                minTickGap={100}
                tickFormatter={formatDateTick}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                tickFormatter={(value: number) => formatNumber(value)}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid var(--border-soft)",
                  borderRadius: 8,
                  backgroundColor: "#ffffff",
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) {
                    return null;
                  }

                  const row = payload[0].payload as IEXPoint;

                  return (
                    <div className="rounded-lg border border-[var(--border-soft)] bg-white p-3 text-xs">
                      <p className="mb-2 text-[var(--text-primary)]">Date: {row.timestamp}</p>
                      <p>MCP: {formatCurrency(row.mcp)} Rs/MWh</p>
                      <p>Weighted MCP: {formatCurrency(row.weightedMcp)} Rs/MWh</p>
                      <p>Volume: {formatNumber(row.finalScheduledVolumeMw)} MW</p>
                    </div>
                  );
                }}
              />
              <ReferenceLine
                y={averageMcp}
                stroke="var(--text-muted)"
                strokeDasharray="4 4"
                ifOverflow="extendDomain"
                label={{
                  position: "insideTopRight",
                  value: `Avg MCP ${formatCurrency(averageMcp)}`,
                  fill: "var(--text-muted)",
                  fontSize: 11,
                }}
              />
              <Area
                type="monotone"
                dataKey="mcp"
                stroke="var(--pastel-lavender)"
                fill="url(#mcpFill)"
                isAnimationActive={false}
                strokeWidth={1.4}
                name="MCP"
              />
              <Area
                type="monotone"
                dataKey="weightedMcp"
                stroke="var(--pastel-blue)"
                fill="url(#weightedFill)"
                isAnimationActive={false}
                strokeWidth={1.4}
                name="Weighted MCP"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {data.length > 0 ? (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Latest volume: {formatNumber(data[data.length - 1].finalScheduledVolumeMw)} MW
        </p>
      ) : null}
    </section>
  );
}

export default IEXChart;
