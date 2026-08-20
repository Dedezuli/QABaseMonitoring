"use client";

import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export type ProjectTrendPoint = {
  weekStart: string;
  progressPct: number;
  bePct: number;
  fePct: number;
};

const SERIES = [
  { key: "progressPct", name: "Progress testing", color: "var(--s1)" },
  { key: "bePct", name: "Coverage BE", color: "var(--s2)" },
  { key: "fePct", name: "Coverage FE", color: "var(--s3)" },
] as const;

function formatWeek(v: string) {
  return new Date(v).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
}

export function ProjectTrendChart({ data }: { data: ProjectTrendPoint[] }) {
  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Belum ada report yang bisa ditampilkan untuk project ini.
      </p>
    );
  }

  return (
    <div className="[--s1:#2a78d6] [--s2:#eb6834] [--s3:#1baf7a] dark:[--s1:#3987e5] dark:[--s2:#d95926] dark:[--s3:#199e70]">
      <ResponsiveContainer width="100%" height={280}>
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
            formatter={(value, name) => [`${value}%`, name]}
            labelFormatter={(label) => `Minggu ${formatWeek(String(label))}`}
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            iconType="plainline"
          />
          {SERIES.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2}
              dot={{ r: 3, fill: s.color }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
