import KPICards from "../components/dashboard/KPICards";
import DemandChart from "../components/dashboard/DemandChart";
import IEXChart from "../components/dashboard/IEXChart";
import VoltWiseSummary from "../components/dashboard/VoltWiseSummary";
import WeatherChart from "../components/dashboard/WeatherChart";
import { useCSVData } from "../hooks/useCSVData";
import {
  DemandCSVRow,
  DemandPoint,
  IEXCSVRow,
  IEXPoint,
  VoltwiseCSVRow,
  VoltwisePoint,
  WeatherCSVRow,
  WeatherPoint,
  mapDemandRow,
  mapIEXRow,
  mapVoltwiseRow,
  mapWeatherRow,
} from "../utils/dataHelpers";

function Dashboard(): JSX.Element {
  const demandState = useCSVData<DemandCSVRow, DemandPoint>("/data/demand.csv", mapDemandRow);
  const iexState = useCSVData<IEXCSVRow, IEXPoint>("/data/IEX.csv", mapIEXRow);
  const weatherState = useCSVData<WeatherCSVRow, WeatherPoint>("/data/weather.csv", mapWeatherRow);
  const voltwiseState = useCSVData<VoltwiseCSVRow, VoltwisePoint>("/data/voltwise_final.csv", mapVoltwiseRow);

  const isAnyLoading =
    demandState.isLoading || iexState.isLoading || weatherState.isLoading || voltwiseState.isLoading;

  return (
    <div className="fade-in space-y-5">
      {isAnyLoading ? <p className="text-sm text-[var(--text-muted)]">Loading datasets...</p> : null}

      <section>
        <KPICards
          data={voltwiseState.data}
          isLoading={voltwiseState.isLoading}
          error={voltwiseState.error}
        />
      </section>

      <section>
        <IEXChart data={iexState.data} isLoading={iexState.isLoading} error={iexState.error} />
      </section>

      <section>
        <DemandChart data={demandState.data} isLoading={demandState.isLoading} error={demandState.error} />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <WeatherChart
            data={weatherState.data}
            isLoading={weatherState.isLoading}
            error={weatherState.error}
          />
        </div>
        <div className="xl:col-span-2">
          <VoltWiseSummary
            data={voltwiseState.data}
            isLoading={voltwiseState.isLoading}
            error={voltwiseState.error}
            view="renewable"
          />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold tracking-tight text-[var(--text-primary)]">
          VoltWise Feature Insights
        </h2>
        <VoltWiseSummary
          data={voltwiseState.data}
          isLoading={voltwiseState.isLoading}
          error={voltwiseState.error}
          view="signals"
        />
      </section>
    </div>
  );
}

export default Dashboard;
