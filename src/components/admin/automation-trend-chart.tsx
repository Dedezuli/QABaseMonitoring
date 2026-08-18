"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type TrendPoint = {
  weekStart: string;
  overallPct: number;
  totalTestCase: number;
};

function formatWeek(v: string) {
  return new Date(v).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

export function AutomationTrendChart({ data }: { data: TrendPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Belum ada data untuk periode/filter ini.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="weekStart"
          tickFormatter={formatWeek}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={{ stroke: "var(--border)" }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
          axisLine={false}
          tickLine={false}
          width={48}
          unit="%"
        />
        <Tooltip
          formatter={(value) => [`${value}%`, "Automation"]}
          labelFormatter={(label) => formatWeek(String(label))}
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Line
          type="monotone"
          dataKey="overallPct"
          stroke="var(--primary)"
          strokeWidth={2}
          dot={{ r: 3, fill: "var(--primary)" }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
