export interface DemandCSVRow {
  datetime: string;
  "National Hourly Demand": string;
  "Northern Region Hourly Demand": string;
  "Western Region Hourly Demand": string;
  "Eastern Region Hourly Demand": string;
  "Southern Region Hourly Demand": string;
  "North-Eastern Region Hourly Demand": string;
}

export interface DemandPoint {
  datetime: string;
  ts: number;
  national: number;
  north: number;
  west: number;
  east: number;
  south: number;
  northeast: number;
}

export interface IEXCSVRow {
  TimeStamp: string;
  "Purchase Bid (MW)": string;
  "Sell Bid (MW)": string;
  "MCV (MW)": string;
  "Final Scheduled Volume (MW)": string;
  "MCP (Rs/MWh) *": string;
  "Weighted MCP (Rs/MWh)": string;
}

export interface IEXPoint {
  timestamp: string;
  ts: number;
  purchaseBidMw: number;
  sellBidMw: number;
  mcvMw: number;
  finalScheduledVolumeMw: number;
  mcp: number;
  weightedMcp: number;
}

export interface WeatherCSVRow {
  datetime: string;
  delhi_temp: string;
  delhi_humidity: string;
  delhi_windspeed: string;
  delhi_precip: string;
  delhi_cloudcover: string;
  mumbai_temp: string;
  mumbai_humidity: string;
  mumbai_windspeed: string;
  mumbai_precip: string;
  mumbai_cloudcover: string;
  kolkata_temp: string;
  kolkata_humidity: string;
  kolkata_windspeed: string;
  kolkata_precip: string;
  kolkata_cloudcover: string;
  chennai_temp: string;
  chennai_humidity: string;
  chennai_windspeed: string;
  chennai_precip: string;
  chennai_cloudcover: string;
  guwahati_temp: string;
  guwahati_humidity: string;
  guwahati_windspeed: string;
  guwahati_precip: string;
  guwahati_cloudcover: string;
}

export interface CityWeather {
  temp: number;
  humidity: number;
  windspeed: number;
  precip: number;
  cloudcover: number;
}

export type CityKey = "delhi" | "mumbai" | "kolkata" | "chennai" | "guwahati";

export interface WeatherPoint {
  datetime: string;
  ts: number;
  delhi: CityWeather;
  mumbai: CityWeather;
  kolkata: CityWeather;
  chennai: CityWeather;
  guwahati: CityWeather;
}

export interface VoltwiseCSVRow {
  datetime: string;
  purchase_bid_mw: string;
  sell_bid_mw: string;
  mcv_mw: string;
  volume_mw: string;
  mcp: string;
  weighted_mcp: string;
  demand_national: string;
  demand_north: string;
  demand_west: string;
  demand_east: string;
  demand_south: string;
  demand_northeast: string;
  hour: string;
  minute: string;
  day_of_week: string;
  month: string;
  is_weekend: string;
  is_peak_hour: string;
  mcp_lag1: string;
  mcp_lag96: string;
  demand_lag1: string;
  demand_lag96: string;
  mcp_ma4: string;
  mcp_ma96: string;
  mcp_rollstd96: string;
  demand_rollmean96: string;
  price_momentum: string;
  volatility_idx: string;
  grid_stress: string;
  price_chg_pct: string;
  demand_growth: string;
  bid_ask_spread: string;
  delhi_temp: string;
  delhi_humidity: string;
  delhi_windspeed: string;
  delhi_precip: string;
  delhi_cloudcover: string;
  mumbai_temp: string;
  mumbai_humidity: string;
  mumbai_windspeed: string;
  mumbai_precip: string;
  mumbai_cloudcover: string;
  kolkata_temp: string;
  kolkata_humidity: string;
  kolkata_windspeed: string;
  kolkata_precip: string;
  kolkata_cloudcover: string;
  chennai_temp: string;
  chennai_humidity: string;
  chennai_windspeed: string;
  chennai_precip: string;
  chennai_cloudcover: string;
  guwahati_temp: string;
  guwahati_humidity: string;
  guwahati_windspeed: string;
  guwahati_precip: string;
  guwahati_cloudcover: string;
  solar_proxy: string;
  wind_proxy: string;
  renewable_proxy: string;
}

export interface VoltwisePoint {
  datetime: string;
  ts: number;
  purchaseBidMw: number;
  sellBidMw: number;
  mcvMw: number;
  volumeMw: number;
  mcp: number;
  weightedMcp: number;
  demandNational: number;
  demandNorth: number;
  demandWest: number;
  demandEast: number;
  demandSouth: number;
  demandNortheast: number;
  hour: number;
  minute: number;
  dayOfWeek: number;
  month: number;
  isWeekend: number;
  isPeakHour: number;
  mcpLag1: number;
  mcpLag96: number;
  demandLag1: number;
  demandLag96: number;
  mcpMa4: number;
  mcpMa96: number;
  mcpRollstd96: number;
  demandRollmean96: number;
  priceMomentum: number;
  volatilityIdx: number;
  gridStress: number;
  priceChgPct: number;
  demandGrowth: number;
  bidAskSpread: number;
  delhiTemp: number;
  delhiHumidity: number;
  delhiWindspeed: number;
  delhiPrecip: number;
  delhiCloudcover: number;
  mumbaiTemp: number;
  mumbaiHumidity: number;
  mumbaiWindspeed: number;
  mumbaiPrecip: number;
  mumbaiCloudcover: number;
  kolkataTemp: number;
  kolkataHumidity: number;
  kolkataWindspeed: number;
  kolkataPrecip: number;
  kolkataCloudcover: number;
  chennaiTemp: number;
  chennaiHumidity: number;
  chennaiWindspeed: number;
  chennaiPrecip: number;
  chennaiCloudcover: number;
  guwahatiTemp: number;
  guwahatiHumidity: number;
  guwahatiWindspeed: number;
  guwahatiPrecip: number;
  guwahatiCloudcover: number;
  solarProxy: number;
  windProxy: number;
  renewableProxy: number;
}

export const toNumber = (value: string | number | null | undefined): number => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const normalized = String(value).replace(/,/g, "").replace(/%/g, "").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const toTimestamp = (value: string): number => {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapCity = (prefix: CityKey, row: WeatherCSVRow): CityWeather => ({
  temp: toNumber(row[`${prefix}_temp`]),
  humidity: toNumber(row[`${prefix}_humidity`]),
  windspeed: toNumber(row[`${prefix}_windspeed`]),
  precip: toNumber(row[`${prefix}_precip`]),
  cloudcover: toNumber(row[`${prefix}_cloudcover`]),
});

export const mapDemandRow = (row: DemandCSVRow): DemandPoint => ({
  datetime: row.datetime,
  ts: toTimestamp(row.datetime),
  national: toNumber(row["National Hourly Demand"]),
  north: toNumber(row["Northern Region Hourly Demand"]),
  west: toNumber(row["Western Region Hourly Demand"]),
  east: toNumber(row["Eastern Region Hourly Demand"]),
  south: toNumber(row["Southern Region Hourly Demand"]),
  northeast: toNumber(row["North-Eastern Region Hourly Demand"]),
});

export const mapIEXRow = (row: IEXCSVRow): IEXPoint => ({
  timestamp: row.TimeStamp,
  ts: toTimestamp(row.TimeStamp),
  purchaseBidMw: toNumber(row["Purchase Bid (MW)"]),
  sellBidMw: toNumber(row["Sell Bid (MW)"]),
  mcvMw: toNumber(row["MCV (MW)"]),
  finalScheduledVolumeMw: toNumber(row["Final Scheduled Volume (MW)"]),
  mcp: toNumber(row["MCP (Rs/MWh) *"]),
  weightedMcp: toNumber(row["Weighted MCP (Rs/MWh)"]),
});

export const mapWeatherRow = (row: WeatherCSVRow): WeatherPoint => ({
  datetime: row.datetime,
  ts: toTimestamp(row.datetime),
  delhi: mapCity("delhi", row),
  mumbai: mapCity("mumbai", row),
  kolkata: mapCity("kolkata", row),
  chennai: mapCity("chennai", row),
  guwahati: mapCity("guwahati", row),
});

export const mapVoltwiseRow = (row: VoltwiseCSVRow): VoltwisePoint => ({
  datetime: row.datetime,
  ts: toTimestamp(row.datetime),
  purchaseBidMw: toNumber(row.purchase_bid_mw),
  sellBidMw: toNumber(row.sell_bid_mw),
  mcvMw: toNumber(row.mcv_mw),
  volumeMw: toNumber(row.volume_mw),
  mcp: toNumber(row.mcp),
  weightedMcp: toNumber(row.weighted_mcp),
  demandNational: toNumber(row.demand_national),
  demandNorth: toNumber(row.demand_north),
  demandWest: toNumber(row.demand_west),
  demandEast: toNumber(row.demand_east),
  demandSouth: toNumber(row.demand_south),
  demandNortheast: toNumber(row.demand_northeast),
  hour: toNumber(row.hour),
  minute: toNumber(row.minute),
  dayOfWeek: toNumber(row.day_of_week),
  month: toNumber(row.month),
  isWeekend: toNumber(row.is_weekend),
  isPeakHour: toNumber(row.is_peak_hour),
  mcpLag1: toNumber(row.mcp_lag1),
  mcpLag96: toNumber(row.mcp_lag96),
  demandLag1: toNumber(row.demand_lag1),
  demandLag96: toNumber(row.demand_lag96),
  mcpMa4: toNumber(row.mcp_ma4),
  mcpMa96: toNumber(row.mcp_ma96),
  mcpRollstd96: toNumber(row.mcp_rollstd96),
  demandRollmean96: toNumber(row.demand_rollmean96),
  priceMomentum: toNumber(row.price_momentum),
  volatilityIdx: toNumber(row.volatility_idx),
  gridStress: toNumber(row.grid_stress),
  priceChgPct: toNumber(row.price_chg_pct),
  demandGrowth: toNumber(row.demand_growth),
  bidAskSpread: toNumber(row.bid_ask_spread),
  delhiTemp: toNumber(row.delhi_temp),
  delhiHumidity: toNumber(row.delhi_humidity),
  delhiWindspeed: toNumber(row.delhi_windspeed),
  delhiPrecip: toNumber(row.delhi_precip),
  delhiCloudcover: toNumber(row.delhi_cloudcover),
  mumbaiTemp: toNumber(row.mumbai_temp),
  mumbaiHumidity: toNumber(row.mumbai_humidity),
  mumbaiWindspeed: toNumber(row.mumbai_windspeed),
  mumbaiPrecip: toNumber(row.mumbai_precip),
  mumbaiCloudcover: toNumber(row.mumbai_cloudcover),
  kolkataTemp: toNumber(row.kolkata_temp),
  kolkataHumidity: toNumber(row.kolkata_humidity),
  kolkataWindspeed: toNumber(row.kolkata_windspeed),
  kolkataPrecip: toNumber(row.kolkata_precip),
  kolkataCloudcover: toNumber(row.kolkata_cloudcover),
  chennaiTemp: toNumber(row.chennai_temp),
  chennaiHumidity: toNumber(row.chennai_humidity),
  chennaiWindspeed: toNumber(row.chennai_windspeed),
  chennaiPrecip: toNumber(row.chennai_precip),
  chennaiCloudcover: toNumber(row.chennai_cloudcover),
  guwahatiTemp: toNumber(row.guwahati_temp),
  guwahatiHumidity: toNumber(row.guwahati_humidity),
  guwahatiWindspeed: toNumber(row.guwahati_windspeed),
  guwahatiPrecip: toNumber(row.guwahati_precip),
  guwahatiCloudcover: toNumber(row.guwahati_cloudcover),
  solarProxy: toNumber(row.solar_proxy),
  windProxy: toNumber(row.wind_proxy),
  renewableProxy: toNumber(row.renewable_proxy),
});

export const formatDateTick = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

export const formatNumber = (value: number, maximumFractionDigits = 0): string =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits,
  }).format(value);

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(value);

export const getLatest = <T>(rows: T[]): T | null => (rows.length ? rows[rows.length - 1] : null);

export const getAverage = (values: number[]): number => {
  if (!values.length) {
    return 0;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};
