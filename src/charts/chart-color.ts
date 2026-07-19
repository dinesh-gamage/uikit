/**
 * Cycles through the shared categorical chart palette (`--uikit-chart-1`
 * through `--uikit-chart-6`, defined in `src/styles/tokens.css`). Every
 * chart primitive uses this for per-series/per-segment color so the
 * palette stays consistent across BarChart, LineChart, and DonutChart.
 */
export function chartSeriesColor(index: number): string {
  const wrapped = ((index % 6) + 6) % 6; // safe for negative indices too
  return `var(--uikit-chart-${wrapped + 1})`;
}
