import { useMemo } from "react";
import { VoltwisePoint, formatCurrency, formatNumber, getLatest } from "../../utils/dataHelpers";

interface KPICardsProps {
  data: VoltwisePoint[];
  isLoading: boolean;
  error: string | null;
}

interface KPIItem {
  label: string;
  value: string;
  color: string;
}

function KPICards({ data, isLoading, error }: KPICardsProps): JSX.Element {
  const kpis = useMemo<KPIItem[]>(() => {
    const latest = getLatest(data);

    if (!latest) {
      return [];
    }

    const peakDemand = data.reduce((maxValue, row) => Math.max(maxValue, row.demandNational), 0);

    return [
      {
        label: "Avg MCP",
        value: `${formatCurrency(latest.mcp)} Rs/MWh`,
        color: "var(--pastel-lavender)",
      },
      {
        label: "Peak Demand",
        value: `${formatNumber(peakDemand)} MW`,
        color: "var(--pastel-blue)",
      },
      {
        label: "Price Volatility",
        value: formatNumber(latest.mcpRollstd96, 2),
        color: "var(--pastel-yellow)",
      },
      {
        label: "Grid Stress",
        value: latest.gridStress.toFixed(2),
        color: "var(--pastel-green)",
      },
      {
        label: "Renewable Proxy",
        value: `${latest.renewableProxy.toFixed(2)}%`,
        color: "var(--pastel-blue)",
      },
    ];
  }, [data]);

  if (isLoading) {
    return <div className="card p-6 text-sm text-[var(--text-muted)]">Loading datasets...</div>;
  }

  if (error) {
    return <div className="card p-6 text-sm text-red-700">Failed to load KPI data: {error}</div>;
  }

  return (
    <div className="fade-in flex gap-3 overflow-x-auto pb-2">
      {kpis.map((kpi) => (
        <article key={kpi.label} className="card interactive-lift min-w-[220px] flex-1 p-6">
          <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">{kpi.label}</p>
          <p className="data-mono mt-3 text-xl font-semibold" style={{ color: kpi.color }}>
            {kpi.value}
          </p>
        </article>
      ))}
    </div>
  );
}

export default KPICards;
