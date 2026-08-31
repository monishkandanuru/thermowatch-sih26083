import { computeHtsi } from '@/lib/thermowatch';

export const runtime = 'edge';

export async function POST(request: Request) {
  const body = (await request.json()) as {
    temperature_c?: number;
    humidity_pct?: number;
    wind_speed_ms?: number;
    uv_index?: number;
    age_group?: string;
    activity?: string;
    acclimatized?: boolean;
  };
  if (body.temperature_c == null || body.humidity_pct == null)
    return Response.json(
      { error: 'Temperature and humidity are required.' },
      { status: 400 },
    );
  const age =
    body.age_group === 'elderly' ? 1.18 : body.age_group === 'child' ? 1.08 : 1;
  const activity =
    body.activity === 'heavy'
      ? 1.18
      : body.activity === 'moderate'
        ? 1.07
        : 0.94;
  const acclimatized = body.acclimatized ? 0.94 : 1.04;
  const result = computeHtsi({
    temp: body.temperature_c,
    humidity: body.humidity_pct,
    wind: body.wind_speed_ms,
    uv: body.uv_index,
    multiplier: age * activity * acclimatized,
  });
  return Response.json({
    htsi_score: result.htsi,
    risk_level: result.risk,
    recommended_action: result.action,
    wbgt_c: result.wbgt,
    heat_index_c: result.heat_index,
    pet_c: result.pet,
  });
}
