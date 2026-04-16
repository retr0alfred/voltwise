import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CityKey, WeatherPoint, formatDateTick, formatNumber } from "../../utils/dataHelpers";

interface WeatherChartProps {
  data: WeatherPoint[];
  isLoading: boolean;
  error: string | null;
}

interface CityTab {
  key: CityKey;
  label: string;
}

const cityTabs: CityTab[] = [
  { key: "delhi", label: "Delhi" },
  { key: "mumbai", label: "Mumbai" },
  { key: "kolkata", label: "Kolkata" },
  { key: "chennai", label: "Chennai" },
  { key: "guwahati", label: "Guwahati" },
];

function WeatherChart({ data, isLoading, error }: WeatherChartProps): JSX.Element {
  const [activeCity, setActiveCity] = useState<CityKey>("delhi");

  const chartData = useMemo(
    () =>
      data.map((point) => ({
        datetime: point.datetime,
        temp: point[activeCity].temp,
        humidity: point[activeCity].humidity,
      })),
    [activeCity, data],
  );

  if (isLoading) {
    return <div className="card p-6 text-sm text-[var(--text-muted)]">Loading datasets...</div>;
  }

  if (error) {
    return <div className="card p-6 text-sm text-red-700">Failed to load weather data: {error}</div>;
  }

  return (
    <section className="card p-6">
      <h2 className="mb-3 text-base font-semibold tracking-tight text-[var(--text-primary)]">City Weather Trends</h2>

      <div className="mb-4 flex flex-wrap gap-2">
        {cityTabs.map((tab) => {
          const isActive = tab.key === activeCity;
          return (
            <button
              key={tab.key}
              type="button"
              className={[
                "rounded-md border px-2 py-1 text-xs transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:shadow-sm",
                isActive
                  ? "border-[var(--pastel-blue)] bg-[var(--pastel-blue)]/20 text-[var(--text-primary)]"
                  : "border-[var(--border-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
              ].join(" ")}
              onClick={() => setActiveCity(tab.key)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="chart-shell">
        <div className="h-[320px] min-w-[680px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} strokeDasharray="2 2" />
              <XAxis
                dataKey="datetime"
                minTickGap={85}
                tickFormatter={formatDateTick}
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
              />
              <YAxis
                yAxisId="temp"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                tickFormatter={(value: number) => `${formatNumber(value, 1)} C`}
              />
              <YAxis
                yAxisId="humidity"
                orientation="right"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                tickFormatter={(value: number) => `${formatNumber(value, 0)}%`}
              />
              <Tooltip
                contentStyle={{
                  border: "1px solid var(--border-soft)",
                  borderRadius: 8,
                  backgroundColor: "#ffffff",
                }}
                formatter={(value: number | string, name: string) => {
                  const numeric = Number(value);
                  if (name === "temp") {
                    return [`${formatNumber(numeric, 1)} C`, "Temperature"];
                  }
                  return [`${formatNumber(numeric, 0)}%`, "Humidity"];
                }}
              />
              <Legend />
              <Line
                yAxisId="temp"
                type="monotone"
                dataKey="temp"
                stroke="var(--pastel-yellow)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="Temperature"
              />
              <Line
                yAxisId="humidity"
                type="monotone"
                dataKey="humidity"
                stroke="var(--pastel-blue)"
                strokeWidth={1.4}
                dot={false}
                isAnimationActive={false}
                name="Humidity"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export default WeatherChart;
