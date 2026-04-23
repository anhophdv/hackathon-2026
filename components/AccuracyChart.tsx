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
import { AccuracyPoint } from "@/lib/forecast/accuracy";
import { CHART, PH } from "@/lib/theme/tokens";

export function AccuracyChart({
  rows,
  metric = "orders",
  height = 320,
}: {
  rows: AccuracyPoint[];
  metric?: "orders" | "revenue";
  height?: number;
}) {
  const data = rows.map((r) => ({
    label: r.label,
    actual: metric === "orders" ? r.actualOrders : Math.round(r.actualRevenue),
    predicted: metric === "orders" ? r.predOrders : Math.round(r.predRevenue),
    bandLow: metric === "orders" ? r.predOrdersP10 : Math.round(r.predRevenue * 0.88),
    bandSpan:
      metric === "orders"
        ? r.predOrdersP90 - r.predOrdersP10
        : Math.round(r.predRevenue * 0.24),
  }));
  const unit = metric === "orders" ? "orders" : "GBP";

  return (
    <div style={{ height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} vertical={false} />
          <XAxis dataKey="label" fontSize={10} stroke={CHART.axis} tickLine={false} axisLine={false} />
          <YAxis fontSize={11} stroke={CHART.axis} tickLine={false} axisLine={false} width={48} />
          <Tooltip
            contentStyle={{ borderRadius: 12, border: `1px solid ${CHART.grid}`, fontSize: 12 }}
            formatter={(v: any, name: string) => {
              if (name === "bandLow" || name === "bandSpan") return [null, null];
              return [
                metric === "revenue" ? `£${Number(v).toLocaleString("en-GB")}` : `${Math.round(v)} ${unit}`,
                name,
              ];
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
            payload={[
              { value: "Actual", type: "rect", color: PH.black },
              { value: "Predicted", type: "line", color: PH.red },
              { value: "P10–P90 confidence", type: "rect", color: CHART.band },
            ]}
          />
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
          <Bar dataKey="actual" fill={PH.black} radius={[4, 4, 0, 0]} barSize={14} />
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
