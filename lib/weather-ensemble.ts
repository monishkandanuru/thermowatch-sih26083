export const FORECAST_MODELS = [
  'ecmwf_ifs025',
  'ecmwf_aifs025_single',
  'ncep_gfs_global',
  'ncep_aigfs025',
  'icon_global',
  'cmc_gem_gdps',
  'jma_gsm',
  'kma_gdps',
  'bom_access_global',
  'cma_grapes_global',
] as const;

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

function finiteValues(
  hourly: HourlyPayload,
  variable: Variable,
  index: number,
) {
  return Object.entries(hourly)
    .filter(
      ([key, value]) =>
        (key === variable || key.startsWith(`${variable}_`)) &&
        Array.isArray(value),
    )
    .map(([, value]) => Number((value as unknown[])[index]))
    .filter(Number.isFinite);
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

  return times.flatMap((time, index) => {
    if (typeof time !== 'string') return [];
    const temperature = finiteValues(hourly, 'temperature_2m', index);
    const humidity = finiteValues(hourly, 'relative_humidity_2m', index);
    const wind = finiteValues(hourly, 'wind_speed_10m', index);
    const solar = finiteValues(hourly, 'shortwave_radiation', index);
    const modelCount = Math.min(
      temperature.length,
      humidity.length,
      wind.length,
      solar.length,
    );
    if (modelCount < minimumModels) return [];

    return [
      {
        time,
        temperature_c: mean(temperature),
        humidity_pct: mean(humidity),
        wind_speed_ms: mean(wind),
        shortwave_radiation_wm2: Math.max(0, mean(solar)),
        model_count: modelCount,
        requested_model_count: FORECAST_MODELS.length,
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
    models: FORECAST_MODELS.join(','),
    timezone: 'Asia/Kolkata',
    wind_speed_unit: 'ms',
    forecast_days: '5',
  });
  const response = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
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
    throw new Error('ensemble weather contained too few models');
  cache.set(key, { expiresAt: Date.now() + 15 * 60_000, points });
  return points;
}
