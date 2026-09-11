import { canOperate, forbiddenResponse, getRequestActor } from '@/lib/access';
import { ensureDatabase } from '@/lib/database';
import { fetchAllDistricts } from '@/lib/thermowatch';

export const runtime = 'edge';

export async function GET(request: Request) {
  const db = await ensureDatabase();
  const actor = await getRequestActor(request, db);
  if (!canOperate(actor)) return forbiddenResponse(actor);
  const districts = await fetchAllDistricts();
  const rows = [
    'district,temperature_c,humidity_pct,htsi,risk,high_risk_probability_pct,source',
    ...districts.map(
      (item) =>
        `${item.district},${item.temp},${item.humidity},${item.htsi},${item.risk},${item.probability},${item.source}`,
    ),
  ];
  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition':
        'attachment; filename="thermowatch-authority-brief.csv"',
    },
  });
}
