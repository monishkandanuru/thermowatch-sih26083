import type { Risk } from '@/lib/thermowatch';

export type ForecastWarningInput = {
  district: string;
  horizon_hours: number;
  predicted_class: Risk;
  high_risk_probability: number;
  htsi: number;
  valid_at: string;
  model_version: string;
};

export type WarningCandidate = ForecastWarningInput & {
  dedupe_key: string;
  priority: 'watch' | 'warning' | 'emergency';
  reason: string;
};

const rank: Record<Risk, number> = {
  Low: 0,
  Moderate: 1,
  High: 2,
  Extreme: 3,
  Emergency: 4,
};

export function evaluateForecastWarnings(
  predictions: ForecastWarningInput[],
): WarningCandidate[] {
  return predictions
    .filter(
      (item) =>
        rank[item.predicted_class] >= rank.High &&
        item.high_risk_probability >= 60,
    )
    .map((item) => {
      const priority =
        item.predicted_class === 'Emergency' ||
        item.high_risk_probability >= 90
          ? 'emergency'
          : item.predicted_class === 'Extreme' ||
              item.high_risk_probability >= 75
            ? 'warning'
            : 'watch';
      return {
        ...item,
        priority,
        dedupe_key: [
          item.district.toLowerCase().replaceAll(' ', '-'),
          item.horizon_hours,
          item.valid_at.slice(0, 13),
          item.predicted_class.toLowerCase(),
        ].join(':'),
        reason: `${item.predicted_class} risk at ${Math.round(item.high_risk_probability)}% High+ probability for the ${item.horizon_hours}-hour horizon.`,
      };
    });
}
