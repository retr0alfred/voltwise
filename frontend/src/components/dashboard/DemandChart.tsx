import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DemandPoint, formatDateTick, formatNumber } from "../../utils/dataHelpers";

interface DemandChartProps {
  data: DemandPoint[];
  isLoading: boolean;
  error: string | null;
}

type RegionSelection = "north" | "west" | "east" | "south" | "northeast";

const regionConfig: Record<RegionSelection, { key: keyof DemandPoint; label: string }> = {
  north: { key: "north", label: "Northern Region" },
  west: { key: "west", label: "Western Region" },
  east: { key: "east", label: "Eastern Region" },
  south: { key: "south", label: "Southern Region" },
  northeast: { key: "northeast", label: "North-Eastern Region" },
};

function DemandChart({ data, isLoading, error }: DemandChartProps): JSX.Element {
  const [selectedRegion, setSelectedRegion] = useState<RegionSelection>("north");

  const regionLine = useMemo(() => regionConfig[selectedRegion], [selectedRegion]);

  if (isLoading) {
    return <div className="card p-6 text-sm text-[var(--text-muted)]">Loading datasets...</div>;
  }

  if (error) {
    return <div className="card p-6 text-sm text-red-700">Failed to load demand data: {error}</div>;
  }

  return (
    <section className="card p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">
          India Electricity Demand - Regional Breakdown
        </h2>
        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          Region
          <select
            value={selectedRegion}
            onChange={(event) => setSelectedRegion(event.target.value as RegionSelection)}
            className="interactive-lift rounded-md border border-[var(--border-soft)] bg-[var(--bg-card)] px-2 py-1 text-sm text-[var(--text-primary)]"
          >
            <option value="north">North</option>
            <option value="west">West</option>
            <option value="east">East</option>
            <option value="south">South</option>
            <option value="northeast">NE</option>
          </select>
        </label>
      </div>

      <div className="chart-shell">
        <div className="h-[360px] min-w-[900px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="var(--border-soft)" vertical={false} strokeDasharray="2 2" />
              <XAxis
                dataKey="datetime"
                minTickGap={90}
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
                  backgroundColor: "var(--bg-card)",
                }}
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) {
                    return null;
                  }

                  const row = payload[0].payload as DemandPoint;

                  return (
                    <div className="rounded-lg border border-[var(--border-soft)] bg-[var(--bg-card)] p-3 text-xs">
                      <p className="mb-2 text-[var(--text-primary)]">{row.datetime}</p>
                      <p>National: {formatNumber(row.national)} MW</p>
                      <p>North: {formatNumber(row.north)} MW</p>
                      <p>West: {formatNumber(row.west)} MW</p>
                      <p>East: {formatNumber(row.east)} MW</p>
                      <p>South: {formatNumber(row.south)} MW</p>
                      <p>NE: {formatNumber(row.northeast)} MW</p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="national"
                stroke="var(--pastel-green)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="National Total"
              />
              <Line
                type="monotone"
                dataKey={regionLine.key}
                stroke="var(--pastel-blue)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name={regionLine.label}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

export default DemandChart;
