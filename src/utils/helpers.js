export const linearForecast = (data, weeks) => {
  const n = data.length, xM = (n - 1) / 2, yM = data.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  data.forEach((y, x) => { num += (x - xM) * (y - yM); den += (x - xM) ** 2; });
  const s = den ? num / den : 0, b = yM - s * xM;
  return Array.from({ length: weeks }, (_, i) => Math.max(0, Math.round((b + s * (n + i)) * 10) / 10));
};

export const fmt$ = n => `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const fmtNum = n => Number(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
