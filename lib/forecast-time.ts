// Open-Meteo returns local wall-clock strings when Asia/Kolkata is requested.
export function indiaForecastTime(time: string) {
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(time) ? time : `${time}+05:30`;
}

export function nearestForecast<T extends { time: string }>(
  points: readonly T[], hours: number, now = Date.now(),
): T {
  if (!points.length) throw new Error('Forecast is empty');
  const target = now + hours * 3600000;
  return points.reduce((best, point) =>
    Math.abs(Date.parse(point.time) - target) < Math.abs(Date.parse(best.time) - target)
      ? point : best,
  );
}
