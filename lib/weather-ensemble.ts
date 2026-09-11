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

const metNorwayCache = new Map<
  string,
  { expiresAt: number; points: EnsembleForecastPoint[] }
>();

const metNorwayRequests = new Map<string, Promise<EnsembleForecastPoint[]>>();

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

export async function fetchMetNorwayForecast(input: {
  latitude: number;
  longitude: number;
}) {
  const key = `${input.latitude.toFixed(4)},${input.longitude.toFixed(4)}`;
  const cached = metNorwayCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.points;

  const pending = metNorwayRequests.get(key);
  if (pending) return pending;

  const request = (async () => {
    const params = new URLSearchParams({
      lat: String(input.latitude),
      lon: String(input.longitude),
    });
    const response = await fetch(
      `https://api.met.no/weatherapi/locationforecast/2.0/compact?${params}`,
      {
        headers: {
          'User-Agent':
            'ThermoWatch-SIH26083/1.0 github.com/monishkandanuru/thermowatch-sih26083',
        },
        signal: AbortSignal.timeout(12_000),
      },
    );
    if (!response.ok)
      throw new Error(`MET Norway weather unavailable (${response.status})`);
    const payload = (await response.json()) as {
      properties?: {
        timeseries?: Array<{
          time?: unknown;
          data?: { instant?: { details?: Record<string, unknown> } };
        }>;
      };
    };
    const points = (payload.properties?.timeseries ?? []).flatMap((entry) => {
      const details = entry.data?.instant?.details;
      const time = entry.time;
      if (!details || typeof time !== 'string') return [];
      const temperature = Number(details.air_temperature);
      const humidity = Number(details.relative_humidity);
      const wind = Number(details.wind_speed);
      const uv = Number(details.ultraviolet_index_clear_sky);
      if (![temperature, humidity, wind].every(Number.isFinite)) return [];
      return [
        {
          time,
          temperature_c: temperature,
          humidity_pct: humidity,
          wind_speed_ms: wind,
          shortwave_radiation_wm2: Number.isFinite(uv)
            ? Math.max(0, uv * 95)
            : 0,
          model_count: 1,
          requested_model_count: 1,
          temperature_spread_c: 0,
        },
      ];
    });
    if (!points.length)
      throw new Error('MET Norway weather contained no complete forecasts');
    metNorwayCache.set(key, {
      expiresAt: Date.now() + 20 * 60_000,
      points,
    });
    return points;
  })();

  metNorwayRequests.set(key, request);
  try {
    return await request;
  } finally {
    metNorwayRequests.delete(key);
  }
}
