import {
  MODEL_INFO,
  predictHeatRisk,
  type ModelContribution,
} from '@/lib/ml-model';

export { MODEL_INFO } from '@/lib/ml-model';
import { indiaForecastTime, nearestForecast } from '@/lib/forecast-time';

export type Risk = 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Emergency';

export type DistrictConfig = {
  district: string;
  lat: number;
  lon: number;
  x: number;
  y: number;
  fallbackTemp: number;
  fallbackHumidity: number;
};

export const DISTRICTS: DistrictConfig[] = [
  {
    district: 'Delhi',
    lat: 28.6139,
    lon: 77.209,
    x: 144,
    y: 75,
    fallbackTemp: 42.1,
    fallbackHumidity: 39,
  },
  {
    district: 'Jaipur',
    lat: 26.9124,
    lon: 75.7873,
    x: 120,
    y: 91,
    fallbackTemp: 43.6,
    fallbackHumidity: 31,
  },
  {
    district: 'Ahmedabad',
    lat: 23.0225,
    lon: 72.5714,
    x: 96,
    y: 118,
    fallbackTemp: 41.3,
    fallbackHumidity: 37,
  },
  {
    district: 'Nagpur',
    lat: 21.1458,
    lon: 79.0882,
    x: 165,
    y: 148,
    fallbackTemp: 41.1,
    fallbackHumidity: 35,
  },
  {
    district: 'Hyderabad',
    lat: 17.385,
    lon: 78.4867,
    x: 162,
    y: 184,
    fallbackTemp: 39.4,
    fallbackHumidity: 47,
  },
  {
    district: 'Patna',
    lat: 25.5941,
    lon: 85.1376,
    x: 208,
    y: 104,
    fallbackTemp: 40.2,
    fallbackHumidity: 58,
  },
  {
    district: 'Lucknow',
    lat: 26.8467,
    lon: 80.9462,
    x: 178,
    y: 91,
    fallbackTemp: 38.6,
    fallbackHumidity: 51,
  },
  {
    district: 'Bhopal',
    lat: 23.2599,
    lon: 77.4126,
    x: 150,
    y: 130,
    fallbackTemp: 38.8,
    fallbackHumidity: 44,
  },
  {
    district: 'Bhubaneswar',
    lat: 20.2961,
    lon: 85.8245,
    x: 215,
    y: 154,
    fallbackTemp: 37.4,
    fallbackHumidity: 66,
  },
  {
    district: 'Chandigarh',
    lat: 30.7333,
    lon: 76.7794,
    x: 142,
    y: 60,
    fallbackTemp: 38.1,
    fallbackHumidity: 39,
  },
  {
    district: 'Bikaner',
    lat: 28.0229,
    lon: 73.3119,
    x: 108,
    y: 72,
    fallbackTemp: 44.2,
    fallbackHumidity: 24,
  },
  {
    district: 'Jodhpur',
    lat: 26.2389,
    lon: 73.0243,
    x: 110,
    y: 92,
    fallbackTemp: 43.8,
    fallbackHumidity: 25,
  },
  {
    district: 'Varanasi',
    lat: 25.3176,
    lon: 82.9739,
    x: 195,
    y: 100,
    fallbackTemp: 40.3,
    fallbackHumidity: 54,
  },
  {
    district: 'Prayagraj',
    lat: 25.4358,
    lon: 81.8463,
    x: 188,
    y: 103,
    fallbackTemp: 40.7,
    fallbackHumidity: 49,
  },
  {
    district: 'Gwalior',
    lat: 26.2183,
    lon: 78.1828,
    x: 157,
    y: 96,
    fallbackTemp: 42.3,
    fallbackHumidity: 31,
  },
  {
    district: 'Aurangabad',
    lat: 19.8762,
    lon: 75.3433,
    x: 135,
    y: 162,
    fallbackTemp: 39.5,
    fallbackHumidity: 39,
  },
  {
    district: 'Nanded',
    lat: 19.1383,
    lon: 77.321,
    x: 148,
    y: 172,
    fallbackTemp: 39.1,
    fallbackHumidity: 42,
  },
  {
    district: 'Raipur',
    lat: 21.2514,
    lon: 81.6296,
    x: 190,
    y: 150,
    fallbackTemp: 40.1,
    fallbackHumidity: 43,
  },
  {
    district: 'Ranchi',
    lat: 23.3441,
    lon: 85.3096,
    x: 213,
    y: 130,
    fallbackTemp: 37.8,
    fallbackHumidity: 54,
  },
  {
    district: 'Gaya',
    lat: 24.7914,
    lon: 85.0002,
    x: 208,
    y: 115,
    fallbackTemp: 40.5,
    fallbackHumidity: 49,
  },
  {
    district: 'Srinagar',
    lat: 34.0837,
    lon: 74.7973,
    x: 125,
    y: 35,
    fallbackTemp: 31.5,
    fallbackHumidity: 42,
  },
  {
    district: 'Dehradun',
    lat: 30.3165,
    lon: 78.0322,
    x: 154,
    y: 63,
    fallbackTemp: 36.8,
    fallbackHumidity: 50,
  },
  {
    district: 'Guwahati',
    lat: 26.1445,
    lon: 91.7362,
    x: 276,
    y: 100,
    fallbackTemp: 35.2,
    fallbackHumidity: 72,
  },
  {
    district: 'Kolkata',
    lat: 22.5726,
    lon: 88.3639,
    x: 239,
    y: 137,
    fallbackTemp: 37.6,
    fallbackHumidity: 68,
  },
  {
    district: 'Mumbai',
    lat: 19.076,
    lon: 72.8777,
    x: 112,
    y: 171,
    fallbackTemp: 35.4,
    fallbackHumidity: 70,
  },
  {
    district: 'Pune',
    lat: 18.5204,
    lon: 73.8567,
    x: 122,
    y: 178,
    fallbackTemp: 36.7,
    fallbackHumidity: 51,
  },
  {
    district: 'Bengaluru',
    lat: 12.9716,
    lon: 77.5946,
    x: 150,
    y: 235,
    fallbackTemp: 34.1,
    fallbackHumidity: 48,
  },
  {
    district: 'Chennai',
    lat: 13.0827,
    lon: 80.2707,
    x: 176,
    y: 232,
    fallbackTemp: 38.2,
    fallbackHumidity: 65,
  },
  {
    district: 'Kochi',
    lat: 9.9312,
    lon: 76.2673,
    x: 139,
    y: 271,
    fallbackTemp: 34.3,
    fallbackHumidity: 76,
  },
  {
    district: 'Visakhapatnam',
    lat: 17.6868,
    lon: 83.2185,
    x: 201,
    y: 182,
    fallbackTemp: 36.5,
    fallbackHumidity: 69,
  },
];

const actions: Record<Risk, string> = {
  Low: 'Continue routine monitoring and hydration messaging.',
  Moderate: 'Increase public advisories and check vulnerable residents.',
  High: 'Open cooling spaces, adjust outdoor work and alert health teams.',
  Extreme:
    'Activate district heat action plans and targeted outreach immediately.',
  Emergency:
    'Escalate emergency response, suspend unsafe exposure and mobilize medical support.',
};

export function riskFor(score: number): Risk {
  if (score >= 85) return 'Emergency';
  if (score >= 70) return 'Extreme';
  if (score >= 55) return 'High';
  if (score >= 38) return 'Moderate';
  return 'Low';
}

export function heatIndex(tempC: number, humidity: number) {
  const t = (tempC * 9) / 5 + 32;
  const r = humidity;
  const hi =
    -42.379 +
    2.04901523 * t +
    10.14333127 * r -
    0.22475541 * t * r -
    0.00683783 * t * t -
    0.05481717 * r * r +
    0.00122874 * t * t * r +
    0.00085282 * t * r * r -
    0.00000199 * t * t * r * r;
  return Number((((hi - 32) * 5) / 9).toFixed(1));
}

function wetBulb(tempC: number, humidity: number) {
  const value =
    tempC * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
    Math.atan(tempC + humidity) -
    Math.atan(humidity - 1.676331) +
    0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) -
    4.686035;
  return value;
}

export function computeHtsi(input: {
  temp: number;
  humidity: number;
  wind?: number;
  uv?: number;
  solar?: number;
  aqi?: number;
  multiplier?: number;
}) {
  const wind = input.wind ?? 1.6;
  const uv = input.uv ?? 7;
  const solar = input.solar ?? 650;
  const aqi = input.aqi ?? 85;
  const wbgt =
    0.7 * wetBulb(input.temp, input.humidity) +
    0.2 * (input.temp + solar / 180) +
    0.1 * input.temp;
  const hi = heatIndex(input.temp, input.humidity);
  const pet = input.temp + input.humidity * 0.035 + solar / 240 - wind * 0.7;
  const thermal = Math.max(0, Math.min(100, (wbgt - 18) * 5.25));
  const humidityStress = Math.max(
    0,
    Math.min(18, (input.humidity - 35) * 0.34),
  );
  const radiantStress = Math.max(0, Math.min(14, solar / 75));
  const uvStress = Math.max(0, Math.min(10, uv * 0.95));
  const airStress = Math.max(0, Math.min(8, (aqi - 40) / 16));
  const windRelief = Math.min(9, wind * 1.7);
  const raw =
    thermal * 0.66 +
    humidityStress +
    radiantStress +
    uvStress +
    airStress -
    windRelief;
  const score = Math.max(0, Math.min(100, raw * (input.multiplier ?? 1)));
  const htsi = Number(score.toFixed(1));
  const risk = riskFor(htsi);
  return {
    htsi,
    risk,
    wbgt: Number(wbgt.toFixed(1)),
    heat_index: hi,
    pet: Number(pet.toFixed(1)),
    action: actions[risk],
  };
}

function modelFields(
  config: DistrictConfig,
  input: {
    temp: number;
    humidity: number;
    wind: number;
    solar: number;
    timestamp: string | Date;
  },
) {
  const prediction = predictHeatRisk({
    temperature_c: input.temp,
    humidity_pct: input.humidity,
    wind_speed_ms: input.wind,
    shortwave_radiation_wm2: input.solar,
    latitude: config.lat,
    longitude: config.lon,
    timestamp: input.timestamp,
  });
  return {
    risk: prediction.predicted_class as Risk,
    probability: Math.round(prediction.confidence_pct),
    model_confidence: prediction.confidence_pct,
    high_risk_probability: prediction.high_risk_probability_pct,
    probabilities: prediction.probabilities,
    explanation: prediction.explanation as ModelContribution[],
    model_version: MODEL_INFO.model_version,
    action: actions[prediction.predicted_class as Risk],
  };
}

function fallbackDistrict(config: DistrictConfig) {
  const timestamp = new Date();
  const hour = Number(
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(timestamp),
  );
  const solar = hour >= 7 && hour <= 18 ? 650 : 10;
  const result = computeHtsi({
    temp: config.fallbackTemp,
    humidity: config.fallbackHumidity,
    wind: 1.7,
    solar,
  });
  return {
    ...config,
    temp: config.fallbackTemp,
    humidity: config.fallbackHumidity,
    wind: 1.7,
    uv: 7.4,
    solar,
    aqi: 85,
    source: 'resilient-fallback',
    ...result,
    ...modelFields(config, {
      temp: config.fallbackTemp,
      humidity: config.fallbackHumidity,
      wind: 1.7,
      solar,
      timestamp,
    }),
  };
}

export async function fetchCurrentDistrict(config: DistrictConfig) {
  try {
    const params = new URLSearchParams({
      latitude: String(config.lat),
      longitude: String(config.lon),
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,uv_index,shortwave_radiation',
      timezone: 'Asia/Kolkata',
    });
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { headers: { 'User-Agent': 'ThermoWatch-SIH26083/3.0' } },
    );
    if (!response.ok) throw new Error('weather unavailable');
    const payload = (await response.json()) as {
      current?: Record<string, number>;
    };
    const current = payload.current ?? {};
    const temp = Number(current.temperature_2m ?? config.fallbackTemp);
    const humidity = Number(
      current.relative_humidity_2m ?? config.fallbackHumidity,
    );
    const wind = Number(current.wind_speed_10m ?? 6) / 3.6;
    const uv = Number(current.uv_index ?? 6.5);
    const timestamp = new Date();
    const hour = Number(
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(timestamp),
    );
    const solar = Number(
      current.shortwave_radiation ?? (hour >= 7 && hour <= 18 ? 680 : 10),
    );
    const result = computeHtsi({ temp, humidity, wind, uv, solar });
    return {
      ...config,
      temp: Number(temp.toFixed(1)),
      humidity: Math.round(humidity),
      wind: Number(wind.toFixed(1)),
      uv: Number(uv.toFixed(1)),
      solar: Number(solar.toFixed(1)),
      aqi: 85,
      source: 'open-meteo',
      ...result,
      ...modelFields(config, {
        temp,
        humidity,
        wind,
        solar,
        timestamp,
      }),
    };
  } catch {
    return fallbackDistrict(config);
  }
}

let currentDistrictCache:
  | { expiresAt: number; data: Awaited<ReturnType<typeof fetchCurrentDistrict>>[] }
  | undefined;
let currentDistrictRequest:
  | Promise<Awaited<ReturnType<typeof fetchCurrentDistrict>>[]>
  | undefined;

export async function fetchAllDistricts() {
  if (currentDistrictCache && currentDistrictCache.expiresAt > Date.now())
    return currentDistrictCache.data;
  if (currentDistrictRequest) return currentDistrictRequest;
  currentDistrictRequest = Promise.all(DISTRICTS.map(fetchCurrentDistrict));
  try {
    const data = await currentDistrictRequest;
    currentDistrictCache = { expiresAt: Date.now() + 5 * 60_000, data };
    return data;
  } finally {
    currentDistrictRequest = undefined;
  }
}

export type ForecastLayerPoint = DistrictConfig & {
  horizon_hours: 24 | 48 | 72;
  valid_at: string;
  temp: number;
  humidity: number;
  wind: number;
  uv: number;
  solar: number;
  htsi: number;
  risk: Risk;
  probability: number;
  model_confidence: number;
  high_risk_probability: number;
  source: string;
  model_version: string;
};

async function fetchDistrictForecastLayers(config: DistrictConfig) {
  const horizons = [24, 48, 72] as const;
  try {
    const params = new URLSearchParams({
      latitude: String(config.lat),
      longitude: String(config.lon),
      hourly:
        'temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,shortwave_radiation',
      timezone: 'Asia/Kolkata',
      forecast_days: '5',
    });
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { headers: { 'User-Agent': 'ThermoWatch-SIH26083/4.0' } },
    );
    if (!response.ok) throw new Error('forecast layer unavailable');
    const payload = (await response.json()) as {
      hourly: {
        time: string[];
        temperature_2m: number[];
        relative_humidity_2m: number[];
        wind_speed_10m: number[];
        uv_index: number[];
        shortwave_radiation: number[];
      };
    };
    const targetNow = Date.now();
    return horizons.map((horizon) => {
      const target = targetNow + horizon * 3_600_000;
      let index = 0;
      let distance = Number.POSITIVE_INFINITY;
      payload.hourly.time.forEach((time, position) => {
        const timestamp = new Date(`${time}+05:30`).getTime();
        const candidate = Math.abs(timestamp - target);
        if (candidate < distance) {
          index = position;
          distance = candidate;
        }
      });
      const time = payload.hourly.time[index];
      const temp = payload.hourly.temperature_2m[index];
      const humidity = payload.hourly.relative_humidity_2m[index];
      const wind = payload.hourly.wind_speed_10m[index] / 3.6;
      const solar = payload.hourly.shortwave_radiation[index] ?? 0;
      const uv = payload.hourly.uv_index[index] ?? solar / 95;
      const thermal = computeHtsi({ temp, humidity, wind, solar, uv });
      const prediction = modelFields(config, {
        temp,
        humidity,
        wind,
        solar,
        timestamp: time,
      });
      return {
        ...config,
        horizon_hours: horizon,
        valid_at: time,
        temp: Number(temp.toFixed(1)),
        humidity: Math.round(humidity),
        wind: Number(wind.toFixed(1)),
        uv: Number(uv.toFixed(1)),
        solar: Number(solar.toFixed(1)),
        source: 'open-meteo',
        ...thermal,
        ...prediction,
      } as ForecastLayerPoint;
    });
  } catch {
    return horizons.map((horizon) => {
      const timestamp = new Date(Date.now() + horizon * 3_600_000);
      const hour = Number(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          hourCycle: 'h23',
        }).format(timestamp),
      );
      const solar = hour >= 7 && hour <= 18 ? 620 : 10;
      const temp = config.fallbackTemp - (hour < 9 || hour > 19 ? 6 : 0);
      const humidity = config.fallbackHumidity + (hour < 8 ? 10 : 0);
      const wind = 1.7;
      const thermal = computeHtsi({ temp, humidity, wind, solar });
      const prediction = modelFields(config, {
        temp,
        humidity,
        wind,
        solar,
        timestamp,
      });
      return {
        ...config,
        horizon_hours: horizon,
        valid_at: timestamp.toISOString(),
        temp: Number(temp.toFixed(1)),
        humidity: Math.round(humidity),
        wind,
        uv: Number((solar / 95).toFixed(1)),
        solar,
        source: 'resilient-fallback',
        ...thermal,
        ...prediction,
      } as ForecastLayerPoint;
    });
  }
}

export async function fetchAllForecastLayers() {
  const districtLayers = await Promise.all(
    DISTRICTS.map(fetchDistrictForecastLayers),
  );
  return {
    24: districtLayers.map((layers) => layers[0]),
    48: districtLayers.map((layers) => layers[1]),
    72: districtLayers.map((layers) => layers[2]),
  };
}

export async function fetchDistrictForecast(name: string) {
  const config =
    DISTRICTS.find(
      (item) => item.district.toLowerCase() === name.toLowerCase(),
    ) ?? DISTRICTS[0];
  const current = await fetchCurrentDistrict(config);
  try {
    const params = new URLSearchParams({
      latitude: String(config.lat),
      longitude: String(config.lon),
      hourly:
        'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,uv_index,shortwave_radiation',
      timezone: 'Asia/Kolkata',
      forecast_days: '5',
    });
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { headers: { 'User-Agent': 'ThermoWatch-SIH26083/3.0' } },
    );
    if (!response.ok) throw new Error('forecast unavailable');
    const payload = (await response.json()) as {
      hourly: {
        time: string[];
        temperature_2m: number[];
        relative_humidity_2m: number[];
        wind_speed_10m: number[];
        uv_index: number[];
        shortwave_radiation: number[];
      };
    };
    const forecast = payload.hourly.time
      .map((time, index) => {
        const hour = Number(time.slice(11, 13));
        const temp = payload.hourly.temperature_2m[index];
        const humidity = payload.hourly.relative_humidity_2m[index];
        const wind = payload.hourly.wind_speed_10m[index] / 3.6;
        const solar =
          payload.hourly.shortwave_radiation[index] ??
          (hour >= 7 && hour <= 18
            ? Math.max(120, 760 - Math.abs(13 - hour) * 90)
            : 10);
        const result = computeHtsi({
          temp,
          humidity,
          wind,
          uv: payload.hourly.uv_index[index] ?? 0,
          solar,
        });
        return {
          time: indiaForecastTime(time),
          label: new Date(indiaForecastTime(time)).toLocaleString('en-IN', {
            timeZone: 'Asia/Kolkata',
            weekday: 'short',
            hour: 'numeric',
          }),
          temp: Number(temp.toFixed(1)),
          humidity,
          wind: Number(wind.toFixed(1)),
          uv: Number((payload.hourly.uv_index[index] ?? solar / 95).toFixed(1)),
          solar: Number(solar.toFixed(1)),
          ...result,
          ...modelFields(config, { temp, humidity, wind, solar, timestamp: time }),
        };
      })
      .filter((point, index) => index % 3 === 0 && Date.parse(point.time) >= Date.now());
    const horizons = [24, 48, 72].map((hours) => {
      const item = nearestForecast(forecast, hours);
      return {
        horizon_hours: hours,
        predicted_class: item.risk,
        probability: item.model_confidence,
        high_risk_probability: item.high_risk_probability,
        htsi: item.htsi,
        explanation: item.explanation,
      };
    });
    const peak = [...forecast].sort((a, b) => b.htsi - a.htsi)[0];
    return {
      district: config.district,
      current,
      forecast,
      horizons,
      peak,
      profiles: vulnerabilityProfiles(current),
      source: 'open-meteo',
    };
  } catch {
    const forecast = Array.from({ length: 40 }, (_, index) => {
      const time = new Date(Date.now() + index * 3 * 3600000);
      const hour = new Date(time.getTime() + 5.5 * 3600000).getUTCHours();
      const temp =
        config.fallbackTemp -
        6 +
        Math.max(0, 1 - Math.abs(14 - hour) / 9) * 7 +
        Math.sin(index / 4);
      const humidity = Math.max(
        24,
        config.fallbackHumidity + (hour < 8 ? 12 : 0),
      );
      const result = computeHtsi({
        temp,
        humidity,
        wind: 1.6,
        solar: hour >= 7 && hour <= 18 ? 640 : 10,
      });
      const solar = hour >= 7 && hour <= 18 ? 640 : 10;
      return {
        time: time.toISOString(),
        label: time.toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          hour: 'numeric',
        }),
        temp: Number(temp.toFixed(1)),
        humidity: Math.round(humidity),
        wind: 1.6,
        uv: Number((solar / 95).toFixed(1)),
        solar,
        ...result,
        ...modelFields(config, {
          temp,
          humidity,
          wind: 1.6,
          solar,
          timestamp: time,
        }),
      };
    });
    const horizons = [24, 48, 72].map((hours) => {
      const item = forecast[Math.round(hours / 3)];
      return {
        horizon_hours: hours,
        predicted_class: item.risk,
        probability: item.model_confidence,
        high_risk_probability: item.high_risk_probability,
        htsi: item.htsi,
        explanation: item.explanation,
      };
    });
    return {
      district: config.district,
      current,
      forecast,
      horizons,
      peak: [...forecast].sort((a, b) => b.htsi - a.htsi)[0],
      profiles: vulnerabilityProfiles(current),
      source: 'resilient-fallback',
    };
  }
}

export function vulnerabilityProfiles(weather: {
  temp: number;
  humidity: number;
  wind?: number;
  uv?: number;
}) {
  const profiles = [
    ['Healthy adult', 0.9],
    ['Child', 1.08],
    ['Older adult', 1.18],
    ['Outdoor worker', 1.24],
    ['Pregnant person', 1.15],
    ['Cardiac or respiratory condition', 1.3],
  ] as const;
  return profiles.map(([profile, multiplier]) => ({
    profile,
    multiplier,
    ...computeHtsi({
      temp: weather.temp,
      humidity: weather.humidity,
      wind: weather.wind,
      uv: weather.uv,
      multiplier,
    }),
  }));
}

export async function fetchNearbyFacilities(name: string) {
  const config =
    DISTRICTS.find(
      (item) => item.district.toLowerCase() === name.toLowerCase(),
    ) ?? DISTRICTS[0];
  const query = `[out:json][timeout:20];(nwr(around:12000,${config.lat},${config.lon})[amenity~"hospital|clinic|community_centre|drinking_water"];);out center 25;`;
  try {
    const response = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'ThermoWatch-SIH26083/3.0' } },
    );
    if (!response.ok) throw new Error('facilities unavailable');
    const payload = (await response.json()) as {
      elements: Array<{
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };
    return payload.elements.slice(0, 15).map((item) => {
      const lat = item.lat ?? item.center?.lat ?? config.lat;
      const lon = item.lon ?? item.center?.lon ?? config.lon;
      const type = item.tags?.amenity ?? 'facility';
      return {
        id: String(item.id),
        name: item.tags?.name ?? type.replaceAll('_', ' '),
        type: type.replaceAll('_', ' '),
        emergency: item.tags?.emergency === 'yes' || type === 'hospital',
        map_url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
      };
    });
  } catch {
    return [];
  }
}
    -42.379 +
    2.04901523 * t +
    10.14333127 * r -
    0.22475541 * t * r -
    0.00683783 * t * t -
    0.05481717 * r * r +
    0.00122874 * t * t * r +
    0.00085282 * t * r * r -
    0.00000199 * t * t * r * r;
  return Number((((hi - 32) * 5) / 9).toFixed(1));
}

function wetBulb(tempC: number, humidity: number) {
  const value =
    tempC * Math.atan(0.151977 * Math.sqrt(humidity + 8.313659)) +
    Math.atan(tempC + humidity) -
    Math.atan(humidity - 1.676331) +
    0.00391838 * Math.pow(humidity, 1.5) * Math.atan(0.023101 * humidity) -
    4.686035;
  return value;
}

export function computeHtsi(input: {
  temp: number;
  humidity: number;
  wind?: number;
  uv?: number;
  solar?: number;
  aqi?: number;
  multiplier?: number;
}) {
  const wind = input.wind ?? 1.6;
  const uv = input.uv ?? 7;
  const solar = input.solar ?? 650;
  const aqi = input.aqi ?? 85;
  const wbgt =
    0.7 * wetBulb(input.temp, input.humidity) +
    0.2 * (input.temp + solar / 180) +
    0.1 * input.temp;
  const hi = heatIndex(input.temp, input.humidity);
  const pet = input.temp + input.humidity * 0.035 + solar / 240 - wind * 0.7;
  const thermal = Math.max(0, Math.min(100, (wbgt - 18) * 5.25));
  const humidityStress = Math.max(
    0,
    Math.min(18, (input.humidity - 35) * 0.34),
  );
  const radiantStress = Math.max(0, Math.min(14, solar / 75));
  const uvStress = Math.max(0, Math.min(10, uv * 0.95));
  const airStress = Math.max(0, Math.min(8, (aqi - 40) / 16));
  const windRelief = Math.min(9, wind * 1.7);
  const raw =
    thermal * 0.66 +
    humidityStress +
    radiantStress +
    uvStress +
    airStress -
    windRelief;
  const score = Math.max(0, Math.min(100, raw * (input.multiplier ?? 1)));
  const htsi = Number(score.toFixed(1));
  const risk = riskFor(htsi);
  return {
    htsi,
    risk,
    wbgt: Number(wbgt.toFixed(1)),
    heat_index: hi,
    pet: Number(pet.toFixed(1)),
    action: actions[risk],
  };
}

function modelFields(
  config: DistrictConfig,
  input: {
    temp: number;
    humidity: number;
    wind: number;
    solar: number;
    timestamp: string | Date;
  },
) {
  const prediction = predictHeatRisk({
    temperature_c: input.temp,
    humidity_pct: input.humidity,
    wind_speed_ms: input.wind,
    shortwave_radiation_wm2: input.solar,
    latitude: config.lat,
    longitude: config.lon,
    timestamp: input.timestamp,
  });
  return {
    risk: prediction.predicted_class as Risk,
    probability: Math.round(prediction.confidence_pct),
    model_confidence: prediction.confidence_pct,
    high_risk_probability: prediction.high_risk_probability_pct,
    probabilities: prediction.probabilities,
    explanation: prediction.explanation as ModelContribution[],
    model_version: MODEL_INFO.model_version,
    action: actions[prediction.predicted_class as Risk],
  };
}

function fallbackDistrict(config: DistrictConfig) {
  const timestamp = new Date();
  const hour = Number(
    new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hourCycle: 'h23',
    }).format(timestamp),
  );
  const solar = hour >= 7 && hour <= 18 ? 650 : 10;
  const result = computeHtsi({
    temp: config.fallbackTemp,
    humidity: config.fallbackHumidity,
    wind: 1.7,
    solar,
  });
  return {
    ...config,
    temp: config.fallbackTemp,
    humidity: config.fallbackHumidity,
    wind: 1.7,
    uv: 7.4,
    solar,
    aqi: 85,
    source: 'resilient-fallback',
    ...result,
    ...modelFields(config, {
      temp: config.fallbackTemp,
      humidity: config.fallbackHumidity,
      wind: 1.7,
      solar,
      timestamp,
    }),
  };
}

export async function fetchCurrentDistrict(config: DistrictConfig) {
  try {
    const params = new URLSearchParams({
      latitude: String(config.lat),
      longitude: String(config.lon),
      current:
        'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,uv_index,shortwave_radiation',
      timezone: 'Asia/Kolkata',
    });
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { headers: { 'User-Agent': 'ThermoWatch-SIH26083/3.0' } },
    );
    if (!response.ok) throw new Error('weather unavailable');
    const payload = (await response.json()) as {
      current?: Record<string, number>;
    };
    const current = payload.current ?? {};
    const temp = Number(current.temperature_2m ?? config.fallbackTemp);
    const humidity = Number(
      current.relative_humidity_2m ?? config.fallbackHumidity,
    );
    const wind = Number(current.wind_speed_10m ?? 6) / 3.6;
    const uv = Number(current.uv_index ?? 6.5);
    const timestamp = new Date();
    const hour = Number(
      new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(timestamp),
    );
    const solar = Number(
      current.shortwave_radiation ?? (hour >= 7 && hour <= 18 ? 680 : 10),
    );
    const result = computeHtsi({ temp, humidity, wind, uv, solar });
    return {
      ...config,
      temp: Number(temp.toFixed(1)),
      humidity: Math.round(humidity),
      wind: Number(wind.toFixed(1)),
      uv: Number(uv.toFixed(1)),
      solar: Number(solar.toFixed(1)),
      aqi: 85,
      source: 'open-meteo',
      ...result,
      ...modelFields(config, {
        temp,
        humidity,
        wind,
        solar,
        timestamp,
      }),
    };
  } catch {
    return fallbackDistrict(config);
  }
}

let currentDistrictCache:
  | { expiresAt: number; data: Awaited<ReturnType<typeof fetchCurrentDistrict>>[] }
  | undefined;
let currentDistrictRequest:
  | Promise<Awaited<ReturnType<typeof fetchCurrentDistrict>>[]>
  | undefined;

export async function fetchAllDistricts() {
  if (currentDistrictCache && currentDistrictCache.expiresAt > Date.now())
    return currentDistrictCache.data;
  if (currentDistrictRequest) return currentDistrictRequest;
  currentDistrictRequest = Promise.all(DISTRICTS.map(fetchCurrentDistrict));
  try {
    const data = await currentDistrictRequest;
    currentDistrictCache = { expiresAt: Date.now() + 5 * 60_000, data };
    return data;
  } finally {
    currentDistrictRequest = undefined;
  }
}

export type ForecastLayerPoint = DistrictConfig & {
  horizon_hours: 24 | 48 | 72;
  valid_at: string;
  temp: number;
  humidity: number;
  wind: number;
  uv: number;
  solar: number;
  htsi: number;
  risk: Risk;
  probability: number;
  model_confidence: number;
  high_risk_probability: number;
  source: string;
  model_version: string;
};

async function fetchDistrictForecastLayers(config: DistrictConfig) {
  const horizons = [24, 48, 72] as const;
  try {
    const params = new URLSearchParams({
      latitude: String(config.lat),
      longitude: String(config.lon),
      hourly:
        'temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,shortwave_radiation',
      timezone: 'Asia/Kolkata',
      forecast_days: '5',
    });
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { headers: { 'User-Agent': 'ThermoWatch-SIH26083/4.0' } },
    );
    if (!response.ok) throw new Error('forecast layer unavailable');
    const payload = (await response.json()) as {
      hourly: {
        time: string[];
        temperature_2m: number[];
        relative_humidity_2m: number[];
        wind_speed_10m: number[];
        uv_index: number[];
        shortwave_radiation: number[];
      };
    };
    const targetNow = Date.now();
    return horizons.map((horizon) => {
      const target = targetNow + horizon * 3_600_000;
      let index = 0;
      let distance = Number.POSITIVE_INFINITY;
      payload.hourly.time.forEach((time, position) => {
        const timestamp = new Date(`${time}+05:30`).getTime();
        const candidate = Math.abs(timestamp - target);
        if (candidate < distance) {
          index = position;
          distance = candidate;
        }
      });
      const time = payload.hourly.time[index];
      const temp = payload.hourly.temperature_2m[index];
      const humidity = payload.hourly.relative_humidity_2m[index];
      const wind = payload.hourly.wind_speed_10m[index] / 3.6;
      const solar = payload.hourly.shortwave_radiation[index] ?? 0;
      const uv = payload.hourly.uv_index[index] ?? solar / 95;
      const thermal = computeHtsi({ temp, humidity, wind, solar, uv });
      const prediction = modelFields(config, {
        temp,
        humidity,
        wind,
        solar,
        timestamp: time,
      });
      return {
        ...config,
        horizon_hours: horizon,
        valid_at: time,
        temp: Number(temp.toFixed(1)),
        humidity: Math.round(humidity),
        wind: Number(wind.toFixed(1)),
        uv: Number(uv.toFixed(1)),
        solar: Number(solar.toFixed(1)),
        source: 'open-meteo',
        ...thermal,
        ...prediction,
      } as ForecastLayerPoint;
    });
  } catch {
    return horizons.map((horizon) => {
      const timestamp = new Date(Date.now() + horizon * 3_600_000);
      const hour = Number(
        new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          hourCycle: 'h23',
        }).format(timestamp),
      );
      const solar = hour >= 7 && hour <= 18 ? 620 : 10;
      const temp = config.fallbackTemp - (hour < 9 || hour > 19 ? 6 : 0);
      const humidity = config.fallbackHumidity + (hour < 8 ? 10 : 0);
      const wind = 1.7;
      const thermal = computeHtsi({ temp, humidity, wind, solar });
      const prediction = modelFields(config, {
        temp,
        humidity,
        wind,
        solar,
        timestamp,
      });
      return {
        ...config,
        horizon_hours: horizon,
        valid_at: timestamp.toISOString(),
        temp: Number(temp.toFixed(1)),
        humidity: Math.round(humidity),
        wind,
        uv: Number((solar / 95).toFixed(1)),
        solar,
        source: 'resilient-fallback',
        ...thermal,
        ...prediction,
      } as ForecastLayerPoint;
    });
  }
}

export async function fetchAllForecastLayers() {
  const districtLayers = await Promise.all(
    DISTRICTS.map(fetchDistrictForecastLayers),
  );
  return {
    24: districtLayers.map((layers) => layers[0]),
    48: districtLayers.map((layers) => layers[1]),
    72: districtLayers.map((layers) => layers[2]),
  };
}

export async function fetchDistrictForecast(name: string) {
  const config =
    DISTRICTS.find(
      (item) => item.district.toLowerCase() === name.toLowerCase(),
    ) ?? DISTRICTS[0];
  const current = await fetchCurrentDistrict(config);
  try {
    const params = new URLSearchParams({
      latitude: String(config.lat),
      longitude: String(config.lon),
      hourly:
        'temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,uv_index,shortwave_radiation',
      timezone: 'Asia/Kolkata',
      forecast_days: '5',
    });
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`,
      { headers: { 'User-Agent': 'ThermoWatch-SIH26083/3.0' } },
    );
    if (!response.ok) throw new Error('forecast unavailable');
    const payload = (await response.json()) as {
      hourly: {
        time: string[];
        temperature_2m: number[];
        relative_humidity_2m: number[];
        wind_speed_10m: number[];
        uv_index: number[];
        shortwave_radiation: number[];
      };
    };
    const forecast = payload.hourly.time
      .map((time, index) => {
        const hour = Number(time.slice(11, 13));
        const temp = payload.hourly.temperature_2m[index];
        const humidity = payload.hourly.relative_humidity_2m[index];
        const wind = payload.hourly.wind_speed_10m[index] / 3.6;
        const solar =
          payload.hourly.shortwave_radiation[index] ??
          (hour >= 7 && hour <= 18
            ? Math.max(120, 760 - Math.abs(13 - hour) * 90)
            : 10);
        const result = computeHtsi({
          temp,
          humidity,
          wind,
          uv: payload.hourly.uv_index[index] ?? 0,
          solar,
        });
        return {
          time,
          label: new Date(time).toLocaleString('en-IN', {
            weekday: 'short',
            hour: 'numeric',
          }),
          temp: Number(temp.toFixed(1)),
          humidity,
          wind: Number(wind.toFixed(1)),
          uv: Number((payload.hourly.uv_index[index] ?? solar / 95).toFixed(1)),
          solar: Number(solar.toFixed(1)),
          ...result,
          ...modelFields(config, { temp, humidity, wind, solar, timestamp: time }),
        };
      })
      .filter((_, index) => index % 3 === 0);
    const horizons = [24, 48, 72].map((hours) => {
      const item =
        forecast[Math.min(forecast.length - 1, Math.round(hours / 3))];
      return {
        horizon_hours: hours,
        predicted_class: item.risk,
        probability: item.model_confidence,
        high_risk_probability: item.high_risk_probability,
        htsi: item.htsi,
        explanation: item.explanation,
      };
    });
    const peak = [...forecast].sort((a, b) => b.htsi - a.htsi)[0];
    return {
      district: config.district,
      current,
      forecast,
      horizons,
      peak,
      profiles: vulnerabilityProfiles(current),
      source: 'open-meteo',
    };
  } catch {
    const forecast = Array.from({ length: 40 }, (_, index) => {
      const time = new Date(Date.now() + index * 3 * 3600000);
      const hour = time.getHours();
      const temp =
        config.fallbackTemp -
        6 +
        Math.max(0, 1 - Math.abs(14 - hour) / 9) * 7 +
        Math.sin(index / 4);
      const humidity = Math.max(
        24,
        config.fallbackHumidity + (hour < 8 ? 12 : 0),
      );
      const result = computeHtsi({
        temp,
        humidity,
        wind: 1.6,
        solar: hour >= 7 && hour <= 18 ? 640 : 10,
      });
      const solar = hour >= 7 && hour <= 18 ? 640 : 10;
      return {
        time: time.toISOString(),
        label: time.toLocaleString('en-IN', {
          weekday: 'short',
          hour: 'numeric',
        }),
        temp: Number(temp.toFixed(1)),
        humidity: Math.round(humidity),
        wind: 1.6,
        uv: Number((solar / 95).toFixed(1)),
        solar,
        ...result,
        ...modelFields(config, {
          temp,
          humidity,
          wind: 1.6,
          solar,
          timestamp: time,
        }),
      };
    });
    const horizons = [24, 48, 72].map((hours) => {
      const item = forecast[Math.round(hours / 3)];
      return {
        horizon_hours: hours,
        predicted_class: item.risk,
        probability: item.model_confidence,
        high_risk_probability: item.high_risk_probability,
        htsi: item.htsi,
        explanation: item.explanation,
      };
    });
    return {
      district: config.district,
      current,
      forecast,
      horizons,
      peak: [...forecast].sort((a, b) => b.htsi - a.htsi)[0],
      profiles: vulnerabilityProfiles(current),
      source: 'resilient-fallback',
    };
  }
}

export function vulnerabilityProfiles(weather: {
  temp: number;
  humidity: number;
  wind?: number;
  uv?: number;
}) {
  const profiles = [
    ['Healthy adult', 0.9],
    ['Child', 1.08],
    ['Older adult', 1.18],
    ['Outdoor worker', 1.24],
    ['Pregnant person', 1.15],
    ['Cardiac or respiratory condition', 1.3],
  ] as const;
  return profiles.map(([profile, multiplier]) => ({
    profile,
    multiplier,
    ...computeHtsi({
      temp: weather.temp,
      humidity: weather.humidity,
      wind: weather.wind,
      uv: weather.uv,
      multiplier,
    }),
  }));
}

export async function fetchNearbyFacilities(name: string) {
  const config =
    DISTRICTS.find(
      (item) => item.district.toLowerCase() === name.toLowerCase(),
    ) ?? DISTRICTS[0];
  const query = `[out:json][timeout:20];(nwr(around:12000,${config.lat},${config.lon})[amenity~"hospital|clinic|community_centre|drinking_water"];);out center 25;`;
  try {
    const response = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`,
      { headers: { 'User-Agent': 'ThermoWatch-SIH26083/3.0' } },
    );
    if (!response.ok) throw new Error('facilities unavailable');
    const payload = (await response.json()) as {
      elements: Array<{
        id: number;
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };
    return payload.elements.slice(0, 15).map((item) => {
      const lat = item.lat ?? item.center?.lat ?? config.lat;
      const lon = item.lon ?? item.center?.lon ?? config.lon;
      const type = item.tags?.amenity ?? 'facility';
      return {
        id: String(item.id),
        name: item.tags?.name ?? type.replaceAll('_', ' '),
        type: type.replaceAll('_', ' '),
        emergency: item.tags?.emergency === 'yes' || type === 'hospital',
        map_url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`,
      };
    });
  } catch {
    return [];
  }
}
