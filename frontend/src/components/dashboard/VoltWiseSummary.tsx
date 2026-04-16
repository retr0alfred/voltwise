import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { VoltwisePoint, formatDateTick, formatNumber, getLatest } from "../../utils/dataHelpers";

interface VoltWiseSummaryProps {
  data: VoltwisePoint[];
  isLoading: boolean;
  error: string | null;
  view: "renewable" | "signals";
}

function VoltWiseSummary({ data, isLoading, error, view }: VoltWiseSummaryProps): JSX.Element {
  const latest = getLatest(data);

  const renewableMix = useMemo(
    () => [
      { name: "Solar Proxy", value: latest?.solarProxy ?? 0, color: "var(--pastel-yellow)" },
      { name: "Wind Proxy", value: latest?.windProxy ?? 0, color: "var(--pastel-blue)" },
      {
        name: "Renewable Proxy",
        value: latest?.renewableProxy ?? 0,
        color: "var(--pastel-green)",
      },
    ],
    [latest],
  );

  if (isLoading) {
    return <div className="card p-6 text-sm text-[var(--text-muted)]">Loading datasets...</div>;
  }

  if (error) {
    return <div className="card p-6 text-sm text-red-700">Failed to load VoltWise data: {error}</div>;
  }

  if (view === "renewable") {
    return (
      <section className="card p-6">
        <h2 className="mb-3 text-base font-semibold tracking-tight text-[var(--text-primary)]">Renewable Mix</h2>
        <div className="h-[361.5px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  border: "1px solid var(--border-soft)",
                  borderRadius: 8,
                  backgroundColor: "#ffffff",
                }}
                formatter={(value: number | string) => [`${formatNumber(Number(value), 2)}%`, "Value"]}
              />
              <Pie
                data={renewableMix}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={95}
                paddingAngle={2}
                label={({ name, value }) => `${name}: ${formatNumber(Number(value), 2)}%`}
                isAnimationActive={false}
              >
                {renewableMix.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="mb-4 text-base font-semibold tracking-tight text-[var(--text-primary)]">Market Signal Indicators</h2>
      <div className="chart-shell">
        <div className="h-[360px] min-w-[900px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} strokeDasharray="2 2" />
              <XAxis
                dataKey="datetime"
                minTickGap={90}
                tickFormatter={formatDateTick}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
              <Tooltip
                contentStyle={{
                  border: "1px solid var(--border-soft)",
                  borderRadius: 8,
                  backgroundColor: "#ffffff",
                }}
                formatter={(value: number | string, name: string) => {
                  const labels: Record<string, string> = {
                    priceMomentum: "Price Momentum",
                    volatilityIdx: "Volatility Index",
                    gridStress: "Grid Stress",
                  };
                  return [formatNumber(Number(value), 3), labels[name] ?? name];
                }}
              />
              <Bar dataKey="priceMomentum" fill="var(--pastel-lavender)" name="priceMomentum" isAnimationActive={false} />
              <Bar dataKey="volatilityIdx" fill="var(--pastel-yellow)" name="volatilityIdx" isAnimationActive={false} />
              <Bar dataKey="gridStress" fill="var(--pastel-green)" name="gridStress" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export default VoltWiseSummary;
