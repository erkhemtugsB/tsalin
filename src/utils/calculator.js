import percentileData from "../data/percentiles.json";

export function calculateNetWorth({ savings, mashin, bair }) {
  // Цэвэр хөрөнгө = хуримтлал + нийт машины үнэ + нийт байрны үнэ
  return Number(savings || 0) + Number(mashin || 0) + Number(bair || 0);
}

function interpolatePercentile(value, rows, valueKey) {
  if (!rows?.length) return 0;
  const safeValue = Number(value || 0);
  const first = rows[0];
  const firstValue = Number(first[valueKey]);

  if (safeValue <= firstValue) {
    const scaled = (safeValue / Math.max(firstValue, 1)) * first.percentile;
    return Math.max(0, Math.round(scaled));
  }

  for (let i = 1; i < rows.length; i += 1) {
    const prev = rows[i - 1];
    const curr = rows[i];
    const prevValue = Number(prev[valueKey]);
    const currValue = Number(curr[valueKey]);

    if (safeValue <= currValue) {
      const ratio = (safeValue - prevValue) / Math.max(currValue - prevValue, 1);
      const interpolated = prev.percentile + ratio * (curr.percentile - prev.percentile);
      return Math.round(interpolated);
    }
  }

  return rows[rows.length - 1].percentile;
}

export function calculatePercentile(netWorth, salary) {
  const netWorthPercentile = interpolatePercentile(
    netWorth,
    percentileData.net_worth_percentiles,
    "net_worth"
  );
  const salaryPercentile = interpolatePercentile(
    salary,
    percentileData.salary_percentiles,
    "salary"
  );
  // Эцсийн дүгнэлтийг хөрөнгийн хэмжээн дээр тулгуурлуулна.
  const combinedPercentile = netWorthPercentile;

  return {
    combinedPercentile,
    netWorthPercentile,
    salaryPercentile
  };
}
