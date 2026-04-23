"use client";

import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { CHART, PH } from "@/lib/theme/tokens";

type Row = {
  label: string;
  predicted: number;
  p10: number;
  p90: number;
  actual?: number | null;
  band?: number;
};

export function ForecastChart({
  rows,
  unit = "orders",
  height = 280,
  showActual = true,
}: {
  rows: Row[];
  unit?: string;
  height?: number;
  showActual?: boolean;
}) {
  const data = rows.map((r) => ({
    ...r,
    bandLow: r.p10,
    bandSpan: r.p90 - r.p10,
  }));
  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" fontSize={11} stroke={CHART.axis} tickLine={false} axisLine={false} />
          <YAxis fontSize={11} stroke={CHART.axis} tickLine={false} axisLine={false} width={36} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }}
            formatter={(v: any, name: any) => {
              if (name === "bandLow" || name === "bandSpan") return [null, null];
              return [`${Math.round(v)} ${unit}`, name];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            payload={[
              { value: "Predicted", type: "line", color: PH.red },
              ...(showActual ? [{ value: "Actual", type: "rect" as const, color: PH.black }] : []),
              { value: "P10–P90 range", type: "rect", color: CHART.band },
            ]}
          />
          {/* Confidence band (stacked area trick) */}
          <Area
            type="monotone"
            dataKey="bandLow"
            stackId="band"
            stroke="none"
            fill="transparent"
            isAnimationActive={false}
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="bandSpan"
            stackId="band"
            stroke="none"
            fill={CHART.band}
            fillOpacity={0.55}
            isAnimationActive={false}
            legendType="none"
          />
          {showActual && (
            <Bar dataKey="actual" fill={PH.black} radius={[4, 4, 0, 0]} barSize={18} />
          )}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke={PH.red}
            strokeWidth={2.5}
            dot={{ r: 3, fill: PH.red }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
