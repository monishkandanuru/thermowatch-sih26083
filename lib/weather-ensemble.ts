export const ENSEMBLE_SYSTEMS = ['ecmwf_ifs025', 'icon_global'] as const;

export const FORECAST_SAMPLE_SIZE = 10;

const VARIABLES = [
  'temperature_2m',
  'relative_humidity_2m',
  'wind_speed_10m',
  'shortwave_radiation',
] as const;

type Variable = (typeof VARIABLES)[number];
type HourlyPayload = Record<string, unknown> & { time?: unknown };

export type EnsembleForecastPoint = {
  time: string;
  temperature_c: number;
  humidity_pct: number;
  wind_speed_ms: number;
  shortwave_radiation_wm2: number;
  model_count: number;
  requested_model_count: number;
  temperature_spread_c: number;
};

function commonForecastSeries(hourly: HourlyPayload) {
  const suffixSets = VARIABLES.map(
    (variable) =>
      new Set(
        Object.entries(hourly)
          .filter(
            ([key, value]) =>
              key.startsWith(`${variable}_`) && Array.isArray(value),
          )
          .map(([key]) => key.slice(variable.length + 1)),
      ),
  );
  return [...suffixSets[0]]
    .filter((suffix) => suffixSets.every((set) => set.has(suffix)))
    .sort((a, b) => Number(a.includes('member')) - Number(b.includes('member')))
    .slice(0, FORECAST_SAMPLE_SIZE);
}

function completeSeriesValues(
  hourly: HourlyPayload,
  suffixes: string[],
  index: number,
) {
  return suffixes.flatMap((suffix) => {
    const values = VARIABLES.map((variable) => {
      const series = hourly[`${variable}_${suffix}`];
      const raw = Array.isArray(series) ? series[index] : undefined;
      if (raw === null || raw === undefined || raw === '') return Number.NaN;
      return Number(raw);
    });
    return values.every(Number.isFinite) ? [values] : [];
  });
}

function mean(values: number[]) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return 0;
  const average = mean(values);
  return Math.sqrt(
    values.reduce((total, value) => total + (value - average) ** 2, 0) /
      values.length,
  );
}

export function aggregateModelForecast(
  payload: { hourly?: HourlyPayload },
  minimumModels = 3,
): EnsembleForecastPoint[] {
  const hourly = payload.hourly;
  const times = hourly?.time;
  if (!hourly || !Array.isArray(times)) return [];
  const suffixes = commonForecastSeries(hourly);

  return times.flatMap((time, index) => {
    if (typeof time !== 'string') return [];
    const complete = completeSeriesValues(hourly, suffixes, index);
    const modelCount = complete.length;
    if (modelCount < minimumModels) return [];
    const temperature = complete.map((values) => values[0]);
    const humidity = complete.map((values) => values[1]);
    const wind = complete.map((values) => values[2]);
    const solar = complete.map((values) => values[3]);

    return [
      {
        time,
        temperature_c: mean(temperature),
        humidity_pct: mean(humidity),
        wind_speed_ms: mean(wind),
        shortwave_radiation_wm2: Math.max(0, mean(solar)),
        model_count: modelCount,
        requested_model_count: FORECAST_SAMPLE_SIZE,
        temperature_spread_c: standardDeviation(temperature),
      },
    ];
  });
}

const cache = new Map<
  string,
  { expiresAt: number; points: EnsembleForecastPoint[] }
>();

export async function fetchModelMeanForecast(input: {
  latitude: number;
  longitude: number;
}) {
  const key = `${input.latitude.toFixed(4)},${input.longitude.toFixed(4)}`;
  const cached = cache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.points;

  const params = new URLSearchParams({
    latitude: String(input.latitude),
    longitude: String(input.longitude),
    hourly: VARIABLES.join(','),
    models: ENSEMBLE_SYSTEMS.join(','),
    timezone: 'Asia/Kolkata',
    wind_speed_unit: 'ms',
    forecast_days: '5',
  });
  const response = await fetch(
    `https://ensemble-api.open-meteo.com/v1/ensemble?${params}`,
    {
      headers: { 'User-Agent': 'ThermoWatch-SIH26083/5.0' },
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok)
    throw new Error(`ensemble weather unavailable (${response.status})`);
  const points = aggregateModelForecast(
    (await response.json()) as { hourly?: HourlyPayload },
  );
  if (!points.length)
    throw new Error('ensemble weather contained too few complete forecasts');
  cache.set(key, { expiresAt: Date.now() + 15 * 60_000, points });
  return points;
}
