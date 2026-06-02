// Returns 'green' | 'amber' | 'red'
export function getIndicatorSignal(key, value) {
  const v = parseFloat(value);
  if (isNaN(v)) return 'gray';

  switch (key) {
    case 'yield10y':
      if (v < 3.5)  return 'green';
      if (v <= 4.5) return 'amber';
      return 'red';

    case 'dxy':
      if (v < 95)   return 'green';
      if (v <= 103) return 'amber';
      return 'red';

    case 'feargreed_iwda':
      if (v > 40)  return 'green';
      if (v >= 20) return 'amber';
      return 'red';

    case 'feargreed_crypto':
      if (v > 50)  return 'green';
      if (v >= 25) return 'amber';
      return 'red';

    case 'btcflows':
      if (v > 200)   return 'green';
      if (v >= -200) return 'amber';
      return 'red';

    case 'eurusd':
      if (v > 1.05)  return 'green';
      if (v >= 1.00) return 'amber';
      return 'red';

    default:
      return 'gray';
  }
}

// Aggregate signal for an asset based on relevant indicators
export function getAssetSignal(asset, indicators) {
  let keys = [];
  if (asset === 'iwda') {
    keys = [
      getIndicatorSignal('yield10y', indicators.yield10y),
      getIndicatorSignal('dxy', indicators.dxy),
      getIndicatorSignal('feargreed_iwda', indicators.feargreed),
      getIndicatorSignal('eurusd', indicators.eurusd),
    ];
  } else {
    keys = [
      getIndicatorSignal('yield10y', indicators.yield10y),
      getIndicatorSignal('dxy', indicators.dxy),
      getIndicatorSignal('feargreed_crypto', indicators.feargreed),
      getIndicatorSignal('btcflows', indicators.btcflows),
    ];
  }

  const valid = keys.filter(s => s !== 'gray');
  if (valid.length === 0) return 'gray';

  const scores = valid.map(s => s === 'green' ? 2 : s === 'amber' ? 1 : 0);
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

  if (avg >= 1.5) return 'green';
  if (avg >= 0.8) return 'amber';
  return 'red';
}
