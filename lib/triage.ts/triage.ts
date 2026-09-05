export type TriageRisk = 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Emergency';

const urgencyRank: Record<TriageRisk, number> = {
  Low: 0,
  Moderate: 1,
  High: 2,
  Extreme: 3,
  Emergency: 4,
};

export function sortByUrgency<
  T extends { risk: TriageRisk; htsi: number; multiplier?: number },
>(items: readonly T[]) {
  return [...items].sort(
    (a, b) =>
      urgencyRank[b.risk] - urgencyRank[a.risk] ||
      b.htsi - a.htsi ||
      (b.multiplier ?? 0) - (a.multiplier ?? 0),
  );
}
