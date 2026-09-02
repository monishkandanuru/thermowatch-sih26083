const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3000';

async function check(path, validate) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  const payload = await response.json();
  validate(payload);
  console.log(`verified ${path}`);
}

await check('/api/health', (payload) => {
  if (payload.status !== 'operational') throw new Error('health is degraded');
});

await check('/api/dashboard', (payload) => {
  if (payload.districts?.length !== 20) throw new Error('district coverage mismatch');
  if (payload.model?.model_version !== 'htsi-logit-4.0')
    throw new Error('live model mismatch');
  if (payload.validation?.test_samples !== 58400)
    throw new Error('validation evidence mismatch');
});

await check('/api/district?district=Delhi', (payload) => {
  if (payload.horizons?.length !== 3) throw new Error('forecast horizons missing');
  if (!payload.horizons.every((item) => item.explanation?.length === 6))
    throw new Error('forecast explanations missing');
});
