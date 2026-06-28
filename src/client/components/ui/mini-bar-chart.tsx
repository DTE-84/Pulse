/**
 * MiniBarChart — zero-dependency pure SVG bar chart.
 * Drop-in replacement for recharts <BarChart>/<Bar>/<Cell>/<ResponsiveContainer>
 * for simple sparkline-style bar charts with per-bar color control.
 */

interface BarDatum {
  value: number;
  [key: string]: unknown;
}

interface MiniBarChartProps {
  data: BarDatum[];
  /** Key to read the numeric value from each datum. Default "value" */
  dataKey?: string;
  /** Called per bar — return fill color string */
  cellColor: (datum: BarDatum, index: number) => string;
  /** Border radius on top corners of each bar. Default 4 */
  radius?: number;
  /** Label key to render below each bar (optional) */
  labelKey?: string;
  /** Label text color */
  labelColor?: string;
  /** Label font size in px */
  labelFontSize?: number;
  className?: string;
  height?: number | string;
}

export function MiniBarChart({
  data,
  dataKey = "value",
  cellColor,
  radius = 4,
  labelKey,
  labelColor = "rgba(100,100,100,0.5)",
  labelFontSize = 11,
  className = "",
  height = "100%",
}: MiniBarChartProps) {
  if (!data || data.length === 0) return null;

  const values = data.map((d) => Number(d[dataKey]) || 0);
  const max = Math.max(...values, 1);

  // Layout constants (viewBox units)
  const VB_W = 200;
  const LABEL_H = labelKey ? 18 : 0;
  const VB_H = 64 + LABEL_H;
  const BAR_AREA_H = 48;
  const BAR_TOP_PAD = 8; // breathing room above tallest bar
  const BAR_GAP = 4;
  const barW = (VB_W - BAR_GAP * (data.length - 1)) / data.length;

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}
    >
      {data.map((datum, i) => {
        const val = Number(datum[dataKey]) || 0;
        const barH = Math.max(2, (val / max) * (BAR_AREA_H - BAR_TOP_PAD));
        const x = i * (barW + BAR_GAP);
        const y = BAR_AREA_H - barH + BAR_TOP_PAD;
        const fill = cellColor(datum, i);
        const r = Math.min(radius, barW / 2, barH / 2);
        const label = labelKey ? String(datum[labelKey] ?? "") : "";

        return (
          <g key={i}>
            {/* Rounded-top rectangle */}
            <path
              d={
                r > 0
                  ? `M${x + r},${y} h${barW - 2 * r} a${r},${r} 0 0 1 ${r},${r}` +
                    ` v${barH - r} h${-(barW)} v${-(barH - r)}` +
                    ` a${r},${r} 0 0 1 ${r},${-r} Z`
                  : `M${x},${y} h${barW} v${barH} h${-barW} Z`
              }
              fill={fill}
            />
            {labelKey && (
              <text
                x={x + barW / 2}
                y={BAR_AREA_H + BAR_TOP_PAD + 14}
                textAnchor="middle"
                fontSize={labelFontSize}
                fontWeight={600}
                fill={labelColor}
              >
                {label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
