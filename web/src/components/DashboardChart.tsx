"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { rupiah } from "@/lib/utils";

export function DashboardChart({
  data,
}: {
  data: { label: string; total: number }[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6b7280" }} stroke="#e5e7eb" />
          <YAxis
            tick={{ fontSize: 11, fill: "#6b7280" }}
            stroke="#e5e7eb"
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? v / 1_000_000 + "jt" : v >= 1000 ? v / 1000 + "rb" : String(v)
            }
          />
          <Tooltip
            formatter={(value) => [rupiah(Number(value)), "Omzet"]}
            contentStyle={{ fontSize: 13, borderRadius: 8, border: "1px solid #e5e7eb" }}
          />
          <Area type="monotone" dataKey="total" stroke="#059669" strokeWidth={2} fill="url(#revenue)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}